# Matrice des routes de navigation

Les statuts REAL/PARTIAL décrivent le code UI, pas une recette métier réussie. ComingSoon reste NOT_IMPLEMENTED. Toutes les routes enregistrées sont protégées par ProtectedRoute.

| SECTION | MENU | SUBMENU | ROUTE | COMPONENT | IMPLEMENTED | PROTECTED | PERMISSION | ENTITLEMENT | OLD_ROUTE | REDIRECT | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Contextuel | platform | Administration (maquette) | /iam/admin | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Contextuel | platform | undefined | /demo/iam/:demoId | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Principal | Tableau de bord | Vue d’ensemble | /dashboard | components/CockpitView.jsx | true | oui | Session IAM | non intégré | /cockpit, / | oui | PARTIAL |
| Principal | Applications | Applications | /applications | components/ApplicationsCatalogView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Principal | Applications | Nouvelle application | /applications/new | App.jsx (réutilise CreateAppModal) | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Principal | Applications | Détail application | /applications/:applicationId | App.jsx (réutilise WorkspaceConfigView) | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Principal | Applications | Configuration application | /applications/workspace | components/WorkspaceConfigView.jsx | true | oui | Session IAM | non intégré | /workspace | oui | PARTIAL |
| Construction | Business Manager | Vue d’ensemble | /business-manager | components/business-manager/BMOverview.jsx | true | oui | Session IAM | non intégré | /business | oui | PARTIAL |
| Construction | Business Manager | Applications | /business-manager/applications | components/business-manager/BMApplicationsRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Versions | /business-manager/versions | components/business-manager/BMVersionsRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Modèle de données | /business-manager/models | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | /business/models | oui | NOT_IMPLEMENTED |
| Construction | Business Manager | Fonctionnalités | /business-manager/features | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | /business/features | oui | NOT_IMPLEMENTED |
| Construction | Business Manager | Menus & Navigation | /business-manager/navigation | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | /business/navigation | oui | NOT_IMPLEMENTED |
| Construction | Business Manager | Configuration | /business-manager/configuration | components/ConfigurationView.jsx | true | oui | Session IAM | non intégré | /business/configuration, /config | oui | PARTIAL |
| Construction | Business Manager | Intégration & Runtime | /business-manager/runtime | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Business Manager | Validation / Qualité | /business-manager/validation | components/PackValidationCockpitView.jsx | true | oui | Session IAM | non intégré | /business/validation, /validation | oui | PARTIAL |
| Construction | Business Manager | Nouvelle application | /business-manager/applications/new | components/business-manager/BMApplicationNewRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Versions | /business-manager/applications/:applicationId/versions | components/business-manager/BMVersionsRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Modèle de données | /business-manager/applications/:applicationId/versions/:versionId/data-model | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Business Manager | Fonctionnalités | /business-manager/applications/:applicationId/versions/:versionId/features | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Business Manager | Menus & Navigation | /business-manager/applications/:applicationId/versions/:versionId/navigation | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Business Manager | Runtime | /business-manager/applications/:applicationId/versions/:versionId/runtime | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Business Manager | Validation / Qualité | /business-manager/applications/:applicationId/versions/:versionId/validation | components/PackValidationCockpitView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Détail application | /business-manager/applications/:applicationId | components/business-manager/BMApplicationDetailRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | Business Manager | Version détaillée | /business-manager/applications/:applicationId/versions/:versionId | components/business-manager/BMVersionDetailRoute.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Construction | UI Builder | Pages | /ui/pages | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Page Builder | /ui/builder/:pageId | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Formulaires | /ui/forms | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Composants | /ui/components | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Thèmes | /ui/themes | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Prévisualisation | /ui/preview | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | UI Builder | /ui | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | UI Builder | Détail page | /ui/pages/:pageId | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Automatisation | Vue d’ensemble | /automation | pages/AutomationCockpit.jsx | true | oui | automation:read | non intégré | — | — | PARTIAL |
| Construction | Automatisation | Règles | /automation/rules | pages/AutomationRules.jsx | true | oui | automation:read | non intégré | — | — | PARTIAL |
| Construction | Automatisation | Formules | /automation/formulas | components/ComingSoon.jsx | false | oui | automation:read | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Automatisation | Workflows | /automation/workflows | pages/AutomationWorkflows.jsx | true | oui | automation:read | non intégré | — | — | PARTIAL |
| Construction | Automatisation | Déclencheurs | /automation/triggers | pages/AutomationTriggers.jsx | true | oui | automation:read | non intégré | — | — | PARTIAL |
| Construction | Automatisation | Actions | /automation/actions | components/ComingSoon.jsx | false | oui | automation:read | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Automatisation | Exécutions | /automation/executions | pages/AutomationHistory.jsx | true | oui | automation:read | non intégré | /automation/history | oui | PARTIAL |
| Construction | Automatisation | conditions | /automation/conditions | pages/AutomationConditions.jsx | true | oui | automation:read | non intégré | — | — | PARTIAL |
| Construction | Packs | Mes Packs | /packs | components/GeneralOverviewView.jsx | true | oui | Session IAM | non intégré | /overview | oui | PARTIAL |
| Construction | Packs | Pack Manager | /packs/manager | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Packs | Registry | /packs/registry | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Packs | Versions | /packs/versions | components/VersionsDetailView.jsx | true | oui | Session IAM | non intégré | /versions | oui | PARTIAL |
| Construction | Packs | Dépendances | /packs/dependencies | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Packs | Publication | /packs/publication | components/PublicationView.jsx | true | oui | Session IAM | non intégré | /publication | oui | PARTIAL |
| Construction | Packs | Pack Runtime | /packs/runtime | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Construction | Packs | Historique | /history | components/HistoryRollbackView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | ERP Dashboard | /erp | pages/ERPDashboard.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | ERP Registry | /erps | pages/ERPList.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | Clients | /erp/clients | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | REAL |
| Intégrations | Données & ERP | Produits | /erp/products | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | REAL |
| Intégrations | Données & ERP | Commandes | /erp/orders | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | REAL |
| Intégrations | Données & ERP | Factures | /erp/invoices | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | REAL |
| Intégrations | Données & ERP | Stocks | /erp/stocks | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | REAL |
| Intégrations | Données & ERP | Entity Mapping | /erp/mappings | pages/Mapping.jsx | true | oui | erp:read | non intégré | /mapping | oui | PARTIAL |
| Intégrations | Données & ERP | Data Runtime | /data-runtime | pages/DataRuntime.jsx | true | oui | data-runtime:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | :moduleKey | /erp/:moduleKey | pages/ErpModule.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | create | /erps/create | pages/ERPCreate.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | :id | /erps/edit/:id | pages/ERPEdit.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | history | /data-runtime/history | pages/DataRuntimeHistory.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | Adaptateurs ERP | /adapters | pages/Adapters.jsx | true | oui | erp:read | non intégré | — | — | PARTIAL |
| Intégrations | Données & ERP | Requêtes | /data-runtime/query | /data-runtime#query | true | oui | data-runtime:query | non intégré | — | — | PARTIAL |
| Plateforme | Abonnements & Facturation | Plans | /billing/plans | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | /billing | oui | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Abonnements | /billing/subscriptions | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Entitlements | /billing/entitlements | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Quotas | /billing/quotas | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Facturation | /billing/invoices | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Payments | /billing/payments | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Webhooks | /billing/webhooks | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Access Rules | /billing/access-rules | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Abonnements & Facturation | Features | /billing/features | pages/DemoPage.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | IAM & Administration | Utilisateurs | /iam/users | pages/iam/UsersPage.jsx | true | oui | iam:admin | non intégré | /iam | oui | PARTIAL |
| Plateforme | IAM & Administration | Identités | /iam/identities | pages/iam/IdentitiesPage.jsx | true | oui | iam:admin | non intégré | — | — | PARTIAL |
| Plateforme | IAM & Administration | Tenants | /iam/tenants | pages/iam/TenantsPage.jsx | true | oui | iam:admin | non intégré | — | — | PARTIAL |
| Plateforme | IAM & Administration | Rôles | /iam/roles | pages/iam/RolesPage.jsx | true | oui | iam:admin | non intégré | — | — | PARTIAL |
| Plateforme | IAM & Administration | Politiques | /iam/policies | pages/iam/PoliciesPage.jsx | true | oui | iam:admin | non intégré | — | — | PARTIAL |
| Plateforme | IAM & Administration | Sessions | /iam/sessions | pages/iam/SessionsPage.jsx | true | oui | iam:admin | non intégré | — | — | PARTIAL |
| Plateforme | IAM & Administration | Organisations / Sites | /iam/organizations | components/ComingSoon.jsx | false | oui | iam:admin | non intégré | /iam/organisations | oui | NOT_IMPLEMENTED |
| Plateforme | IAM & Administration | Appareils | /iam/devices | components/ComingSoon.jsx | false | oui | iam:admin | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | IAM & Administration | Contextes | /iam/contexts | pages/DemoPage.jsx | false | oui | iam:admin | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | IAM & Administration | Liaisons ERP | /iam/identity-links | pages/DemoPage.jsx | false | oui | iam:admin | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | IAM & Administration | Groupes | /iam/identity-groups | pages/DemoPage.jsx | false | oui | iam:admin | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Observabilité | Vue d’ensemble | /observability | pages/iam/observability/ObservabilityOverview.jsx | true | oui | iam:admin | non intégré | /iam/observability | oui | PARTIAL |
| Plateforme | Observabilité | Monitoring | /observability/monitoring | pages/iam/observability/MonitoringPage.jsx | true | oui | iam:admin | non intégré | /iam/observability/monitoring | oui | PARTIAL |
| Plateforme | Observabilité | Logs | /observability/logs | pages/iam/observability/LogsPage.jsx | true | oui | iam:admin | non intégré | /iam/observability/logs | oui | PARTIAL |
| Plateforme | Observabilité | Audit | /observability/audit | pages/iam/observability/AuditPage.jsx | true | oui | iam:admin | non intégré | /iam/observability/audit | oui | PARTIAL |
| Plateforme | Observabilité | Événements de sécurité | /observability/security-events | pages/iam/observability/SecurityEventsPage.jsx | true | oui | iam:admin | non intégré | /iam/observability/security-events | oui | PARTIAL |
| Plateforme | Observabilité | Alertes | /observability/alerts | pages/iam/observability/AlertManagerPage.jsx | true | oui | iam:admin | non intégré | /iam/observability/alerts | oui | PARTIAL |
| Plateforme | Paramètres | Paramètres généraux | /settings/general | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Paramètres | Intégrations | /settings/integrations | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | /integrations/cockpit, /integrations | oui | PARTIAL |
| Plateforme | Paramètres | Configuration ERP | /settings/erp | pages/Settings.jsx | true | oui | erp:read | non intégré | /settings | oui | PARTIAL |
| Plateforme | Paramètres | Sécurité | /settings/security | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Paramètres | Profil | /settings/profile | components/ComingSoon.jsx | false | oui | Session IAM | non intégré | — | — | NOT_IMPLEMENTED |
| Plateforme | Paramètres | Spécifications | /specifications | components/SpecificationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | Environnements | /environments | components/EnvironmentsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | Registre des contrats | /contracts | components/ContractsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | Snapshots | /snapshots | components/SnapshotsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | Socle & contrat | /platform-contract | components/PlatformContractView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | connectors | /integrations/connectors | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | apis | /integrations/apis | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | webhooks | /integrations/webhooks | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | credentials | /integrations/credentials | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | sync | /integrations/sync | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | diagnostics | /integrations/diagnostics | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | specifications | /integrations/specifications | components/IntegrationsView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | deployment | /deployment | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | cockpit | /deployment/cockpit | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | releases | /deployment/releases | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | pipelines | /deployment/pipelines | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | promotion | /deployment/promotion | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | rollback | /deployment/rollback | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | diagnostics | /deployment/diagnostics | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |
| Plateforme | Paramètres | specifications | /deployment/specifications | components/deployment/DeploymentPublicationView.jsx | true | oui | Session IAM | non intégré | — | — | PARTIAL |

