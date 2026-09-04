const MOCK_INVITATIONS = [
  {
    token: 'inv-demo-001',
    email: 'nouveau@boutique.com',
    organizationName: 'Boutique A',
    tenantName: 'Boutique A - Paris',
    role: 'Viewer',
    invitedBy: 'Mami Admin',
    expiresAt: '2026-09-10 23:59',
  },
];

function delay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getInvitationByToken(token) {
  await delay();
  const invitation = MOCK_INVITATIONS.find((item) => item.token === token);
  if (!invitation) {
    const error = new Error('Invitation introuvable');
    error.status = 404;
    error.code = 'INVITATION_NOT_FOUND';
    throw error;
  }
  return { data: invitation };
}

export async function acceptInvitation(token, payload) {
  await delay();
  const invitation = MOCK_INVITATIONS.find((item) => item.token === token);
  if (!invitation) {
    const error = new Error('Invitation introuvable');
    error.status = 404;
    error.code = 'INVITATION_NOT_FOUND';
    throw error;
  }

  const missing = [];
  if (!payload?.firstName) missing.push('firstName');
  if (!payload?.lastName) missing.push('lastName');
  if (!payload?.password) missing.push('password');

  if (missing.length) {
    const error = new Error('Champs manquants');
    error.status = 422;
    error.code = 'VALIDATION_ERROR';
    error.details = missing.map((field) => ({ field, message: `${field} est requis` }));
    throw error;
  }

  return {
    data: {
      user: {
        id: 101,
        username: payload.username || invitation.email,
        primaryEmail: invitation.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        status: 'ACTIVE',
      },
      session: { id: `session-${Date.now()}`, userId: 101 },
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresIn: 900,
    },
  };
}

export default { getInvitationByToken, acceptInvitation };
