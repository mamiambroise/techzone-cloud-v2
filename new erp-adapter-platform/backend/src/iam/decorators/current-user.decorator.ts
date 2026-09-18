import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IamAuthContext {
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  organizationId?: string | null;
  authenticationLevel?: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IamAuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.iamAuth;
  },
);