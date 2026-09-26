export const iamUsersMock = [
  {
    id: 'user-001',
    username: 'mami.admin',
    primaryEmail: 'mami@boutique.com',
    firstName: 'Mami',
    lastName: 'Admin',
    phone: '+33 6 12 34 56 78',
    displayName: 'Mami Admin',
    status: 'ACTIVE',
    isAdmin: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2026-09-02T13:57:00Z',
  },
  {
    id: 'user-002',
    username: 'sophie.martin',
    primaryEmail: 'sophie.martin@boutique.com',
    firstName: 'Sophie',
    lastName: 'Martin',
    phone: '+33 6 98 76 54 32',
    displayName: 'Sophie Martin',
    status: 'ACTIVE',
    isAdmin: true,
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2026-09-02T12:20:00Z',
  },
  {
    id: 'user-003',
    username: 'thomas.bernard',
    primaryEmail: 'thomas.bernard@boutique.com',
    firstName: 'Thomas',
    lastName: 'Bernard',
    phone: '+33 6 11 22 33 44',
    displayName: 'Thomas Bernard',
    status: 'ACTIVE',
    isAdmin: false,
    createdAt: '2024-05-22T00:00:00Z',
    updatedAt: '2026-09-02T11:05:00Z',
  },
  {
    id: 'user-004',
    username: 'emma.dubois',
    primaryEmail: 'emma.dubois@boutique.com',
    firstName: 'Emma',
    lastName: 'Dubois',
    phone: '+33 6 55 66 77 88',
    displayName: 'Emma Dubois',
    status: 'SUSPENDED',
    isAdmin: false,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2026-09-02T10:50:00Z',
  },
  {
    id: 'user-005',
    username: 'lucas.moreau',
    primaryEmail: 'lucas.moreau@boutique.com',
    firstName: 'Lucas',
    lastName: 'Moreau',
    phone: '+33 6 77 88 99 00',
    displayName: 'Lucas Moreau',
    status: 'SUSPENDED',
    isAdmin: false,
    createdAt: '2024-07-14T00:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z',
  },
  {
    id: 'user-006',
    username: 'chloe.roux',
    primaryEmail: 'chloe.roux@boutique.com',
    firstName: 'Chloé',
    lastName: 'Roux',
    phone: '+33 6 12 34 56 79',
    displayName: 'Chloé Roux',
    status: 'ACTIVE',
    isAdmin: true,
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2026-09-02T09:30:00Z',
  },
];

export const iamUserStatsMock = {
  users: 6,
  activeUsers: 4,
  pendingUsers: 0,
  sessions: 7,
  activeSessions: 5,
};

export const iamUsersPageMock = {
  users: iamUsersMock,
  stats: iamUserStatsMock,
};

