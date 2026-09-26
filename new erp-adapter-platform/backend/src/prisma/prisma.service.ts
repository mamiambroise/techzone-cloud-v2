import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 3000;

const DB_NOT_CONFIGURED = 'DB_NOT_CONFIGURED';

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') {
    throw new Error(DB_NOT_CONFIGURED);
  }
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = resolveDatabaseUrl();
    super({ datasourceUrl: connectionString });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try {
        await this.$connect();
        this.logger.log('Connexion a PostgreSQL etablie');
        return;
      } catch (err) {
        this.logger.warn(
          `Connexion PostgreSQL echouee (tentative ${attempt}) - ${(err as any)?.message} (nouvel essai dans ${RETRY_DELAY_MS / 1000}s)`,
        );
        if (attempt >= MAX_ATTEMPTS) {
          this.logger.error(
            `Base de donnees injoignable apres ${attempt} tentatives - demarrage interrompu`,
          );
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Connexion a PostgreSQL fermee');
  }
}
