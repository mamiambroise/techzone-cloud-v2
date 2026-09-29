import { jest } from '@jest/globals';
import { IamAuthController } from './iam-auth.controller';
import { COOKIE_REFRESH_TOKEN } from './iam.constants';

describe('Cookie refresh contract', () => {
  const setup = () => {
    const refresh = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ accessToken: 'test-access', refreshToken: 'test-refresh' });
    const controller = new IamAuthController({ refresh } as any);
    const response = { cookie: jest.fn(), json: jest.fn() } as any;
    return { controller, refresh, response };
  };
  it('accepts the HttpOnly refresh cookie with an empty request body', async () => {
    const { controller, refresh, response } = setup();
    await controller.refresh({}, { cookies: { [COOKIE_REFRESH_TOKEN]: 'test-cookie' } } as any, response);
    expect(refresh).toHaveBeenCalledWith({ refreshToken: 'test-cookie' });
    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(response.json).toHaveBeenCalledWith({ success: true, message: 'Token rafraîchi' });
  });
  it('rejects missing credentials before calling the service', async () => {
    const { controller, refresh, response } = setup();
    await expect(controller.refresh({}, { cookies: {} } as any, response)).rejects.toMatchObject({ statusCode: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });
  it('preserves explicit token clients and prefers the cookie when both are sent', async () => {
    const { controller, refresh, response } = setup();
    await controller.refresh({ refreshToken: 'test-body' }, {} as any, response);
    expect(refresh).toHaveBeenLastCalledWith({ refreshToken: 'test-body' });
    await controller.refresh({ refreshToken: 'test-body' }, { cookies: { [COOKIE_REFRESH_TOKEN]: 'test-cookie' } } as any, response);
    expect(refresh).toHaveBeenLastCalledWith({ refreshToken: 'test-cookie' });
  });
});
