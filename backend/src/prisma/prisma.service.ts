import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/techzone';

    const schema = new URL(connectionString).searchParams.get('schema') || 'public';
    const adapter = new PrismaPg({ connectionString }, { schema });

    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();

      await this.$queryRaw`SELECT 1`;

      this.logger.log('✅ PostgreSQL connected successfully');
    } catch (error) {
      this.logger.error(
        '❌ Unable to connect to PostgreSQL',
        error instanceof Error ? error.stack : String(error),
      );

      await this.$disconnect();

      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 PostgreSQL connection closed');
  }
}