export const iamSessionsMock = [
  { id: 'sess-001', userId: 'user-001', username: 'mami.admin', email: 'mami@boutique.com', displayName: 'Mami Admin', device: 'Chrome sur Windows', ip: '192.168.1.42', location: 'Antananarivo, MG', createdAt: '2026-09-01T08:00:00Z', lastActiveAt: '2026-09-05T16:25:00Z', isCurrent: true, status: 'ACTIVE', authenticationLevel: 'MFA', riskLevel: 'LOW' },
  { id: 'sess-002', userId: 'user-001', username: 'mami.admin', email: 'mami@boutique.com', displayName: 'Mami Admin', device: 'Safari sur iPhone', ip: '192.168.1.43', location: 'Antananarivo, MG', createdAt: '2026-09-02T09:00:00Z', lastActiveAt: '2026-09-05T14:10:00Z', isCurrent: false, status: 'ACTIVE', authenticationLevel: 'MFA', riskLevel: 'LOW' },
  { id: 'sess-003', userId: 'user-002', username: 'sophie.martin', email: 'sophie.martin@boutique.com', displayName: 'Sophie Martin', device: 'Chrome sur macOS', ip: '10.0.0.15', location: 'Paris, France', createdAt: '2026-09-02T12:00:00Z', lastActiveAt: '2026-09-02T12:20:00Z', isCurrent: false, status: 'ACTIVE', authenticationLevel: 'PASSWORD', riskLevel: 'LOW' },
  { id: 'sess-004', userId: 'user-006', username: 'chloe.roux', email: 'chloe.roux@boutique.com', displayName: 'Chloé Roux', device: 'Firefox sur Windows', ip: '10.0.0.22', location: 'Lyon, France', createdAt: '2026-09-01T18:00:00Z', lastActiveAt: '2026-09-02T09:30:00Z', isCurrent: false, status: 'ACTIVE', authenticationLevel: 'MFA', riskLevel: 'LOW' },
  { id: 'sess-005', userId: 'user-003', username: 'thomas.bernard', email: 'thomas.bernard@boutique.com', displayName: 'Thomas Bernard', device: 'Chrome sur Windows', ip: '10.0.0.31', location: 'Berlin, Allemagne', createdAt: '2026-08-30T07:00:00Z', lastActiveAt: '2026-09-02T11:05:00Z', isCurrent: false, status: 'EXPIRED', authenticationLevel: 'PASSWORD', riskLevel: 'LOW' },
  { id: 'sess-006', userId: 'user-004', username: 'emma.dubois', email: 'emma.dubois@boutique.com', displayName: 'Emma Dubois', device: 'Edge sur Windows', ip: '10.0.0.45', location: 'Paris, France', createdAt: '2026-09-02T13:00:00Z', lastActiveAt: '2026-09-02T14:00:00Z', isCurrent: false, status: 'REVOKED', authenticationLevel: 'PASSWORD', riskLevel: 'HIGH' },
  { id: 'sess-007', userId: 'user-005', username: 'lucas.moreau', email: 'lucas.moreau@boutique.com', displayName: 'Lucas Moreau', device: 'Safari sur iPad', ip: '10.0.0.18', location: 'Montreal, Canada', createdAt: '2026-09-01T10:00:00Z', lastActiveAt: '2026-09-01T10:50:00Z', isCurrent: false, status: 'REVOKED', authenticationLevel: 'PASSWORD', riskLevel: 'LOW' },
];

export const iamSessionStatusConfig = {
  ACTIVE: { color: '#10b981', label: 'Actif', bg: '#dcfce7', text: '#166534' },
  EXPIRED: { color: '#f59e0b', label: 'Expire', bg: '#fef3c7', text: '#92400e' },
  REVOKED: { color: '#ef4444', label: 'Révoqué', bg: '#fef2f2', text: '#991b1b' },
};

export const iamSessionsStatsMock = [
  { label: 'Sessions actives', value: '5', context: 'En cours', icon: 'session', color: '#10b981' },
  { label: 'Appareils uniques', value: '5', context: 'Tous utilisateurs', icon: 'device', color: '#7c3aed' },
  { label: 'Sessions expirées', value: '1', context: 'À nettoyer', icon: 'expired', color: '#ef4444' },
  { label: 'Sessions révoquées', value: '2', context: 'Admin révoqué', icon: 'alert', color: '#f59e0b' },
];

export const iamSessionsPageMock = {
  sessions: iamSessionsMock,
  stats: iamSessionsStatsMock,
};

