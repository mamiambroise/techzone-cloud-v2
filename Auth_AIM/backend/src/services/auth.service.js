const identityService = require('./identity.service');
const credentialService = require('./credential.service');
const mfaService = require('./mfa.service');
const deviceService = require('./device.service');
const sessionService = require('./session.service');
const tokenService = require('./token.service');
const { AppError } = require('../utils/response');
const { signMfaChallengeToken, verifyMfaChallengeToken } = require('../utils/jwt');

function sanitizeUser(user) {
  const { id, username, primaryEmail, phone, firstName, lastName, status } = user;
  return { id, username, primaryEmail, phone, firstName, lastName, status };
}

async function register(input) {
  const user = await identityService.registerUser(input);
  return sanitizeUser(user);
}

async function login({
  identifier,
  password,
  ipAddress,
  userAgent,
  deviceFingerprint,
  deviceName,
  deviceType,
  tenantId,
  organizationId,
  siteId,
  applicationId,
  environment,
}) {
  const user = await identityService.findUserByIdentifier(identifier);
  if (!user) {
    throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await credentialService.verifyPasswordCredential(user.id, password);
  if (!isValid) {
    throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
  }

  identityService.assertUserIsActive(user);

  const device = await deviceService.registerOrUpdateDevice({
    userId: user.id,
    rawFingerprint: deviceFingerprint,
    name: deviceName,
    deviceType,
  });

  const mfaEnabled = await mfaService.hasMfaEnabled(user.id);

  if (mfaEnabled) {
    const challengeToken = signMfaChallengeToken({
      userId: user.id,
      deviceId: device.id,
      tenantId,
      organizationId,
      siteId,
      applicationId,
      environment,
    });
    return { mfaRequired: true, challengeToken };
  }

  const session = await sessionService.createSession({
    userId: user.id,
    tenantId,
    organizationId,
    siteId,
    applicationId,
    environment,
    deviceId: device.id,
    ipAddress,
    userAgent,
    authenticationLevel: 'PASSWORD',
    riskLevel: 'LOW',
  });

  const tokens = await tokenService.issueTokenPair(session);

  return { mfaRequired: false, user: sanitizeUser(user), session, ...tokens };
}

async function verifyMfaChallenge({ challengeToken, mfaMethodId, code, ipAddress, userAgent }) {
  let decoded;
  try {
    decoded = verifyMfaChallengeToken(challengeToken);
  } catch (err) {
    throw new AppError('Challenge MFA invalide ou expiré', 401, 'MFA_CHALLENGE_INVALID');
  }

  await mfaService.verifyMfaCode({ userId: decoded.userId, methodId: mfaMethodId, code });

  const user = await identityService.getUserById(decoded.userId);
  identityService.assertUserIsActive(user);

  const session = await sessionService.createSession({
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    organizationId: decoded.organizationId,
    siteId: decoded.siteId,
    applicationId: decoded.applicationId,
    environment: decoded.environment,
    deviceId: decoded.deviceId,
    ipAddress,
    userAgent,
    authenticationLevel: 'MFA',
    riskLevel: 'LOW',
  });

  const tokens = await tokenService.issueTokenPair(session);

  return { user: sanitizeUser(user), session, ...tokens };
}

async function refresh({ refreshToken }) {
  return tokenService.rotateRefreshToken(refreshToken);
}

async function logout({ sessionId, actorId }) {
  await tokenService.revokeTokensForSession({ sessionId, revokeReason: 'USER_LOGOUT' });
  await sessionService.revokeSession({ sessionId, revokedBy: actorId, revokeReason: 'USER_LOGOUT' });
}

async function logoutAll({ userId, exceptSessionId, actorId, revokeReason = 'USER_LOGOUT_ALL' }) {
  const activeSessions = await sessionService.listUserSessions(userId);
  const targets = activeSessions.filter(
    (s) => s.status === 'ACTIVE' && s.id !== exceptSessionId
  );

  for (const session of targets) {
    await tokenService.revokeTokensForSession({ sessionId: session.id, revokeReason });
  }

  await sessionService.revokeAllUserSessions({
    userId,
    exceptSessionId,
    revokedBy: actorId,
    revokeReason,
  });
}

async function changePassword({ userId, currentPassword, newPassword, currentSessionId }) {
  await credentialService.changePassword({ userId, currentPassword, newPassword });
  await logoutAll({
    userId,
    exceptSessionId: currentSessionId,
    actorId: userId,
    revokeReason: 'PASSWORD_CHANGED',
  });
}

module.exports = {
  register,
  login,
  verifyMfaChallenge,
  refresh,
  logout,
  logoutAll,
  changePassword,
};