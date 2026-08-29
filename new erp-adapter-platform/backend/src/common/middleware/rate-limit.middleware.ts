import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
    max: Number(process.env.RATE_LIMIT_MAX) || 100, // 100 requêtes par minute
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Trop de requêtes. Veuillez réessayer dans une minute.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}