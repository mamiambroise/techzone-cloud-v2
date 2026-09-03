import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const explicitUrl = config.get<string>('DATABASE_URL');
    const host = config.get<string>('DB_HOST', 'localhost');
    const port = config.get<string>('DB_PORT', '5432');
    const user = encodeURIComponent(
      config.get<string>('DB_USERNAME', 'postgres'),
    );
    const password = encodeURIComponent(
      config.get<string>('DB_PASSWORD', 'postgres'),
    );
    const database = config.get<string>('DB_DATABASE', 'business_manager');
    const url =
      explicitUrl ??
      `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
    super({ datasources: { db: { url } } });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
