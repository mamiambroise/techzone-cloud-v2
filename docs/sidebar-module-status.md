# Statut des modules du sidebar

> Inventaire plateforme large. La photographie BM/PM/PR à jour est `bm-pm-pr-page-compliance.md` et prévaut pour ces trois domaines.

Cette matrice reprend chaque entrée du sidebar cible. `Frontend` décrit le composant réutilisable ou l'absence d'écran ; `Backend/API` décrit uniquement les capacités observées dans les contrôleurs existants.

| Groupe | Menu | Sous-menu | Route | Frontend | Backend/API | Type | Statut |
|---|---|---|---|---|---|---|---|
| Dashboard | Dashboard | Dashboard | `/dashboard` | OverviewView | BM/PM données existantes | B | PARTIEL |
| Plateforme | Platform Foundation | Vue d’ensemble | `/platform-foundation` | OverviewView | partiel | B | À DÉPLACER |
| Plateforme | Platform Foundation | Applications & Versions | `/platform-foundation/applications` | ApplicationsView, VersionsView | applications, versions | A | FONCTIONNEL |
| Plateforme | Platform Foundation | Environnements | `/platform-foundation/environments` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Platform Foundation | Contrats | `/platform-foundation/contracts` | IntegrationBridgeView | runtime bridge | B | À DÉPLACER |
| Plateforme | Platform Foundation | Configuration | `/platform-foundation/configuration` | ConfigurationView | configuration/metadata | B | À DÉPLACER |
| Plateforme | Platform Foundation | Snapshots & Historique | `/platform-foundation/snapshots` | AuditView | snapshots | B | À DÉPLACER |
| Plateforme | Auth + IAM + Context | Vue d’ensemble | `/auth-iam` | IAMDashboardView | session/guards | B | À DÉPLACER |
| Plateforme | Auth + IAM + Context | Utilisateurs & Identités | `/auth-iam/users` | IAMDashboardView partielle | session | B | À CONNECTER |
| Plateforme | Auth + IAM + Context | Organisations & Tenants | `/auth-iam/tenants` | partiel | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Auth + IAM + Context | Rôles & Permissions | `/auth-iam/roles` | partiel | guards/permissions | B | À CONNECTER |
| Plateforme | Auth + IAM + Context | Accès & Policies | `/auth-iam/policies` | absent | guards | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Auth + IAM + Context | Sessions & Sécurité | `/auth-iam/sessions` | absent | session | B | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Auth + IAM + Context | Contextes | `/auth-iam/contexts` | absent | runtime context | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Vue d’ensemble | `/billing` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Tenants | `/billing/tenants` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Plans & Offres | `/billing/plans` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Abonnements | `/billing/subscriptions` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Facturation | `/billing/invoices` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Paiements | `/billing/payments` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Quotas & Limites | `/billing/quotas` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Usage / Metering | `/billing/usage` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Tenant, Subscription & Billing | Historique | `/billing/history` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Observability & Security | Vue d’ensemble | `/observability` | AuditView | audit partiel | B | À DÉPLACER |
| Plateforme | Observability & Security | Logs | `/observability/logs` | AuditView partielle | activity | B | À CONNECTER |
| Plateforme | Observability & Security | Audit | `/observability/audit` | AuditView | audit | A | FONCTIONNEL |
| Plateforme | Observability & Security | Événements de sécurité | `/observability/security-events` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Observability & Security | Monitoring | `/observability/monitoring` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Observability & Security | Alertes | `/observability/alerts` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Plateforme | Observability & Security | Health | `/observability/health` | IAMDashboardView | health partiel | B | À DÉPLACER |
| Plateforme | Observability & Security | Diagnostics | `/observability/diagnostics` | E2EBenchView | runtime diagnostics | B | À DÉPLACER |
| Conception | Business Manager | Vue d’ensemble | `/business-manager` | OverviewView | BM apps/stats | A | FONCTIONNEL |
| Conception | Business Manager | Applications | `/business-manager/applications` | ApplicationsView | applications CRUD | A | FONCTIONNEL |
| Conception | Business Manager | Versions & Lifecycle | `/business-manager/versions` | VersionsView | versions/lifecycle | B | PARTIEL |
| Conception | Business Manager | Data Model | `/business-manager/data-model` | DataModelView | data-model | B | PARTIEL |
| Conception | Business Manager | Features & Capabilities | `/business-manager/features` | FeatureCapabilityView | feature-capability | B | PARTIEL |
| Conception | Business Manager | Menus & Navigation | `/business-manager/menus` | MenuEngineView | menus/navigation | B | PARTIEL |
| Conception | Business Manager | Configuration & Metadata | `/business-manager/configuration` | ConfigurationView | configuration/metadata | B | PARTIEL |
| Conception | Business Manager | Contracts & Runtime Bridge | `/business-manager/contracts` | IntegrationBridgeView | runtime bridge | A | FONCTIONNEL |
| Conception | Business Manager | Validation & Quality | `/business-manager/validation` | ValidationView | validation/quality | B | PARTIEL |
| Conception | Pack Manager | Vue d’ensemble | `/pack-manager` | PackOverviewView | dashboard | A | FONCTIONNEL |
| Conception | Pack Manager | Packs | `/pack-manager/packs` | PacksView | packs CRUD | B | PARTIEL |
| Conception | Pack Manager | Versions de packs | `/pack-manager/versions` | PackVersionsView | versions | B | PARTIEL |
| Conception | Pack Manager | Modules | `/pack-manager/modules` | PackModulesView | modules | B | PARTIEL |
| Conception | Pack Manager | Features & Capabilities | `/pack-manager/features` | FeatureCapabilityView | PM associations | B | PARTIEL |
| Conception | Pack Manager | Dépendances | `/pack-manager/dependencies` | PackDependenciesView | dependencies | B | PARTIEL |
| Conception | Pack Manager | Règles & Conditions | `/pack-manager/rules` | PackRulesView | rules | B | PARTIEL |
| Conception | Pack Manager | Validation | `/pack-manager/validation` | ValidationView | validate | B | PARTIEL |
| Conception | Pack Manager | Publication | `/pack-manager/publication` | PacksView partielle | publish | B | PARTIEL |
| Conception | Pack Manager | Manifest | `/pack-manager/manifest` | PackVersionsView | manifest | A | FONCTIONNEL |
| ERP & Runtime | ERP Adapter | Vue d’ensemble | `/erp-adapter` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Analyse & Adaptation | `/erp-adapter/analysis` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Capacités ERP | `/erp-adapter/capabilities` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Mappings | `/erp-adapter/mappings` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Extensions | `/erp-adapter/extensions` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Compatibilité | `/erp-adapter/compatibility` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | ERP Adapter | Rapports d’analyse | `/erp-adapter/reports` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| ERP & Runtime | Pack Runtime | Vue d’ensemble | `/pack-runtime` | RuntimeCockpitView | dashboard/resolutions | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Runtime Context | `/pack-runtime/context` | RuntimeCockpitView | context | B | PARTIEL |
| ERP & Runtime | Pack Runtime | Resolver | `/pack-runtime/resolver` | RuntimeCockpitView | resolve | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Effective Manifest | `/pack-runtime/effective-manifest` | RuntimeCockpitView | effective manifest | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Runtime Status | `/pack-runtime/status` | RuntimeCockpitView | status | B | PARTIEL |
| ERP & Runtime | Pack Runtime | Cache & Résilience | `/pack-runtime/cache` | partiel | cache/resilience | B | PARTIEL |
| ERP & Runtime | Pack Runtime | Diagnostics | `/pack-runtime/diagnostics` | partiel | diagnostics | B | PARTIEL |
| ERP & Runtime | Pack Runtime | API Runtime | `/pack-runtime/api` | RuntimeCockpitView | runtime API | B | PARTIEL |
| UI & Experience | UI Builder / Experience Engine | Vue d’ensemble | `/ui-builder` | partiel | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Page & UI Builder | `/ui-builder/pages` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Layouts | `/ui-builder/layouts` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Components Registry | `/ui-builder/components` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Menu Engine | `/ui-builder/menu-engine` | MenuEngineView | menus | A | FONCTIONNEL |
| UI & Experience | UI Builder / Experience Engine | Form Engine | `/ui-builder/forms` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Dashboard Engine | `/ui-builder/dashboards` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Themes | `/ui-builder/themes` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Templates UI | `/ui-builder/templates` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Data Binding | `/ui-builder/data-binding` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| UI & Experience | UI Builder / Experience Engine | Actions UI | `/ui-builder/actions` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Data & Logic | Data Model Manager | Vue d’ensemble, Entités, Champs, Relations, Métadonnées, Schémas, Validations, Migrations / Versions | `/data-model/*` | DataModelView / ConfigurationView | data-model/configuration | B | PARTIEL |
| Data & Logic | Query Engine | Vue d’ensemble, Queries, Data Sources, Filtres, Agrégations, Saved Queries, API Queries, Tests | `/query-engine/*` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Data & Logic | Feature & Capability Manager | Vue d’ensemble, Features, Capabilities, Relations, Dépendances, Contraintes, Compatibilité, Matrice de couverture | `/features/*` | FeatureCapabilityView | feature-capability | B | PARTIEL |
| Automation | Rules & Formula Engine | Vue d’ensemble, Règles, Formules, Conditions, Expressions, Validation, Simulation, Historique | `/rules-engine/*` | PackRulesView / AuditView | PM rules | B | PARTIEL |
| Automation | Workflow Engine | Vue d’ensemble, Workflows, Étapes, Transitions, Conditions, Actions, Exécutions, Historique | `/workflows/*` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Automation | Approval Engine | Vue d’ensemble, Circuits d’approbation, Niveaux, Approbateurs, Conditions, Demandes, Historique | `/approvals/*` | ValidationView partielle | BM quality/waivers | B | PARTIEL |
| Automation | Automation Engine | Vue d’ensemble, Automations, Triggers, Actions, Schedules, Conditions, Exécutions, Historique | `/automation/*` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Communication & Documents | Notification Manager | Vue d’ensemble, Notifications, Templates, Canaux, Email, SMS, Push, In-App, Règles d’envoi, Historique | `/notifications/*` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Communication & Documents | Report & Document Builder | Vue d’ensemble, Rapports, Documents, Templates, Sources de données, Génération PDF, Exports, Historique | `/reports/*` | absent | absent | C | EN COURS DE DÉVELOPPEMENT |
| Extensions & Developer Platform | Extension & Template Manager | Vue d’ensemble, Extensions, Plugins, Templates, Versions, Dépendances, Installation, Publication | `/extensions/*` | PackDependenciesView partielle | PM dependencies | B | PARTIEL |
| Extensions & Developer Platform | Integrations | Vue d’ensemble, Connecteurs, API, Webhooks, Credentials, Synchronisations, Mapping, Logs d’intégration | `/integrations/*` | IntegrationBridgeView partielle | BM integrations | B | PARTIEL |
| Extensions & Developer Platform | Developer Platform | Vue d’ensemble, API Explorer, SDK, Developer Apps, API Keys, Webhooks, Sandbox, Documentation, Tests | `/developer-platform/*` | absent | Swagger seulement | C | EN COURS DE DÉVELOPPEMENT |
| Extensions & Developer Platform | Marketplace | Vue d’ensemble, Packs, Extensions, Templates, Versions, Publication, Validation / Certification, Installations | `/marketplace/*` | PacksView réutilisable | PM publish | C | EN COURS DE DÉVELOPPEMENT |
| Versioning & Delivery | Version & Sandbox Manager | Vue d’ensemble, Versions, Drafts, Sandboxes, Comparaisons, Validation, Promotion, Historique | `/versioning/*` | VersionsView / ValidationView | BM versions/validation | B | PARTIEL |
| Versioning & Delivery | Publication & Rollback Manager | Vue d’ensemble, Publications, Releases, Déploiements, Environnements, Validation, Rollback, Historique | `/delivery/*` | PacksView / ValidationView / AuditView | PM publish, BM rollback | B | PARTIEL |
| Administration | Platform Administration | Vue d’ensemble, Paramètres plateforme, Organisations, Tenants, Utilisateurs, Rôles & Permissions, Feature Flags, Paramètres système, Maintenance, Jobs, Sauvegardes, Diagnostics | `/administration/*` | IAMDashboardView / ConfigurationView | auth, configuration, diagnostics partiels | B | PARTIEL |