export const iamIdentitiesMock = [
  { id: 'id-001', userId: 'user-001', firstName: 'Mami', lastName: 'Admin', email: 'mami@boutique.com', avatarInitials: 'MA', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Mami Admin', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-01-15', lastActivity: '2026-09-02 13:45' },
  { id: 'id-002', userId: 'user-002', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@boutique.com', avatarInitials: 'SM', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Sophie Martin', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-03-10', lastActivity: '2026-09-02 12:20' },
  { id: 'id-003', userId: 'user-003', firstName: 'Thomas', lastName: 'Bernard', email: 'thomas.bernard@boutique.com', avatarInitials: 'TB', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Thomas Bernard', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2024-05-22', lastActivity: '2026-09-02 11:05' },
  { id: 'id-004', userId: 'user-004', firstName: 'Emma', lastName: 'Dubois', email: 'emma.dubois@boutique.com', avatarInitials: 'ED', type: 'SYSTEM', source: 'SYSTEM', isPrimary: true, linkedUser: null, erpLink: true, erpSource: 'API', status: 'ACTIVE', createdAt: '2024-06-01', lastActivity: '2026-09-02 10:50' },
  { id: 'id-005', userId: 'user-005', firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@boutique.com', avatarInitials: 'LM', type: 'EMAIL', source: 'INVITE', isPrimary: true, linkedUser: 'Lucas Moreau', erpLink: false, erpSource: null, status: 'SUSPENDED', createdAt: '2024-07-14', lastActivity: '2026-08-30 16:00' },
  { id: 'id-006', userId: 'user-006', firstName: 'Chloé', lastName: 'Roux', email: 'chloe.roux@boutique.com', avatarInitials: 'CR', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Chloé Roux', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-02-20', lastActivity: '2026-09-02 09:30' },
  { id: 'id-007', firstName: 'Service', lastName: 'Bot', email: 'bot@boutique.com', avatarInitials: 'SB', type: 'SYSTEM', source: 'SYSTEM', isPrimary: true, linkedUser: null, erpLink: true, erpSource: 'API', status: 'ACTIVE', createdAt: '2024-06-15', lastActivity: '2026-09-02 07:00' },
  { id: 'id-008', firstName: 'Guest', lastName: 'Anonyme', email: 'guest@boutique.com', avatarInitials: 'GA', type: 'EMAIL', source: 'INVITE', isPrimary: false, linkedUser: null, erpLink: false, erpSource: null, status: 'ARCHIVED', createdAt: '2024-03-20', lastActivity: '2026-07-10 11:00' },
  { id: 'id-009', firstName: 'Marc', lastName: 'Leroy', email: 'marc.leroy@boutique.com', avatarInitials: 'ML', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Marc Leroy', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2025-01-10', lastActivity: '2026-09-02 15:20' },
];

export const iamIdentityStatsMock = [
  { label: 'Identités totales', value: '9', context: '+2 ce mois-ci', icon: 'id-total', color: '#2563eb' },
  { label: 'Identités principales', value: '8', context: '89% du total', icon: 'id-primary', color: '#10b981' },
  { label: 'Identités liées', value: '6', context: '67% du total', icon: 'id-linked', color: '#7c3aed' },
  { label: 'Non liées à ERP', value: '3', context: '-1 ce mois-ci', icon: 'id-erp', color: '#f59e0b' },
];

export const iamIdentitiesPageMock = {
  identities: iamIdentitiesMock,
  stats: iamIdentityStatsMock,
};

export const iamRolesMock = [
  { id: 'role-001', name: 'Administrator', displayName: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités.', type: 'SYSTEM', isBuiltIn: true, permissions: ['user:create', 'user:delete', 'tenant:manage', 'policy:manage'], userCount: 3, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2026-09-02T13:57:00Z' },
  { id: 'role-002', name: 'Manager', displayName: 'Manager', description: 'Gestion des utilisateurs et des rôles au sein de son tenant.', type: 'CUSTOM', isBuiltIn: false, permissions: ['user:read', 'user:update', 'session:revoke'], userCount: 5, createdAt: '2024-03-10T00:00:00Z', updatedAt: '2026-09-01T10:00:00Z' },
  { id: 'role-003', name: 'Editor', displayName: 'Éditeur', description: 'Modification des données et des configurations.', type: 'CUSTOM', isBuiltIn: false, permissions: ['resource:create', 'resource:update', 'resource:delete'], userCount: 12, createdAt: '2024-02-20T00:00:00Z', updatedAt: '2026-08-30T09:00:00Z' },
  { id: 'role-004', name: 'Viewer', displayName: 'Viewer', description: 'Accès en lecture seule.', type: 'CUSTOM', isBuiltIn: false, permissions: ['resource:read', 'user:read', 'session:read'], userCount: 45, createdAt: '2024-02-20T00:00:00Z', updatedAt: '2026-08-28T14:00:00Z' },
  { id: 'role-005', name: 'Auditor', displayName: 'Auditeur', description: 'Accès aux journaux d\'audit et aux événements de sécurité.', type: 'CUSTOM', isBuiltIn: false, permissions: ['audit:read', 'security-event:read', 'log:read'], userCount: 2, createdAt: '2024-05-22T00:00:00Z', updatedAt: '2026-07-15T11:00:00Z' },
];

export const iamRolesPageMock = { roles: iamRolesMock };

export const iamPoliciesMock = [
  { id: 'pol-001', name: 'Password Policy', code: 'PASSWORD_POLICY', description: "Exige un mot de passe d'au moins 10 caractères avec des chiffres et des caractères spéciaux.", type: 'PASSWORD', isBuiltIn: true, rules: [{ min_length: 10, require_digit: true, require_special: true, require_uppercase: true, require_lowercase: true }], tenantIds: [], userCount: 0, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2026-09-02T13:57:00Z' },
  { id: 'pol-002', name: 'MFA Policy', code: 'MFA_POLICY', description: 'Exige l\'authentification à deux facteurs pour tous les administrateurs.', type: 'MFA', isBuiltIn: true, rules: [{ mfa_required: true, mfa_methods: ['TOTP', 'SMS'] }], tenantIds: [], userCount: 0, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2026-09-01T10:00:00Z' },
  { id: 'pol-003', name: 'Session Timeout', code: 'SESSION_TIMEOUT', description: 'Termine automatiquement les sessions inactives après 15 minutes.', type: 'SESSION', isBuiltIn: true, rules: [{ idle_timeout_minutes: 15, max_session_duration_hours: 8 }], tenantIds: [], userCount: 0, createdAt: '2024-03-10T00:00:00Z', updatedAt: '2026-08-30T09:00:00Z' },
  { id: 'pol-004', name: 'IP Allowlist - Production', code: 'IP_ALLOWLIST_PROD', description: 'Restreint l\'accès aux adresses IP approuvées pour le tenant Production.', type: 'IP_WHITELIST', isBuiltIn: false, rules: [{ allowed_ips: ['192.168.1.0/24', '10.0.0.0/8'] }], tenantIds: [1], userCount: 45, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2026-09-01T12:00:00Z' },
  { id: 'pol-005', name: 'Rate Limit - API', code: 'RATE_LIMIT_API', description: 'Limite à 100 requêtes par minute par utilisateur.', type: 'RATE_LIMIT', isBuiltIn: false, rules: [{ max_requests: 100, window_minutes: 1 }], tenantIds: [1, 2, 3], userCount: 120, createdAt: '2024-05-22T00:00:00Z', updatedAt: '2026-08-28T14:00:00Z' },
];

export const iamPoliciesPageMock = { policies: iamPoliciesMock };

export const iamTenantsMock = [
  { id: 'tenant-001', name: 'Boutique A - Paris', code: 'BOUTIQUE_A', domain: 'boutique-a.techcloud.local', status: 'ACTIVE', isDefault: true, userCount: 12, roleCount: 5, policyCount: 3, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2026-09-02T13:57:00Z' },
  { id: 'tenant-002', name: 'Boutique B - Lyon', code: 'BOUTIQUE_B', domain: 'boutique-b.techcloud.local', status: 'ACTIVE', isDefault: false, userCount: 8, roleCount: 3, policyCount: 2, createdAt: '2024-03-10T00:00:00Z', updatedAt: '2026-09-01T10:00:00Z' },
  { id: 'tenant-003', name: 'Boutique C - Marseille', code: 'BOUTIQUE_C', domain: 'boutique-c.techcloud.local', status: 'ACTIVE', isDefault: false, userCount: 5, roleCount: 2, policyCount: 1, createdAt: '2024-02-20T00:00:00Z', updatedAt: '2026-08-30T09:00:00Z' },
  { id: 'tenant-004', name: 'Boutique D - Paris', code: 'BOUTIQUE_D', domain: 'boutique-d.techcloud.local', status: 'SUSPENDED', isDefault: false, userCount: 3, roleCount: 1, policyCount: 1, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2026-09-01T12:00:00Z' },
  { id: 'tenant-005', name: 'Boutique E - Nantes', code: 'BOUTIQUE_E', domain: 'boutique-e.techcloud.local', status: 'PENDING', isDefault: false, userCount: 0, roleCount: 0, policyCount: 0, createdAt: '2026-09-02T13:57:00Z', updatedAt: '2026-09-02T13:57:00Z' },
];

export const iamTenantStatusConfig = {
  ACTIVE: { color: '#10b981', label: 'Actif', bg: '#dcfce7', text: '#166534' },
  SUSPENDED: { color: '#f59e0b', label: 'Suspendu', bg: '#fef3c7', text: '#92400e' },
  PENDING: { color: '#3b82f6', label: 'En attente', bg: '#dbeafe', text: '#1e40af' },
};

export const iamTenantsPageMock = { tenants: iamTenantsMock, statusConfig: iamTenantStatusConfig };

export const iamRolesOptions = iamRolesMock.map((r) => ({ value: r.id, label: r.displayName }));
