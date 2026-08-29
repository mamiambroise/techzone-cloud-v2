import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));