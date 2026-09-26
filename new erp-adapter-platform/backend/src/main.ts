import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TraceIdMiddleware } from './erp-adapter/trace-id.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Security headers via helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  // Cookie parser for refresh token cookies
  app.use(cookieParser());

  // Prefixe global pour toutes les routes API
  app.setGlobalPrefix('api');

  // CORS (strict: no wildcard with credentials)
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001')
    .split(',')
    .map((origin: string) => origin.trim());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // TraceId propagation (before global filters so every response carries it)
  const traceIdMiddleware = new TraceIdMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => traceIdMiddleware.use(req, res, next));

  // Filtre global d'exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuration Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('ERP Adapter Platform API')
    .setDescription('API de gestion des adaptateurs ERP + Data Runtime + Automation (Phase 3)')
    .setVersion('3.0')
    .addTag('erp-registry', 'Gestion du registre des ERP (PostgreSQL)')
    .addTag('erp-adapter', 'Gestion des adaptateurs ERP (Mock, Dolibarr)')
    .addTag('data-runtime', 'Data Runtime Contract v1 - Query, Execution, Binding')
    .addTag('automation', 'Automation Contract v1 - Rules, Workflow, Trigger, Action')
    .addTag('iam-auth', 'IAM · Authentification (login, refresh, logout, mot de passe)')
    .addTag('iam-users', 'IAM · Gestion des utilisateurs (admin)')
    .addTag('iam-sessions', "IAM · Gestion des sessions (admin)")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application demarree sur le port ${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
