import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import {
  currentTotpStep,
  decryptSecret,
  encryptSecret,
  generateChallengeToken,
  generateTotpSecret,
  hashChallengeToken,
  totpStepConsumable,
  totpVerify,
} from './iam-totp';

/**
 * Enrôlement → challenge de login → vérification TOTP réelle →
 * consommation du challenge → création de session.
 *
 * Le challenge est opaque, one-time, TTL, lié à l'Identity, limité en
 * essais et anti-replay. Aucune session n'est créée avant consommation
 * réussie du challenge émis après validation du mot de passe.
 */
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MFA_CHALLENGE_MAX_ATTEMPTS = 5;

@Injectable()
export class IamMfaService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(userId: string, type: string, label?: string) {
    if (type === 'TOTP') {
      const secret = generateTotpSecret();
      const method = await this.prisma.mfaMethod.create({
        data: {
          userId,
          type: 'TOTP',
          label: label ?? 'TOTP',
          // Référence de secret : le secret brut n'existe jamais en clair en
          // base, il est chiffré AES-256-GCM (iam-totp.ts).
          secretRef: encryptSecret(secret),
          enabled: false,
          verified: false,
        },
      });
      const otpauthUri =
        `otpauth://totp/TechzoneCloud:${userId}?issuer=Techzone%20Cloud&secret=${secret}&algorithm=SHA1&digits=6&period=30`;
      // Le secret n'est retourné QU'UNE SEULE fois, durant l'enrôlement.
      return { type: 'TOTP', methodId: method.id, secret, otpauthUri };
    }
    if (type === 'RECOVERY_CODE') {
      const codes = this.generateRecoveryCodes();
      await this.prisma.recoveryCode.deleteMany({ where: { userId } });
      // Hachage bcrypt : identifiable à la vérification (compare) et non
      // réversible (contrairement au SHA-256 seul).
      await this.prisma.recoveryCode.createMany({
        data: await Promise.all(
          codes.map(async (c) => ({
            userId,
            codeHash: await bcrypt.hash(c, 10),
          })),
        ),
      });
      return { type: 'RECOVERY_CODE', codes };
    }
    throw new IamError('Type MFA non supporté', 400, 'MFA_TYPE_UNSUPPORTED');
  }

  async verifyEnrollment(userId: string, type: string, code: string) {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: type as any, enabled: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!method) {
      throw new IamError('Méthode MFA introuvable', 404, 'MFA_METHOD_NOT_FOUND');
    }

    if (type === 'TOTP') {
      const meta = (method.metadata as Record<string, unknown> | null) ?? {};
      const result = this.verifyTotpCode(code, method.secretRef, null, method.id, meta);
      if (result !== 'ok') {
        throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
      }
      await this.prisma.mfaMethod.update({
        where: { id: method.id },
        data: {
          metadata: { ...((method.metadata as any) ?? {}), lastUsedTotpStep: currentTotpStep() },
        },
      });
    }

    await this.prisma.mfaMethod.update({
      where: { id: method.id },
      data: { enabled: true, verified: true, verifiedAt: new Date(), lastUsedAt: new Date() },
    });

    return { success: true, message: 'MFA activé' };
  }

  // ================= Challenge de login (P0) =================

  /**
   * Crée le challenge MFA lié au login attempt (mot de passe VALIDÉ).
   * Token opaque, one-time, TTL, lié à l'Identity ; limité en essais.
   */
  async issueLoginChallenge(userId: string, deviceId?: string | null, ipHash?: string | null) {
    const { token, tokenHash } = generateChallengeToken();
    const challenge = await this.prisma.mfaChallenge.create({
      data: {
        userId,
        tokenHash,
        status: 'PENDING',
        maxAttempts: MFA_CHALLENGE_MAX_ATTEMPTS,
        deviceId: deviceId ?? null,
        ipHash: ipHash ?? null,
        expiresAt: new Date(Date.now() + MFA_CHALLENGE_TTL_MS),
      },
    });
    return { token: `mfa-ch_${token}`, challengeId: challenge.id, expiresAt: challenge.expiresAt };
  }

  /**
   * Vérifie un code TOTP réel contre un challenge valide puis consomme le
   * challenge de manière atomique. Retourne userId du challenge.
   *
   * Garanties : opaque, one-time, TTL, lié à l'Identity, limité en essais,
   * anti-replay. Erreur générique `MFA_INVALID_CODE` : aucune distinction
   * entre challenge inconnu / expiré / consommé / code faux.
   */
  async validateLoginChallenge(
    rawToken: string,
    code: string,
    recoveryCode?: string | null,
  ): Promise<{ userId: string; deviceId: string | null }> {
    const token = rawToken?.startsWith('mfa-ch_') ? rawToken.slice('mfa-ch_'.length) : rawToken;
    if (!token) {
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }

    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
    });
    if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }
    if (challenge.status !== 'PENDING') {
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      await this.consumeChallengeWrite(challenge.id, 'EXCEEDED_ATTEMPTS');
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }

    const verification = await this.verifyMfaForUser(challenge.userId, code, recoveryCode);

    if (!verification.verified) {
      const lock = challenge.attempts + 1 >= challenge.maxAttempts;
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts: { increment: 1 },
          ...(lock
            ? { consumedAt: new Date(), consumedReason: 'EXCEEDED_ATTEMPTS', status: 'CONSUMED' }
            : {}),
        },
      });
      await this.logSecurityEvent({
        type: 'auth.mfa.failed',
        severity: 'MEDIUM',
        userId: challenge.userId,
        metadata: { reason: verification.rejectedReplay ? 'MFA_REPLAY' : 'MFA_INVALID_CODE' },
      });
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }

    // Consommation atomique : un seul flux peut consommer le challenge.
    const consumed = await this.prisma.mfaChallenge.updateMany({
      where: { id: challenge.id, status: 'PENDING' },
      data: { status: 'CONSUMED', consumedAt: new Date(), consumedReason: 'MFA_OK' },
    });
    if (consumed.count !== 1) {
      throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
    }

    return { userId: challenge.userId, deviceId: challenge.deviceId };
  }

  private async consumeChallengeWrite(challengeId: string, reason: string) {
    await this.prisma.mfaChallenge.updateMany({
      where: { id: challengeId, status: 'PENDING' },
      data: { status: 'CONSUMED', consumedAt: new Date(), consumedReason: reason },
    });
  }

  // ================= Vérification réelle =================

  /**
   * Vérifie TOTP réel (avec anti-replay par timestep) puis recovery code
   * (bcrypt). Toute erreur renvoie `verified: false` (fail-closed).
   */
  async verifyMfaForUser(
    userId: string,
    code: string,
    recoveryCode?: string | null,
  ): Promise<{ verified: boolean; rejectedReplay?: boolean }> {
    const methods = await this.prisma.mfaMethod.findMany({
      where: { userId, enabled: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const method of methods) {
      if (method.type !== 'TOTP') continue;
      const meta = (method.metadata as Record<string, unknown> | null) ?? {};
      const lastUsedStep =
        typeof meta.lastUsedTotpStep === 'number' ? meta.lastUsedTotpStep : null;
      const result = this.verifyTotpCode(code, method.secretRef, lastUsedStep, method.id, meta);
      if (result === 'ok') {
        return { verified: true };
      }
      if (result === 'replay') {
        return { verified: false, rejectedReplay: true };
      }
    }

    if (recoveryCode) {
      const unused = await this.prisma.recoveryCode.findMany({
        where: { userId, usedAt: null },
      });
      for (const entry of unused) {
        if (await bcrypt.compare(recoveryCode, entry.codeHash)) {
          await this.prisma.recoveryCode.update({
            where: { id: entry.id },
            data: { usedAt: new Date() },
          });
          return { verified: true };
        }
      }
    }

    return { verified: false };
  }

  /**
   * Vérifie un code TOTP réel. `lastUsedStep` est passé par l'appelant
   * (anti-replay) et, si succès, le pas consommé est persisté.
   */
  private verifyTotpCode(
    code: string,
    secretEncrypted: string | null,
    lastUsedStep: number | null,
    methodId: string,
    existingMetadata: Record<string, unknown>,
  ): 'ok' | 'replay' | 'failure' {
    if (!secretEncrypted) return 'failure';
    const secret = decryptSecret(secretEncrypted);
    if (!secret) return 'failure';

    const match = totpVerify(secret, code);
    if (!match) return 'failure';

    const absoluteStep = currentTotpStep() + match.stepDelta;
    if (!totpStepConsumable(absoluteStep, lastUsedStep)) {
      return 'replay';
    }
    // Persiste le pas consommé pour l'anti-replay (le refus après écrasement
    // du metadata ne doit pas invalider la vérification réussie).
    void this.prisma.mfaMethod
      .update({
        where: { id: methodId },
        data: {
          metadata: { ...existingMetadata, lastUsedTotpStep: absoluteStep },
          lastUsedAt: new Date(),
        },
      })
      .catch(() => undefined);
    return 'ok';
  }

  // ================= Legacy (remplacé par le flux challenge) =================

  /**
   * @deprecated L'ancien flux « identifier + code » sans challenge est
   * supprimé : toute vérification MFA passe par un challenge opaque émis
   * après validation du mot de passe. Cette méthode échoue systématiquement
   * (fail-closed).
   */
  async verifyMfaChallenge(): Promise<never> {
    throw new IamError('Code MFA invalide', 401, 'MFA_INVALID_CODE');
  }

  async listMfaMethods(userId: string) {
    return this.prisma.mfaMethod.findMany({
      where: { userId },
      select: { id: true, type: true, label: true, enabled: true, verified: true, createdAt: true, lastUsedAt: true },
    });
  }

  async revokeMfaMethod(userId: string, methodId: string) {
    const method = await this.prisma.mfaMethod.findFirst({ where: { id: methodId, userId } });
    if (!method) {
      throw new IamError('Méthode MFA introuvable', 404, 'MFA_METHOD_NOT_FOUND');
    }
    await this.prisma.mfaMethod.update({
      where: { id: methodId },
      data: { enabled: false, verified: false, disabledAt: new Date() },
    });
    return { success: true, message: 'Méthode MFA révoquée' };
  }

  async regenerateRecoveryCodes(userId: string) {
    const codes = this.generateRecoveryCodes();
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });
    await this.prisma.recoveryCode.createMany({
      data: await Promise.all(
        codes.map(async (c) => ({
          userId,
          codeHash: await bcrypt.hash(c, 10),
        })),
      ),
    });
    return codes;
  }

  async hasMfaEnabled(userId: string): Promise<boolean> {
    const count = await this.prisma.mfaMethod.count({ where: { userId, enabled: true } });
    return count > 0;
  }

  private generateRecoveryCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random().toString(36).substring(2, 8).toUpperCase();
      const b = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(`${a}-${b}`);
    }
    return codes;
  }

  private async logSecurityEvent(event: {
    type: string;
    severity: any;
    userId?: string;
    sessionId?: string;
    deviceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.securityEvent.create({
      data: {
        traceId: event.metadata?.traceId as string | undefined,
        type: event.type,
        severity: event.severity,
        userId: event.userId ?? null,
        sessionId: event.sessionId ?? null,
        deviceId: event.deviceId ?? null,
        source: 'MFA',
        metadata: (event.metadata ?? {}) as any,
      },
    });
  }
}
