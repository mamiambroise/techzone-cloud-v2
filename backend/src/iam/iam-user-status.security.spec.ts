import { IamAdminService } from './iam-admin.service';
import { IamAuthService } from './iam-auth.service';
import { IamError } from './iam-error';

describe('IAM user status security', () => {
  it('fails closed when a persisted user status is not ACTIVE', () => {
    const auth = new IamAuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    expect(() => auth.assertUserIsActive({ status: 'ACTIVE' })).not.toThrow();
    expect(() => auth.assertUserIsActive({ status: 'SUSPENDED' })).toThrow(
      IamError,
    );
    expect(() => auth.assertUserIsActive({ status: 'UNKNOWN_FUTURE_STATUS' })).toThrow(
      IamError,
    );
  });

  it('revokes active sessions and refresh tokens in the status-change transaction', async () => {
    const now = new Date();
    const updatedUser = {
      id: 'subject-user',
      username: 'subject',
      primaryEmail: 'subject@example.test',
      phone: null,
      firstName: null,
      lastName: null,
      displayName: null,
      status: 'SUSPENDED',
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      iamUser: {
        findUnique: jest.fn().mockResolvedValue(updatedUser),
        update: jest.fn().mockResolvedValue(updatedUser),
      },
      iamRefreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      iamSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const admin = new IamAdminService(prisma as any);

    const result = await admin.updateUserStatus(
      'subject-user',
      { status: 'SUSPENDED', reason: 'security review' },
      'admin-user',
    );

    expect(result.status).toBe('SUSPENDED');
    expect(tx.iamRefreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          session: { is: { userId: 'subject-user' } },
        }),
      }),
    );
    expect(tx.iamSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'subject-user', status: 'ACTIVE' },
        data: expect.objectContaining({
          status: 'REVOKED',
          revokedBy: 'admin-user',
          revokeReason: 'USER_SUSPENDED',
        }),
      }),
    );
  });
});
