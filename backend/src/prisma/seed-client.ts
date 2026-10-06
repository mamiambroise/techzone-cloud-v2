/**
 * Client Prisma partagé par les points d'entrée de seed.
 *
 * La résolution du schéma PostgreSQL est volontairement identique à celle de
 * `PrismaService` : le seed écrit dans le même schéma que l'application, sinon
 * le jeu de démonstration atterrit dans un schema que le backend ne lit pas.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DEFAULT_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/techzone';

export function createSeedPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || DEFAULT_CONNECTION_STRING;
  const schema = new URL(connectionString).searchParams.get('schema') || 'business_manager';

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema }),
  });
}