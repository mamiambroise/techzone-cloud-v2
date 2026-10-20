/**
 * Client Prisma partagé par les points d'entrée de seed.
 *
 * La résolution du schéma PostgreSQL est volontairement identique à celle de
 * `PrismaService` : le seed écrit dans le même schéma que l'application, sinon
 * le jeu de démonstration atterrit dans un schema que le backend ne lit pas.
 */
import 'dotenv/config';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Seeds run from `backend`; load its ignored local overrides just like the
// other local provisioning scripts, without requiring secrets in the shell.
config({ path: '.env.local', override: true });

const DEFAULT_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/techzone';

export function createSeedPrismaClient(): PrismaClient {
  // The demo orchestrator pins an explicit disposable target. Restore it after
  // local dotenv overrides so a developer's .env.local cannot redirect writes.
  const connectionString =
    process.env.TECHZONE_SEED_TARGET_URL ||
    process.env.DATABASE_URL ||
    DEFAULT_CONNECTION_STRING;
  const schema = new URL(connectionString).searchParams.get('schema') || 'business_manager';

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema }),
  });
}
