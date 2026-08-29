import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  id: string;
  email: string;
  permissions: string[];
  tenantId?: string;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);