## Redirections conservées

| Ancienne route | Destination | Statut |
|---|---|---|
| /business | /business-manager | LEGACY_REDIRECT |
| /business/models | /business-manager/models | LEGACY_REDIRECT |
| /business/features | /business-manager/features | LEGACY_REDIRECT |
| /business/navigation | /business-manager/navigation | LEGACY_REDIRECT |
| /business/configuration | /business-manager/configuration | LEGACY_REDIRECT |
| /business/validation | /business-manager/validation | LEGACY_REDIRECT |
| /cockpit | /dashboard | LEGACY_REDIRECT |
| /workspace | /applications/workspace | LEGACY_REDIRECT |
| /config | /business-manager/configuration | LEGACY_REDIRECT |
| /validation | /business-manager/validation | LEGACY_REDIRECT |
| /automation/history | /automation/executions | LEGACY_REDIRECT |
| /overview | /packs | LEGACY_REDIRECT |
| /versions | /packs/versions | LEGACY_REDIRECT |
| /publication | /packs/publication | LEGACY_REDIRECT |
| /mapping | /erp/mappings | LEGACY_REDIRECT |
| /billing/overview | /billing | LEGACY_REDIRECT |
| /iam/organisations | /iam/organizations | LEGACY_REDIRECT |
| /iam/observability | /observability | LEGACY_REDIRECT |
| /iam/observability/monitoring | /observability/monitoring | LEGACY_REDIRECT |
| /iam/observability/logs | /observability/logs | LEGACY_REDIRECT |
| /iam/observability/audit | /observability/audit | LEGACY_REDIRECT |
| /iam/observability/security-events | /observability/security-events | LEGACY_REDIRECT |
| /iam/observability/alerts | /observability/alerts | LEGACY_REDIRECT |
| /integrations/cockpit | /settings/integrations | LEGACY_REDIRECT |
| /settings | /settings/erp | LEGACY_REDIRECT |
| /integrations | /settings/integrations | LEGACY_REDIRECT |
| / | /dashboard | LEGACY_REDIRECT |
| /iam | /iam/users | LEGACY_REDIRECT |
| /billing | /billing/plans | LEGACY_REDIRECT |
