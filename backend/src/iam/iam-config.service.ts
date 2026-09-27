import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

@Injectable()
export class IamConfigService {
  private readonly defaultPasswordPolicy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    maxAgeDays: 90,
    historyCount: 12,
    maxFailedAttempts: 5,
    lockoutDurationMs: 900000,
  };

  constructor(private readonly prisma: PrismaService) {}

  getPublicConfig() {
    return {
      issuer: 'techzone-cloud-iam',
      mfa: {
        enabled: true,
        methods: ['TOTP', 'RECOVERY_CODE'],
        required: false,
      },
      passwordPolicy: this.defaultPasswordPolicy,
      features: {
        selfRegistration: true,
        adminApprovalRequired: false,
        passwordReset: true,
        mfaEnrollment: true,
        rememberDevice: true,
      },
    };
  }

  getPasswordPolicies() {
    return { policy: this.defaultPasswordPolicy };
  }

  getSecurityConfig() {
    return {
      passwordPolicy: this.defaultPasswordPolicy,
      session: {
        absoluteTimeoutMs: 28800000,
        idleTimeoutMs: 1800000,
        maxConcurrentSessions: 1,
      },
      mfa: {
        requiredForAdmin: true,
        requiredForPrivileged: false,
        rememberDeviceDays: 30,
      },
      rateLimit: {
        login: { windowMs: 900000, max: 10 },
        refresh: { windowMs: 900000, max: 30 },
      },
    };
  }

  testPolicy(policyCode: string, value: string) {
    if (policyCode === 'PASSWORD') {
      const errors: string[] = [];
      if (value.length < this.defaultPasswordPolicy.minLength) {
        errors.push(`Minimum ${this.defaultPasswordPolicy.minLength} caractères`);
      }
      if (this.defaultPasswordPolicy.requireUppercase && !/[A-Z]/.test(value)) {
        errors.push('Au moins une majuscule requise');
      }
      if (this.defaultPasswordPolicy.requireLowercase && !/[a-z]/.test(value)) {
        errors.push('Au moins une minuscule requise');
      }
      if (this.defaultPasswordPolicy.requireNumbers && !/\d/.test(value)) {
        errors.push('Au moins un chiffre requis');
      }
      if (this.defaultPasswordPolicy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>_/+[\\]-]/.test(value)) {
        errors.push('Au moins un caractère spécial requis');
      }
      return { valid: errors.length === 0, errors };
    }
    return { valid: true, errors: [] };
  }

  async getTenantConfig(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }
    return {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      status: tenant.status,
      locale: tenant.locale,
      timezone: tenant.timezone,
      metadata: tenant.metadata,
    };
  }

  async updateTenantConfig(id: string, body: Record<string, unknown>) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }

    const updateData: any = {};
    if (body.locale !== undefined) updateData.locale = body.locale;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.metadata !== undefined) updateData.metadata = body.metadata as any;

    return this.prisma.tenant.update({ where: { id }, data: updateData });
  }
}
