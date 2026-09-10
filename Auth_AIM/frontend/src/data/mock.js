export const users = [
  {
    id: 1,
    firstName: 'Mami',
    lastName: 'Admin',
    email: 'mami@boutique.com',
    avatarInitials: 'MA',
    identityType: 'EMAIL',
    roles: ['Super Admin'],
    tenant: 'Boutique A',
    status: 'active',
    lastActivity: '2026-09-02 13:45',
    isOnline: true,
    phone: '+33 6 12 34 56 78',
    createdAt: '2024-01-15',
    lastLogin: '2026-09-02 13:40',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications activées',
    activeSessions: 2,
    connections24h: 5,
    recentActivity: [
      { time: '13:45', title: 'Connexion', description: 'Connexion depuis Paris, France', type: 'success' },
      { time: '12:30', title: 'Mot de passe modifié', description: 'Changement effectué par l\'utilisateur', type: 'warning' },
      { time: 'Hier', title: 'Rôle mis à jour', description: 'Super Admin attribué', type: 'info' },
    ],
  },
  {
    id: 2,
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@boutique.com',
    avatarInitials: 'SM',
    identityType: 'GOOGLE',
    roles: ['Admin'],
    tenant: 'Boutique A',
    status: 'active',
    lastActivity: '2026-09-02 12:20',
    isOnline: true,
    phone: '+33 6 98 76 54 32',
    createdAt: '2024-03-10',
    lastLogin: '2026-09-02 12:15',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications désactivées',
    activeSessions: 1,
    connections24h: 3,
    recentActivity: [
      { time: '12:20', title: 'Connexion', description: 'Connexion via Google SSO', type: 'success' },
      { time: '11:00', title: 'Profil mis à jour', description: 'Photo de profil changée', type: 'info' },
    ],
  },
  {
    id: 3,
    firstName: 'Thomas',
    lastName: 'Bernard',
    email: 'thomas.bernard@boutique.com',
    avatarInitials: 'TB',
    identityType: 'EMAIL',
    roles: ['Manager'],
    tenant: 'Boutique B',
    status: 'active',
    lastActivity: '2026-09-02 11:05',
    isOnline: false,
    phone: '+33 6 11 22 33 44',
    createdAt: '2024-05-22',
    lastLogin: '2026-09-02 11:00',
    language: 'fr',
    timezone: 'Europe/Berlin',
    preferences: 'Notifications activées',
    activeSessions: 0,
    connections24h: 1,
    recentActivity: [
      { time: '11:05', title: 'Déconnexion', description: 'Session fermée', type: 'info' },
      { time: 'Hier', title: 'Accès refusé', description: 'Tentative sur ressource protégée', type: 'error' },
    ],
  },
  {
    id: 4,
    firstName: 'Emma',
    lastName: 'Dubois',
    email: 'emma.dubois@boutique.com',
    avatarInitials: 'ED',
    identityType: 'SYSTEM',
    roles: ['Éditeur'],
    tenant: 'Boutique A',
    status: 'active',
    lastActivity: '2026-09-02 10:50',
    isOnline: true,
    phone: '+33 6 55 66 77 88',
    createdAt: '2024-06-01',
    lastLogin: '2026-09-02 10:45',
    language: 'en',
    timezone: 'UTC',
    preferences: 'Notifications activées',
    activeSessions: 1,
    connections24h: 2,
    recentActivity: [
      { time: '10:50', title: 'Connexion', description: 'Accès API depuis service backend', type: 'success' },
    ],
  },
  {
    id: 5,
    firstName: 'Lucas',
    lastName: 'Moreau',
    email: 'lucas.moreau@boutique.com',
    avatarInitials: 'LM',
    identityType: 'EMAIL',
    roles: ['Viewer'],
    tenant: 'Boutique C',
    status: 'suspended',
    lastActivity: '2026-08-30 16:00',
    isOnline: false,
    phone: '+33 6 77 88 99 00',
    createdAt: '2024-07-14',
    lastLogin: '2026-08-30 15:55',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications désactivées',
    activeSessions: 0,
    connections24h: 0,
    recentActivity: [
      { time: '30/08', title: 'Compte suspendu', description: 'Action par Super Admin', type: 'error' },
    ],
  },
  {
    id: 6,
    firstName: 'Chloé',
    lastName: 'Roux',
    email: 'chloe.roux@boutique.com',
    avatarInitials: 'CR',
    identityType: 'GOOGLE',
    roles: ['Admin', 'Manager'],
    tenant: 'Boutique A',
    status: 'active',
    lastActivity: '2026-09-02 09:30',
    isOnline: true,
    phone: '+33 6 12 34 56 79',
    createdAt: '2024-02-20',
    lastLogin: '2026-09-02 09:25',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications activées',
    activeSessions: 3,
    connections24h: 6,
    recentActivity: [
      { time: '09:30', title: 'Connexion', description: 'SSO Google, Paris', type: 'success' },
      { time: 'Hier', title: 'Rôle ajouté', description: 'Manager ajouté au profil', type: 'info' },
    ],
  },
  {
    id: 7,
    firstName: 'Nathan',
    lastName: 'Girard',
    email: 'nathan.girard@boutique.com',
    avatarInitials: 'NG',
    identityType: 'EMAIL',
    roles: ['Éditeur'],
    tenant: 'Boutique B',
    status: 'active',
    lastActivity: '2026-09-01 18:45',
    isOnline: false,
    phone: '+33 6 33 44 55 66',
    createdAt: '2024-08-05',
    lastLogin: '2026-09-01 18:40',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications activées',
    activeSessions: 0,
    connections24h: 1,
    recentActivity: [
      { time: 'Hier', title: 'Déconnexion', description: 'Fin de session', type: 'info' },
    ],
  },
  {
    id: 8,
    firstName: 'Léa',
    lastName: 'Fontaine',
    email: 'lea.fontaine@boutique.com',
    avatarInitials: 'LF',
    identityType: 'SYSTEM',
    roles: ['Viewer'],
    tenant: 'Boutique C',
    status: 'active',
    lastActivity: '2026-09-02 08:15',
    isOnline: false,
    phone: '+33 6 99 00 11 22',
    createdAt: '2024-09-12',
    lastLogin: '2026-09-02 08:10',
    language: 'en',
    timezone: 'UTC',
    preferences: 'Notifications activées',
    activeSessions: 0,
    connections24h: 1,
    recentActivity: [
      { time: '08:15', title: 'Connexion API', description: 'Token service account', type: 'success' },
    ],
  },
  {
    id: 9,
    firstName: 'Hugo',
    lastName: 'Mercier',
    email: 'hugo.mercier@boutique.com',
    avatarInitials: 'HM',
    identityType: 'EMAIL',
    roles: ['Manager'],
    tenant: 'Boutique A',
    status: 'active',
    lastActivity: '2026-09-02 14:00',
    isOnline: true,
    phone: '+33 6 44 55 66 77',
    createdAt: '2024-04-30',
    lastLogin: '2026-09-02 13:55',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications activées',
    activeSessions: 1,
    connections24h: 4,
    recentActivity: [
      { time: '14:00', title: 'Connexion', description: 'Paris, France', type: 'success' },
      { time: '13:00', title: 'Validation document', description: 'Approbation workflow', type: 'info' },
    ],
  },
  {
    id: 10,
    firstName: 'Inès',
    lastName: 'Blanc',
    email: 'ines.blanc@boutique.com',
    avatarInitials: 'IB',
    identityType: 'GOOGLE',
    roles: ['Viewer'],
    tenant: 'Boutique B',
    status: 'suspended',
    lastActivity: '2026-08-28 10:00',
    isOnline: false,
    phone: '+33 6 88 77 66 55',
    createdAt: '2024-10-01',
    lastLogin: '2026-08-28 09:55',
    language: 'fr',
    timezone: 'Europe/Paris',
    preferences: 'Notifications désactivées',
    activeSessions: 0,
    connections24h: 0,
    recentActivity: [
      { time: '28/08', title: 'Compte suspendu', description: 'Inactivité prolongée', type: 'error' },
    ],
  },
];

