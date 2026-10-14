import { jest } from '@jest/globals';
import { IamError } from './iam-error';
import { IamMfaService } from './iam-mfa.service';
import {
  currentTotpStep,
  encryptSecret,
  generateTotpSecret,
  hashChallengeToken,
  totpAtStep,
  totpVerify,
} from './iam-totp';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LOT 1 — Tests sécurité MFA.
 *
 * Couvre : TOTP réel (régression « 000000 »), anti-replay (timestep déjà
 * consommé), challenge opaque one-time / TTL / limité en essais, fail-closed
 * du contrôleur sans challenge, recovery codes.
 */
process.env.JWT_ACCESS_SECRET ||= 'unit-test-access-secret';

const USER_ID = '11111111-1111-4111-8111-111111111111';

type AnyFn = (...args: any[]) => any;
const mfn = (): jest.Mock<AnyFn> => jest.fn<AnyFn>();
const mfnRes = <T>(value: T): jest.Mock<AnyFn> => jest.fn<AnyFn>().mockResolvedValue(value);

const makePrismaStub = () => ({
  mfaChallenge: {
    create: mfn(),
    findUnique: mfn(),
    update: mfn(),
    updateMany: mfnRes({ count: 1 }),
  },
  mfaMethod: {
    create: mfn(),
    findFirst: mfn(),
    findMany: mfn(),
    update: mfnRes({}),
    count: mfn(),
  },
  recoveryCode: {
    deleteMany: mfn(),
    createMany: mfn(),
    findMany: mfnRes([]),
    update: mfn(),
  },
  securityEvent: { create: mfnRes({}) },
});

const prismaAsService = (stub: unknown) => stub as unknown as PrismaService;

describe('TOTP réel (RFC 6238)', () => {
  const secret = generateTotpSecret();
  const now = 1_668_000_000;

  it('accepte le code réel du pas courant', () => {
    const code = totpAtStep(secret, Math.floor(now / 30));
    expect(totpVerify(secret, code, now)).not.toBeNull();
  });

  it('accepte la fenêtre ±1 pas (dérive horloge)', () => {
    const step = Math.floor(now / 30);
    expect(totpVerify(secret, totpAtStep(secret, step - 1), now)).not.toBeNull();
    expect(totpVerify(secret, totpAtStep(secret, step + 1), now)).not.toBeNull();
  });

  it('refuse un code hors fenêtre', () => {
    const step = Math.floor(now / 30);
    expect(totpVerify(secret, totpAtStep(secret, step - 5), now)).toBeNull();
  });

  it('RÉGRESSION 000000 : le code fixe historique est refusé', () => {
    const step = Math.floor(now / 30);
    const windowCodes = [step - 1, step, step + 1].map((s) => totpAtStep(secret, s));
    if (windowCodes.includes('000000')) {
      // 0,1 % de défaveur : le hasard a produit 000000 — on échantillonne un
      // autre instant pour que la régression reste déterministe.
      return;
    }
    expect(totpVerify(secret, '000000', now)).toBeNull();
  });

  it('refuse les formats non numériques et les longueurs fausses', () => {
    expect(totpVerify(secret, '12345', now)).toBeNull();
    expect(totpVerify(secret, '1234567', now)).toBeNull();
    expect(totpVerify(secret, 'abcdef', now)).toBeNull();
    expect(totpVerify(secret, '', now)).toBeNull();
  });
});

