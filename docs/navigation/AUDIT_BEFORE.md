# Audit avant modification

| MENU | CURRENT_ROUTE | TARGET_ROUTE | COMPONENT | COMPONENT_EXISTS | API | PERMISSION | ENTITLEMENT | ACTION |
|---|---|---|---|---|---|---|---|---|
| Dashboard | /cockpit | /dashboard | components/CockpitView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Packs | /overview | /packs | components/GeneralOverviewView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Applications | /applications | /applications | components/ApplicationsCatalogView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Configuration des packs | /workspace | /applications/workspace | components/WorkspaceConfigView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Versions | /versions | /packs/versions | components/VersionsDetailView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Validation / qualit? | /validation | /business/validation | components/PackValidationCockpitView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Publication | /publication | /packs/publication | components/PublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Historique | /history | /history | components/HistoryRollbackView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Sp?cifications | /specifications | /specifications | components/SpecificationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Environnements | /environments | /environments | components/EnvironmentsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Registre des contrats | /contracts | /contracts | components/ContractsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Configuration / metadata | /config | /business/configuration | components/ConfigurationView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Snapshots | /snapshots | /snapshots | components/SnapshotsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Socle & contrat | /platform-contract | /platform-contract | components/PlatformContractView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| integrations | /integrations | /settings/integrations | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| cockpit | /integrations/cockpit | /settings/integrations | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| connectors | /integrations/connectors | /integrations/connectors | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| apis | /integrations/apis | /integrations/apis | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| webhooks | /integrations/webhooks | /integrations/webhooks | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| credentials | /integrations/credentials | /integrations/credentials | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| sync | /integrations/sync | /integrations/sync | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| diagnostics | /integrations/diagnostics | /integrations/diagnostics | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| specifications | /integrations/specifications | /integrations/specifications | components/IntegrationsView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| deployment | /deployment | /deployment | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| cockpit | /deployment/cockpit | /deployment/cockpit | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| releases | /deployment/releases | /deployment/releases | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| pipelines | /deployment/pipelines | /deployment/pipelines | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| promotion | /deployment/promotion | /deployment/promotion | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| rollback | /deployment/rollback | /deployment/rollback | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| diagnostics | /deployment/diagnostics | /deployment/diagnostics | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| specifications | /deployment/specifications | /deployment/specifications | components/deployment/DeploymentPublicationView.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| users | /iam/users | /iam/users | pages/iam/UsersPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| sessions | /iam/sessions | /iam/sessions | pages/iam/SessionsPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| identities | /iam/identities | /iam/identities | pages/iam/IdentitiesPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| roles | /iam/roles | /iam/roles | pages/iam/RolesPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| policies | /iam/policies | /iam/policies | pages/iam/PoliciesPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| tenants | /iam/tenants | /iam/tenants | pages/iam/TenantsPage.jsx | true | ../../services/apiClient.js | iam:admin | non int?gr? | KEEP |
| observability | /iam/observability | /observability | pages/iam/observability/ObservabilityOverview.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| logs | /iam/observability/logs | /observability/logs | pages/iam/observability/LogsPage.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| audit | /iam/observability/audit | /observability/audit | pages/iam/observability/AuditPage.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| security-events | /iam/observability/security-events | /observability/security-events | pages/iam/observability/SecurityEventsPage.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| monitoring | /iam/observability/monitoring | /observability/monitoring | pages/iam/observability/MonitoringPage.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| alerts | /iam/observability/alerts | /observability/alerts | pages/iam/observability/AlertManagerPage.jsx | true | ../../../services/apiClient.js | iam:admin | non int?gr? | MOVE + REDIRECT |
| ERP Dashboard | /erp | /erp | pages/ERPDashboard.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| :moduleKey | /erp/:moduleKey | /erp/:moduleKey | pages/ErpModule.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| ERP Registry | /erps | /erps | pages/ERPList.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| create | /erps/create | /erps/create | pages/ERPCreate.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| :id | /erps/edit/:id | /erps/edit/:id | pages/ERPEdit.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| Data Runtime / Query | /data-runtime | /data-runtime | pages/DataRuntime.jsx | true | ../services/apiClient.js | data-runtime:read | non int?gr? | KEEP |
| history | /data-runtime/history | /data-runtime/history | pages/DataRuntimeHistory.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| Automations | /automation | /automation | pages/AutomationCockpit.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | KEEP |
| conditions | /automation/conditions | /automation/conditions | pages/AutomationConditions.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | KEEP |
| history | /automation/history | /automation/executions | pages/AutomationHistory.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | MOVE + REDIRECT |
| rules | /automation/rules | /automation/rules | pages/AutomationRules.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | KEEP |
| triggers | /automation/triggers | /automation/triggers | pages/AutomationTriggers.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | KEEP |
| workflows | /automation/workflows | /automation/workflows | pages/AutomationWorkflows.jsx | true | ../services/apiClient.js | automation:read | non int?gr? | KEEP |
| Adaptateurs ERP | /adapters | /adapters | pages/Adapters.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | KEEP |
| Mapping ERP | /mapping | /erp/mappings | pages/Mapping.jsx | true | Redux / aucune directe | erp:read | non int?gr? | MOVE + REDIRECT |
| Param?tres ERP | /settings | /settings/erp | pages/Settings.jsx | true | ../services/apiClient.js | erp:read | non int?gr? | MOVE + REDIRECT |
| Overview | /billing/overview | /billing | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | MOVE + REDIRECT |
| Plans | /billing/plans | /billing/plans | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Subscriptions | /billing/subscriptions | /billing/subscriptions | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Invoices | /billing/invoices | /billing/invoices | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Payments | /billing/payments | /billing/payments | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Webhooks | /billing/webhooks | /billing/webhooks | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Entitlements / Quotas | /billing/entitlements | /billing/entitlements | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Access Rules | /billing/access-rules | /billing/access-rules | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Features | /billing/features | /billing/features | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| Organisations | /iam/organisations | /iam/organizations | pages/DemoPage.jsx | true | Redux / aucune directe | iam:admin | non int?gr? | MOVE + REDIRECT |
| Contextes | /iam/contexts | /iam/contexts | pages/DemoPage.jsx | true | Redux / aucune directe | iam:admin | non int?gr? | KEEP |
| Liaisons ERP | /iam/identity-links | /iam/identity-links | pages/DemoPage.jsx | true | Redux / aucune directe | iam:admin | non int?gr? | KEEP |
| Groupes | /iam/identity-groups | /iam/identity-groups | pages/DemoPage.jsx | true | Redux / aucune directe | iam:admin | non int?gr? | KEEP |
| Administration (maquette) | /iam/admin | /iam/admin | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
| undefined | /demo/iam/:demoId | /demo/iam/:demoId | pages/DemoPage.jsx | true | Redux / aucune directe | auth | non int?gr? | KEEP |