export const roleColors = {
  'Super Admin': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  'Admin': { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  'Manager': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'Éditeur': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  'Viewer': { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
};

export const statusConfig = {
  active: { color: '#10b981', label: 'Actif' },
  suspended: { color: '#f59e0b', label: 'Suspendu' },
};

export const identityTypeLabels = {
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE',
  SYSTEM: 'SYSTEM',
};

export const activityTypeConfig = {
  success: { color: '#10b981', label: 'Succès' },
  warning: { color: '#f59e0b', label: 'Attention' },
  error: { color: '#ef4444', label: 'Erreur' },
  info: { color: '#6b7280', label: 'Info' },
};

export const topUsers = [
  { name: 'Mami Admin', duration: '4h 32m', percent: 92 },
  { name: 'Sophie Martin', duration: '3h 45m', percent: 78 },
  { name: 'Chloé Roux', duration: '3h 12m', percent: 65 },
  { name: 'Hugo Mercier', duration: '2h 58m', percent: 58 },
  { name: 'Emma Dubois', duration: '2h 15m', percent: 45 },
];

export const connections24h = [
  12, 15, 10, 8, 14, 18, 22, 25, 20, 18, 15, 12,
  10, 14, 18, 22, 26, 28, 24, 20, 18, 15, 12, 10,
];

export const roleStats = [
  { name: 'Super Admin', value: 5, color: '#dc2626' },
  { name: 'Admin', value: 24, color: '#7c3aed' },
  { name: 'Manager', value: 37, color: '#2563eb' },
  { name: 'Éditeur', value: 52, color: '#16a34a' },
  { name: 'Viewer', value: 42, color: '#6b7280' },
  { name: 'Autres', value: 8, color: '#ec4899' },
];

export const identities = [
  { id: 1, firstName: 'Mami', lastName: 'Admin', email: 'mami@boutique.com', avatarInitials: 'MA', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Mami Admin', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-01-15', lastActivity: '2026-09-02 13:45' },
  { id: 2, firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@boutique.com', avatarInitials: 'SM', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Sophie Martin', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-03-10', lastActivity: '2026-09-02 12:20' },
  { id: 3, firstName: 'Thomas', lastName: 'Bernard', email: 'thomas.bernard@boutique.com', avatarInitials: 'TB', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Thomas Bernard', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2024-05-22', lastActivity: '2026-09-02 11:05' },
  { id: 4, firstName: 'Emma', lastName: 'Dubois', email: 'emma.dubois@boutique.com', avatarInitials: 'ED', type: 'SYSTEM', source: 'SYSTEM', isPrimary: true, linkedUser: null, erpLink: true, erpSource: 'API', status: 'ACTIVE', createdAt: '2024-06-01', lastActivity: '2026-09-02 10:50' },
  { id: 5, firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@boutique.com', avatarInitials: 'LM', type: 'EMAIL', source: 'INVITE', isPrimary: true, linkedUser: 'Lucas Moreau', erpLink: false, erpSource: null, status: 'SUSPENDED', createdAt: '2024-07-14', lastActivity: '2026-08-30 16:00' },
  { id: 6, firstName: 'Chloé', lastName: 'Roux', email: 'chloe.roux@boutique.com', avatarInitials: 'CR', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Chloé Roux', erpLink: true, erpSource: 'Dolibarr', status: 'ACTIVE', createdAt: '2024-02-20', lastActivity: '2026-09-02 09:30' },
  { id: 7, firstName: 'Nathan', lastName: 'Girard', email: 'nathan.girard@boutique.com', avatarInitials: 'NG', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Nathan Girard', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2024-08-05', lastActivity: '2026-09-01 18:45' },
  { id: 8, firstName: 'Léa', lastName: 'Fontaine', email: 'lea.fontaine@boutique.com', avatarInitials: 'LF', type: 'SYSTEM', source: 'SYSTEM', isPrimary: true, linkedUser: null, erpLink: true, erpSource: 'API', status: 'ACTIVE', createdAt: '2024-09-12', lastActivity: '2026-09-02 08:15' },
  { id: 9, firstName: 'Hugo', lastName: 'Mercier', email: 'hugo.mercier@boutique.com', avatarInitials: 'HM', type: 'EMAIL', source: 'IMPORT', isPrimary: true, linkedUser: 'Hugo Mercier', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2024-04-30', lastActivity: '2026-09-02 14:00' },
  { id: 10, firstName: 'Inès', lastName: 'Blanc', email: 'ines.blanc@boutique.com', avatarInitials: 'IB', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Inès Blanc', erpLink: true, erpSource: 'Dolibarr', status: 'SUSPENDED', createdAt: '2024-10-01', lastActivity: '2026-08-28 10:00' },
  { id: 11, firstName: 'Paul', lastName: 'Durand', email: 'paul.durand@boutique.com', avatarInitials: 'PD', type: 'EMAIL', source: 'INVITE', isPrimary: false, linkedUser: null, erpLink: false, erpSource: null, status: 'PENDING', createdAt: '2024-11-05', lastActivity: '2026-08-20 09:00' },
  { id: 12, firstName: 'Claire', lastName: 'Moreau', email: 'claire.moreau@boutique.com', avatarInitials: 'CM', type: 'EMAIL', source: 'SIGN_UP', isPrimary: true, linkedUser: 'Claire Moreau', erpLink: true, erpSource: 'SAP', status: 'ACTIVE', createdAt: '2024-12-01', lastActivity: '2026-09-01 16:30' },
  { id: 13, firstName: 'Service', lastName: 'Bot', email: 'bot@boutique.com', avatarInitials: 'SB', type: 'SYSTEM', source: 'SYSTEM', isPrimary: true, linkedUser: null, erpLink: true, erpSource: 'API', status: 'ACTIVE', createdAt: '2024-06-15', lastActivity: '2026-09-02 07:00' },
  { id: 14, firstName: 'Guest', lastName: 'Anonyme', email: 'guest@boutique.com', avatarInitials: 'GA', type: 'EMAIL', source: 'INVITE', isPrimary: false, linkedUser: null, erpLink: false, erpSource: null, status: 'ARCHIVED', createdAt: '2024-03-20', lastActivity: '2026-07-10 11:00' },
  { id: 15, firstName: 'Marc', lastName: 'Leroy', email: 'marc.leroy@boutique.com', avatarInitials: 'ML', type: 'GOOGLE', source: 'SSO', isPrimary: true, linkedUser: 'Marc Leroy', erpLink: false, erpSource: null, status: 'ACTIVE', createdAt: '2025-01-10', lastActivity: '2026-09-02 15:20' },
];

export const identityStats = [
  { label: 'Identités totales', value: '142', context: '+8 ce mois-ci', icon: 'id-total', color: '#2563eb', sparkline: [10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 19, 22] },
  { label: 'Identités principales', value: '98', context: '69% du total', icon: 'id-primary', color: '#10b981', sparkline: [60, 62, 63, 65, 66, 68, 70, 72, 73, 75, 76, 78] },
  { label: 'Identités liées', value: '121', context: '85% du total', icon: 'id-linked', color: '#7c3aed', sparkline: [80, 82, 85, 87, 90, 92, 95, 97, 100, 103, 106, 108] },
  { label: 'Non liées à ERP', value: '35', context: '-3 ce mois-ci', icon: 'id-erp', color: '#f59e0b', sparkline: [45, 43, 42, 40, 39, 38, 37, 36, 36, 35, 35, 35] },
  { label: 'Google / SSO', value: '28', context: '+5 ce mois-ci', icon: 'id-sso', color: '#ec4899', sparkline: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26] },
  { label: 'Invités / Anonymes', value: '12', context: '8% du total', icon: 'id-guest', color: '#6b7280', sparkline: [8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 12, 12] },
];

export const identityTypeStats = [
  { name: 'EMAIL', value: 68, color: '#2563eb' },
  { name: 'GOOGLE', value: 28, color: '#ec4899' },
  { name: 'SYSTEM', value: 22, color: '#7c3aed' },
  { name: 'EXTERNAL', value: 14, color: '#10b981' },
  { name: 'Autres', value: 10, color: '#6b7280' },
];

export const identitySourceStats = [
  { name: 'SIGN_UP', value: 72, color: '#2563eb' },
  { name: 'SSO', value: 28, color: '#ec4899' },
  { name: 'INVITE', value: 22, color: '#f59e0b' },
  { name: 'IMPORT', value: 12, color: '#10b981' },
  { name: 'SYSTEM', value: 8, color: '#6b7280' },
];

export const identityErpLinkStats = [
  { name: 'Liées à ERP', value: 107, color: '#10b981' },
  { name: 'Non liées', value: 35, color: '#f59e0b' },
];

export const topUnlinkedIdentities = [
  { name: 'Thomas Bernard', email: 'thomas.bernard@boutique.com', avatarInitials: 'TB', status: 'ACTIVE' },
  { name: 'Nathan Girard', email: 'nathan.girard@boutique.com', avatarInitials: 'NG', status: 'ACTIVE' },
  { name: 'Hugo Mercier', email: 'hugo.mercier@boutique.com', avatarInitials: 'HM', status: 'ACTIVE' },
  { name: 'Marc Leroy', email: 'marc.leroy@boutique.com', avatarInitials: 'ML', status: 'ACTIVE' },
  { name: 'Paul Durand', email: 'paul.durand@boutique.com', avatarInitials: 'PD', status: 'PENDING' },
];

export const dashboardMetrics = {
  activeUsers: { value: '142', context: '+8 ce mois-ci', trend: [60, 64, 70, 72, 78, 82, 88, 95, 102, 110, 118, 142], color: '#2563eb' },
  activeSessions: { value: '37', context: '4 tenants actifs', trend: [12, 15, 18, 22, 20, 24, 26, 30, 28, 32, 35, 37], color: '#7c3aed' },
  securityAlerts: { value: '3', context: '1 critique · 2 moyennes', color: '#ef4444' },
  systemHealth: { value: '98%', context: 'Tous services opérationnels', color: '#10b981' },
};

export const dashboardActions = [
  { id: 'a1', title: 'Valider 3 invitations en attente', context: 'Boutique A · expire dans 48h', priority: 'high' },
  { id: 'a2', title: 'Approuver la nouvelle politique MFA', context: 'Brouillon · en attente Super Admin', priority: 'medium' },
  { id: 'a3', title: 'Réviser 5 comptes suspendus', context: 'Inactivité > 90 jours', priority: 'low' },
];

export const dashboardActivity = [
  { id: 'e1', time: "À l'instant", type: 'success', title: 'Connexion réussie', actor: 'Mami Admin', detail: 'Paris, France · Chrome' },
  { id: 'e2', time: 'Il y a 5 min', type: 'warning', title: 'Mot de passe modifié', actor: 'Sophie Martin', detail: 'Action utilisateur' },
  { id: 'e3', time: 'Il y a 12 min', type: 'error', title: 'Tentative refusée', actor: 'IP 92.184.*.*', detail: 'Ressource protégée · Boutique C' },
  { id: 'e4', time: 'Il y a 24 min', type: 'info', title: 'Rôle attribué', actor: 'Hugo Mercier → Manager', detail: 'Boutique A' },
  { id: 'e5', time: 'Il y a 1 h', type: 'success', title: 'Identité liée à ERP', actor: 'Dolibarr PROD', detail: 'Claire Moreau' },
  { id: 'e6', time: 'Hier', type: 'info', title: 'Connexion API', actor: 'Service Bot', detail: 'Token utilisé' },
];

export const invitations = [
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

export const organisations = [
  { id: 1, name: 'Boutique A', legalName: 'Boutique A SARL', code: 'ORG-001', type: 'SARL', country: 'France', timezone: 'Europe/Paris', status: 'active', createdAt: '2024-01-10', tenantCount: 3 },
  { id: 2, name: 'Boutique B', legalName: 'Boutique B SAS', code: 'ORG-002', type: 'SAS', country: 'France', timezone: 'Europe/Berlin', status: 'active', createdAt: '2024-02-14', tenantCount: 2 },
  { id: 3, name: 'Boutique C', legalName: 'Boutique C EURL', code: 'ORG-003', type: 'EURL', country: 'Canada', timezone: 'America/Montreal', status: 'active', createdAt: '2024-03-05', tenantCount: 2 },
  { id: 4, name: 'Boutique D', legalName: 'Boutique D SA', code: 'ORG-004', type: 'SA', country: 'France', timezone: 'Europe/Paris', status: 'suspended', createdAt: '2024-04-18', tenantCount: 1 },
  { id: 5, name: 'Boutique E', legalName: 'Boutique E EI', code: 'ORG-005', type: 'EI', country: 'Belgique', timezone: 'Europe/Brussels', status: 'archived', createdAt: '2024-05-22', tenantCount: 0 },
];

export const tenants = [
  { id: 1, name: 'Boutique A - Paris', organisationId: 1, ownerId: 1, ownerName: 'Mami Admin', status: 'ACTIVE', plan: 'Premium', region: 'EU-West', createdAt: '2024-01-12' },
  { id: 2, name: 'Boutique A - Lyon', organisationId: 1, ownerId: 2, ownerName: 'Sophie Martin', status: 'ACTIVE', plan: 'Standard', region: 'EU-West', createdAt: '2024-02-01' },
  { id: 3, name: 'Boutique A - Bordeaux', organisationId: 1, ownerId: 3, ownerName: 'Thomas Bernard', status: 'ACTIVE', plan: 'Standard', region: 'EU-West', createdAt: '2024-02-15' },
  { id: 4, name: 'Boutique B - Berlin', organisationId: 2, ownerId: 4, ownerName: 'Emma Dubois', status: 'ACTIVE', plan: 'Premium', region: 'EU-Central', createdAt: '2024-02-20' },
  { id: 5, name: 'Boutique B - Munich', organisationId: 2, ownerId: 5, ownerName: 'Lucas Moreau', status: 'SUSPENDED', plan: 'Standard', region: 'EU-Central', createdAt: '2024-03-10' },
  { id: 6, name: 'Boutique C - Montreal', organisationId: 3, ownerId: 6, ownerName: 'Chloé Roux', status: 'ACTIVE', plan: 'Premium', region: 'NA-East', createdAt: '2024-03-12' },
  { id: 7, name: 'Boutique C - Toronto', organisationId: 3, ownerId: 7, ownerName: 'Nathan Girard', status: 'ACTIVE', plan: 'Standard', region: 'NA-East', createdAt: '2024-04-01' },
  { id: 8, name: 'Boutique D - Paris', organisationId: 4, ownerId: 8, ownerName: 'Léa Fontaine', status: 'ACTIVE', plan: 'Standard', region: 'EU-West', createdAt: '2024-04-20' },
];

export const organisationStats = [
  { label: 'Organisations', value: String(organisations.length), context: 'Comptes enregistrés', icon: 'org', color: '#2563eb' },
  { label: 'Tenants', value: String(tenants.length), context: 'Environnements déployés', icon: 'tenant', color: '#7c3aed' },
  { label: 'Tenants actifs', value: String(tenants.filter((t) => t.status === 'ACTIVE').length), context: 'Opérationnels', icon: 'active', color: '#10b981' },
  { label: 'Org. actives', value: String(organisations.filter((o) => o.status === 'active').length), context: `${organisations.filter((o) => o.status === 'suspended').length} suspendues · ${organisations.filter((o) => o.status === 'archived').length} archivées`, icon: 'status', color: '#f59e0b' },
];

export const userStatusStats = [
  { name: 'Actif', value: users.filter((u) => u.status === 'active').length, color: '#10b981' },
  { name: 'Suspendu', value: users.filter((u) => u.status === 'suspended').length, color: '#f59e0b' },
  { name: 'En attente', value: users.filter((u) => u.status === 'pending').length, color: '#3b82f6' },
  { name: 'Archivé', value: users.filter((u) => u.status === 'archived').length, color: '#6b7280' },
];

export const tenantStatusStats = [
  { name: 'Actif', value: tenants.filter((t) => t.status === 'ACTIVE').length, color: '#10b981' },
  { name: 'Provisionnement', value: tenants.filter((t) => t.status === 'PENDING').length, color: '#3b82f6' },
  { name: 'Suspendu', value: tenants.filter((t) => t.status === 'SUSPENDED').length, color: '#f59e0b' },
  { name: 'Archivé', value: tenants.filter((t) => t.status === 'ARCHIVED').length, color: '#6b7280' },
];

export const orgTypeStats = [
  { name: 'SARL', value: organisations.filter((o) => o.type === 'SARL').length, color: '#2563eb' },
  { name: 'SAS', value: organisations.filter((o) => o.type === 'SAS').length, color: '#7c3aed' },
  { name: 'EURL', value: organisations.filter((o) => o.type === 'EURL').length, color: '#10b981' },
  { name: 'SA', value: organisations.filter((o) => o.type === 'SA').length, color: '#f59e0b' },
  { name: 'EI', value: organisations.filter((o) => o.type === 'EI').length, color: '#6b7280' },
];

export const recentUsers = users.slice(0, 5);

export const roles = [
  { id: 1, name: 'Super Admin', type: 'system', scope: 'global', description: 'Accès complet à toutes les fonctionnalités.', status: 'active', createdAt: '2024-01-01', isSystem: true },
  { id: 2, name: 'Admin', type: 'system', scope: 'global', description: 'Gestion des utilisateurs et des configurations.', status: 'active', createdAt: '2024-01-01', isSystem: true },
  { id: 3, name: 'Manager', type: 'system', scope: 'tenant', description: 'Gestion des équipes et des opérations par tenant.', status: 'active', createdAt: '2024-01-01', isSystem: true },
  { id: 4, name: 'Éditeur', type: 'system', scope: 'tenant', description: 'Création et modification de contenu.', status: 'active', createdAt: '2024-01-01', isSystem: true },
  { id: 5, name: 'Viewer', type: 'system', scope: 'global', description: 'Lecture seule sur les ressources autorisées.', status: 'active', createdAt: '2024-01-01', isSystem: true },
  { id: 6, name: 'Auditeur', type: 'custom', scope: 'tenant', description: 'Accès en lecture aux logs et rapports.', status: 'active', createdAt: '2024-06-15', isSystem: false },
  { id: 7, name: 'Support Client', type: 'custom', scope: 'tenant', description: 'Gestion des tickets et du support utilisateur.', status: 'active', createdAt: '2024-08-20', isSystem: false },
  { id: 8, name: 'Intégrateur', type: 'custom', scope: 'global', description: 'Accès aux APIs et aux connecteurs.', status: 'archived', createdAt: '2025-01-10', isSystem: false },
];

export const permissions = [
  { id: 1, name: 'users.read', description: 'Lister et consulter les utilisateurs.', effect: 'ALLOW', resource: 'users', action: 'read' },
  { id: 2, name: 'users.write', description: 'Créer et modifier des utilisateurs.', effect: 'ALLOW', resource: 'users', action: 'write' },
  { id: 3, name: 'users.delete', description: 'Supprimer des utilisateurs.', effect: 'ALLOW', resource: 'users', action: 'delete' },
  { id: 4, name: 'roles.read', description: 'Consulter les rôles et permissions.', effect: 'ALLOW', resource: 'roles', action: 'read' },
  { id: 5, name: 'roles.write', description: 'Créer et modifier des rôles.', effect: 'ALLOW', resource: 'roles', action: 'write' },
  { id: 6, name: 'policies.read', description: 'Consulter les policies d\'accès.', effect: 'ALLOW', resource: 'policies', action: 'read' },
  { id: 7, name: 'policies.write', description: 'Créer et modifier des policies.', effect: 'ALLOW', resource: 'policies', action: 'write' },
  { id: 8, name: 'policies.delete', description: 'Supprimer des policies.', effect: 'DENY', resource: 'policies', action: 'delete' },
  { id: 9, name: 'tenants.read', description: 'Consulter les tenants.', effect: 'ALLOW', resource: 'tenants', action: 'read' },
  { id: 10, name: 'tenants.write', description: 'Modifier les configurations de tenants.', effect: 'ALLOW', resource: 'tenants', action: 'write' },
  { id: 11, name: 'audit.read', description: 'Accéder aux logs d\'audit.', effect: 'ALLOW', resource: 'audit', action: 'read' },
  { id: 12, name: 'settings.write', description: 'Modifier les paramètres globaux.', effect: 'DENY', resource: 'settings', action: 'write' },
];

export const rolePermissions = [
  { roleId: 1, permissionId: 1 },
  { roleId: 1, permissionId: 2 },
  { roleId: 1, permissionId: 3 },
  { roleId: 1, permissionId: 4 },
  { roleId: 1, permissionId: 5 },
  { roleId: 1, permissionId: 6 },
  { roleId: 1, permissionId: 7 },
  { roleId: 1, permissionId: 8 },
  { roleId: 1, permissionId: 9 },
  { roleId: 1, permissionId: 10 },
  { roleId: 1, permissionId: 11 },
  { roleId: 1, permissionId: 12 },
  { roleId: 2, permissionId: 1 },
  { roleId: 2, permissionId: 2 },
  { roleId: 2, permissionId: 4 },
  { roleId: 2, permissionId: 6 },
  { roleId: 2, permissionId: 9 },
  { roleId: 2, permissionId: 11 },
  { roleId: 3, permissionId: 1 },
  { roleId: 3, permissionId: 4 },
  { roleId: 3, permissionId: 9 },
  { roleId: 3, permissionId: 11 },
  { roleId: 4, permissionId: 1 },
  { roleId: 4, permissionId: 4 },
  { roleId: 5, permissionId: 1 },
  { roleId: 5, permissionId: 4 },
  { roleId: 6, permissionId: 1 },
  { roleId: 6, permissionId: 11 },
  { roleId: 7, permissionId: 1 },
  { roleId: 7, permissionId: 4 },
  { roleId: 7, permissionId: 9 },
];

export const userRoles = [
  { userId: 1, roleId: 1 },
  { userId: 2, roleId: 2 },
  { userId: 3, roleId: 3 },
  { userId: 4, roleId: 4 },
  { userId: 5, roleId: 5 },
  { userId: 6, roleId: 2 },
  { userId: 6, roleId: 3 },
  { userId: 7, roleId: 4 },
  { userId: 8, roleId: 5 },
  { userId: 9, roleId: 3 },
  { userId: 10, roleId: 5 },
  { userId: 11, roleId: 5 },
  { userId: 12, roleId: 4 },
  { userId: 13, roleId: 5 },
  { userId: 14, roleId: 5 },
  { userId: 15, roleId: 3 },
];

export const policies = [
  { id: 1, name: 'Accès Admin Global', type: 'system', effect: 'ALLOW', priority: 10, status: 'active', description: 'Accès complet pour les administrateurs globaux.', subject: 'role:Super Admin', resource: '*', action: '*', conditions: '', createdAt: '2024-01-01' },
  { id: 2, name: 'Lecture Utilisateurs', type: 'system', effect: 'ALLOW', priority: 20, status: 'active', description: 'Permet la lecture des utilisateurs pour tous les rôles connectés.', subject: 'role:*', resource: 'users', action: 'read', conditions: 'mfa.enabled == true', createdAt: '2024-01-01' },
  { id: 3, name: 'Blocage Suppression Policies', type: 'system', effect: 'DENY', priority: 30, status: 'active', description: 'Interdit la suppression de policies par les non-administrateurs.', subject: 'role:Viewer', resource: 'policies', action: 'delete', conditions: '', createdAt: '2024-01-01' },
  { id: 4, name: 'Accès Support Restreint', type: 'custom', effect: 'ALLOW', priority: 40, status: 'active', description: 'Accès restreint aux tickets et données de support.', subject: 'role:Support Client', resource: 'support:*', action: 'read', conditions: 'tenant.id == request.tenantId', createdAt: '2024-08-20' },
  { id: 5, name: 'Intégration API', type: 'custom', effect: 'ALLOW', priority: 50, status: 'inactive', description: 'Accès API pour les intégrateurs externes.', subject: 'role:Intégrateur', resource: 'api/*', action: 'invoke', conditions: 'ip.whitelist == true', createdAt: '2025-01-10' },
  { id: 6, name: 'Audit Logs', type: 'custom', effect: 'ALLOW', priority: 60, status: 'active', description: 'Lecture des logs d\'audit pour les auditeurs.', subject: 'role:Auditeur', resource: 'audit', action: 'read', conditions: 'time.window == business_hours', createdAt: '2024-06-15' },
];

export const memberships = [
  { id: 1, userId: 1, tenantId: 1, role: 'Super Admin', joinedAt: '2024-01-15' },
  { id: 2, userId: 1, tenantId: 2, role: 'Admin', joinedAt: '2024-01-16' },
  { id: 3, userId: 1, tenantId: 3, role: 'Manager', joinedAt: '2024-01-17' },
  { id: 4, userId: 2, tenantId: 2, role: 'Admin', joinedAt: '2024-03-10' },
  { id: 5, userId: 3, tenantId: 3, role: 'Manager', joinedAt: '2024-05-22' },
  { id: 6, userId: 4, tenantId: 4, role: 'Éditeur', joinedAt: '2024-06-01' },
  { id: 7, userId: 5, tenantId: 5, role: 'Viewer', joinedAt: '2024-07-14' },
  { id: 8, userId: 6, tenantId: 6, role: 'Admin', joinedAt: '2024-02-20' },
  { id: 9, userId: 6, tenantId: 7, role: 'Manager', joinedAt: '2024-02-21' },
  { id: 10, userId: 7, tenantId: 7, role: 'Éditeur', joinedAt: '2024-08-05' },
  { id: 11, userId: 8, tenantId: 8, role: 'Viewer', joinedAt: '2024-09-12' },
  { id: 12, userId: 9, tenantId: 1, role: 'Manager', joinedAt: '2024-04-30' },
  { id: 13, userId: 10, tenantId: 5, role: 'Viewer', joinedAt: '2024-10-01' },
  { id: 14, userId: 11, tenantId: 6, role: 'Viewer', joinedAt: '2024-11-05' },
  { id: 15, userId: 12, tenantId: 4, role: 'Éditeur', joinedAt: '2024-12-01' },
];

export const sessions = [
  { id: 1, userId: 1, device: 'Chrome sur Windows', ip: '192.168.1.42', location: 'Antananarivo, MG', createdAt: '2026-09-01 08:00', lastActiveAt: '2026-09-05 16:25', isCurrent: true, status: 'ACTIVE' },
  { id: 2, userId: 1, device: 'Safari sur iPhone', ip: '192.168.1.43', location: 'Antananarivo, MG', createdAt: '2026-09-02 09:00', lastActiveAt: '2026-09-05 14:10', isCurrent: false, status: 'ACTIVE' },
  { id: 3, userId: 2, device: 'Chrome sur macOS', ip: '10.0.0.15', location: 'Paris, France', createdAt: '2026-09-02 12:00', lastActiveAt: '2026-09-02 12:20', isCurrent: false, status: 'ACTIVE' },
  { id: 4, userId: 6, device: 'Firefox sur Windows', ip: '10.0.0.22', location: 'Lyon, France', createdAt: '2026-09-01 18:00', lastActiveAt: '2026-09-02 09:30', isCurrent: false, status: 'ACTIVE' },
  { id: 5, userId: 3, device: 'Chrome sur Windows', ip: '10.0.0.31', location: 'Berlin, Allemagne', createdAt: '2026-08-30 07:00', lastActiveAt: '2026-09-02 11:05', isCurrent: false, status: 'EXPIRED' },
  { id: 6, userId: 9, device: 'Edge sur Windows', ip: '10.0.0.45', location: 'Paris, France', createdAt: '2026-09-02 13:00', lastActiveAt: '2026-09-02 14:00', isCurrent: false, status: 'ACTIVE' },
  { id: 7, userId: 4, device: 'Safari sur iPad', ip: '10.0.0.18', location: 'Montreal, Canada', createdAt: '2026-09-01 10:00', lastActiveAt: '2026-09-01 10:50', isCurrent: false, status: 'REVOKED' },
  { id: 8, userId: 7, device: 'Chrome sur Android', ip: '10.0.0.72', location: 'Toronto, Canada', createdAt: '2026-08-28 16:00', lastActiveAt: '2026-09-01 18:45', isCurrent: false, status: 'EXPIRED' },
];

export const sessionStatusConfig = {
  ACTIVE: { color: '#10b981', label: 'Actif', bg: '#dcfce7', text: '#166534' },
  EXPIRED: { color: '#f59e0b', label: 'Expire', bg: '#fef3c7', text: '#92400e' },
  REVOKED: { color: '#ef4444', label: 'Revoque', bg: '#fef2f2', text: '#991b1b' },
};

export const sessionsStats = [
  { label: 'Sessions actives', value: String(sessions.filter((s) => s.status === 'ACTIVE').length), context: 'En cours', icon: 'session', color: '#10b981' },
  { label: 'Appareils uniques', value: String(new Set(sessions.map((s) => s.device)).size), context: 'Tous utilisateurs', icon: 'device', color: '#7c3aed' },
  { label: 'Derniere activite suspecte', value: 'Hier', context: 'IP 10.0.0.72 · Toronto', icon: 'alert', color: '#f59e0b' },
  { label: 'Sessions expirees', value: String(sessions.filter((s) => s.status === 'EXPIRED').length), context: 'A nettoyer', icon: 'expired', color: '#ef4444' },
];

export const iamOverview = {
  status: 'WARNING',
  lastRefresh: '2026-09-05T20:32:00Z',
  mode: 'STANDARD',
  globalStatus: {
    health: { score: 92, label: 'Excellent', trend: 'up' },
    security: { score: 74, label: 'À surveiller', trend: 'down' },
    readiness: { score: 88, label: 'Bon', trend: 'up' },
    contextIntegrity: { score: 65, label: 'Fragile', trend: 'down' },
  },
  coreMetrics: {
    users: users.length,
    identities: 142,
    tenants: tenants.length,
    roles: 8,
    permissions: permissions.length,
    activeSessions: sessions.filter((s) => s.status === 'ACTIVE').length,
    activeContexts: 4,
  },
  alerts: [
    {
      id: 'al-001',
      severity: 'CRITICAL',
      title: 'Connexion depuis un pays inhabituel',
      description: 'IP 92.184.102.55 (Moscou, RU) — utilisateur Mami Admin',
      module: 'Sessions',
      createdAt: '2026-09-05 19:48',
      link: '/sessions',
    },
    {
      id: 'al-002',
      severity: 'HIGH',
      title: '5 comptes sans MFA activée',
      description: 'Comptes privilégiés sans second facteur — Boutique B, Boutique C',
      module: 'Identités',
      createdAt: '2026-09-05 18:12',
      link: '/identities',
    },
    {
      id: 'al-003',
      severity: 'HIGH',
      title: 'Conflit de contexte détecté',
      description: 'Léa Fontana active simultanément sur Boutique D - Paris et Boutique C - Montreal',
      module: 'Contextes',
      createdAt: '2026-09-05 16:05',
      link: '/contexts',
    },
    {
      id: 'al-004',
      severity: 'WARNING',
      title: 'Identités non liées à ERP',
      description: '35 identités sans correspondance ERP — risque de rupture de traçabilité',
      module: 'Identités',
      createdAt: '2026-09-05 14:30',
      link: '/identities',
    },
    {
      id: 'al-005',
      severity: 'WARNING',
      title: 'Politique MFA non appliquée',
      description: 'Brouillon « MFA obligatoire - Super Admin » en attente depuis 3 jours',
      module: 'Accès & Policies',
      createdAt: '2026-09-04 11:20',
      link: '/policies',
    },
    {
      id: 'al-006',
      severity: 'INFO',
      title: 'Mise à jour de rôle effectuée',
      description: 'Hugo Mercier promu Manager sur Boutique A - Paris',
      module: 'Rôles & Permissions',
      createdAt: '2026-09-05 09:15',
      link: '/roles',
    },
    {
      id: 'al-007',
      severity: 'INFO',
      title: 'Nouveau tenant provisionné',
      description: 'Boutique D - Paris a été créé par Mami Admin',
      module: 'Organisations & Tenants',
      createdAt: '2026-09-04 17:45',
      link: '/tenants',
    },
  ],
  contextExplorer: {
    activeContexts: 4,
    conflicts: 1,
    lastCheck: '2026-09-05 20:30:00Z',
  },
  accessDecisions: {
    allow: 1284,
    deny: 73,
    last24h: [
      { hour: '00h', allow: 22, deny: 1 },
      { hour: '02h', allow: 18, deny: 2 },
      { hour: '04h', allow: 12, deny: 0 },
      { hour: '06h', allow: 35, deny: 3 },
      { hour: '08h', allow: 124, deny: 6 },
      { hour: '10h', allow: 198, deny: 9 },
      { hour: '12h', allow: 156, deny: 7 },
      { hour: '14h', allow: 187, deny: 11 },
      { hour: '16h', allow: 165, deny: 8 },
      { hour: '18h', allow: 142, deny: 9 },
      { hour: '20h', allow: 121, deny: 7 },
      { hour: '22h', allow: 104, deny: 10 },
    ],
  },
  iamCoverage: {
    percent: 86,
    coveredModules: ['Utilisateurs', 'Identités', 'Organisations', 'Tenants', 'Sessions', 'Rôles'],
    uncoveredModules: ['Policies', 'Audit'],
  },
  privilegedAccounts: [
    { userId: 1, name: 'Mami Admin', role: 'Super Admin', lastActivity: '2026-09-05 20:25' },
    { userId: 2, name: 'Sophie Martin', role: 'Admin', lastActivity: '2026-09-05 18:42' },
    { userId: 3, name: 'Thomas Bernard', role: 'Manager', lastActivity: '2026-09-05 16:10' },
    { userId: 9, name: 'Hugo Mercier', role: 'Manager', lastActivity: '2026-09-05 14:00' },
  ],
  sensitiveChanges: [
    { id: 'sc-01', actor: 'Mami Admin', action: 'a modifié le rôle de', target: 'Hugo Mercier → Manager', timestamp: '2026-09-05 09:15' },
    { id: 'sc-02', actor: 'Sophie Martin', action: 'a révoqué la session de', target: 'Lucas Moreau (iPad)', timestamp: '2026-09-05 08:50' },
    { id: 'sc-03', actor: 'Mami Admin', action: 'a suspendu le compte de', target: 'Inès Blanc', timestamp: '2026-09-04 17:22' },
    { id: 'sc-04', actor: 'Mami Admin', action: 'a archivé l\'organisation', target: 'Boutique E (EI)', timestamp: '2026-09-04 11:05' },
    { id: 'sc-05', actor: 'Sophie Martin', action: 'a créé la politique', target: 'Accès Support Restreint', timestamp: '2026-09-03 14:40' },
  ],
  riskySessions: [
    { sessionId: 5, userId: 3, reason: 'IP inhabituelle', ip: '10.0.0.31', location: 'Berlin, Allemagne', detectedAt: '2026-09-05 20:15' },
    { sessionId: 8, userId: 7, reason: 'Localisation inhabituelle', ip: '10.0.0.72', location: 'Toronto, Canada', detectedAt: '2026-09-05 18:48' },
    { sessionId: 3, userId: 2, reason: 'Plusieurs échecs MFA', ip: '10.0.0.15', location: 'Paris, France', detectedAt: '2026-09-05 12:20' },
  ],
  connectionsTrend: connections24h,
  roleDistribution: roleStats,
  tenantActivity: tenants.map((t) => {
    const score = t.status === 'ACTIVE' ? 60 + (t.id * 7) % 35 : 15;
    const trend = t.status === 'ACTIVE' ? 'up' : 'down';
    return {
      tenantId: t.id,
      tenantName: t.name,
      activityScore: score,
      trend,
    };
  }),
  recentActivity: dashboardActivity,
};

export const adminOverview = {
  platformHealth: 'HEALTHY',
  stats: [
    { label: 'Utilisateurs totaux', value: String(users.length), context: 'Tous comptes', icon: 'users', color: '#2563eb' },
    { label: 'Tenants actifs', value: String(tenants.filter((t) => t.status === 'ACTIVE').length), context: 'Opérationnels', icon: 'tenant', color: '#10b981' },
    { label: 'Incidents actifs', value: '3', context: '1 critique · 2 moyens', icon: 'alert', color: '#ef4444' },
    { label: 'Health plateforme', value: 'HEALTHY', context: 'Tous services opérationnels', icon: 'health', color: '#10b981' },
  ],
  services: [
    { name: 'API Gateway', status: 'OPERATIONAL', latency: '24ms', errors: '0.02%', dependencies: ['Auth', 'IAM', 'Context'] },
    { name: 'Auth Service', status: 'OPERATIONAL', latency: '12ms', errors: '0.01%', dependencies: ['Database', 'Cache'] },
    { name: 'IAM Service', status: 'OPERATIONAL', latency: '18ms', errors: '0.01%', dependencies: ['Database', 'Audit'] },
    { name: 'Context Resolver', status: 'DEGRADED', latency: '145ms', errors: '1.2%', dependencies: ['Cache', 'ERP'] },
    { name: 'ERP Adapter', status: 'OPERATIONAL', latency: '89ms', errors: '0.05%', dependencies: ['External'] },
    { name: 'Notification Service', status: 'OPERATIONAL', latency: '35ms', errors: '0.00%', dependencies: ['Queue'] },
  ],
  incidents: [
    { id: 'inc-01', severity: 'critical', title: 'Latence élevée sur Context Resolver', service: 'Context Resolver', detectedAt: '2026-09-10 08:15', status: 'investigating' },
    { id: 'inc-02', severity: 'medium', title: "Erreurs intermittentes ERP Adapter", service: 'ERP Adapter', detectedAt: '2026-09-10 07:42', status: 'monitoring' },
    { id: 'inc-03', severity: 'medium', title: 'Queue de notifications saturée', service: 'Notification Service', detectedAt: '2026-09-09 22:10', status: 'resolved' },
  ],
  charts: {
    serviceHealthDistribution: [
      { name: 'Opérationnel', value: 4, color: '#10b981' },
      { name: 'Dégradé', value: 1, color: '#f59e0b' },
      { name: 'En panne', value: 0, color: '#ef4444' },
    ],
    incidentTrend: [
      { hour: '00h', incidents: 0 },
      { hour: '02h', incidents: 0 },
      { hour: '04h', incidents: 1 },
      { hour: '06h', incidents: 0 },
      { hour: '08h', incidents: 2 },
      { hour: '10h', incidents: 1 },
      { hour: '12h', incidents: 0 },
      { hour: '14h', incidents: 1 },
      { hour: '16h', incidents: 0 },
      { hour: '18h', incidents: 1 },
      { hour: '20h', incidents: 0 },
      { hour: '22h', incidents: 0 },
    ],
  },
};

export const adminUsers = [
  { id: 101, firstName: 'Alice', lastName: 'Admin', email: 'alice.admin@techzone.cloud', avatarInitials: 'AA', identityType: 'EMAIL', status: 'active', isLocked: false, tenant: 'Boutique A', lastActivity: '2026-09-10 09:15', createdAt: '2024-01-05', roles: ['Super Admin'], memberships: [{ tenantId: 1, role: 'Super Admin' }, { tenantId: 2, role: 'Admin' }], sessions: 2 },
  { id: 102, firstName: 'Bob', lastName: 'Support', email: 'bob.support@techzone.cloud', avatarInitials: 'BS', identityType: 'EMAIL', status: 'active', isLocked: false, tenant: 'Boutique A', lastActivity: '2026-09-10 08:45', createdAt: '2024-02-12', roles: ['Admin'], memberships: [{ tenantId: 1, role: 'Admin' }], sessions: 1 },
  { id: 103, firstName: 'Charlie', lastName: 'Ops', email: 'charlie.ops@techzone.cloud', avatarInitials: 'CO', identityType: 'SYSTEM', status: 'suspended', isLocked: true, tenant: 'Boutique B', lastActivity: '2026-09-08 14:20', createdAt: '2024-03-18', roles: ['Manager'], memberships: [{ tenantId: 4, role: 'Manager' }], sessions: 0 },
  { id: 104, firstName: 'Diana', lastName: 'Viewer', email: 'diana.viewer@techzone.cloud', avatarInitials: 'DV', identityType: 'GOOGLE', status: 'active', isLocked: false, tenant: 'Boutique C', lastActivity: '2026-09-09 16:05', createdAt: '2024-04-22', roles: ['Viewer'], memberships: [{ tenantId: 6, role: 'Viewer' }], sessions: 1 },
  { id: 105, firstName: 'Evan', lastName: 'Editor', email: 'evan.editor@techzone.cloud', avatarInitials: 'EE', identityType: 'EMAIL', status: 'active', isLocked: false, tenant: 'Boutique A', lastActivity: '2026-09-10 07:55', createdAt: '2024-05-30', roles: ['Éditeur'], memberships: [{ tenantId: 1, role: 'Éditeur' }], sessions: 1 },
];

export const adminTenants = [
  { id: 201, name: 'Boutique A - Admin', organisationId: 1, organisationName: 'Boutique A', status: 'ACTIVE', plan: 'Premium', usage: { users: 12, storage: '45GB', apiCalls: '2.3M' }, quotas: { users: 50, storage: '100GB', apiCalls: '5M' }, memberships: 12, createdAt: '2024-01-12', incidents: 1 },
  { id: 202, name: 'Boutique B - Support', organisationId: 2, organisationName: 'Boutique B', status: 'ACTIVE', plan: 'Standard', usage: { users: 6, storage: '18GB', apiCalls: '800K' }, quotas: { users: 25, storage: '50GB', apiCalls: '2M' }, memberships: 6, createdAt: '2024-02-01', incidents: 0 },
  { id: 203, name: 'Boutique C - Readonly', organisationId: 3, organisationName: 'Boutique C', status: 'SUSPENDED', plan: 'Standard', usage: { users: 3, storage: '8GB', apiCalls: '150K' }, quotas: { users: 25, storage: '50GB', apiCalls: '2M' }, memberships: 3, createdAt: '2024-03-05', incidents: 2 },
];

export const accessGovernance = {
  roles: [
    { id: 'role-01', name: 'Super Admin', scope: 'global', riskLevel: 'CRITICAL', excessivePrivilege: true, assignees: 2 },
    { id: 'role-02', name: 'Admin', scope: 'global', riskLevel: 'HIGH', excessivePrivilege: false, assignees: 5 },
    { id: 'role-03', name: 'Manager', scope: 'tenant', riskLevel: 'MEDIUM', excessivePrivilege: false, assignees: 14 },
    { id: 'role-04', name: 'Éditeur', scope: 'tenant', riskLevel: 'LOW', excessivePrivilege: false, assignees: 32 },
    { id: 'role-05', name: 'Viewer', scope: 'global', riskLevel: 'LOW', excessivePrivilege: false, assignees: 48 },
  ],
  reviews: [
    { id: 'rev-01', subject: 'Alice Admin', role: 'Super Admin', status: 'pending', requestedAt: '2026-09-10 08:00', reason: 'Revue trimestrielle' },
    { id: 'rev-02', subject: 'Bob Support', role: 'Admin', status: 'pending', requestedAt: '2026-09-09 17:30', reason: 'Changement de périmètre' },
    { id: 'rev-03', subject: 'Charlie Ops', role: 'Manager', status: 'approved', requestedAt: '2026-09-08 09:15', reason: 'Fin de période probatoire' },
  ],
};

export const delegations = [
  { id: 'del-01', delegationId: 'DEL-001', grantedTo: 'Bob Support', scopeType: 'tenant', scopeId: 201, permissions: ['users.read', 'sessions.read'], startsAt: '2026-09-01 00:00', endsAt: '2026-09-30 23:59', status: 'ACTIVE', grantedBy: 'Alice Admin', delegatorMaxPermission: 'users.write' },
  { id: 'del-02', delegationId: 'DEL-002', grantedTo: 'Diana Viewer', scopeType: 'application', scopeId: 1, permissions: ['reports.read'], startsAt: '2026-09-05 00:00', endsAt: '2026-09-12 23:59', status: 'ACTIVE', grantedBy: 'Alice Admin', delegatorMaxPermission: 'reports.admin' },
  { id: 'del-03', delegationId: 'DEL-003', grantedTo: 'Evan Editor', scopeType: 'support', scopeId: 1, permissions: ['support.tickets.write'], startsAt: '2026-08-20 00:00', endsAt: '2026-09-05 23:59', status: 'EXPIRED', grantedBy: 'Bob Support', delegatorMaxPermission: 'support.tickets.admin' },
];

export const securityAudit = {
  events: [
    { id: 'se-01', traceId: 'trace-abc-123', severity: 'critical', tenant: 'Boutique A', user: 'Alice Admin', action: 'tentative.connexion.admin', result: 'DENIED', detectedAt: '2026-09-10 08:22', investigation: false },
    { id: 'se-02', traceId: 'trace-abc-124', severity: 'medium', tenant: 'Boutique B', user: 'Bob Support', action: 'acces.donnees.sensibles', result: 'ALLOWED', detectedAt: '2026-09-10 07:55', investigation: true },
    { id: 'se-03', traceId: 'trace-abc-125', severity: 'low', tenant: 'Boutique A', user: 'Evan Editor', action: 'modification.profil', result: 'ALLOWED', detectedAt: '2026-09-09 19:10', investigation: false },
  ],
  auditTrail: [
    { id: 'at-01', traceId: 'trace-abc-120', actor: 'Alice Admin', action: 'suspendre.utilisateur', target: 'Charlie Ops', result: 'SUCCESS', timestamp: '2026-09-08 14:00' },
    { id: 'at-02', traceId: 'trace-abc-121', actor: 'Bob Support', action: 'creer.delegation', target: 'DEL-001', result: 'SUCCESS', timestamp: '2026-09-01 08:30' },
    { id: 'at-03', traceId: 'trace-abc-122', actor: 'System', action: 'invalidation.cache', target: 'Context Resolver', result: 'SUCCESS', timestamp: '2026-09-09 03:00' },
  ],
};

export const monitoring = {
  health: {
    global: 'HEALTHY',
    score: 98,
    criticalErrors: 0,
    latency: '34ms',
    degradedDependencies: ['Context Resolver'],
  },
  services: [
    { name: 'API Gateway', status: 'OPERATIONAL', latency: '24ms', errors: '0.02%', uptime: '99.99%' },
    { name: 'Auth Service', status: 'OPERATIONAL', latency: '12ms', errors: '0.01%', uptime: '99.99%' },
    { name: 'IAM Service', status: 'OPERATIONAL', latency: '18ms', errors: '0.01%', uptime: '99.98%' },
    { name: 'Context Resolver', status: 'DEGRADED', latency: '145ms', errors: '1.2%', uptime: '98.50%' },
    { name: 'ERP Adapter', status: 'OPERATIONAL', latency: '89ms', errors: '0.05%', uptime: '99.95%' },
    { name: 'Notification Service', status: 'OPERATIONAL', latency: '35ms', errors: '0.00%', uptime: '99.99%' },
  ],
  incidents: [
    { id: 'inc-01', severity: 'critical', title: 'Latence élevée sur Context Resolver', service: 'Context Resolver', detectedAt: '2026-09-10 08:15', status: 'investigating' },
    { id: 'inc-02', severity: 'medium', title: 'Erreurs intermittentes ERP Adapter', service: 'ERP Adapter', detectedAt: '2026-09-10 07:42', status: 'monitoring' },
    { id: 'inc-03', severity: 'medium', title: 'Queue de notifications saturée', service: 'Notification Service', detectedAt: '2026-09-09 22:10', status: 'resolved' },
  ],
};

export const adminActions = {
  actions: [
    { id: 'aa-01', label: 'Suspendre utilisateur', critical: true, pipeline: ['Permission Check', 'Context Validation', 'User Lock'] },
    { id: 'aa-02', label: 'Suspendre tenant', critical: true, pipeline: ['Permission Check', 'Context Validation', 'Tenant Lock'] },
    { id: 'aa-03', label: 'Forcer révocation de sessions', critical: true, pipeline: ['Permission Check', 'Session Revoke'] },
    { id: 'aa-04', label: 'Réinitialiser état de sécurité', critical: true, pipeline: ['Permission Check', 'Security Reset'] },
    { id: 'aa-05', label: 'Relancer synchronisation', critical: false, pipeline: ['Sync Trigger'] },
    { id: 'aa-06', label: 'Débloquer opération', critical: false, pipeline: ['Unlock Operation'] },
    { id: 'aa-07', label: 'Lancer diagnostic', critical: false, pipeline: ['Diagnostic Run'] },
    { id: 'aa-08', label: 'Appliquer override', critical: true, pipeline: ['Permission Check', 'Override Apply'] },
    { id: 'aa-09', label: 'Forcer invalidation cache', critical: false, pipeline: ['Cache Invalidation'] },
    { id: 'aa-10', label: 'Déclencher rollback administratif', critical: true, pipeline: ['Permission Check', 'Rollback Trigger'] },
  ],
  history: [
    { id: 'ah-01', action: 'Forcer invalidation cache', actor: 'Alice Admin', result: 'SUCCESS', timestamp: '2026-09-09 03:00', reason: 'Nettoyage post-incident' },
    { id: 'ah-02', action: 'Lancer diagnostic', actor: 'Bob Support', result: 'SUCCESS', timestamp: '2026-09-08 16:45', reason: 'Investigation performance' },
    { id: 'ah-03', action: 'Relancer synchronisation', actor: 'System', result: 'FAILED', timestamp: '2026-09-08 04:00', reason: 'Timeout ERP' },
  ],
};