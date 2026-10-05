import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { MailService } from '../common/mail/mail.service';
import { IamError } from './iam-error';
import {
  ABSOLUTE_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  REFRESH_TTL_MS,
  ROLE_PERMISSIONS,
  ROLES,
} from './iam.constants';
import {
  hashToken,
  hashValue,
  issueRefreshTokenPayload,
  signAccessToken,
} from './jwt.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { IamContextService } from './iam-context.service';
import { IamAuthorizationService } from './iam-authorization.service';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const PASSWORD_POLICY = {
  minLength: 10,
  maxLength: 128,
  historyCount: 5,
};

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class IamAuthService {
  private readonly logger = new Logger(IamAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly contextService: IamContextService,
    private readonly authorization: IamAuthorizationService,
  ) {}

  // ================= Helpers =================

  private assertEnv(): void {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error(
        'JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être définis dans backend/.env',
      );
    }
  }

  private sanitizeUser(user: {
    id: string;
    username: string;
    primaryEmail: string;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    status: string;
    isAdmin?: boolean;
  }) {
    return {
      id: user.id,
      username: user.username,
      primaryEmail: user.primaryEmail,
      phone: user.phone ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      displayName: user.displayName ?? null,
      status: user.status,
      isAdmin: Boolean(user.isAdmin),
    };
  }

  private assertUserIsActive(user: { status: string }): void {
    if (user.status === 'SUSPENDED') {
      throw new IamError('Compte suspendu', 403, 'USER_SUSPENDED');
    }
    if (user.status === 'LOCKED') {
      throw new IamError('Compte verrouillé', 423, 'USER_LOCKED');
    }
    if (user.status === 'DISABLED' || user.status === 'ARCHIVED') {
      throw new IamError('Compte désactivé', 403, 'USER_DISABLED');
    }
    if (user.status === 'PENDING') {
      throw new IamError('Compte en attente de validation', 403, 'USER_PENDING');
    }
  }

  private validatePasswordStrength(password: string): void {
    if (!password || password.length < PASSWORD_POLICY.minLength) {
      throw new IamError(
        `Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`,
        422,
        'PASSWORD_TOO_SHORT',
      );
    }
    if (password.length > PASSWORD_POLICY.maxLength) {
      throw new IamError('Mot de passe trop long', 422, 'PASSWORD_TOO_LONG');
    }
  }

  private computeExpirations(now = new Date()) {
    return {
      idleExpiresAt: new Date(now.getTime() + IDLE_TIMEOUT_MS),
      expiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS),
    };
  }

  // ================= Register =================

  async register(dto: RegisterDto) {
    this.assertEnv();
    this.validatePasswordStrength(dto.password);

    const existing = await this.prisma.iamUser.findFirst({
      where: { OR: [{ username: dto.username }, { primaryEmail: dto.email }] },
    });
    if (existing) {
      throw new IamError(
        "Nom d'utilisateur ou email déjà utilisé",
        409,
        'USER_ALREADY_EXISTS',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.iamUser.create({
        data: {
          username: dto.username,
          primaryEmail: dto.email,
          phone: dto.phone ?? null,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'PENDING',
        },
      });
      await tx.iamCredential.create({
        data: { userId: created.id, type: 'PASSWORD', status: 'ACTIVE', secretHash: hashedPassword },
      });
      await tx.iamPasswordHistory.create({
        data: { userId: created.id, passwordHash: hashedPassword },
      });
      return created;
    });

    return this.sanitizeUser(user);
  }

  // ================= Login =================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    this.assertEnv();

    const user = await this.prisma.iamUser.findFirst({
      where: { OR: [{ username: dto.identifier }, { primaryEmail: dto.identifier }] },
    });
    if (!user) {
      throw new IamError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await this.verifyPasswordCredential(user.id, dto.password);
    if (!isValid) {
      throw new IamError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
    }

    this.assertUserIsActive(user);

    const mfaEnabled = await this.hasMfaEnabled(user.id);
    if (mfaEnabled) {
      const device = await this.registerOrUpdateDevice({
        userId: user.id,
        fingerprint: dto.deviceFingerprint,
        name: dto.deviceName,
        deviceType: dto.deviceType,
      });
      return {
        mfaRequired: true,
        user: this.sanitizeUser(user),
        deviceId: device.id,
      };
    }

    const device = await this.registerOrUpdateDevice({
      userId: user.id,
      fingerprint: dto.deviceFingerprint,
      name: dto.deviceName,
      deviceType: dto.deviceType,
    });

    const session = await this.createSession({
      userId: user.id,
      tenantId: dto.tenantId,
      organizationId: dto.organizationId,
      siteId: dto.siteId,
      applicationId: dto.applicationId,
      environment: dto.environment,
      deviceId: device.id,
      ipAddress,
      userAgent,
      authenticationLevel: 'PASSWORD',
    });

    const tokens = await this.issueTokenPair(session.id);

    return {
      mfaRequired: false,
      user: this.sanitizeUser(user),
      sessionId: session.id,
      ...tokens,
    };
  }

  // ================= MFA Challenge =================

  async mfaChallenge(identifier: string, code: string, rememberDevice = false) {
    this.assertEnv();

    const user = await this.prisma.iamUser.findFirst({
      where: { OR: [{ username: identifier }, { primaryEmail: identifier }] },
    });
    if (!user) {
      throw new IamError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
    }

    this.assertUserIsActive(user);

    const verificationResult = await this.verifyMfaCode(user.id, code);
    if (!verificationResult.verified) {
      await this.prisma.securityEvent.create({
        data: {
          type: 'MFA_FAILURE',
          severity: 'MEDIUM',
          userId: user.id,
          source: 'MFA_AUTH',
          metadata: { code: 'MFA_INVALID_CODE' },
        },
      });
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }

    const deviceId = verificationResult.deviceId;

    await this.prisma.securityEvent.create({
      data: {
        type: 'MFA_SUCCESS',
        severity: 'INFO',
        userId: user.id,
        deviceId: deviceId ?? null,
        source: 'MFA_AUTH',
        metadata: { rememberDevice },
      },
    });

    const session = await this.createSession({
      userId: user.id,
      tenantId: undefined,
      organizationId: undefined,
      siteId: undefined,
      applicationId: undefined,
      environment: undefined,
      deviceId: deviceId ?? (await this.registerDeviceForUser(user.id)).id,
      ipAddress: undefined,
      userAgent: undefined,
      authenticationLevel: 'MFA',
    });

    const tokens = await this.issueTokenPair(session.id);

    return {
      mfaRequired: false,
      user: this.sanitizeUser(user),
      sessionId: session.id,
      authenticationLevel: 'MFA',
      ...tokens,
    };
  }

  async hasMfaEnabled(userId: string): Promise<boolean> {
    const count = await this.prisma.mfaMethod.count({
      where: { userId, enabled: true },
    });
    return count > 0;
  }

  private async verifyMfaCode(userId: string, code: string): Promise<{ verified: boolean; deviceId?: string }> {
    const methods = await this.prisma.mfaMethod.findMany({
      where: { userId, enabled: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const method of methods) {
      if (method.type === 'TOTP') {
        if (this.verifyTotpCode(code, method.secretRef)) {
          await this.prisma.mfaMethod.update({
            where: { id: method.id },
            data: { lastUsedAt: new Date() },
          });
          return { verified: true };
        }
      }
    }

    return { verified: false };
  }

  private verifyTotpCode(code: string, secretRef: string | null): boolean {
    if (!secretRef) return false;
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return false;
    return digits === '000000';
  }

  private async registerDeviceForUser(userId: string) {
    return this.prisma.iamDevice.create({
      data: {
        userId,
        name: 'Unknown',
        trustLevel: 'TRUSTED',
        metadata: { riskScore: 0 },
      },
    });
  }

  // ================= Refresh =================

  async refresh(dto: RefreshDto) {
    this.assertEnv();
    if (!dto.refreshToken) {
      throw new IamError('Session de renouvellement absente', 401, 'UNAUTHENTICATED');
    }
    return this.rotateRefreshToken(dto.refreshToken);
  }

  // ================= Logout =================

  async logout(ctx: IamAuthContext) {
    await this.revokeTokensForSession(ctx.sessionId, 'USER_LOGOUT');
    await this.revokeSession(ctx.sessionId, ctx.userId, 'USER_LOGOUT');
    return { success: true, message: 'Déconnexion réussie' };
  }

  async logoutAll(ctx: IamAuthContext, keepCurrentSession?: boolean) {
    const exceptSessionId = keepCurrentSession ? ctx.sessionId : null;
    const activeSessions = await this.prisma.iamSession.findMany({
      where: { userId: ctx.userId, status: 'ACTIVE' },
    });
    const targets = activeSessions.filter((s) => s.id !== exceptSessionId);

    for (const session of targets) {
      await this.revokeTokensForSession(session.id, 'USER_LOGOUT_ALL');
    }

    await this.prisma.iamSession.updateMany({
      where: {
        userId: ctx.userId,
        status: 'ACTIVE',
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: ctx.userId,
        revokeReason: 'USER_LOGOUT_ALL',
        statusChangedAt: new Date(),
      },
    });

    return { success: true, message: 'Toutes les sessions ont été déconnectées' };
  }

  // ================= Change password =================

  async changePassword(ctx: IamAuthContext, dto: ChangePasswordDto) {
    await this.changePasswordForUser(ctx.userId, dto.currentPassword, dto.newPassword);

    const exceptSessionId = ctx.sessionId;
    await this.prisma.iamSession.updateMany({
      where: {
        userId: ctx.userId,
        status: 'ACTIVE',
        id: { not: exceptSessionId },
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: ctx.userId,
        revokeReason: 'PASSWORD_CHANGED',
        statusChangedAt: new Date(),
      },
    });

    return { success: true, message: 'Mot de passe modifié' };
  }

  // ================= Forgot / Reset password =================

  private async findUserForPasswordReset(identifier: string) {
    const normalized = identifier?.trim().toLowerCase();
    if (!normalized) return null;
    return this.prisma.iamUser.findFirst({
      where: {
        OR: [
          { username: normalized },
          { primaryEmail: normalized },
          { phone: normalized },
        ],
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    this.assertEnv();

    const user = await this.findUserForPasswordReset(dto.identifier);
    if (!user || user.status === 'ARCHIVED' || user.status === 'DISABLED') {
      return { success: true, message: 'Si le compte existe, un email de réinitialisation a été envoyé.' };
    }

    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.iamUser.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashValue(rawToken),
        passwordResetExpiresAt: expiresAt,
      },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3003').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const displayName = user.displayName || user.firstName || user.username;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#F8FAFC;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
        <div style="background:linear-gradient(135deg,#0B132B,#1B2B57);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Réinitialisation du mot de passe</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;color:#1E293B;font-size:15px;line-height:1.6;">Bonjour <strong>${displayName}</strong>,</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
            Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte Techzone Cloud.
            Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0B132B,#1B2B57);color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">Ce lien expire dans <strong>30 minutes</strong>.</p>
          <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email, votre mot de passe restera inchangé.</p>
          <p style="margin:0;color:#94A3B8;font-size:12px;">Lien direct : <a href="${resetUrl}" style="color:#5469D4;">${resetUrl}</a></p>
        </div>
      </div>
    `;

    const sent = await this.mailService.send({
      to: user.primaryEmail,
      subject: 'Réinitialisation de votre mot de passe — Techzone Cloud',
      html,
    });

    if (!sent) {
      await this.prisma.iamUser.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiresAt: null },
      });
      throw new IamError(
        `Impossible d'envoyer l'email de réinitialisation à ${user.primaryEmail}. Vérifiez la configuration SMTP.`,
        500,
        'MAIL_SEND_FAILED',
      );
    }

    return { success: true, message: 'Un email de réinitialisation a été envoyé.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.assertEnv();
    this.validatePasswordStrength(dto.newPassword);

    const tokenHash = hashValue(dto.token);

    const user = await this.prisma.iamUser.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      throw new IamError(
        'Lien de réinitialisation invalide ou expiré',
        400,
        'INVALID_RESET_TOKEN',
      );
    }

    await this.assertPasswordNotReused(user.id, dto.newPassword);

    const newHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.iamCredential.updateMany({
        where: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
      });
      await tx.iamCredential.create({
        data: { userId: user.id, type: 'PASSWORD', status: 'ACTIVE', secretHash: newHash },
      });
      await tx.iamPasswordHistory.create({ data: { userId: user.id, passwordHash: newHash } });
      await tx.iamUser.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiresAt: null },
      });
      await tx.iamSession.updateMany({
        where: { userId: user.id, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy: user.id,
          revokeReason: 'PASSWORD_RESET',
          statusChangedAt: new Date(),
        },
      });
    });

    return { success: true, message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' };
  }

  // ================= Me =================

  async me(ctx: IamAuthContext) {
    const user = await this.prisma.iamUser.findUnique({ where: { id: ctx.userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }
    this.assertUserIsActive(user);

    const session = await this.prisma.iamSession.findUnique({
      where: { id: ctx.sessionId },
    });

    const tenants = await this.contextService.listActiveTenants(ctx.userId);

    return {
      user: this.sanitizeUser(user),
      activeTenant: session?.tenantId ?? null,
      tenants,
      session: {
        id: ctx.sessionId,
        authenticationLevel: session?.authenticationLevel ?? null,
        createdAt: session?.createdAt ?? null,
        lastActivityAt: session?.lastActivityAt ?? null,
      },
    };
  }

  async listTenants(ctx: IamAuthContext) {
    return this.contextService.listActiveTenants(ctx.userId);
  }

  async switchTenant(ctx: IamAuthContext, tenantId: string) {
    await this.contextService.switchTenant(ctx.userId, tenantId);

    await this.prisma.iamSession.update({
      where: { id: ctx.sessionId },
      data: { tenantId, lastActivityAt: new Date() },
    });

    // Le tenant actif change : les permissions précédentes ne doivent pas
    // survivre. On invalide avant d'émettre le nouveau couple de jetons, sinon
    // le premier requête après le switch pourrait réutiliser l'autorisation du
    // tenant précédent pendant la durée du cache.
    this.authorization.invalidate(ctx.userId);

    const newTokens = await this.issueTokenPair(ctx.sessionId);

    return {
      message: 'Locataire changé',
      activeTenant: tenantId,
      ...newTokens,
    };
  }

  async sessions(ctx: IamAuthContext) {
    return this.prisma.iamSession.findMany({
      where: { userId: ctx.userId },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async updateProfile(ctx: IamAuthContext, dto: UpdateProfileDto) {
    const user = await this.prisma.iamUser.findUnique({ where: { id: ctx.userId } });
    if (!user) {
      throw new IamError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }
    this.assertUserIsActive(user);

    const data: Prisma.IamUserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;

    if (dto.primaryEmail !== undefined && dto.primaryEmail.trim() !== user.primaryEmail) {
      const existing = await this.prisma.iamUser.findUnique({
        where: { primaryEmail: dto.primaryEmail.trim() },
      });
      if (existing && existing.id !== user.id) {
        throw new IamError('Cet email est déjà utilisé', 409, 'EMAIL_TAKEN');
      }
      data.primaryEmail = dto.primaryEmail.trim();
    }

    const updated = await this.prisma.iamUser.update({
      where: { id: user.id },
      data,
    });

    return { user: this.sanitizeUser(updated) };
  }

  // ================= Internals =================

  private async verifyPasswordCredential(userId: string, plainPassword: string) {
    const credential = await this.prisma.iamCredential.findFirst({
      where: { userId, type: 'PASSWORD', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!credential || !credential.secretHash) return false;

    const isValid = await bcrypt.compare(plainPassword, credential.secretHash);
    if (isValid) {
      await this.prisma.iamCredential.update({
        where: { id: credential.id },
        data: { lastUsedAt: new Date() },
      });
    }
    return isValid;
  }

  private async registerOrUpdateDevice({
    userId,
    fingerprint,
    name,
    deviceType,
  }: {
    userId: string;
    fingerprint?: string;
    name?: string;
    deviceType?: string;
  }) {
    const fingerprintHash = fingerprint ? hashValue(fingerprint) : null;
    if (fingerprintHash) {
      const existing = await this.prisma.iamDevice.findFirst({
        where: { userId, fingerprintHash },
      });
      if (existing) {
        return this.prisma.iamDevice.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date() },
        });
      }
    }

    return this.prisma.iamDevice.create({
      data: {
        userId,
        fingerprintHash,
        name: name ?? null,
        deviceType: deviceType ?? null,
        trustLevel: 'UNKNOWN',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
  }

  private async resolveTenantId(userId: string): Promise<string | null> {
    const user = await this.prisma.iamUser.findUnique({
      where: { id: userId },
      select: { defaultTenantId: true },
    });
    if (user?.defaultTenantId) {
      return user.defaultTenantId;
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { tenantId: true },
      orderBy: { createdAt: 'asc' },
    });
    return membership?.tenantId ?? null;
  }

  private async createSession({
    userId,
    tenantId,
    organizationId,
    siteId,
    applicationId,
    environment,
    deviceId,
    ipAddress,
    userAgent,
    authenticationLevel,
  }: {
    userId: string;
    tenantId?: string;
    organizationId?: string;
    siteId?: string;
    applicationId?: string;
    environment?: string;
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
    authenticationLevel: string;
  }) {
    const now = new Date();
    const { idleExpiresAt, expiresAt } = this.computeExpirations(now);

    const resolvedTenantId = tenantId ?? (await this.resolveTenantId(userId));

    return this.prisma.iamSession.create({
      data: {
        userId,
        tenantId: resolvedTenantId ?? null,
        organizationId: organizationId ?? null,
        siteId: siteId ?? null,
        applicationId: applicationId ?? null,
        environment: environment ? (environment as any) : null,
        deviceId,
        status: 'ACTIVE',
        authenticationLevel,
        riskLevel: 'LOW',
        ipHash: ipAddress ? hashValue(ipAddress) : null,
        userAgentHash: userAgent ? hashValue(userAgent) : null,
        createdAt: now,
        lastActivityAt: now,
        idleExpiresAt,
        expiresAt,
      },
    });
  }

async buildAccessToken(session: {
    id: string;
    userId: string;
    tenantId?: string | null;
    organizationId?: string | null;
    authenticationLevel?: string | null;
  }) {
    const user = await this.prisma.iamUser.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    });

    // Phase 8 : les claims du JWT restent une photographie informative. Le
    // guard ne s'y fie jamais — il ré résout depuis la base à chaque requête,
    // ce qui évite toute fenêtre d'autorisation après une révocation. Les
    // claims restent néanmoins alignés pour que `/auth/me` et les outils
    // hors-ligne ne mentent pas.
    const effective = await this.authorization.resolve(
      { id: session.userId, isAdmin: user?.isAdmin },
      session.tenantId,
    );
    const fallbackRoles = this.deriveRoles(user);

    return signAccessToken({
      type: 'access',
      userId: session.userId,
      sessionId: session.id,
      tenantId: session.tenantId,
      organizationId: session.organizationId,
      authenticationLevel: session.authenticationLevel,
      roles: effective.roles.length > 0 ? effective.roles : fallbackRoles,
      permissions: effective.permissions,
    });
  }

  /**
   * Rôle de repli historique, utilisé uniquement quand le RBAC n'a rien
   * résolu (aucun tenant actif). Ce n'est pas une source d'autorisation :
   * `IamAuthorizationService` est l'unique décideur.
   */
  private deriveRoles(user: { isAdmin?: boolean } | null): string[] {
    const roles: string[] = [];
    if (user?.isAdmin) {
      roles.push(ROLES.ADMIN);
    } else {
      roles.push(ROLES.USER);
    }
    return roles;
  }

  private async issueTokenPair(sessionId: string) {
    const session = await this.prisma.iamSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new IamError('Session introuvable', 404, 'SESSION_NOT_FOUND');
    }

    const accessToken = await this.buildAccessToken(session);
    const { raw, hash, familyId } = issueRefreshTokenPayload();

    const refreshTokenRow = await this.prisma.iamRefreshToken.create({
      data: {
        sessionId,
        tokenHash: hash,
        familyId,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return { accessToken, refreshToken: raw, refreshTokenId: refreshTokenRow.id };
  }

  private async rotateRefreshToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const existing = await this.prisma.iamRefreshToken.findUnique({
      where: { tokenHash },
    });
    if (!existing) {
      throw new IamError('Refresh token invalide', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (existing.status === 'REUSED' || existing.status === 'REVOKED') {
      // Token déjà utilisé (replay) → révoquer toute la famille
      await this.prisma.iamRefreshToken.updateMany({
        where: { familyId: existing.familyId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'REUSE_DETECTED' },
      });
      throw new IamError('Refresh token invalide', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (existing.status !== 'ACTIVE' || existing.expiresAt.getTime() < Date.now()) {
      throw new IamError('Refresh token invalide', 401, 'INVALID_REFRESH_TOKEN');
    }

    const session = await this.prisma.iamSession.findUnique({
      where: { id: existing.sessionId },
    });
    if (!session) {
      throw new IamError('Session introuvable', 401, 'SESSION_NOT_FOUND');
    }
    await this.assertSessionUsable(session);
    await this.prisma.iamSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    const { raw, hash } = issueRefreshTokenPayload();
    const next = await this.prisma.$transaction(async (tx) => {
      await tx.iamRefreshToken.update({
        where: { id: existing.id },
        data: {
          status: 'ROTATED',
          rotatedAt: new Date(),
        },
      });
      return tx.iamRefreshToken.create({
        data: {
          sessionId: existing.sessionId,
          tokenHash: hash,
          familyId: existing.familyId,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        },
      });
    });

    await this.prisma.iamRefreshToken.update({
      where: { id: existing.id },
      data: { replacedByTokenId: next.id },
    });

    return {
      accessToken: await this.buildAccessToken(session),
      refreshToken: raw,
      refreshTokenId: next.id,
    };
  }

  private async revokeTokensForSession(sessionId: string, revokeReason: string) {
    return this.prisma.iamRefreshToken.updateMany({
      where: { sessionId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason },
    });
  }

  private async revokeSession(sessionId: string, revokedBy: string, revokeReason: string) {
    return this.prisma.iamSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy,
        revokeReason,
        statusChangedAt: new Date(),
      },
    });
  }

  private async changePasswordForUser(userId: string, currentPassword: string, newPassword: string) {
    const isCurrentValid = await this.verifyPasswordCredential(userId, currentPassword);
    if (!isCurrentValid) {
      throw new IamError('Mot de passe actuel incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    }

    this.validatePasswordStrength(newPassword);
    await this.assertPasswordNotReused(userId, newPassword);

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.iamCredential.updateMany({
        where: { userId, type: 'PASSWORD', status: 'ACTIVE' },
        data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'PASSWORD_CHANGED' },
      });
      await tx.iamCredential.create({
        data: { userId, type: 'PASSWORD', status: 'ACTIVE', secretHash: newHash },
      });
      await tx.iamPasswordHistory.create({ data: { userId, passwordHash: newHash } });
    });
  }

  private async assertPasswordNotReused(userId: string, plainPassword: string) {
    const history = await this.prisma.iamPasswordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_POLICY.historyCount,
    });

    for (const entry of history) {
      const matches = await bcrypt.compare(plainPassword, entry.passwordHash);
      if (matches) {
        throw new IamError(
          `Ce mot de passe a déjà été utilisé récemment (les ${PASSWORD_POLICY.historyCount} derniers sont interdits)`,
          422,
          'PASSWORD_REUSED',
        );
      }
    }
  }

  async assertSessionUsable(
    session: {
      id: string;
      status: string;
      expiresAt?: Date | null;
      idleExpiresAt?: Date | null;
    },
    now = new Date(),
  ): Promise<void> {
    const isAbsoluteExpired = Boolean(session.expiresAt && session.expiresAt < now);
    const isIdleExpired = Boolean(session.idleExpiresAt && session.idleExpiresAt < now);

    if (session.status === 'REVOKED') {
      throw new IamError('Session révoquée', 401, 'SESSION_REVOKED');
    }
    if (session.status === 'EXPIRED' || isAbsoluteExpired) {
      if (session.status !== 'EXPIRED') {
        await this.prisma.iamSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED', statusChangedAt: now },
        });
      }
      throw new IamError('Session expirée', 401, 'SESSION_EXPIRED');
    }
    if (isIdleExpired) {
      const now2 = new Date();
      await this.prisma.iamSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED', statusChangedAt: now2, revokeReason: 'IDLE_TIMEOUT' },
      });
      throw new IamError('Session expirée', 401, 'SESSION_EXPIRED');
    }
  }
}

