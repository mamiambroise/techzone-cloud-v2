import { matchPath } from "react-router-dom";
import { canAccess } from "./navigationAccess.js";
import { ROUTES } from "./routes.js";
import { navigationSections, navigationGroups, navigationItems } from "./navigationMenu.js";
import { plannedPages } from "./plannedPages.js";
export { navigationSections, navigationGroups };

export const pageDefinitions = [
  { ...{"id":"admin","group":"admin","label":"Administration (maquette)","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"admin-overviewpage","permission":null}, route: ROUTES["admin"] },
  { ...{"id":"demo","group":"admin","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","permission":null}, route: ROUTES["demo"] },
  { ...{"component":"CockpitRoute","id":"dashboard","label":"Tableau de bord","group":"dashboard","status":"PARTIAL","menu":true,"moduleId":"01","tab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["dashboard"] },
  { ...{"component":"ApplicationsRoute","id":"applications","label":"Applications","group":"applications","status":"PARTIAL","menu":true,"moduleId":"01","tab":"applications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applications"] },
  { ...{"component":"NewApplicationRoute","id":"applicationNew","label":"Nouvelle application","group":"applications","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationNew"] },
  { ...{"component":"ApplicationDetailRoute","id":"applicationDetail","label":"Détail application","group":"applications","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationDetail"] },
  { ...{"component":"WorkspaceConfigView","id":"applicationWorkspace","label":"Configuration application","group":"applications","status":"PARTIAL","menu":true,"moduleId":"01","tab":"workspace","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationWorkspace"] },
  { ...{"component":"BMApplicationsRoute","id":"bm","label":"Applications","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bm"] },
  { ...{"component":"BMApplicationsRoute","id":"bmApplications","label":"Applications","group":"bm","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplications"] },
  { ...{"id":"bmVersionsIndex","group":"bm","label":"Versions","component":"BMVersionsRoute","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE"}, route: ROUTES["bmVersionsIndex"] },
  { ...{"id":"bmModels","group":"bm","label":"Modèles de données","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Entités, champs, relations et contraintes de la version sélectionnée."}, route: ROUTES["bmModels"] },
  { ...{"id":"bmFeaturesIndex","group":"bm","label":"Fonctionnalités","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Features, capacités et dépendances de la version sélectionnée."}, route: ROUTES["bmFeaturesIndex"] },
  { ...{"id":"bmNavigationIndex","group":"bm","label":"Navigation","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Menus et éléments de navigation de la version sélectionnée."}, route: ROUTES["bmNavigationIndex"] },
  { ...{"component":"ConfigurationView","id":"bmConfiguration","label":"Configuration","group":"bm","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"tab":"config"}, route: ROUTES["bmConfiguration"] },
  { ...{"id":"bmRuntimeIndex","group":"bm","label":"Intégration & Runtime","component":"ComingSoon","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","description":"La liaison entre les contrats des applications et leurs fournisseurs sera intégrée avec le Runtime Bridge."}, route: ROUTES["bmRuntimeIndex"] },
  { ...{"id":"bmQuality","group":"bm","label":"Validation","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","tab":"validation"}, route: ROUTES["bmQuality"] },
  { ...{"component":"BMApplicationNewRoute","id":"bmApplicationNew","label":"Nouvelle application","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplicationNew"] },
  { ...{"component":"BMVersionsRoute","id":"bmVersions","label":"Versions","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmVersions"] },
  { ...{"id":"bmDataModel","label":"Modèles de données","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":4,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmDataModel"] },
  { ...{"id":"bmFeatures","label":"Fonctionnalités","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":5,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmFeatures"] },
  { ...{"id":"bmNavigation","label":"Navigation","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":6,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmNavigation"] },
  { ...{"id":"bmRuntime","label":"Runtime","group":"bm","menu":false,"protected":true,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","implemented":false,"phase":8,"component":"ComingSoon","versionSection":true}, route: ROUTES["bmRuntime"] },
  { ...{"id":"bmValidation","label":"Validation","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmValidation"] },
  { ...{"component":"BMApplicationDetailRoute","id":"bmApplicationDetail","label":"Détail application","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplicationDetail"] },
  { ...{"component":"BMWorkspaceRoute","id":"bmVersionDetail","label":"Version détaillée","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmVersionDetail"] },
  { ...{"id":"ui","group":"ui","label":"Pages","component":"UiPagesManager","menu":false,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"permission":"ui-builder:read","description":"Accès direct aux pages de l’application sélectionnée."}, route: ROUTES["ui"] },
  { ...{"id":"uiPages","group":"ui","label":"Pages","component":"UiPagesManager","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Gestion des pages de l’application dans le UI Builder."}, route: ROUTES["uiPages"] },
  { ...{"id":"uiBuilder","group":"ui","label":"Éditeur visuel","component":"UiVisualEditor","menu":false,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"permission":"ui-builder:read","description":"Édition visuelle et configuration des pages de l’application."}, route: ROUTES["uiBuilder"] },
  { ...{"id":"uiForms","group":"ui","label":"Formulaires","component":"UiFormsBuilder","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Création et configuration des formulaires dans le UI Builder."}, route: ROUTES["uiForms"] },
  { ...{"id":"uiComponents","group":"ui","label":"Composants","component":"UiComponentsCatalog","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Catalogue des composants disponibles dans le UI Builder."}, route: ROUTES["uiComponents"] },
  { ...{"id":"uiThemes","group":"ui","label":"Thèmes","component":"UiThemeBuilder","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Personnalisation des styles et thèmes des applications."}, route: ROUTES["uiThemes"] },
  { ...{"id":"uiPreview","group":"ui","label":"Prévisualisation","component":"UiPreviewValidation","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Aperçu et validation des pages du UI Builder."}, route: ROUTES["uiPreview"] },
  { ...{"id":"uiPage","group":"ui","label":"Détail page","component":"ComingSoon","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","permission":"ui-builder:read","description":"Le détail d’une page UI Builder sera disponible lorsque les pages de l’application seront configurables."}, route: ROUTES["uiPage"] },
  { ...{"component":"AutomationCockpit","id":"automation","label":"Vue d’ensemble","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automation"] },
  { ...{"component":"AutomationRules","id":"automationRules","label":"Règles","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationRules"] },
  { ...{"id":"automationFormulas","group":"automation","label":"Formules","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"permission":"automation:read","description":"L’éditeur de formules et leur évaluation ne sont pas encore intégrés à la console."}, route: ROUTES["automationFormulas"] },
  { ...{"component":"AutomationWorkflows","id":"automationWorkflows","label":"Workflows","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationWorkflows"] },
  { ...{"component":"AutomationTriggers","id":"automationTriggers","label":"Déclencheurs","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationTriggers"] },
  { ...{"id":"automationActions","group":"automation","label":"Actions","component":"AutomationActions","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"permission":"automation:read"}, route: ROUTES["automationActions"] },
  { ...{"id":"automationSchedules","group":"automation","label":"Planifications","component":"AutomationSchedules","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"permission":"automation:read"}, route: ROUTES["automationSchedules"] },
  { ...{"component":"AutomationHistory","id":"automationExecutions","label":"Exécutions","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationExecutions"] },
  { ...{"component":"AutomationConditions","id":"automation-conditions","label":"conditions","group":"automation","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read"}, route: ROUTES["automation-conditions"] },
  { ...{"component":"OverviewRoute","id":"packs","label":"Mes Packs","group":"packs","status":"PARTIAL","menu":true,"moduleId":"01","tab":"overview","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["packs"] },
  { ...{"component":"ValidationRoute","id":"packValidation","label":"Validation & Manifest","group":"packs","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["packValidation"] },
  { ...{"id":"pmpacks","group":"packs","label":"Packs","component":"PackManagerPage","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"pack.read"}, route: ROUTES["packManager"] },
  { ...{"id":"packRegistry","group":"packs","label":"Registry","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"Le catalogue central de packs publiés n’est pas encore intégré."}, route: ROUTES["packRegistry"] },
  { ...{"component":"VersionsDetailView","id":"packVersions","label":"Versions","group":"packs","status":"PARTIAL","menu":true,"moduleId":"01","tab":"versions","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["packVersions"] },
  { ...{"id":"packDependencies","group":"packs","label":"Dépendances","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"L’inspection et la résolution des dépendances des packs seront disponibles dans une prochaine phase."}, route: ROUTES["packDependencies"] },
  { ...{"component":"PublicationView","id":"packPublication","label":"Publication","group":"packs","status":"PARTIAL","menu":true,"moduleId":"01","tab":"publication","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["packPublication"] },
  { ...{"id":"packRuntime","group":"packs","label":"Pack Runtime","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"L’exécution et le suivi des packs nécessitent le futur moteur Pack Runtime."}, route: ROUTES["packRuntime"] },
  { ...{"component":"HistoryRollbackView","id":"history","label":"Historique","group":"packs","status":"PARTIAL","menu":false,"moduleId":"01","tab":"history","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["history"] },
  { ...{"id":"registry","group":"registry","label":"Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read","description":"Vue d’ensemble du registre transversal réel : entrées, fournisseurs, schémas et diagnostics."}, route: ROUTES["registry"] },
  { ...{"id":"registrySources","group":"registry","label":"Sources Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registrySources"] },
  { ...{"id":"registryEntries","group":"registry","label":"Entrées Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryEntries"] },
  { ...{"id":"registryEntryDetail","group":"registry","label":"Détail d’entrée Registry","component":"RegistryPage","menu":false,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryEntryDetail"] },
  { ...{"id":"registryVersions","group":"registry","label":"Versions Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryVersions"] },
  { ...{"id":"registryCapabilities","group":"registry","label":"Capacités Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryCapabilities"] },
  { ...{"id":"registryProviders","group":"registry","label":"Providers Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryProviders"] },
  { ...{"id":"registrySchemas","group":"registry","label":"Schémas Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registrySchemas"] },
  { ...{"id":"registryCompatibility","group":"registry","label":"Compatibilité Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.compatibility.read"}, route: ROUTES["registryCompatibility"] },
  { ...{"id":"registryAvailability","group":"registry","label":"Disponibilité Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.availability.read"}, route: ROUTES["registryAvailability"] },
  { ...{"id":"registryDiagnostics","group":"registry","label":"Diagnostics Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.diagnostics.read"}, route: ROUTES["registryDiagnostics"] },
  { ...{"id":"registryAudit","group":"registry","label":"Audit Registry","component":"RegistryPage","menu":true,"protected":true,"implemented":true,"status":"REAL","permission":"registry.read"}, route: ROUTES["registryAudit"] },
  { ...{"id":"runtime","group":"runtime","label":"Runtime","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"Le moteur d’exécution des applications et la liaison runtime ne sont pas encore intégrés."}, route: ROUTES["runtime"] },
  { ...{"component":"ERPDashboard","id":"erp","label":"ERP Dashboard","group":"erp","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erp"] },
  { ...{"id":"erpResources","group":"erp","label":"Ressources","component":"ErpResourcesNav","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erpResources"] },
  { ...{"id":"erpRegistry","group":"erp","label":"Registre ERP","component":"ERPList","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erpRegistry"] },
  { ...{"id":"erp-clients","group":"erp","label":"Clients","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"clients"}, route: ROUTES["erp-clients"] },
  { ...{"id":"erp-products","group":"erp","label":"Produits","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"products"}, route: ROUTES["erp-products"] },
  { ...{"id":"erp-orders","group":"erp","label":"Commandes","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"orders"}, route: ROUTES["erp-orders"] },
  { ...{"id":"erp-invoices","group":"erp","label":"Factures","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"invoices"}, route: ROUTES["erp-invoices"] },
  { ...{"id":"erp-stocks","group":"erp","label":"Stocks","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"stock-movements"}, route: ROUTES["erp-stocks"] },
  { ...{"component":"Mapping","id":"erpMapping","label":"Entity Mapping","group":"erp","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erpMapping"] },
  { ...{"component":"DataRuntime","id":"dataRuntime","label":"Data Runtime","group":"data","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"data-runtime:read"}, route: ROUTES["dataRuntime"] },
  { ...{"component":"ErpModule","id":"erp-:moduleKey","label":":moduleKey","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erp-:moduleKey"] },
  { ...{"component":"ERPCreate","id":"erps-create","label":"create","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erps-create"] },
  { ...{"component":"ERPEdit","id":"erps-edit-:id","label":":id","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erps-edit-:id"] },
  { ...{"component":"DataRuntimeHistory","id":"data-runtime-history","label":"Historique","group":"data","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"data-runtime:read"}, route: ROUTES["data-runtime-history"] },
  { ...{"component":"Adapters","id":"adapters","label":"Adaptateurs ERP","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["adapters"] },
  { ...{"id":"dataQuery","group":"data","label":"Requêtes","component":null,"menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","redirectTo":"/data-runtime#query","permission":"data-runtime:query"}, route: ROUTES["dataQuery"] },
  { ...{"id":"billingOverview","group":"billing","label":"Mon abonnement","component":"BillingOverviewPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:read"}, route: ROUTES["billingOverview"] },
  { ...{"component":"BillingPlansPage","id":"billingPlans","label":"Plans","group":"billing","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"billing:read"}, route: ROUTES["billingPlans"] },
  { ...{"component":"BillingSubscriptionsPage","id":"billingSubscriptions","label":"Abonnements","group":"billing","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"billing:read"}, route: ROUTES["billingSubscriptions"] },
  { ...{"id":"billingEntitlements","group":"billing","label":"Entitlements","component":"BillingEntitlementsPage","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:read"}, route: ROUTES["billingEntitlements"] },
  { ...{"id":"billingQuotas","group":"billing","label":"Utilisation","component":"BillingUsagePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:usage:read"}, route: ROUTES["billingQuotas"] },
  { ...{"id":"billingInvoices","group":"billing","label":"Factures & paiements","component":"BillingInvoicesPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:invoice:read"}, route: ROUTES["billingInvoices"] },
  { ...{"id":"billingSettings","group":"billing","label":"Paramètres","component":"BillingSettingsPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","permission":"billing:read"}, route: ROUTES["billingSettings"] },
  { ...{"id":"billing-payments","group":"billing","label":"Payments","component":"BillingPaymentsPage","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:payment:read"}, route: ROUTES["billing-payments"] },
  { ...{"id":"billing-webhooks","group":"billing","label":"Webhooks","component":"BillingWebhooksPage","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:diagnostic:read"}, route: ROUTES["billing-webhooks"] },
  { ...{"id":"billing-admin","group":"billing","label":"Billing Admin","component":"BillingAdminPage","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","permission":"billing:subscription:read"}, route: ROUTES["billing-admin"] },
  { ...{"id":"billingAdminCatalog","group":"billing","label":"Offres & tarifs","component":"BillingAdminPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","permission":"billing:plan:read"}, route: ROUTES["billingAdminCatalog"] },
  { ...{"id":"billingAdminSubscriptions","group":"billing","label":"Abonnements clients","component":"BillingAdminPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","permission":"billing:subscription:read"}, route: ROUTES["billingAdminSubscriptions"] },
  { ...{"id":"billingAdminOperations","group":"billing","label":"Opérations financières","component":"BillingAdminPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","permissions":["billing:invoice:read","billing:payment:read"]}, route: ROUTES["billingAdminOperations"] },
  { ...{"id":"billingAdminDiagnostics","group":"billing","label":"Diagnostics & audit","component":"BillingAdminPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","permissions":["billing:diagnostic:read","billing:read"]}, route: ROUTES["billingAdminDiagnostics"] },
  { ...{"id":"billing-access-rules","group":"billing","label":"Access Rules","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-accessrulespage","permission":null}, route: ROUTES["billing-access-rules"] },
  { ...{"id":"billing-features","group":"billing","label":"Features","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-featurespage","permission":null}, route: ROUTES["billing-features"] },
  { ...{"component":"IamUsersPage","id":"iam-users","label":"Utilisateurs","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-users"] },
  { ...{"component":"IdentitiesPage","id":"iam-identities","label":"Identités","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-identities"] },
  { ...{"component":"TenantsPage","id":"iam-tenants","label":"Tenants","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-tenants"] },
  { ...{"component":"RolesPage","id":"iam-roles","label":"Rôles","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-roles"] },
  { ...{"component":"PoliciesPage","id":"iam-policies","label":"Politiques","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-policies"] },
  { ...{"component":"SessionsPage","id":"iam-sessions","label":"Sessions","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-sessions"] },
  { ...{"id":"iam-organizations","group":"iam","label":"Organisations / Sites","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","permission":"iam:admin"}, route: ROUTES["iam-organizations"] },
  { ...{"id":"iam-devices","group":"iam","label":"Appareils","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","permission":"iam:admin"}, route: ROUTES["iam-devices"] },
  { ...{"id":"iam-contexts","group":"iam","label":"Contextes","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"contexts-contextspage","permission":"iam:admin"}, route: ROUTES["iam-contexts"] },
  { ...{"id":"iam-identity-links","group":"iam","label":"Liaisons ERP","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"identitylinks-identitylinkspage","permission":"iam:admin"}, route: ROUTES["iam-identity-links"] },
  { ...{"id":"iam-identity-groups","group":"iam","label":"Groupes","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"identitygroups-identitygroupspage","permission":"iam:admin"}, route: ROUTES["iam-identity-groups"] },
  { ...{"component":"ObservabilityOverview","id":"observability","label":"Vue d’ensemble","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability"] },
  { ...{"component":"MonitoringPage","id":"observability-monitoring","label":"Monitoring","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-monitoring"] },
  { ...{"component":"LogsPage","id":"observability-logs","label":"Logs","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-logs"] },
  { ...{"component":"AuditPage","id":"observability-audit","label":"Audit","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-audit"] },
  { ...{"component":"SecurityEventsPage","id":"observability-security-events","label":"Événements de sécurité","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-security-events"] },
  { ...{"component":"AlertManagerPage","id":"observability-alerts","label":"Alertes","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-alerts"] },
  { ...{"component":"ObservabilityDataPage","id":"observability-metrics","pageId":"observability-metrics","label":"Métriques","group":"observability","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-metrics"] },
  { ...{"component":"ObservabilityDataPage","id":"observability-incidents","pageId":"observability-incidents","label":"Incidents","group":"observability","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-incidents"] },
  { ...{"component":"ObservabilityDataPage","id":"observability-diagnostics","pageId":"observability-diagnostics","label":"Diagnostics","group":"observability","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-diagnostics"] },
  { ...{"component":"ObservabilitySettingsPage","id":"observability-settings","label":"Paramètres d’observabilité","group":"observability","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-settings"] },
  { ...{"id":"settingsGeneral","group":"admin","label":"Paramètres généraux","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"Les préférences générales de la plateforme ne disposent pas encore d’un écran dédié."}, route: ROUTES["settingsGeneral"] },
  { ...{"component":"IntegrationsView","id":"settingsIntegrations","label":"Intégrations","group":"api","status":"PARTIAL","menu":true,"moduleId":"api-layer","tab":"integrations","integrationTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["settingsIntegrations"] },
  { ...{"component":"Settings","id":"settingsErp","label":"Configuration ERP","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["settingsErp"] },
  { ...{"id":"settingsSecurity","group":"iam","label":"Sécurité","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"La configuration des options de sécurité ne dispose pas encore d’un écran dédié."}, route: ROUTES["settingsSecurity"] },
  { ...{"id":"settingsProfile","group":"admin","label":"Profil","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"La modification du profil utilisateur sera intégrée à la console dans une prochaine phase."}, route: ROUTES["settingsProfile"] },
  { ...{"component":"SpecificationsView","id":"specifications","label":"Spécifications","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["specifications"] },
  { ...{"component":"EnvironmentsView","id":"environments","label":"Environnements","group":"environments","status":"PARTIAL","menu":true,"moduleId":"01","tab":"environments","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["environments"] },
  { ...{"component":"ContractsView","id":"contracts","label":"Registre des contrats","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"contracts","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["contracts"] },
  { ...{"component":"SnapshotsRoute","id":"snapshots","label":"Snapshots","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"snapshots","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["snapshots"] },
  { ...{"component":"PlatformContractView","id":"platform-contract","label":"Socle & contrat","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"platform-contract","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["platform-contract"] },
  { ...{"component":"IntegrationsView","id":"integrations-connectors","label":"connectors","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"connectors","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-connectors"] },
  { ...{"component":"IntegrationsView","id":"integrations-apis","label":"apis","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"apis","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-apis"] },
  { ...{"component":"IntegrationsView","id":"integrations-webhooks","label":"webhooks","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"webhooks","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-webhooks"] },
  { ...{"component":"IntegrationsView","id":"integrations-credentials","label":"credentials","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"credentials","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-credentials"] },
  { ...{"component":"IntegrationsView","id":"integrations-sync","label":"sync","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"sync","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-sync"] },
  { ...{"component":"IntegrationsView","id":"integrations-diagnostics","label":"diagnostics","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"diagnostics","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-diagnostics"] },
  { ...{"component":"IntegrationsView","id":"integrations-specifications","label":"specifications","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["integrations-specifications"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment","label":"Vue d’ensemble","group":"environments","status":"PARTIAL","menu":true,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-cockpit","label":"cockpit","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-cockpit"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-releases","label":"releases","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"releases","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-releases"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-pipelines","label":"pipelines","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"pipelines","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-pipelines"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-promotion","label":"promotion","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"promotions","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-promotion"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-rollback","label":"rollback","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"rollback","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-rollback"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-diagnostics","label":"diagnostics","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"diagnostics","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-diagnostics"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-specifications","label":"specifications","group":"environments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-specifications"] },
    ...plannedPages,
];

const groupPermissions = {
  ui: "ui-builder:read",
  automation: "automation:read",
  packs: "pack.read",
  runtime: "runtime.resolution.read",
  data: "data-runtime:read",
  erp: "erp:read",
};
const integrationPermissions = {
  settingsIntegrations: "integration:read",
  "integrations-connectors": "integration:read",
  "integrations-apis": "integration:read",
  "integrations-webhooks": "integration:read",
  "integrations-credentials": "integration:credential:read",
  "integrations-sync": "integration:read",
  "integrations-diagnostics": "integration:diagnostic:read",
  "integrations-specifications": "integration:read",
};

pageDefinitions.forEach((page) => {
  if (page.id === "uiNavigation") {
    page.component = "UiNavigationPresentation";
    page.implemented = true;
    page.status = "PARTIAL";
    page.classification = "NEW_PAGE";
  }
  page.permission ??= integrationPermissions[page.id] ?? groupPermissions[page.group];
  if (page.component === "ComingSoon" && !page.description) {
    page.description = `La destination « ${page.label ?? page.id} » sera disponible dans une prochaine version.`;
  }
});

export const routeDefinitions = pageDefinitions.filter((r) => r.component);

export const legacyRedirects = [
  { from: "/business", to: "/business-manager" },
  { from: "/business/models", to: "/business-manager/models" },
  { from: "/business/features", to: "/business-manager/features" },
  { from: "/business/navigation", to: "/business-manager/navigation" },
  { from: "/business/configuration", to: "/business-manager/configuration" },
  { from: "/business/validation", to: "/business-manager/validation" },
  { from: "/cockpit", to: "/dashboard" },
  { from: "/workspace", to: "/applications/workspace" },
  { from: "/config", to: "/business-manager/configuration" },
  { from: "/validation", to: "/business-manager/validation" },
  { from: "/automation/history", to: "/automation/executions" },
  { from: "/overview", to: "/packs" },
  { from: "/versions", to: "/packs/versions" },
  { from: "/publication", to: "/packs/publication" },
  { from: "/mapping", to: "/erp/mappings" },
  { from: "/packs/manager", to: "/packs/packs" },
  { from: "/packs/runtime", to: "/runtime" },
  { from: "/data", to: "/data-runtime" },
  { from: "/iam/organisations", to: "/iam/organizations" },
  { from: "/iam/observability", to: "/observability" },
  { from: "/iam/observability/monitoring", to: "/observability/monitoring" },
  { from: "/iam/observability/logs", to: "/observability/logs" },
  { from: "/iam/observability/audit", to: "/observability/audit" },
  { from: "/iam/observability/security-events", to: "/observability/security-events" },
  { from: "/iam/observability/alerts", to: "/observability/alerts" },
  { from: "/integrations/cockpit", to: "/settings/integrations" },
  { from: "/settings", to: "/settings/erp" },
  { from: "/integrations", to: "/settings/integrations" },
  { from: "/", to: "/dashboard" },
  { from: "/iam", to: "/iam/users" },
  { from: "/billing", to: "/billing/overview" },
];

export const redirects = [
  ...legacyRedirects,
  ...pageDefinitions.filter((r) => r.redirectTo).map((r) => ({ from: r.route, to: r.redirectTo })),
];

const pagesById = new Map(pageDefinitions.map((p) => [p.id, p]));

if (import.meta.env?.DEV && pagesById.size !== pageDefinitions.length) {
  console.warn("[navigation] ids de page en double dans pageDefinitions");
}

const routeOrder = pageDefinitions
  .filter((p) => typeof p.route === "string")
  .sort((a, b) => Number(a.route.includes(":")) - Number(b.route.includes(":")) || b.route.length - a.route.length);

const entriesByGroup = new Map();
const entryByPageId = new Map();

navigationGroups.forEach((g) => {
  const entries = (navigationItems[g.id] ?? []).flatMap(
    ({ aliases = [], pageId, route, ...overrides }) => {
    const page = pagesById.get(pageId ?? overrides.id);
    if (!page) {
      if (import.meta.env?.DEV) console.warn(`[navigation] page introuvable : "${overrides.id}" (groupe ${g.id})`);
      return [];
    }
    const entry = {
      ...page,
      ...overrides,
      ...(route ? { route } : {}),
      permission: page.permission ?? overrides.permission,
      group: g.id,
      menu: true,
    };
    entryByPageId.set(page.id, entry);
    aliases.forEach((alias) => entryByPageId.set(alias, entry));
    return [entry];
    },
  );
  entriesByGroup.set(g.id, entries);
});

export const navigationEntries = [...entriesByGroup.values()].flat();

export const resolveRoute = (pathname) => {
  const path = pathname?.split(/[?#]/, 1)[0] || "/";
  return routeOrder.find((r) => matchPath({ path: r.route, end: true }, path));
};

const resolveActiveRoute = (pathname) =>
  resolveRoute(pathname) ??
  routeOrder.find((r) => r.route !== "/" && matchPath({ path: r.route, end: false }, pathname));

export function activeNavigation(pathname) {
  const page = resolveActiveRoute(pathname);
  if (!page) return undefined;
  const entry = entryByPageId.get(page.id) ?? page;
  return page.id === "bm"
    ? (entryByPageId.get("bmApplications") ?? entry)
    : page.id === "erps-create" || page.id === "erps-edit-:id"
    ? { ...entry, id: "erpRegistry" }
    : entry;
}

export const groupEntries = (id) => entriesByGroup.get(id) ?? [];

export const groupDestination = (id) => groupEntries(id).find((r) => r.component || r.redirectTo)?.route;

export const routeForTab = (tab) =>
  pageDefinitions.find((r) => r.tab === (tab === "contract-v1" ? "platform-contract" : tab))?.route;

export function navigationStatus(context = {}) {
  if (context.loading) return "loading";
  return context.error || !context.tenantId ? "fallback" : "ready";
}

export function effectiveNavigation(user, context = {}) {
  const status = navigationStatus(context);
  if (status === "loading") {
    const dashboard = navigationGroups.find((group) => group.id === "dashboard");
    return dashboard
      ? [{ ...dashboard, entries: groupEntries("dashboard").filter((entry) => canAccess(entry, user)) }]
      : [];
  }
  return navigationGroups
    .filter((g) => !g.hidden && (status === "ready" || g.id === "dashboard"))
    .map((g) => {
      const entries = groupEntries(g.id);
      const permissions = entries
        .map((entry) => entry.permission)
        .filter(Boolean);
      const uniformPermission = permissions.length > 0 && permissions.every((permission) => permission === permissions[0]);
      const visibleEntries = uniformPermission && canAccess({ permission: permissions[0] }, user)
        ? entries
        : entries.filter((entry) => canAccess(entry, user));
      return { ...g, entries: visibleEntries };
    })
    .filter((g) => g.entries.length);
}
