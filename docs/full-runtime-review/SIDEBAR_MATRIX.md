# Sidebar — 92 destinations configurées

Source : navigationConfig.js + MODULES. Source de navigation unique; visibilité personnalisée non validée car login bloqué. Les préfixes API indiquent un groupe à inspecter, pas une correspondance univoque ni un appel réellement observé. Aucune page connectée classée REAL_PASS.

| SECTION | MENU | ROUTE | COMPONENT | API | CONSOLE_ERROR | STATUS | REAL_TEST |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | Dashboard | /cockpit | CockpitRoute | /api/platform/dashboard | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| packs | Packs | /overview | OverviewRoute | Redux / platform APIs; publication NO_OP | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| business | Applications | /applications | ApplicationsRoute | /api/platform/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| packs | Configuration des packs | /workspace | WorkspaceConfigView | Redux / platform APIs; publication NO_OP | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| packs | Versions | /versions | VersionsDetailView | Redux / platform APIs; publication NO_OP | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| business | Validation / qualit? | /validation | ValidationRoute | /api/platform/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| packs | Publication | /publication | PublicationView | Redux / platform APIs; publication NO_OP | 0 pageerror (anonymous only) | MOCK_ONLY | AUTH_REDIRECT_ONLY |
| packs | Historique | /history | HistoryRollbackView | Redux / platform APIs; publication NO_OP | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Sp?cifications | /specifications | SpecificationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Environnements | /environments | EnvironmentsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Registre des contrats | /contracts | ContractsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| business | Configuration / metadata | /config | ConfigurationView | /api/platform/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Snapshots | /snapshots | SnapshotsRoute | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Socle & contrat | /platform-contract | PlatformContractView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | cockpit | /integrations/cockpit | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | connectors | /integrations/connectors | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | apis | /integrations/apis | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | webhooks | /integrations/webhooks | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | credentials | /integrations/credentials | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | sync | /integrations/sync | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | diagnostics | /integrations/diagnostics | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | specifications | /integrations/specifications | IntegrationsView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | cockpit | /deployment/cockpit | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | releases | /deployment/releases | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | pipelines | /deployment/pipelines | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | promotion | /deployment/promotion | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | rollback | /deployment/rollback | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | diagnostics | /deployment/diagnostics | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | specifications | /deployment/specifications | DeploymentPublicationView | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | users | /iam/users | IamUsersPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | sessions | /iam/sessions | SessionsPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | identities | /iam/identities | IdentitiesPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | roles | /iam/roles | RolesPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | policies | /iam/policies | PoliciesPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| iam | tenants | /iam/tenants | TenantsPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | observability | /iam/observability | ObservabilityOverview | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | logs | /iam/observability/logs | LogsPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | audit | /iam/observability/audit | AuditPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | security-events | /iam/observability/security-events | SecurityEventsPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | monitoring | /iam/observability/monitoring | MonitoringPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| observability | alerts | /iam/observability/alerts | AlertManagerPage | /api/iam/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | ERP Dashboard | /erp | ERPDashboard | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | ERP Registry | /erps | ERPList | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | Data Runtime / Query | /data-runtime | DataRuntime | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | history | /data-runtime/history | DataRuntimeHistory | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | Automations | /automation | AutomationCockpit | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | conditions | /automation/conditions | AutomationConditions | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | history | /automation/history | AutomationHistory | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | rules | /automation/rules | AutomationRules | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | triggers | /automation/triggers | AutomationTriggers | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| automation | workflows | /automation/workflows | AutomationWorkflows | /api/automation/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | Adaptateurs ERP | /adapters | Adapters | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | Mapping ERP | /mapping | Mapping | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| platform | Param?tres ERP | /settings | Settings | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| billing | Overview | /billing/overview | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Plans | /billing/plans | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Subscriptions | /billing/subscriptions | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Invoices | /billing/invoices | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Payments | /billing/payments | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Webhooks | /billing/webhooks | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Entitlements / Quotas | /billing/entitlements | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Access Rules | /billing/access-rules | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| billing | Features | /billing/features | DemoPage | DemoPage; no canonical live UI | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| iam | Organisations | /iam/organisations | DemoPage | /api/iam/* | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| iam | Contextes | /iam/contexts | DemoPage | /api/iam/* | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| iam | Liaisons ERP | /iam/identity-links | DemoPage | /api/iam/* | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| iam | Groupes | /iam/identity-groups | DemoPage | /api/iam/* | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| platform | Administration (maquette) | /iam/admin | DemoPage | /api/platform/*, /api/integrations/*, /api/deployment* | 0 pageerror (anonymous only) | PLACEHOLDER | AUTH_REDIRECT_ONLY |
| erp | clients | /erp/clients | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | products | /erp/products | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | product-variants | /erp/product-variants | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | services | /erp/services | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | orders | /erp/orders | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | quotes | /erp/quotes | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | invoices | /erp/invoices | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | payments | /erp/payments | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | suppliers | /erp/suppliers | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | warehouses | /erp/warehouses | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | shipments | /erp/shipments | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | documents | /erp/documents | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | purchases | /erp/purchases | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | stock-movements | /erp/stock-movements | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | stock-transfers | /erp/stock-transfers | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | inventories | /erp/inventories | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | stock-alerts | /erp/stock-alerts | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | returns | /erp/returns | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | promotions | /erp/promotions | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | cash-registers | /erp/cash-registers | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | expenses | /erp/expenses | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | reservations | /erp/reservations | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | projects | /erp/projects | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
| erp | agenda | /erp/agenda | ErpModule | /api/erp*, /api/data-runtime/* | 0 pageerror (anonymous only) | PARTIAL | AUTH_REDIRECT_ONLY |
