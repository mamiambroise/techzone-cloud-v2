import 'dotenv/config';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { integrationRequestContext } from './common/integration-request-context';
import { iamHttpThrottle } from './iam/iam-http-throttle.middleware';
import { ObservabilityService } from './observability/observability.service';
import { safeOptionalId, safeTraceId, traceContext } from './observability/trace-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const observability = app.get(ObservabilityService);

  app.use((req: any, res: any, next: () => void) => {
    const traceId = safeTraceId(req.headers['x-trace-id']);
    const requestId = safeTraceId(req.headers['x-request-id']);
    const correlationId = safeOptionalId(req.headers['x-correlation-id']);
    req.traceId = traceId;
    req.requestId = requestId;
    if (correlationId) req.correlationId = correlationId;
    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Id', requestId);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ message: 'Cross-site request refused', traceId });
    }
    const startedAt = process.hrtime.bigint();
    res.once('finish', () => {
      try {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const path = String(req.path ?? req.url ?? '').replace(/\/(?:[0-9a-f]{8,}|\d+)(?=\/|$)/gi, '/:id');
        observability.recordHttpRequest({
          method: req.method,
          path,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs),
          traceId,
          requestId,
          correlationId,
          tenantId: req.iamAuth?.tenantId ?? undefined,
        });
      } catch {
        // Telemetry must never change the outcome of a healthy business request.
      }
    });
    traceContext.run({ traceId, requestId, correlationId }, () => integrationRequestContext.run({ traceId }, next));
  });

  app.use(cookieParser());

  // LOT 4 : rate limit réel par IP sur login / MFA / refresh / recovery.
  app.use(iamHttpThrottle());

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Trace-Id', 'X-Runtime-Resolution-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Trace-Id'],
    credentials: true,
    maxAge: 600,
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      hidePoweredBy: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  const port = process.env.PORT ?? 3003;
  await app.listen(port);

  Logger.log(
    JSON.stringify({
      event: 'BOOT',
      port,
      corsOrigins,
    }),
  );
}

bootstrap();
