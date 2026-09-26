import { ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

/** Consume the identity authority's existing session and context contracts. */
export async function resolveIamPrincipal(token: string) {
  const base = process.env.IAM_API_URL || 'http://127.0.0.1:5001/api/iam';
  async function post(route: string, body: object) {
    let response: Response;
    try {
      response = await fetch(`${base}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException('Identity authority unavailable');
    }
    if (response.status === 401) throw new UnauthorizedException('Session invalid');
    if (!response.ok) throw new ServiceUnavailableException('Identity contract unavailable');
    return (await response.json()).data;
  }
  const validation = await post('/sessions/validate', { accessToken: token });
  if (!validation?.valid || !validation.session?.userId) throw new UnauthorizedException('Session invalid');
  const session = validation.session;
  const context = await post('/context/resolve', { source: 'PLATFORM_API' });
  const resolved = context?.status === 'RESOLVED';
  if (!resolved) throw new ForbiddenException('Identity context unresolved');
  return {
    userId: session.userId,
    sessionId: session.id,
    tenantId: resolved ? context.tenant?.tenantId ?? null : null,
    organizationId: resolved ? context.tenant?.organizationId ?? null : null,
    authenticationLevel: session.authenticationLevel ?? null,
    roles: resolved ? (context.roles || []).map((role: any) => role.code) : [],
    permissions: resolved ? (context.permissions || []).map((permission: any) => permission.code) : [],
    isSuperAdmin: false,
  };
}