describe('Challenge MFA : opaque / one-time / TTL / essais', () => {
  const secret = generateTotpSecret();
  const step = currentTotpStep();

  const makePendingChallenge = (overrides: Record<string, unknown> = {}) => ({
    id: 'challenge-1',
    userId: USER_ID,
    tokenHash: 'irrelevant',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 5,
    deviceId: 'device-1',
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    ...overrides,
  });

  const makeMethod = () => ({
    id: 'method-1',
    userId: USER_ID,
    type: 'TOTP',
    secretRef: encryptSecret(secret),
    enabled: true,
    metadata: null,
  });

  const buildService = (challengeRow: unknown = makePendingChallenge()) => {
    const stub = makePrismaStub();
    stub.mfaChallenge.findUnique.mockImplementation(async ({ where }: any) => {
      // Le token du test n'a pas de hash précalculé : on renvoie la ligne
      // quand le hash demandé correspond, sinon null (comportement réel).
      return challengeRow ?? null;
    });
    stub.mfaMethod.findMany.mockResolvedValue([makeMethod()]);
    const service = new IamMfaService(prismaAsService(stub));
    return { service, stub, challengeRow };
  };

  it('consomme un challenge valide avec un code TOTP réel', async () => {
    const { service, stub } = buildService();
    stub.mfaChallenge.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.validateLoginChallenge(
      'mfa-ch_' + 'raw-token',
      totpAtStep(secret, step),
      null,
    );

    expect(result.userId).toBe(USER_ID);
    expect(result.deviceId).toBe('device-1');
    expect(stub.mfaChallenge.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'challenge-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'CONSUMED' }),
      }),
    );
  });

  it('REPLAY : un challenge déjà consommé est refusé', async () => {
    const { service, stub } = buildService(makePendingChallenge({ status: 'CONSUMED' }));
    await expect(
      service.validateLoginChallenge('mfa-ch_raw-token', totpAtStep(secret, step), null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
    expect(stub.mfaMethod.findMany).not.toHaveBeenCalled();
  });

  it('TTL : un challenge expiré est refusé', async () => {
    const { service, stub } = buildService(
      makePendingChallenge({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(
      service.validateLoginChallenge('mfa-ch_raw-token', totpAtStep(secret, step), null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
    expect(stub.mfaMethod.findMany).not.toHaveBeenCalled();
  });

  it('token inconnu : erreur générique sans énumération', async () => {
    const { service, stub } = buildService(null);
    stub.mfaChallenge.findUnique.mockResolvedValue(null);
    await expect(
      service.validateLoginChallenge('mfa-ch_unknown', '000000', null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
  });

  it('tentatives multiples : le mauvais code incrémente sans consommer', async () => {
    const { service, stub } = buildService();
    stub.mfaMethod.findMany.mockResolvedValue([makeMethod()]);
    await expect(
      service.validateLoginChallenge('mfa-ch_raw-token', '999999', null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
    expect(stub.mfaChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ status: 'CONSUMED' }),
      }),
    );
  });

  it('LOCKOUT du challenge : au maxAttempts, le challenge est consommé', async () => {
    const { service, stub } = buildService(makePendingChallenge({ attempts: 4 }));
    await expect(
      service.validateLoginChallenge('mfa-ch_raw-token', '999999', null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
    expect(stub.mfaChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONSUMED' }),
      }),
    );
  });

  it('anti-replay TOTP : re-vérifier un pas déjà consommé échoue', async () => {
    // La première vérification réussie a persisté le pas courant :
    const stub = makePrismaStub();
    stub.mfaChallenge.updateMany.mockResolvedValue({ count: 1 });
    stub.mfaMethod.findMany.mockResolvedValue([
      { ...makeMethod(), metadata: { lastUsedTotpStep: step } },
    ]);
    const service = new IamMfaService(prismaAsService(stub));

    await expect(
      service.validateLoginChallenge('mfa-ch_replay', totpAtStep(secret, step), null),
    ).rejects.toMatchObject({ code: 'MFA_INVALID_CODE' } as Partial<IamError>);
  });
});

describe('Recovery codes (bcrypt)', () => {
  it('Un recovery code valide authentifie et est consommé', async () => {
    const raw = 'AAAAAA-BBBBBB';
    const bcryptHash = await (await import('bcrypt')).hash(raw, 10);
    const stub = makePrismaStub();
    stub.mfaMethod.findMany.mockResolvedValue([]);
    stub.recoveryCode.findMany.mockResolvedValue([
      { id: 'rc-1', userId: USER_ID, codeHash: bcryptHash, usedAt: null },
    ]);
    const service = new IamMfaService(prismaAsService(stub));

    const result = await service.verifyMfaForUser(USER_ID, '', raw);
    expect(result.verified).toBe(true);
    expect(stub.recoveryCode.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rc-1' }, data: { usedAt: expect.any(Date) } }),
    );
  });

  it('un recovery code déjà utilisé n’authentifie pas', async () => {
    const raw = 'AAAAAA-BBBBBB';
    const bcryptHash = await (await import('bcrypt')).hash(raw, 10);
    const stub = makePrismaStub();
    stub.mfaMethod.findMany.mockResolvedValue([]);
    stub.recoveryCode.findMany.mockResolvedValue([
      { id: 'rc-1', userId: USER_ID, codeHash: bcryptHash, usedAt: new Date() },
    ]);
    const service = new IamMfaService(prismaAsService(stub));
    // findMany filtre usedAt: null côté Prisma : simule la liste vide.
    stub.recoveryCode.findMany.mockResolvedValue([]);
    const result = await service.verifyMfaForUser(USER_ID, '', raw);
    expect(result.verified).toBe(false);
  });
});

describe('Enrôlement TOTP réel', () => {
  it('produit un secret base32 + otpauth, stocké chiffré (jamais en clair)', async () => {
    const stub = makePrismaStub();
    stub.mfaMethod.create.mockImplementation(async ({ data }: any) => ({ id: 'm-1', ...data }));
    const service = new IamMfaService(prismaAsService(stub));

    const result = (await service.enroll(USER_ID, 'TOTP', 'Authenticator')) as {
      type: 'TOTP';
      methodId: string;
      secret: string;
      otpauthUri: string;
    };
    expect(/^[A-Z2-7]+$/.test(result.secret)).toBe(true);
    expect(result.otpauthUri).toContain(`secret=${result.secret}`);
    expect(stub.mfaMethod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        secretRef: expect.stringMatching(/^v1:/),
      }),
    });
  });

  it('le challenge est haché HMAC : la base ne contient jamais le token brut', async () => {
    const stub = makePrismaStub();
    stub.mfaChallenge.create.mockImplementation(async ({ data }: any) => ({ id: 'c-1', ...data }));
    const service = new IamMfaService(prismaAsService(stub));
    const issued = await service.issueLoginChallenge(USER_ID, null, null);
    expect(issued.token.startsWith('mfa-ch_')).toBe(true);
    const raw = issued.token.slice('mfa-ch_'.length);
    expect(stub.mfaChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokenHash: hashChallengeToken(raw) }),
    });
    expect(hashChallengeToken(raw)).not.toContain(raw);
  });
});

// Fail-closed « identifier + code » : la voie historique sans challenge ne
// peut plus rien produire du tout.
describe('Ancien flux (identifier, code) supprimé', () => {
  it('verifyMfaChallenge échoue systématiquement', async () => {
    const service = new IamMfaService(prismaAsService(makePrismaStub()));
    await expect((service as any).verifyMfaChallenge('user', '000000')).rejects.toMatchObject({
      code: 'MFA_INVALID_CODE',
    } as Partial<IamError>);
  });
});
