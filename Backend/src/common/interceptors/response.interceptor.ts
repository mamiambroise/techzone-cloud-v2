import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  success: boolean;
  data: T;
  error: null;
  meta: {
    trace_id: string;
    timestamp: string;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const traceId = uuidv4();
    const now = new Date().toISOString();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null,
        meta: {
          trace_id: traceId,
          timestamp: now,
        },
      })),
    );
  }
}