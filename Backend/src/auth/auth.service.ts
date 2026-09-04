import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { User } from './user.entity';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'iam.user.read', 'iam.user.create', 'iam.user.update', 'iam.user.disable', 'business.pack.read', 'business.pack.write',
    'business.application.read', 'business.application.create', 'business.application.update', 'business.application.archive',
    'business.application.version.read', 'business.application.version.create', 'business.application.validate',
    'business.application.publish', 'business.application.rollback', 'business.application.audit.read',
    'business.application.data-model.read', 'business.application.data-model.write', 'business.application.data-model.validate',
    'business.feature.read', 'business.feature.create', 'business.feature.update', 'business.feature.archive',
    'business.capability.read', 'business.capability.create', 'business.capability.update', 'business.capability.archive',
    'business.feature.mapping.manage', 'business.capability.dependency.manage', 'business.capability.requirement.manage',
    'business.version.feature.manage', 'business.version.capability.manage', 'business.feature.impact.read',
    'business.feature.validation.run', 'business.feature.snapshot.read',
  ],
  BUILDER: [
    'business.application.read', 'business.application.create', 'business.application.update',
    'business.application.version.read', 'business.application.version.create', 'business.application.data-model.read',
    'business.application.data-model.write', 'business.feature.read', 'business.feature.create', 'business.feature.update',
    'business.capability.read', 'business.version.feature.manage', 'business.version.capability.manage',
    'business.pack.read', 'business.pack.write',
  ],
  VIEWER: ['business.application.read', 'business.application.version.read', 'business.application.audit.read', 'business.application.data-model.read', 'business.feature.read', 'business.capability.read', 'business.feature.snapshot.read', 'business.pack.read'],
};

function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    const email = process.env.IAM_ADMIN_EMAIL || 'admin@techzone.io';
    const password = process.env.IAM_ADMIN_PASSWORD || 'ChangeMe123!';
    if (!(await this.users.findOne({ where: { email } }))) {
      await this.users.save(this.users.create({
        email,
        name: 'Administrateur Techzone',
        role: 'ADMIN',
        permissions: ROLE_PERMISSIONS.ADMIN,
        passwordHash: hashPassword(password),
      }));
    }
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase(), isActive: true } });
    if (!user || !verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Identifiants invalides');
    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions, tenantId: 'tenant-techzone-01' };
    return { accessToken: await this.jwt.signAsync(payload), user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions, tenantId: payload.tenantId } };
  }

  async listUsers() {
    return this.users.find({ select: ['id', 'email', 'name', 'role', 'permissions', 'isActive', 'createdAt', 'updatedAt'], order: { createdAt: 'ASC' } });
  }

  async createUser(input: { email: string; name: string; role?: string; password: string }) {
    const role = input.role || 'VIEWER';
    const user = this.users.create({ email: input.email.trim().toLowerCase(), name: input.name.trim(), role, permissions: ROLE_PERMISSIONS[role] || [], passwordHash: hashPassword(input.password) });
    return this.users.save(user);
  }
}

export { ROLE_PERMISSIONS };
