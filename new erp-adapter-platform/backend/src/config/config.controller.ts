import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../iam/decorators/public.decorator';

interface ConfigEntry {
  key: string;
  value: string;
  source: 'env' | 'default' | 'runtime';
  masked: boolean;
}

function maskValue(value: string, key: string): string {
  const sensitiveKeys = [
    'secret',
    'password',
    'token',
    'key',
    'credential',
    'apikey',
    'api_key',
    'private',
    'jwt',
  ];
  const isSensitive = sensitiveKeys.some((s) => key.toLowerCase().includes(s));
  if (!isSensitive) {
    return value;
  }
  if (!value || value.length === 0) {
    return '********';
  }
  if (value.length <= 4) {
    return '********';
  }
  return `${value.slice(0, 2)}********${value.slice(-2)}`;
}

@Controller('config')
@ApiTags('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public configuration (masked secrets)' })
  getPublicConfig(): Record<string, string> {
    return {
      environment: this.configService.get('NODE_ENV') || 'development',
      erpResolutionMode: this.configService.get('ERP_RESOLUTION_MODE') || 'config',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Configuration overview with secret masking' })
  getConfig(): { entries: ConfigEntry[] } {
    const entries: ConfigEntry[] = [];
    const runtimeEntries: Record<string, any> = (this.configService as any).internalConfig || {};
    const envKeys = Object.keys(process.env);

    const knownKeys = [
      'NODE_ENV',
      'PORT',
      'CORS_ORIGIN',
      'JWT_ACCESS_SECRET',
      'JWT_ACCESS_TTL',
      'JWT_REFRESH_SECRET',
      'ERP_RESOLUTION_MODE',
      'DEFAULT_ERP',
      'AUTH_AIM_URL',
      'AUTH_AIM_API_KEY',
      'DATABASE_URL',
      'BCRYPT_SALT_ROUNDS',
    ];

    for (const key of knownKeys) {
      let value = this.configService.get(key) ?? process.env[key] ?? '';
      const source: 'env' | 'default' | 'runtime' = process.env[key]
        ? 'env'
        : runtimeEntries[key] !== undefined
          ? 'runtime'
          : 'default';
      const masked = value !== '' && maskValue(String(value), key) !== String(value);
      entries.push({
        key,
        value: masked ? maskValue(String(value), key) : String(value),
        source,
        masked,
      });
    }

    return { entries };
  }
}
