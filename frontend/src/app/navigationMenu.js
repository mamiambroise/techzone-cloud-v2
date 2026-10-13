const item = (id, label, icon, aliases = []) => ({ id, label, icon, aliases });
const group = (id, label, section, icon, accent, items) => ({ id, label, section, icon, accent, items });

export const navigationSections = [
  { id: "accueil", label: "ACCUEIL" },
  { id: "construction", label: "CONSTRUCTION" },
  { id: "execution", label: "EXÉCUTION" },
  { id: "integrations", label: "DONNÉES & INTÉGRATIONS" },
  { id: "platform", label: "PLATEFORME" },
];

const menu = [
  group("dashboard", "Tableau de bord", "accueil", "Home", "", [item("dashboard", "Tableau de bord", "Home")]),

  group("bm", "Business Manager", "construction", "Package", "text-pink-500", [
    item("bm", "Vue d’ensemble", "Home"),
    item("bmApplications", "Applications", "LayoutGrid", ["applications", "applicationNew", "applicationDetail", "applicationWorkspace", "bmApplicationNew", "bmApplicationDetail", "bmVersions", "bmVersionsIndex", "bmVersionDetail", "bmRuntimeIndex", "bmRuntime"]),
    item("bmModels", "Modèles de données", "Database", ["bmDataModel"]),
    item("bmFeaturesIndex", "Fonctionnalités", "Cog", ["bmFeatures"]),
    item("bmNavigationIndex", "Navigation", "Navigation", ["bmNavigation"]),
    item("bmConfiguration", "Configuration", "SlidersHorizontal"),
    item("bmQuality", "Validation", "CheckCircle2", ["bmValidation"]),
  ]),

  group("ui", "UI Builder", "construction", "PanelsTopLeft", "text-violet-500", [
    item("ui", "Vue d’ensemble", "Home"),
    item("uiPages", "Pages", "FileText", ["uiPage"]),
    item("uiEditor", "Éditeur visuel", "ImageIcon", ["uiBuilder"]),
    item("uiComponents", "Composants", "Box"),
    item("uiForms", "Formulaires", "ClipboardList"),
    item("uiNavigation", "Navigation", "Navigation"),
    item("uiThemes", "Thème", "Palette"),
    item("uiPreview", "Aperçu & Test", "Eye"),
  ]),

  group("automation", "Automatisation", "construction", "Cog", "text-amber-400", [
    item("automation", "Vue d’ensemble", "Home"),
    item("automationWorkflows", "Workflows", "Network"),
    item("automationTriggers", "Déclencheurs", "Zap"),
    item("automationActions", "Actions", "Play"),
    item("automationSchedules", "Planifications", "History"),
    item("automationExecutions", "Exécutions", "ListChecks"),
    item("automationTemplates", "Modèles", "FileText"),
    item("automationDiagnostics", "Diagnostics", "BarChart3"),
    item("automationRules", "Règles", "ShieldCheck", ["automation-conditions"]),
  ]),

  group("packs", "Pack Manager", "construction", "Layers", "text-emerald-400", [
    item("packs", "Vue d’ensemble", "Home"),
    item("packManager", "Packs", "Box"),
    item("packVersions", "Versions", "Tag"),
    item("packModules", "Modules", "Puzzle"),
    item("packFeatures", "Fonctionnalités", "ListChecks"),
    item("packCapabilities", "Capacités", "Server"),
    item("packDependencies", "Dépendances", "Link2"),
    item("packRules", "Règles", "ShieldCheck"),
    item("packValidation", "Validation & Manifest", "CheckCircle2"),
    item("packPublication", "Publication", "UploadCloud"),
  ]),

  group("runtime", "Runtime", "execution", "Play", "text-sky-400", [
    item("runtime", "Vue d’ensemble", "Home", ["packRuntime"]),
    item("runtimeContext", "Contextes", "Layers"),
    item("runtimeManifest", "Manifest", "FileText"),
    item("runtimeResolver", "Résolution", "GitBranch"),
    item("runtimeEffective", "Configuration effective", "SlidersHorizontal"),
    item("runtimeCache", "Cache", "Database"),
    item("runtimeDiagnostics", "Diagnostics", "BarChart3"),
  ]),

  group("data", "Données", "integrations", "Database", "text-cyan-400", [
    item("data", "Vue d’ensemble", "Home"),
    item("dataSources", "Sources", "Database"),
    item("dataContracts", "Modèles & Contrats", "FileText"),
    item("dataRuntime", "Requêtes", "Search", ["dataQuery", "data-runtime-history"]),
    item("dataPolicies", "Politiques", "Lock"),
    item("dataDiagnostics", "Diagnostics", "BarChart3"),
  ]),

  group("erp", "ERP / Dolibarr", "integrations", "Link2", "text-sky-400", [
    item("erp", "Vue d’ensemble", "Home"),
    item("erp-clients", "Ressources", "Database", ["erp-products", "erp-orders", "erp-invoices", "erp-stocks", "erp-:moduleKey", "erps-create", "erps-edit-:id"]),
    item("erpMapping", "Mappings", "Table2"),
    item("erpSynchronizations", "Synchronisations", "RefreshCw"),
    item("erpDiagnostics", "Diagnostics", "BarChart3"),
    item("settingsErp", "Configuration", "Settings", ["adapters"]),
  ]),

  group("api", "API & Intégrations", "integrations", "Puzzle", "text-teal-300", [
    item("settingsIntegrations", "Vue d’ensemble", "Home"),
    item("integrations-connectors", "Connecteurs", "Plug", ["integrations-credentials"]),
    item("integrations-webhooks", "Webhooks", "Webhook"),
    item("integrations-diagnostics", "Diagnostics", "BarChart3", ["integrations-apis", "integrations-sync", "integrations-specifications"]),
  ]),

  group("registry", "Registry", "platform", "Box", "text-slate-200", [
    item("registry", "Vue d’ensemble", "Home", ["packRegistry"]),
    item("registryEntries", "Entrées", "Package"),
    item("registryCapabilities", "Capacités", "Server"),
    item("registryProviders", "Providers", "Plug"),
    item("registryCompatibility", "Compatibilité", "CheckCircle2"),
    item("registryDiagnostics", "Diagnostics", "BarChart3"),
  ]),

  group("environments", "Environnements", "platform", "Server", "text-sky-400", [
    item("environments", "Environnements", "Server", ["specifications", "contracts", "snapshots", "platform-contract"]),
  ]),

  group("deployments", "Déploiements", "platform", "Rocket", "text-sky-300", [
    item("deployment", "Vue d’ensemble", "Home", ["deployment-cockpit", "deployment-diagnostics", "deployment-specifications"]),
    item("deployment-releases", "Déploiements", "Rocket", ["deployment-pipelines", "deployment-promotion"]),
    item("deploymentActivations", "Activations", "Zap"),
    item("history", "Historique", "History"),
    item("deployment-rollback", "Rollback", "Undo2"),
  ]),

  group("iam", "Sécurité & IAM", "platform", "ShieldCheck", "text-slate-200", [
    item("iam-users", "Utilisateurs", "Users"),
    item("iam-identities", "Identités", "Fingerprint"),
    item("iam-roles", "Rôles", "KeyRound"),
    item("iam-policies", "Politiques", "Lock"),
    item("iam-tenants", "Entreprises / Tenants", "Building2"),
    item("iam-organizations", "Organisations / Sites", "Landmark"),
    item("iam-sessions", "Sessions", "Monitor"),
  ]),

  group("observability", "Observabilité", "platform", "Activity", "text-slate-200", [
    item("observability", "Vue d’ensemble", "Home"),
    item("observability-monitoring", "Monitoring", "Activity"),
    item("observability-logs", "Logs", "ScrollText"),
    item("observability-traces", "Traces", "GitBranch"),
    item("observability-errors", "Erreurs", "ShieldAlert"),
    item("observability-alerts", "Alertes", "Bell"),
    item("observability-audit", "Audit", "FileSearch"),
    item("observability-security-events", "Événements de sécurité", "Lock"),
  ]),

  group("billing", "Abonnements", "platform", "CreditCard", "text-sky-400", [
    item("billingPlans", "Plans", "Tag"),
    item("billingSubscriptions", "Abonnements", "CreditCard"),
    item("billingQuotas", "Usage", "Gauge"),
    item("billingInvoices", "Facturation", "Receipt"),
  ]),

  group("admin", "Administration", "platform", "Settings", "text-slate-200", [
    item("adminOverview", "Vue d’ensemble", "Home"),
    item("settingsGeneral", "Paramètres plateforme", "Settings"),
    item("adminFeatures", "Fonctionnalités", "ListChecks"),
    item("adminMaintenance", "Maintenance", "SlidersHorizontal"),
  ]),
];

export const navigationGroups = menu.map(({ items, ...rest }) => rest);
export const navigationItems = Object.fromEntries(menu.map((g) => [g.id, g.items]));