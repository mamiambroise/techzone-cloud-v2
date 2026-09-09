import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body } = request;
    const traceId = headers['x-trace-id'] || uuidv4();
    request.traceId = traceId;

    const startTime = Date.now();

    this.logger.log(
      `[${traceId}] ${method} ${url} - Request received`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${traceId}] ${method} ${url} - Completed in ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${traceId}] ${method} ${url} - Failed in ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}