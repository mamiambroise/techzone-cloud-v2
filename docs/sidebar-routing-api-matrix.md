# Matrice routing, frontend et API du sidebar

> Inventaire plateforme historique. Pour BM/PM/PR, `bm-pm-pr-page-compliance.md` contient les statuts vérifiés après rationalisation et prévaut sur les mentions anciennes ci-dessous.

L'audit est basé sur le shell actuel (`currentView`), les composants présents dans `Frontend/src/components/views` et les contrôleurs NestJS existants. Les routes cibles sont canoniques et seront servies par le shell React ; `-` signifie qu'aucun écran ou endpoint n'existe encore.

| Groupe | Menu | Sous-menu | Route actuelle | Route cible | Frontend existant | API existante | Contexte | Type | Statut |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Dashboard | Dashboard | `overview` | `/dashboard` | OverviewView | BM dashboard indirect | tenant | B | À CONNECTER |
| Plateforme | Platform Foundation | Vue d’ensemble | `overview` | `/platform-foundation` | OverviewView réutilisée | - | tenant | B | À DÉPLACER |
| Plateforme | Platform Foundation | Applications & Versions | `applications`, `versions` | `/platform-foundation/applications` | ApplicationsView, VersionsView | BM applications/versions | application | A | FONCTIONNEL |
| Plateforme | Platform Foundation | Environnements | - | `/platform-foundation/environments` | - | - | tenant | C | À CRÉER |
| Plateforme | Platform Foundation | Contrats | `integrations` | `/platform-foundation/contracts` | IntegrationBridgeView | BM runtime bridge | applicationVersion | B | À DÉPLACER |
| Plateforme | Platform Foundation | Configuration | `configuration` | `/platform-foundation/configuration` | ConfigurationView | BM configuration/metadata | applicationVersion, environment | B | À DÉPLACER |
| Plateforme | Platform Foundation | Snapshots & Historique | `audit` | `/platform-foundation/snapshots` | AuditView | snapshots BM | applicationVersion | B | À DÉPLACER |
| Plateforme | Auth + IAM + Context | Vue d’ensemble | `iam-overview` | `/auth-iam` | IAMDashboardView | auth session | tenant, user | B | À DÉPLACER |
| Plateforme | Auth + IAM + Context | Utilisateurs & Identités | `iam-users` | `/auth-iam/users` | IAMDashboardView partielle | auth session | tenant | B | À CONNECTER |
| Plateforme | Auth + IAM + Context | Organisations & Tenants | `iam-tenants` | `/auth-iam/tenants` | IAMDashboardView partielle | - | tenant | C | À CRÉER |
| Plateforme | Auth + IAM + Context | Rôles & Permissions | `iam-roles` | `/auth-iam/roles` | IAMDashboardView partielle | guards/permissions BM | tenant, user | B | À CONNECTER |
| Plateforme | Auth + IAM + Context | Accès & Policies | - | `/auth-iam/policies` | - | guards BM | tenant | C | À CRÉER |
| Plateforme | Auth + IAM + Context | Sessions & Sécurité | - | `/auth-iam/sessions` | - | auth session | user | B | À CRÉER |
| Plateforme | Auth + IAM + Context | Contextes | - | `/auth-iam/contexts` | - | runtime context | tenant, environment | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Vue d’ensemble | - | `/billing` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Tenants | `iam-tenants` | `/billing/tenants` | IAMDashboardView partielle | - | organization | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Plans & Offres | - | `/billing/plans` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Abonnements | - | `/billing/subscriptions` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Facturation | - | `/billing/invoices` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Paiements | - | `/billing/payments` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Quotas & Limites | - | `/billing/quotas` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Usage / Metering | - | `/billing/usage` | - | - | tenant | C | À CRÉER |
| Plateforme | Tenant, Subscription & Billing | Historique | - | `/billing/history` | - | - | tenant | C | À CRÉER |
| Plateforme | Observability & Security | Vue d’ensemble | `audit` | `/observability` | AuditView | BM audit | tenant | B | À DÉPLACER |
| Plateforme | Observability & Security | Logs | `audit` | `/observability/logs` | AuditView partielle | BM activity | tenant, application | B | À CONNECTER |
| Plateforme | Observability & Security | Audit | `audit` | `/observability/audit` | AuditView | BM audit | tenant, user | A | FONCTIONNEL |
| Plateforme | Observability & Security | Événements de sécurité | - | `/observability/security-events` | - | - | tenant | C | À CRÉER |
| Plateforme | Observability & Security | Monitoring | - | `/observability/monitoring` | - | - | tenant | C | À CRÉER |
| Plateforme | Observability & Security | Alertes | - | `/observability/alerts` | - | - | tenant | C | À CRÉER |
| Plateforme | Observability & Security | Health | `iam-overview` | `/observability/health` | IAMDashboardView | health indirect | tenant | B | À DÉPLACER |
| Plateforme | Observability & Security | Diagnostics | `e2e-bench` | `/observability/diagnostics` | E2EBenchView | runtime diagnostics | tenant | B | À DÉPLACER |
| Conception | Business Manager | Vue d’ensemble | `overview` | `/business-manager` | OverviewView | BM applications stats | tenant | A | FONCTIONNEL |
| Conception | Business Manager | Applications | `applications` | `/business-manager/applications` | ApplicationsView | BM applications | tenant, organization | A | FONCTIONNEL |
| Conception | Business Manager | Versions & Lifecycle | `versions` | `/business-manager/versions` | VersionsView | BM versions/lifecycle | application | B | À CONNECTER |
| Conception | Business Manager | Data Model | `data-model` | `/business-manager/data-model` | DataModelView | BM data-model | applicationVersion | B | À CONNECTER |
| Conception | Business Manager | Features & Capabilities | `features` | `/business-manager/features` | FeatureCapabilityView | BM feature-capability | applicationVersion | B | À CONNECTER |
| Conception | Business Manager | Menus & Navigation | `menus` | `/business-manager/menus` | MenuEngineView | BM menus/navigation | applicationVersion | B | À CONNECTER |
| Conception | Business Manager | Configuration & Metadata | `configuration` | `/business-manager/configuration` | ConfigurationView | BM configuration/metadata | applicationVersion | B | À CONNECTER |
| Conception | Business Manager | Contracts & Runtime Bridge | `integrations` | `/business-manager/contracts` | IntegrationBridgeView | BM runtime bridge | applicationVersion | A | FONCTIONNEL |
| Conception | Business Manager | Validation & Quality | `validation` | `/business-manager/validation` | ValidationView | BM validation/quality | applicationVersion | B | À CONNECTER |
| Conception | Pack Manager | Vue d’ensemble | `pack-overview` | `/pack-manager` | PackOverviewView | PM dashboard | tenant | A | FONCTIONNEL |
| Conception | Pack Manager | Packs | `packs` | `/pack-manager/packs` | PacksView | PM packs | tenant | B | À CONNECTER |
| Conception | Pack Manager | Versions de packs | `pack-versions` | `/pack-manager/versions` | PackVersionsView | PM versions | pack | B | À CONNECTER |
| Conception | Pack Manager | Modules | `pack-modules` | `/pack-manager/modules` | PackModulesView | PM modules | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Features & Capabilities | `features` | `/pack-manager/features` | FeatureCapabilityView réutilisable | PM features/capabilities | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Dépendances | `pack-dependencies` | `/pack-manager/dependencies` | PackDependenciesView | PM dependencies | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Règles & Conditions | `pack-rules` | `/pack-manager/rules` | PackRulesView | PM rules | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Validation | `validation` | `/pack-manager/validation` | ValidationView réutilisable | PM validate | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Publication | `packs` | `/pack-manager/publication` | PacksView partielle | PM publish | packVersion | B | À CONNECTER |
| Conception | Pack Manager | Manifest | `pack-versions` | `/pack-manager/manifest` | PackVersionsView partielle | PM manifest | packVersion | A | FONCTIONNEL |
| ERP & Runtime | ERP Adapter | Vue d’ensemble | - | `/erp-adapter` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Analyse & Adaptation | - | `/erp-adapter/analysis` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Capacités ERP | - | `/erp-adapter/capabilities` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Mappings | - | `/erp-adapter/mappings` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Extensions | - | `/erp-adapter/extensions` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Compatibilité | - | `/erp-adapter/compatibility` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | ERP Adapter | Rapports d’analyse | - | `/erp-adapter/reports` | - | - | tenant | C | À CRÉER |
| ERP & Runtime | Pack Runtime | Vue d’ensemble | `pack-runtime` | `/pack-runtime` | RuntimeCockpitView | PR dashboard/resolutions | tenant, environment | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Runtime Context | `pack-runtime` | `/pack-runtime/context` | RuntimeCockpitView | PR context | tenant, environment | B | À CONNECTER |
| ERP & Runtime | Pack Runtime | Resolver | `pack-runtime` | `/pack-runtime/resolver` | RuntimeCockpitView | PR resolve | tenant, packVersion | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Effective Manifest | `pack-runtime` | `/pack-runtime/effective-manifest` | RuntimeCockpitView | PR effective manifest | resolution | A | FONCTIONNEL |
| ERP & Runtime | Pack Runtime | Runtime Status | `pack-runtime` | `/pack-runtime/status` | RuntimeCockpitView | PR dashboard/status | tenant | B | À CONNECTER |
| ERP & Runtime | Pack Runtime | Cache & Résilience | `pack-runtime` | `/pack-runtime/cache` | RuntimeCockpitView partielle | PR cache/resilience | tenant | B | À CONNECTER |
| ERP & Runtime | Pack Runtime | Diagnostics | `pack-runtime` | `/pack-runtime/diagnostics` | RuntimeCockpitView partielle | PR diagnostics | resolution | B | À CONNECTER |
| ERP & Runtime | Pack Runtime | API Runtime | `pack-runtime` | `/pack-runtime/api` | RuntimeCockpitView | PR API | tenant | B | À CONNECTER |
| UI & Experience | UI Builder / Experience Engine | Vue d’ensemble | `pack-modules` | `/ui-builder` | PackModulesView partielle | - | packVersion | B | À DÉPLACER |
| UI & Experience | UI Builder / Experience Engine | Page & UI Builder | `ui-builder` | `/ui-builder/pages` | - | - | application | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Layouts | - | `/ui-builder/layouts` | - | - | application | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Components Registry | - | `/ui-builder/components` | - | - | tenant | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Menu Engine | `menus` | `/ui-builder/menu-engine` | MenuEngineView | BM menus | applicationVersion | A | FONCTIONNEL |
| UI & Experience | UI Builder / Experience Engine | Form Engine | `form-engine` | `/ui-builder/forms` | - | - | application | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Dashboard Engine | `dashboard-engine` | `/ui-builder/dashboards` | - | - | application | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Themes | - | `/ui-builder/themes` | - | - | tenant | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Templates UI | - | `/ui-builder/templates` | - | - | tenant | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Data Binding | - | `/ui-builder/data-binding` | - | - | application | C | À CRÉER |
| UI & Experience | UI Builder / Experience Engine | Actions UI | - | `/ui-builder/actions` | - | - | application | C | À CRÉER |
| Data & Logic | Data Model Manager | Vue d’ensemble | `data-model` | `/data-model` | DataModelView | BM data-model | applicationVersion | B | À CONNECTER |
| Data & Logic | Data Model Manager | Entités | `data-model` | `/data-model/entities` | DataModelView | BM models | applicationVersion | B | À CONNECTER |
| Data & Logic | Data Model Manager | Champs | `data-model` | `/data-model/fields` | DataModelView partielle | BM models | model | B | À CONNECTER |
| Data & Logic | Data Model Manager | Relations | `data-model` | `/data-model/relations` | DataModelView partielle | BM dependencies | model | C | À CRÉER |
| Data & Logic | Data Model Manager | Métadonnées | `configuration` | `/data-model/metadata` | ConfigurationView | BM metadata | model | B | À DÉPLACER |
| Data & Logic | Data Model Manager | Schémas | `data-model` | `/data-model/schemas` | DataModelView | BM models | applicationVersion | B | À CONNECTER |
| Data & Logic | Data Model Manager | Validations | `data-model` | `/data-model/validations` | DataModelView partielle | BM model validate | model | B | À CONNECTER |
| Data & Logic | Data Model Manager | Migrations / Versions | `versions` | `/data-model/migrations` | VersionsView partielle | BM versions | applicationVersion | C | À CRÉER |
| Data & Logic | Query Engine | Vue d’ensemble | `query-engine` | `/query-engine` | - | - | tenant | C | À CRÉER |
| Data & Logic | Query Engine | Queries | - | `/query-engine/queries` | - | - | tenant | C | À CRÉER |
| Data & Logic | Query Engine | Data Sources | - | `/query-engine/data-sources` | - | - | tenant | C | À CRÉER |
| Data & Logic | Query Engine | Filtres | - | `/query-engine/filters` | - | - | query | C | À CRÉER |
| Data & Logic | Query Engine | Agrégations | - | `/query-engine/aggregations` | - | - | query | C | À CRÉER |
| Data & Logic | Query Engine | Saved Queries | - | `/query-engine/saved` | - | - | user | C | À CRÉER |
| Data & Logic | Query Engine | API Queries | - | `/query-engine/api` | - | - | tenant | C | À CRÉER |
| Data & Logic | Query Engine | Tests | `e2e-bench` | `/query-engine/tests` | E2EBenchView | - | tenant | C | À CRÉER |
| Data & Logic | Feature & Capability Manager | Vue d’ensemble | `features` | `/features` | FeatureCapabilityView | BM feature-capability | applicationVersion | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Features | `features` | `/features/features` | FeatureCapabilityView | BM features | applicationVersion | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Capabilities | `features` | `/features/capabilities` | FeatureCapabilityView | BM capabilities | applicationVersion | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Relations | `features` | `/features/relations` | FeatureCapabilityView | BM mappings | applicationVersion | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Dépendances | `features` | `/features/dependencies` | FeatureCapabilityView partielle | BM capability dependencies | capability | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Contraintes | `features` | `/features/constraints` | FeatureCapabilityView partielle | BM requirements | capability | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Compatibilité | `features` | `/features/compatibility` | FeatureCapabilityView partielle | BM impact | applicationVersion | B | À CONNECTER |
| Data & Logic | Feature & Capability Manager | Matrice de couverture | `features` | `/features/coverage` | FeatureCapabilityView partielle | BM snapshots | applicationVersion | B | À CONNECTER |
| Automation | Rules & Formula Engine | Vue d’ensemble | `pack-rules` | `/rules-engine` | PackRulesView | PM rules | packVersion | B | À DÉPLACER |
| Automation | Rules & Formula Engine | Règles | `pack-rules` | `/rules-engine/rules` | PackRulesView | PM rules | packVersion | B | À CONNECTER |
| Automation | Rules & Formula Engine | Formules | - | `/rules-engine/formulas` | - | - | tenant | C | À CRÉER |
| Automation | Rules & Formula Engine | Conditions | `pack-rules` | `/rules-engine/conditions` | PackRulesView | PM rules | packVersion | B | À CONNECTER |
| Automation | Rules & Formula Engine | Expressions | - | `/rules-engine/expressions` | - | - | tenant | C | À CRÉER |
| Automation | Rules & Formula Engine | Validation | `pack-rules` | `/rules-engine/validation` | PackRulesView | PM rules validation | packVersion | B | À CONNECTER |
| Automation | Rules & Formula Engine | Simulation | - | `/rules-engine/simulation` | - | - | packVersion | C | À CRÉER |
| Automation | Rules & Formula Engine | Historique | `audit` | `/rules-engine/history` | AuditView partielle | PM audit | packVersion | B | À DÉPLACER |
| Automation | Workflow Engine | Vue d’ensemble | `workflow-engine` | `/workflows` | - | - | tenant | C | À CRÉER |
| Automation | Workflow Engine | Workflows | `workflows` | `/workflows/workflows` | - | - | tenant | C | À CRÉER |
| Automation | Workflow Engine | Étapes | - | `/workflows/steps` | - | - | workflow | C | À CRÉER |
| Automation | Workflow Engine | Transitions | - | `/workflows/transitions` | - | - | workflow | C | À CRÉER |
| Automation | Workflow Engine | Conditions | - | `/workflows/conditions` | - | - | workflow | C | À CRÉER |
| Automation | Workflow Engine | Actions | - | `/workflows/actions` | - | - | workflow | C | À CRÉER |
| Automation | Workflow Engine | Exécutions | - | `/workflows/runs` | - | - | workflow | C | À CRÉER |
| Automation | Workflow Engine | Historique | `audit` | `/workflows/history` | AuditView partielle | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Vue d’ensemble | `validation` | `/approvals` | ValidationView partielle | BM quality/waivers | tenant | B | À DÉPLACER |
| Automation | Approval Engine | Circuits d’approbation | - | `/approvals/flows` | - | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Niveaux | - | `/approvals/levels` | - | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Approbateurs | - | `/approvals/approvers` | - | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Conditions | - | `/approvals/conditions` | - | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Demandes | - | `/approvals/requests` | - | - | tenant | C | À CRÉER |
| Automation | Approval Engine | Historique | `audit` | `/approvals/history` | AuditView partielle | BM audit | tenant | B | À DÉPLACER |
| Automation | Automation Engine | Vue d’ensemble | `integrations` | `/automation` | IntegrationBridgeView partielle | - | tenant | C | À DÉPLACER |
| Automation | Automation Engine | Automations | - | `/automation/automations` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Triggers | - | `/automation/triggers` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Actions | - | `/automation/actions` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Schedules | - | `/automation/schedules` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Conditions | - | `/automation/conditions` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Exécutions | - | `/automation/runs` | - | - | tenant | C | À CRÉER |
| Automation | Automation Engine | Historique | `audit` | `/automation/history` | AuditView partielle | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Vue d’ensemble | `configuration` | `/notifications` | ConfigurationView partielle | - | tenant | C | À DÉPLACER |
| Communication & Documents | Notification Manager | Notifications | - | `/notifications/notifications` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Templates | - | `/notifications/templates` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Canaux | - | `/notifications/channels` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Email | - | `/notifications/email` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | SMS | - | `/notifications/sms` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Push | - | `/notifications/push` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | In-App | - | `/notifications/in-app` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Règles d’envoi | - | `/notifications/rules` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Notification Manager | Historique | `audit` | `/notifications/history` | AuditView partielle | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Vue d’ensemble | `e2e-bench` | `/reports` | E2EBenchView partielle | - | tenant | C | À DÉPLACER |
| Communication & Documents | Report & Document Builder | Rapports | - | `/reports/reports` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Documents | - | `/reports/documents` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Templates | - | `/reports/templates` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Sources de données | - | `/reports/data-sources` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Génération PDF | - | `/reports/pdf` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Exports | - | `/reports/exports` | - | - | tenant | C | À CRÉER |
| Communication & Documents | Report & Document Builder | Historique | `audit` | `/reports/history` | AuditView partielle | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Vue d’ensemble | `pack-dependencies` | `/extensions` | PackDependenciesView | - | tenant | C | À DÉPLACER |
| Extensions & Developer Platform | Extension & Template Manager | Extensions | - | `/extensions/extensions` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Plugins | - | `/extensions/plugins` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Templates | `templates` | `/extensions/templates` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Versions | `versions` | `/extensions/versions` | VersionsView partielle | - | extension | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Dépendances | `pack-dependencies` | `/extensions/dependencies` | PackDependenciesView | PM dependencies | extension | B | À DÉPLACER |
| Extensions & Developer Platform | Extension & Template Manager | Installation | - | `/extensions/installations` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Extension & Template Manager | Publication | `publication` | `/extensions/publication` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Integrations | Vue d’ensemble | `integrations` | `/integrations` | IntegrationBridgeView | BM integrations | tenant | A | FONCTIONNEL |
| Extensions & Developer Platform | Integrations | Connecteurs | `integrations` | `/integrations/connectors` | IntegrationBridgeView | BM integrations | tenant | B | À CONNECTER |
| Extensions & Developer Platform | Integrations | API | - | `/integrations/api` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Integrations | Webhooks | - | `/integrations/webhooks` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Integrations | Credentials | - | `/integrations/credentials` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Integrations | Synchronisations | - | `/integrations/sync` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Integrations | Mapping | `integrations` | `/integrations/mapping` | IntegrationBridgeView partielle | BM integration bindings | applicationVersion | B | À CONNECTER |
| Extensions & Developer Platform | Integrations | Logs d’intégration | `audit` | `/integrations/logs` | AuditView partielle | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Vue d’ensemble | - | `/developer-platform` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | API Explorer | - | `/developer-platform/api-explorer` | - | Swagger backend | tenant | B | À CRÉER |
| Extensions & Developer Platform | Developer Platform | SDK | - | `/developer-platform/sdk` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Developer Apps | - | `/developer-platform/apps` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | API Keys | - | `/developer-platform/api-keys` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Webhooks | - | `/developer-platform/webhooks` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Sandbox | - | `/developer-platform/sandbox` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Documentation | - | `/developer-platform/docs` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Developer Platform | Tests | - | `/developer-platform/tests` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Marketplace | Vue d’ensemble | - | `/marketplace` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Marketplace | Packs | `packs` | `/marketplace/packs` | PacksView réutilisable | PM packs | tenant | B | À DÉPLACER |
| Extensions & Developer Platform | Marketplace | Extensions | - | `/marketplace/extensions` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Marketplace | Templates | - | `/marketplace/templates` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Marketplace | Versions | - | `/marketplace/versions` | - | - | tenant | C | À CRÉER |
| Extensions & Developer Platform | Marketplace | Publication | `publication` | `/marketplace/publication` | - | PM publish | tenant | B | À CRÉER |
| Extensions & Developer Platform | Marketplace | Validation / Certification | `validation` | `/marketplace/certification` | ValidationView partielle | BM quality | tenant | B | À DÉPLACER |
| Extensions & Developer Platform | Marketplace | Installations | - | `/marketplace/installations` | - | - | tenant | C | À CRÉER |
| Versioning & Delivery | Version & Sandbox Manager | Vue d’ensemble | `versions` | `/versioning` | VersionsView | BM versions | tenant | B | À DÉPLACER |
| Versioning & Delivery | Version & Sandbox Manager | Versions | `versions` | `/versioning/versions` | VersionsView | BM versions | application | A | FONCTIONNEL |
| Versioning & Delivery | Version & Sandbox Manager | Drafts | `pack-versions` | `/versioning/drafts` | PackVersionsView | PM draft | packVersion | B | À DÉPLACER |
| Versioning & Delivery | Version & Sandbox Manager | Sandboxes | - | `/versioning/sandboxes` | - | - | tenant | C | À CRÉER |
| Versioning & Delivery | Version & Sandbox Manager | Comparaisons | `versions` | `/versioning/compare` | VersionsView partielle | BM compare | application | B | À CONNECTER |
| Versioning & Delivery | Version & Sandbox Manager | Validation | `validation` | `/versioning/validation` | ValidationView | BM/PM validation | version | B | À DÉPLACER |
| Versioning & Delivery | Version & Sandbox Manager | Promotion | - | `/versioning/promotion` | - | - | version | C | À CRÉER |
| Versioning & Delivery | Version & Sandbox Manager | Historique | `audit` | `/versioning/history` | AuditView | BM audit | version | B | À DÉPLACER |
| Versioning & Delivery | Publication & Rollback Manager | Vue d’ensemble | `packs` | `/delivery` | PacksView partielle | PM publish | tenant | B | À DÉPLACER |
| Versioning & Delivery | Publication & Rollback Manager | Publications | `packs` | `/delivery/publications` | PacksView partielle | PM publish | packVersion | B | À CONNECTER |
| Versioning & Delivery | Publication & Rollback Manager | Releases | - | `/delivery/releases` | - | - | tenant | C | À CRÉER |
| Versioning & Delivery | Publication & Rollback Manager | Déploiements | - | `/delivery/deployments` | - | - | environment | C | À CRÉER |
| Versioning & Delivery | Publication & Rollback Manager | Environnements | - | `/delivery/environments` | - | - | tenant | C | À CRÉER |
| Versioning & Delivery | Publication & Rollback Manager | Validation | `validation` | `/delivery/validation` | ValidationView | PM validate | packVersion | B | À DÉPLACER |
| Versioning & Delivery | Publication & Rollback Manager | Rollback | `packs` | `/delivery/rollback` | PacksView partielle | BM rollback | publication | B | À CONNECTER |
| Versioning & Delivery | Publication & Rollback Manager | Historique | `audit` | `/delivery/history` | AuditView | BM/PM audit | tenant | B | À DÉPLACER |
| Administration | Platform Administration | Vue d’ensemble | `iam-overview` | `/administration` | IAMDashboardView | auth/health | tenant | B | À DÉPLACER |
| Administration | Platform Administration | Paramètres plateforme | `configuration` | `/administration/platform-settings` | ConfigurationView | BM configuration | tenant | B | À DÉPLACER |
| Administration | Platform Administration | Organisations | `iam-tenants` | `/administration/organizations` | IAMDashboardView partielle | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Tenants | `iam-tenants` | `/administration/tenants` | IAMDashboardView partielle | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Utilisateurs | `iam-users` | `/administration/users` | IAMDashboardView partielle | auth session | tenant | B | À CONNECTER |
| Administration | Platform Administration | Rôles & Permissions | `iam-roles` | `/administration/roles` | IAMDashboardView partielle | guards/permissions | tenant | B | À CONNECTER |
| Administration | Platform Administration | Feature Flags | - | `/administration/feature-flags` | - | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Paramètres système | - | `/administration/system-settings` | - | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Maintenance | - | `/administration/maintenance` | - | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Jobs | - | `/administration/jobs` | - | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Sauvegardes | - | `/administration/backups` | - | - | tenant | C | À CRÉER |
| Administration | Platform Administration | Diagnostics | `e2e-bench` | `/administration/diagnostics` | E2EBenchView partielle | PR diagnostics | tenant | B | À DÉPLACER |
