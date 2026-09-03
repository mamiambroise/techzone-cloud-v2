import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Permission } from '../../../common/enums';

class CreateSessionDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}

const USERS = {
  'admin@techzone.io': {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Super Administrateur',
    role: 'ADMIN',
  },
  'builder@techzone.io': {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Studio Builder Techzone',
    role: 'BUILDER',
  },
  'guest@techzone.io': {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Lecteur Invité Entreprise',
    role: 'VIEWER',
  },
} as const;

const BUILDER_PERMISSIONS = [
  Permission.APPLICATION_READ,
  Permission.APPLICATION_CREATE,
  Permission.APPLICATION_UPDATE,
  Permission.VERSION_READ,
  Permission.VERSION_CREATE,
  Permission.DATA_MODEL_READ,
  Permission.DATA_MODEL_WRITE,
  Permission.FEATURE_READ,
  Permission.FEATURE_CREATE,
  Permission.FEATURE_UPDATE,
  Permission.CAPABILITY_READ,
  Permission.VERSION_FEATURE_MANAGE,
  Permission.VERSION_CAPABILITY_MANAGE,
  Permission.PACK_READ,
  Permission.PACK_CREATE,
  Permission.PACK_UPDATE,
  Permission.PACK_VERSION_READ,
  Permission.PACK_VERSION_CREATE,
  Permission.PACK_VERSION_UPDATE,
  Permission.PACK_VERSION_VALIDATE,
  Permission.PACK_VERSION_GENERATE_MANIFEST,
  Permission.PACK_MODULE_READ,
  Permission.PACK_MODULE_CREATE,
  Permission.PACK_FEATURE_READ,
  Permission.PACK_FEATURE_CREATE,
  Permission.PACK_CAPABILITY_READ,
  Permission.PACK_CAPABILITY_CREATE,
  Permission.PACK_CAPABILITY_ATTACH,
  Permission.PACK_DEPENDENCY_READ,
  Permission.PACK_DEPENDENCY_CREATE,
  Permission.PACK_DEPENDENCY_RESOLVE,
  Permission.PACK_RULE_READ,
  Permission.PACK_RULE_CREATE,
  Permission.PACK_RULE_VALIDATE,
  Permission.RUNTIME_RESOLVE,
  Permission.RUNTIME_RESOLUTION_READ,
  Permission.RUNTIME_MANIFEST_READ,
  Permission.RUNTIME_EFFECTIVE_MANIFEST_READ,
  Permission.RUNTIME_DIAGNOSTIC_READ,
  Permission.RUNTIME_DIAGNOSTIC_EXPORT,
  Permission.RUNTIME_PROVIDER_READ,
  Permission.RUNTIME_PROVIDER_PROBE,
  Permission.RUNTIME_CACHE_READ,
  Permission.RUNTIME_CACHE_INVALIDATE,
  Permission.RUNTIME_RESOLUTION_RETRY,
  Permission.RUNTIME_RESOLUTION_RERESOLVE,
  Permission.RUNTIME_RESILIENCE_READ,
];

const VIEWER_PERMISSIONS = [
  Permission.APPLICATION_READ,
  Permission.VERSION_READ,
  Permission.AUDIT_READ,
  Permission.DATA_MODEL_READ,
  Permission.FEATURE_READ,
  Permission.CAPABILITY_READ,
  Permission.FEATURE_SNAPSHOT_READ,
  Permission.PACK_READ,
  Permission.PACK_VERSION_READ,
  Permission.PACK_MODULE_READ,
  Permission.PACK_FEATURE_READ,
  Permission.PACK_CAPABILITY_READ,
  Permission.PACK_DEPENDENCY_READ,
  Permission.PACK_RULE_READ,
  Permission.RUNTIME_RESOLUTION_READ,
  Permission.RUNTIME_MANIFEST_READ,
  Permission.RUNTIME_EFFECTIVE_MANIFEST_READ,
  Permission.RUNTIME_DIAGNOSTIC_READ,
  Permission.RUNTIME_PROVIDER_READ,
  Permission.RUNTIME_CACHE_READ,
  Permission.RUNTIME_RESILIENCE_READ,
];

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  /** BM-CDC-00: the backend is the sole issuer of API credentials. */
  @Post('session')
  async createSession(@Body() input: CreateSessionDto) {
    const email = input.email.trim().toLowerCase();
    const known = USERS[email as keyof typeof USERS];
    const user = known ?? {
      id: '44444444-4444-4444-8444-444444444444',
      name: input.name?.trim() || email.split('@')[0],
      role: 'VIEWER' as const,
    };
    const permissions =
      user.role === 'ADMIN'
        ? Object.values(Permission)
        : user.role === 'BUILDER'
          ? BUILDER_PERMISSIONS
          : VIEWER_PERMISSIONS;
    const tenantId = 'tenant-techzone-01';
    const payload = {
      sub: user.id,
      email,
      name: input.name?.trim() || user.name,
      role: user.role,
      permissions,
      tenantId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email,
        name: payload.name,
        role: user.role,
        permissions,
        tenantId,
      },
    };
  }
}
