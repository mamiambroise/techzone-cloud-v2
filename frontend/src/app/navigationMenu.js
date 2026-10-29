const item = (id, label, icon, aliases = [], options = {}) => ({
  id,
  label,
  icon,
  aliases,
  ...options,
});
const groupPermissions = {
  ui: "ui-builder:read",
  automation: "automation:read",
  packs: "pack.read",
  runtime: "runtime.resolution.read",
  data: "data-runtime:read",
  erp: "erp:read",
};
const group = (id, label, section, icon, accent, items) => ({
  id,
  label,
  section,
  icon,
  accent,
  items: items.map((entry) =>
    groupPermissions[id] && !entry.permission
      ? { ...entry, permission: groupPermissions[id] }
      : entry,
  ),
});

export const navigationSections = [
  { id: "accueil", label: "ACCUEIL" },
  { id: "creation", label: "CRÉATION D’APPLICATIONS" },
  { id: "publication", label: "PUBLICATION & EXÉCUTION" },
  { id: "integrations", label: "DONNÉES & INTÉGRATIONS" },
  { id: "supervision", label: "SUPERVISION" },
  { id: "commercial", label: "COMMERCIAL" },
  { id: "administration", label: "ADMINISTRATION & INFRASTRUCTURE" },
];

const menu = [
  group("dashboard", "Tableau de bord", "accueil", "Home", "", [item("dashboard", "Tableau de bord", "Home")]),

  group("bm", "Business Manager", "creation", "BriefcaseBusiness", "text-pink-500", [
    item("bmApplications", "Applications", "LayoutGrid", ["applications", "applicationNew", "applicationDetail", "applicationWorkspace", "bmApplicationNew", "bmApplicationDetail", "bmVersions", "bmVersionsIndex", "bmVersionDetail", "bmRuntimeIndex", "bmRuntime"]),
    item("bmModels", "Modèles de données", "Database", ["bmDataModel"]),
    item("bmFeaturesIndex", "Fonctionnalités", "Cog", ["bmFeatures"]),
    item("bmNavigationIndex", "Navigation", "Navigation", ["bmNavigation"]),
    item("bmConfiguration", "Configuration", "SlidersHorizontal"),
    item("bmQuality", "Validation", "CheckCircle2", ["bmValidation"]),
  ]),

  group("ui", "UI Builder", "creation", "PanelsTopLeft", "text-violet-500", [
    item("ui", "Vue d’ensemble", "LayoutDashboard"),
    item("uiPages", "Pages", "FileText"),
    item("uiEditor", "Éditeur visuel", "ImageIcon", ["uiBuilder", "uiPage"], {
      pageId: "uiBuilder",
      route: "/ui/builder/editor",
    }),
    item("uiComponents", "Composants", "Boxes"),
    item("uiForms", "Formulaires", "FormInput"),
    item("uiNavigation", "Navigation", "Waypoints"),
    item("uiThemes", "Thèmes", "Palette"),
    item("uiPreview", "Aperçu & test", "MonitorPlay"),
  ]),

  group("automation", "Automatisation", "creation", "Cog", "text-amber-400", [
    item("automation", "Vue d’ensemble", "Home"),
    item("automationWorkflows", "Workflows", "Network"),
    item("automationTriggers", "Déclencheurs", "Zap"),
    item("automationActions", "Actions", "Play"),
    item("automationSchedules", "Planifications", "History"),
    item("automationExecutions", "Exécutions", "ListChecks"),
    item("automationTemplates", "Modèles", "FileText"),
    item("automationDiagnostics", "Diagnostics", "BarChart3"),
    item("automationRules", "Règles", "ShieldCheck", ["automation-conditions"]),
    item("automationFormulas", "Formules", "SlidersHorizontal"),
  ]),

  group("packs", "Pack Manager", "publication", "Layers", "text-emerald-400", [
    item("packs", "Vue d’ensemble", "Home"),
    item("pmpacks", "Packs", "Box", [], { pageId: "pmpacks" }),
    item("packVersions", "Versions", "Tag"),
    item("packModules", "Modules", "Puzzle"),
    item("packFeatures", "Fonctionnalités", "ListChecks"),
    item("packCapabilities", "Capacités", "Server"),
    item("packDependencies", "Dépendances", "Link2"),
    item("packRules", "Règles", "ShieldCheck"),
    item("pmvalidation", "Validation & Manifest", "CheckCircle2", [], {
      pageId: "packValidation",
    }),
    item("pmpublication", "Publication", "UploadCloud", [], {
      pageId: "packPublication",
    }),
    item("history", "Historique", "History"),
  ]),

  group("runtime", "Pack Runtime", "publication", "Play", "text-sky-400", [
    item("runtime", "Vue d’ensemble", "Home", ["packRuntime"]),
    item("runtimeApplications", "Applications", "LayoutGrid"),
    item("runtimeResolutions", "Résolutions", "GitBranch"),
    item("runtimeActivations", "Activations", "PlayCircle"),
    item("runtimeCache", "Cache", "Database"),
    item("runtimeDiagnostics", "Diagnostics", "BarChart3"),
    item("runtimeHistory", "Historique", "History"),
  ]),

  group("data", "Données", "integrations", "Database", "text-cyan-400", [
    item("dataRuntime", "Vue d’ensemble", "Home"),
    item("dataSources", "Sources", "Database"),
    item("dataContracts", "Modèles & Contrats", "FileText"),
    item("dataQuery", "Requêtes", "Search"),
    item("dataPolicies", "Politiques", "Lock"),
    item("dataDiagnostics", "Diagnostics", "BarChart3"),
    item("data-runtime-history", "Historique", "History"),
  ]),

  group("erp", "ERP / Dolibarr", "integrations", "Link2", "text-sky-400", [
    item("erp", "Vue d’ensemble", "Home"),
    item("erpResources", "Ressources", "Database", [
      "erp-clients",
      "erp-products",
      "erp-orders",
      "erp-invoices",
      "erp-stocks",
      "erp-:moduleKey",
    ]),
    item("erpRegistry", "Connexions", "Server"),
    item("erpMapping", "Mappings", "Table2"),
    item("settingsErp", "Paramètres & diagnostics", "Settings", ["adapters"]),
  ]),

  group("api", "API & Intégrations", "integrations", "Puzzle", "text-teal-300", [
    item("settingsIntegrations", "Vue d’ensemble", "Home"),
    item("integrations-connectors", "Connecteurs", "Plug", ["integrations-credentials"]),
    item("integrations-webhooks", "Webhooks", "Webhook"),
    item("integrations-diagnostics", "Diagnostics", "BarChart3", ["integrations-apis", "integrations-sync", "integrations-specifications"]),
  ]),

  group("registry", "Registry", "administration", "Box", "text-slate-200", [
    item("registry", "Vue d’ensemble", "Home", ["packRegistry"]),
    item("registrySources", "Sources", "Network"),
    item("registryEntries", "Entrées", "Package"),
    item("registryVersions", "Versions", "Tag"),
    item("registryCapabilities", "Capacités", "Server"),
    item("registryProviders", "Providers", "Plug"),
    item("registrySchemas", "Schémas", "FileText"),
    item("registryCompatibility", "Compatibilité", "CheckCircle2"),
    item("registryAvailability", "Disponibilité", "Activity"),
    item("registryDiagnostics", "Diagnostics", "BarChart3"),
    item("registryAudit", "Audit", "FileSearch"),
  ]),

  group("environments", "Environnements & Déploiements", "publication", "Server", "text-sky-400", [
    item("environments", "Environnements", "Server", ["specifications", "contracts", "snapshots", "platform-contract"]),
    item("deployment", "Déploiements", "Rocket", ["deployment-cockpit", "deployment-diagnostics", "deployment-specifications"]),
    item("deploymentReleases", "Historique des déploiements", "History", [], { pageId: "deployment-releases" }),
  ]),

  group("iam", "Auth / IAM", "administration", "ShieldCheck", "text-slate-200", [
    item("iam-users", "Utilisateurs", "Users"),
    item("iam-identities", "Identités", "Fingerprint"),
    item("iam-roles", "Rôles", "KeyRound"),
    item("iam-policies", "Politiques", "Lock"),
    item("iam-tenants", "Entreprises / Tenants", "Building2"),
    item("iam-organizations", "Organisations / Sites", "Landmark"),
    item("iam-sessions", "Sessions", "Monitor"),
  ]),

  group("observability", "Observabilité", "supervision", "Activity", "text-slate-200", [
    item("observability", "Vue d’ensemble", "Home"),
    item("observability-monitoring", "Monitoring", "Activity"),
    item("observability-logs", "Logs", "ScrollText"),
    item("observability-traces", "Traces", "GitBranch"),
    item("observability-errors", "Erreurs", "ShieldAlert"),
    item("observability-alerts", "Alertes", "Bell"),
    item("observability-audit", "Audit", "FileSearch"),
    item("observability-security-events", "Événements de sécurité", "Lock"),
  ]),

  group("billing", "Abonnements & Facturation", "commercial", "CreditCard", "text-sky-400", [
    item("billingOverview", "Mon abonnement", "CreditCard"),
    item("billingQuotas", "Utilisation", "Gauge"),
    item("billingInvoices", "Factures & paiements", "Receipt"),
    item("billingSettings", "Paramètres", "Settings"),
    item("billingAdminCatalog", "Offres & tarifs", "Tags"),
    item("billingAdminSubscriptions", "Abonnements clients", "Building2"),
    item("billingAdminOperations", "Opérations financières", "Landmark"),
    item("billingAdminDiagnostics", "Diagnostics & audit", "Activity"),
  ]),

  group("admin", "Administration Platform", "administration", "Settings", "text-slate-200", [
    item("adminOverview", "Vue d’ensemble", "Home"),
    item("settingsGeneral", "Paramètres généraux", "Settings"),
    item("settingsProfile", "Profil", "Users"),
  ].map((entry) => ({ ...entry, permission: "iam:admin" }))),
];

export const navigationGroups = menu.map(({ items, ...rest }) => rest);
export const navigationItems = Object.fromEntries(menu.map((g) => [g.id, g.items]));
