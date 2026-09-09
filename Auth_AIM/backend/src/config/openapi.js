const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Auth IAM Context API',
    version: '1.0.0',
    description: 'API d authentification, de gestion des identites, des sessions et des contextes tenant.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Developpement local' }],
  tags: [
    { name: 'Health', description: 'Etat du service' },
    { name: 'Auth', description: 'Authentification et gestion du compte' },
    { name: 'Identity', description: 'Identites et utilisateurs' },
    { name: 'Sessions', description: 'Sessions et appareils' },
    { name: 'Context', description: 'Contextes tenant' },
    { name: 'MFA', description: 'Authentification multifacteur' },
    { name: 'Security', description: 'Alertes de securite' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Permission refusee' },
          code: { type: 'string', example: 'FORBIDDEN_PERMISSION' },
        },
      },
      Credentials: {
        type: 'object',
        additionalProperties: true,
        description: 'Champs attendus selon l operation et sa validation metier.',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifier la disponibilite de l API',
        responses: { 200: { description: 'Service disponible' } },
      },
    },
  },
};

const operations = [
  ['post', '/api/iam/auth/register', 'Auth', 'Inscrire un utilisateur'],
  ['post', '/api/iam/auth/login', 'Auth', 'Ouvrir une session'],
  ['post', '/api/iam/auth/login/mfa', 'Auth', 'Ouvrir une session avec MFA'],
  ['post', '/api/iam/auth/refresh', 'Auth', 'Rafraichir les tokens'],
  ['post', '/api/iam/auth/logout', 'Auth', 'Se deconnecter', true],
  ['post', '/api/iam/auth/logout-all', 'Auth', 'Revoquer toutes les sessions', true],
  ['post', '/api/iam/auth/change-password', 'Auth', 'Changer le mot de passe', true],
  ['post', '/api/iam/auth/step-up', 'Auth', 'Demander une verification renforcee', true],
  ['post', '/api/iam/auth/step-up/verify', 'Auth', 'Verifier la verification renforcee', true],
  ['get', '/api/iam/me', 'Identity', 'Obtenir mon identite', true],
  ['get', '/api/iam/users', 'Identity', 'Lister les utilisateurs', true],
  ['get', '/api/iam/users/{id}', 'Identity', 'Obtenir un utilisateur', true],
  ['patch', '/api/iam/users/{id}', 'Identity', 'Modifier un utilisateur', true],
  ['post', '/api/iam/users/{id}/activate', 'Identity', 'Activer un utilisateur', true],
  ['post', '/api/iam/users/{id}/suspend', 'Identity', 'Suspendre un utilisateur', true],
  ['post', '/api/iam/users/{id}/lock', 'Identity', 'Verrouiller un utilisateur', true],
  ['post', '/api/iam/users/{id}/unlock', 'Identity', 'Deverrouiller un utilisateur', true],
  ['post', '/api/iam/users/{id}/disable', 'Identity', 'Desactiver un utilisateur', true],
  ['post', '/api/iam/users/{id}/archive', 'Identity', 'Archiver un utilisateur', true],
  ['get', '/api/iam/me/sessions', 'Sessions', 'Lister mes sessions', true],
  ['post', '/api/iam/me/sessions/{id}/revoke', 'Sessions', 'Revoquer ma session', true],
  ['post', '/api/iam/me/sessions/revoke-others', 'Sessions', 'Revoquer mes autres sessions', true],
  ['get', '/api/iam/devices', 'Sessions', 'Lister mes appareils', true],
  ['get', '/api/iam/devices/{id}', 'Sessions', 'Obtenir un appareil', true],
  ['post', '/api/iam/devices/{id}/trust', 'Sessions', 'Faire confiance a un appareil', true],
  ['post', '/api/iam/devices/{id}/untrust', 'Sessions', 'Retirer la confiance a un appareil', true],
  ['post', '/api/iam/devices/{id}/block', 'Sessions', 'Bloquer un appareil', true],
  ['get', '/api/iam/sessions', 'Sessions', 'Lister toutes les sessions', true],
  ['get', '/api/iam/sessions/{id}', 'Sessions', 'Obtenir une session', true],
  ['post', '/api/iam/sessions/{id}/revoke', 'Sessions', 'Revoquer une session', true],
  ['post', '/api/iam/users/{id}/sessions/revoke-all', 'Sessions', 'Revoquer les sessions d un utilisateur', true],
  ['post', '/api/iam/devices/{id}/sessions/revoke', 'Sessions', 'Revoquer les sessions d un appareil', true],
  ['post', '/api/iam/sessions/{id}/risk/recalculate', 'Sessions', 'Recalculer le risque', true],
  ['post', '/api/iam/sessions/validate', 'Sessions', 'Valider une session'],
  ['post', '/api/iam/context/resolve', 'Context', 'Resoudre le contexte courant', true],
  ['post', '/api/iam/context/switch-tenant', 'Context', 'Changer de tenant', true],
  ['get', '/api/iam/context/tenants', 'Context', 'Lister les tenants actifs', true],
  ['post', '/api/iam/context/invalidate', 'Context', 'Invalider le contexte', true],
  ['post', '/api/iam/mfa/enroll', 'MFA', 'Enroler un facteur MFA', true],
  ['post', '/api/iam/mfa/verify', 'MFA', 'Verifier un facteur MFA', true],
  ['get', '/api/iam/mfa/factors', 'MFA', 'Lister les facteurs MFA', true],
  ['post', '/api/iam/mfa/factors/{id}/revoke', 'MFA', 'Revoquer un facteur MFA', true],
  ['post', '/api/iam/mfa/recovery-codes/regenerate', 'MFA', 'Regenerer les codes de recuperation', true],
  ['get', '/api/iam/security/alerts', 'Security', 'Lister les alertes de securite', true],
  ['post', '/api/iam/security/alerts/{id}/acknowledge', 'Security', 'Accuser reception d une alerte', true],
  ['post', '/api/iam/security/alerts/{id}/resolve', 'Security', 'Resoudre une alerte', true],
];

for (const [method, path, tag, summary, requiresAuth] of operations) {
  openapi.paths[path] = openapi.paths[path] || {};
  openapi.paths[path][method] = {
    tags: [tag],
    summary,
    ...(requiresAuth ? { security: [{ bearerAuth: [] }] } : {}),
    requestBody: ['post', 'patch'].includes(method)
      ? { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } }
      : undefined,
    responses: {
      200: { description: 'Operation reussie' },
      400: { description: 'Requete invalide', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      401: { description: 'Authentification requise' },
      403: { description: 'Permission refusee' },
    },
  };
}

module.exports = openapi;