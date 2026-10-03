import { canAccess } from './navigationAccess.js';
import { matchPath } from 'react-router-dom';
import { ROUTES } from './routes.js';
export const navigationSections = [{id:'accueil',label:'ACCUEIL'}, {id:'construction',label:'CONSTRUCTION'}, {id:'execution',label:'EXÉCUTION'}, {id:'integrations',label:'DONNÉES & INTÉGRATIONS'}, {id:'platform',label:'PLATEFORME'}];
export const navigationGroups = [
  {id:'registry',label:'Registry',section:'platform',icon:'Layers'},
  {
    "id": "dashboard",
    "label": "Tableau de bord",
    "section": "accueil",
    "icon": "LayoutDashboard"
  },
  {
    "id": "applications",
    "hidden": true,
    "label": "Applications",
    "section": "construction",
    "icon": "AppWindow"
  },
  {
    "id": "bm",
    "label": "Business Manager",
    "section": "construction",
    "icon": "BriefcaseBusiness"
  },
  {
    "id": "ui",
    "label": "UI Builder",
    "section": "construction",
    "icon": "PanelsTopLeft"
  },
  {
    "id": "automation",
    "label": "Automatisation",
    "section": "construction",
    "icon": "Workflow"
  },
  {
    "id": "packs",
    "label": "Pack Manager",
    "section": "construction",
    "icon": "Package"
  },
  {
    "id": "runtime",
    "label": "Runtime",
    "section": "execution",
    "icon": "Play"
  },
  {
    "id": "data",
    "label": "Données",
    "section": "integrations",
    "icon": "Database"
  },
  {
    "id": "erp",
    "label": "ERP / Dolibarr",
    "section": "integrations",
    "icon": "Building"
  },
  {
    "id": "api",
    "label": "API & Intégrations",
    "section": "integrations",
    "icon": "Plug"
  },
  {
    "id": "environments",
    "label": "Environnements",
    "section": "platform",
    "icon": "Server"
  },
  {
    "id": "deployments",
    "label": "Déploiements",
    "section": "platform",
    "icon": "Rocket"
  },
  {
    "id": "iam",
    "label": "Sécurité & IAM",
    "section": "platform",
    "icon": "ShieldCheck"
  },
  {
    "id": "observability",
    "label": "Observabilité",
    "section": "platform",
    "icon": "Activity"
  },
  {
    "id": "billing",
    "label": "Abonnements",
    "section": "platform",
    "icon": "CreditCard"
  },
  {
    "id": "admin",
    "label": "Administration",
    "section": "platform",
    "icon": "Settings"
  }
];
export const pageDefinitions = [
  { ...{"id":"erpRegistry","group":"erp","label":"Registre des ERP","component":"ERPList","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erpRegistry"] },
  {id:'registry',group:'registry',label:'Vue d’ensemble',route:'/registry',component:'ComingSoon',menu:true,protected:true,implemented:false,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',description:'Le Registry Platform transversal est en préparation. Les registres spécialisés restent accessibles dans leurs modules propriétaires.'},
  {"id":"packs","group":"packs","label":"Vue d’ensemble","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs"},
  {"id":"pmpacks","group":"packs","label":"Packs","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/packs"},
  {"id":"pmversions","tab":"versions","group":"packs","label":"Versions","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/versions"},
  {"id":"pmmodules","group":"packs","label":"Modules","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/modules"},
  {"id":"pmfeatures","group":"packs","label":"Fonctionnalités","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/features"},
  {"id":"pmcapabilities","group":"packs","label":"Capacités","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/capabilities"},
  {"id":"pmdependencies","group":"packs","label":"Dépendances","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/dependencies"},
  {"id":"pmrules","group":"packs","label":"Règles","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/rules"},
  {"id":"pmvalidation","group":"packs","label":"Validation & Manifest","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/validation"},
  {"id":"pmpublication","group":"packs","label":"Publication","permission":"pack.read","component":"PackManagerPage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/publication"},
  {"id":"pmregistry","group":"packs","label":"Registre publié","permission":"pack.read","component":"PackManagerPage","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/packs/registry"},
  {"id":"runtime","group":"runtime","label":"Vue d’ensemble","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime"},
  {"id":"runtimecontext","group":"runtime","label":"Contextes","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/context"},
  {"id":"runtimemanifest","group":"runtime","label":"Manifest","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/manifest"},
  {"id":"runtimeresolver","group":"runtime","label":"Résolution","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/resolver"},
  {"id":"runtimeeffective","group":"runtime","label":"Configuration effective","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/effective"},
  {"id":"runtimecache","group":"runtime","label":"Cache","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/cache"},
  {"id":"runtimediagnostics","group":"runtime","label":"Diagnostics","permission":"runtime.resolution.read","component":"RuntimePage","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","route":"/runtime/diagnostics"},

  { ...{"id":"admin","group":"admin","label":"Administration (maquette)","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"admin-overviewpage","permission":null}, route: ROUTES["admin"] },
  { ...{"id":"demo","group":"admin","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","permission":null}, route: ROUTES["demo"] },
  { ...{"component":"CockpitRoute","id":"dashboard","label":"Tableau de bord","group":"dashboard","status":"PARTIAL","menu":true,"moduleId":"01","tab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["dashboard"] },
  { ...{"component":"ApplicationsRoute","id":"applications","label":"Applications","group":"applications","status":"PARTIAL","menu":true,"moduleId":"01","tab":"applications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applications"] },
  { ...{"component":"NewApplicationRoute","id":"applicationNew","label":"Nouvelle application","group":"applications","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationNew"] },
  { ...{"component":"ApplicationDetailRoute","id":"applicationDetail","label":"Détail application","group":"applications","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationDetail"] },
  { ...{"component":"WorkspaceConfigView","id":"applicationWorkspace","label":"Configuration application","group":"applications","status":"PARTIAL","menu":true,"moduleId":"01","tab":"workspace","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["applicationWorkspace"] },
  { ...{"component":"BMOverview","id":"bm","label":"Vue d’ensemble","group":"bm","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bm"] },
  { ...{"component":"BMApplicationsRoute","id":"bmApplications","label":"Applications","group":"bm","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplications"] },
  { ...{"id":"bmVersionsIndex","group":"bm","label":"Versions","component":"BMVersionsRoute","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE"}, route: ROUTES["bmVersionsIndex"] },
  { ...{"id":"bmModels","group":"bm","label":"Modèles de données","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Entités, champs, relations et contraintes de la version sélectionnée."}, route: ROUTES["bmModels"] },
  { ...{"id":"bmFeaturesIndex","group":"bm","label":"Fonctionnalités","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Features, capacités et dépendances de la version sélectionnée."}, route: ROUTES["bmFeaturesIndex"] },
  { ...{"id":"bmNavigationIndex","group":"bm","label":"Navigation","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","description":"Menus et éléments de navigation de la version sélectionnée."}, route: ROUTES["bmNavigationIndex"] },
  { ...{"component":"ConfigurationView","id":"bmConfiguration","label":"Configuration","group":"bm","menu":true,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"tab":"config"}, route: ROUTES["bmConfiguration"] },
  { ...{"id":"bmRuntimeIndex","group":"bm","label":"Intégration & Runtime","component":"BMRuntimeRedirect","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"IMPLEMENTED","description":"La liaison entre les contrats des applications et leurs fournisseurs sera intégrée avec le Runtime Bridge."}, route: ROUTES["bmRuntimeIndex"] },
  { ...{"id":"bmQuality","group":"bm","label":"Validation","component":"BMWorkspaceRoute","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","tab":"validation"}, route: ROUTES["bmQuality"] },
  { ...{"component":"BMApplicationNewRoute","id":"bmApplicationNew","label":"Nouvelle application","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplicationNew"] },
  { ...{"component":"BMVersionsRoute","id":"bmVersions","label":"Versions","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmVersions"] },
  { ...{"id":"bmDataModel","label":"Modèles de données","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":4,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmDataModel"] },
  { ...{"id":"bmFeatures","label":"Fonctionnalités","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":5,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmFeatures"] },
  { ...{"id":"bmNavigation","label":"Navigation","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"phase":6,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmNavigation"] },
  { ...{"id":"bmRuntime","label":"Runtime","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"IMPLEMENTED","implemented":true,"phase":8,"component":"BMRuntimeRedirect","versionSection":true}, route: ROUTES["bmRuntime"] },
  { ...{"id":"bmValidation","label":"Validation","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true,"component":"BMWorkspaceRoute","versionSection":true}, route: ROUTES["bmValidation"] },
  { ...{"component":"BMApplicationDetailRoute","id":"bmApplicationDetail","label":"Détail application","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmApplicationDetail"] },
  { ...{"component":"BMWorkspaceRoute","id":"bmVersionDetail","label":"Version détaillée","group":"bm","menu":false,"protected":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","implemented":true}, route: ROUTES["bmVersionDetail"] },
  { ...{"id":"ui","group":"ui","label":"Vue d’ensemble","component":"UiBuilderOverview","menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE","description":"Vue d’ensemble du UI Builder : contexte, pages, composants, validation."}, route: ROUTES["ui"] },
  { ...{"id":"uiPages","group":"ui","label":"Pages","component":"UiPagesManager","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Créer, ordonner et configurer les pages de la version (routes validées, détection de doublons)."}, route: ROUTES["uiPages"] },
  { ...{"id":"uiBuilder","group":"ui","label":"Éditeur visuel","component":"UiVisualEditor","menu":false,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Canvas, bibliothèque de composants, Inspector, bindings, actions et sauvegarde persistante."}, route: ROUTES["uiBuilder"] },
  { ...{"id":"uiForms","group":"ui","label":"Formulaires","component":"UiFormsBuilder","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Composez des formulaires à partir des entités et champs du Business Manager."}, route: ROUTES["uiForms"] },
  { ...{"id":"uiComponents","group":"ui","label":"Composants","component":"UiComponentsCatalog","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Catalogue contrôlé des composants rendus par le Shared Renderer."}, route: ROUTES["uiComponents"] },
  { ...{"id":"uiThemes","group":"ui","label":"Thème","component":"UiThemeBuilder","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Design tokens : couleurs, typographie, espacements, radius, breakpoints."}, route: ROUTES["uiThemes"] },
  { ...{"id":"uiPreview","group":"ui","label":"Aperçu & Test","component":"UiPreviewValidation","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Rendu via le Shared Renderer et cockpit de validation ERROR / WARNING / INFO."}, route: ROUTES["uiPreview"] },
  { ...{"id":"uiPage","group":"ui","label":"Détail page","component":"UiVisualEditor","menu":false,"protected":true,"implemented":true,"status":"PARTIAL","classification":"NEW_PAGE"}, route: ROUTES["uiPage"] },
  { ...{"id":"uiNavigation","group":"ui","label":"Navigation","component":"UiNavigationPresentation","menu":true,"protected":true,"status":"PARTIAL","classification":"NEW_PAGE","implemented":true,"description":"Ordre visuel, icône et visibilité des pages (présentation — la structure reste au Business Manager)."}, route: ROUTES["uiNavigation"] },
  { ...{"component":"AutomationCockpit","id":"automation","label":"Vue d’ensemble","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automation"] },
  { ...{"component":"AutomationWorkflows","id":"automationWorkflows","label":"Workflows","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationWorkflows"] },
  { ...{"component":"AutomationTriggers","id":"automationTriggers","label":"Déclencheurs","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationTriggers"] },
  { ...{"id":"automationActions","group":"automation","label":"Actions","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"permission":"automation:read","description":"Le gestionnaire des actions automatisées n’est pas disponible. Les handlers existants ne constituent pas encore un gestionnaire complet."}, route: ROUTES["automationActions"] },
  {id:'automationSchedules',group:'automation',label:'Planifications',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'automation:read',description:'La planification récurrente des automatisations n’est pas encore intégrée à la console.',route:ROUTES["automationSchedules"]},
  { ...{"component":"AutomationHistory","id":"automationExecutions","label":"Exécutions","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationExecutions"] },
  {id:'automationTemplates',group:'automation',label:'Modèles',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'automation:read',description:'La bibliothèque de modèles d’automatisation réutilisables n’est pas encore disponible.',route:ROUTES["automationTemplates"]},
  {id:'automationDiagnostics',group:'automation',label:'Diagnostics',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'automation:read',description:'Le cockpit de diagnostics des exécutions d’automatisation n’est pas encore consolidé.',route:ROUTES["automationDiagnostics"]},
  { ...{"component":"AutomationRules","id":"automationRules","label":"Règles","group":"automation","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read","engine":"PARTIAL"}, route: ROUTES["automationRules"] },
  { ...{"id":"automationFormulas","group":"automation","label":"Formules","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"permission":"automation:read","description":"L’éditeur de formules et leur évaluation ne sont pas encore intégrés à la console."}, route: ROUTES["automationFormulas"] },
  { ...{"component":"AutomationConditions","id":"automation-conditions","label":"conditions","group":"automation","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"automation:read"}, route: ROUTES["automation-conditions"] },
  { ...{"component":"ERPDashboard","id":"erp","label":"Vue d’ensemble","group":"erp","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erp"] },
  {component:'ErpResourcesNav',id:'erpResources',label:'Ressources',group:'erp',status:'PARTIAL',menu:true,protected:true,classification:'EXISTING_PARTIAL_PAGE',implemented:true,permission:'erp:read',description:'Point d’entrée vers les écrans fonctionnels détaillés du connecteur ERP.',route:ROUTES["erpResources"]},
  { ...{"component":"Mapping","id":"erpMapping","label":"Mappings","group":"erp","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erpMapping"] },
  {id:'erpSynchronizations',group:'erp',label:'Synchronisations',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'erp:read',description:'La synchronisation ERP dédiée n’est pas encore exposée. Les flux existants restent pilotés depuis API & Intégrations.',route:ROUTES["erpSynchronizations"]},
  { ...{"id":"erp-clients","group":"erp","label":"Clients","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"clients","description":"Écran fonctionnel détaillé du workspace ERP."}, route: ROUTES["erp-clients"] },
  { ...{"id":"erp-products","group":"erp","label":"Produits","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"products","description":"Écran fonctionnel détaillé du workspace ERP."}, route: ROUTES["erp-products"] },
  { ...{"id":"erp-orders","group":"erp","label":"Commandes","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"orders","description":"Écran fonctionnel détaillé du workspace ERP."}, route: ROUTES["erp-orders"] },
  { ...{"id":"erp-invoices","group":"erp","label":"Factures","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"invoices","description":"Écran fonctionnel détaillé du workspace ERP."}, route: ROUTES["erp-invoices"] },
  { ...{"id":"erp-stocks","group":"erp","label":"Stocks","component":"ErpModule","menu":false,"protected":true,"status":"REAL","classification":"EXISTING_REAL_PAGE","implemented":true,"permission":"erp:read","moduleKeyOverride":"stock-movements","description":"Écran fonctionnel détaillé du workspace ERP."}, route: ROUTES["erp-stocks"] },
  { ...{"component":"DataRuntime","id":"dataRuntime","label":"Vue d’ensemble","group":"data","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"data-runtime:read"}, route: ROUTES["dataRuntime"] },
  {id:'dataSources',group:'data',label:'Sources',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'data-runtime:read',description:'Le registre des sources de données connectées n’est pas encore exposé dans la console.',route:ROUTES["dataSources"]},
  {id:'dataContracts',group:'data',label:'Modèles & Contrats',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'data-runtime:read',description:'La gestion des modèles et des contrats de données n’est pas encore disponible.',route:ROUTES["dataContracts"]},
  { ...{"id":"dataQuery","group":"data","label":"Requêtes","component":null,"menu":true,"protected":true,"implemented":true,"status":"PARTIAL","classification":"EXISTING_PARTIAL_PAGE","redirectTo":"/data-runtime#query","permission":"data-runtime:query","description":"Exécution de requêtes sur les ressources du tenant."}, route: ROUTES["dataQuery"] },
  {id:'dataPolicies',group:'data',label:'Politiques',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'data-runtime:read',description:'Les politiques d’accès et de rétention des données ne sont pas encore configurables.',route:ROUTES["dataPolicies"]},
  {id:'dataDiagnostics',group:'data',label:'Diagnostics',component:'ComingSoon',menu:true,protected:true,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',implemented:false,permission:'data-runtime:read',description:'Le cockpit de diagnostics du Data Runtime n’est pas encore consolidé.',route:ROUTES["dataDiagnostics"]},
  { ...{"component":"DataRuntimeHistory","id":"data-runtime-history","label":"Historique","group":"data","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"data-runtime:read"}, route: ROUTES["data-runtime-history"] },
  { ...{"component":"ErpModule","id":"erp-:moduleKey","label":":moduleKey","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erp-:moduleKey"] },
  { ...{"component":"ERPCreate","id":"erps-create","label":"create","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erps-create"] },
  { ...{"component":"ERPEdit","id":"erps-edit-:id","label":":id","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["erps-edit-:id"] },
  { ...{"component":"Adapters","id":"adapters","label":"Adaptateurs ERP","group":"erp","status":"PARTIAL","menu":false,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["adapters"] },
  {id:'billingOverview',group:'billing',label:'Vue d’ensemble',component:'ComingSoon',menu:true,protected:true,implemented:false,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',description:'Le modèle Subscription & Billing n’est pas encore consolidé : aucune vue d’ensemble ne peut être exposée honnêtement.',route:ROUTES["billingOverview"]},
  { ...{"component":"ComingSoon","id":"billingPlans","pageId":"billing-planspage","label":"Plans","group":"billing","status":"NOT_IMPLEMENTED","menu":true,"protected":true,"classification":"PLANNED_PAGE","implemented":false,"description":"La gestion des offres commerciales et de leurs tarifs n’est pas encore intégrée."}, route: ROUTES["billingPlans"] },
  { ...{"component":"ComingSoon","id":"billingSubscriptions","pageId":"billing-subscriptionspage","label":"Abonnements","group":"billing","status":"NOT_IMPLEMENTED","menu":true,"protected":true,"classification":"PLANNED_PAGE","implemented":false,"description":"La souscription, le renouvellement et la résiliation des abonnements seront intégrés dans une prochaine phase."}, route: ROUTES["billingSubscriptions"] },
  { ...{"id":"billingEntitlements","group":"billing","label":"Entitlements","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","description":"La gestion des droits commerciaux des abonnements est distincte des permissions IAM et n’est pas encore disponible."}, route: ROUTES["billingEntitlements"] },
  { ...{"id":"billingQuotas","group":"billing","label":"Quotas","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","description":"Le suivi de consommation et les limites des abonnements ne sont pas encore disponibles."}, route: ROUTES["billingQuotas"] },
  { ...{"id":"billingInvoices","group":"billing","label":"Facturation","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","description":"L’émission et le suivi des factures d’abonnement ne sont pas encore intégrés."}, route: ROUTES["billingInvoices"] },
  { ...{"id":"billing-payments","group":"billing","label":"Payments","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-paymentspage","permission":null}, route: ROUTES["billing-payments"] },
  { ...{"id":"billing-webhooks","group":"billing","label":"Webhooks","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-webhookspage","permission":null}, route: ROUTES["billing-webhooks"] },
  { ...{"id":"billing-access-rules","group":"billing","label":"Access Rules","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-accessrulespage","permission":null}, route: ROUTES["billing-access-rules"] },
  { ...{"id":"billing-features","group":"billing","label":"Features","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"billing-featurespage","permission":null}, route: ROUTES["billing-features"] },
  { ...{"component":"IamUsersPage","id":"iam-users","label":"Utilisateurs","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-users"] },
  { ...{"component":"IdentitiesPage","id":"iam-identities","label":"Identités","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-identities"] },
  { ...{"component":"TenantsPage","id":"iam-tenants","label":"Tenants","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-tenants"] },
  { ...{"component":"RolesPage","id":"iam-roles","label":"Rôles","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-roles"] },
  { ...{"component":"PoliciesPage","id":"iam-policies","label":"Politiques","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-policies"] },
  { ...{"component":"SessionsPage","id":"iam-sessions","label":"Sessions","group":"iam","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["iam-sessions"] },
  { ...{"id":"iam-organizations","group":"iam","label":"Organisations / Sites","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","permission":"iam:admin","description":"La gestion des organisations et des sites rattachés aux tenants n’est pas encore disponible."}, route: ROUTES["iam-organizations"] },
  { ...{"id":"iam-devices","group":"iam","label":"Appareils","component":"ComingSoon","menu":true,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"MISSING_PAGE","permission":"iam:admin","description":"L’inventaire et la gestion des appareils connectés ne sont pas encore disponibles."}, route: ROUTES["iam-devices"] },
  { ...{"id":"iam-contexts","group":"iam","label":"Contextes","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"contexts-contextspage","permission":"iam:admin"}, route: ROUTES["iam-contexts"] },
  { ...{"id":"iam-identity-links","group":"iam","label":"Liaisons ERP","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"identitylinks-identitylinkspage","permission":"iam:admin"}, route: ROUTES["iam-identity-links"] },
  { ...{"id":"iam-identity-groups","group":"iam","label":"Groupes","component":"DemoPage","menu":false,"protected":true,"implemented":false,"status":"NOT_IMPLEMENTED","classification":"EXISTING_PARTIAL_PAGE","pageId":"identitygroups-identitygroupspage","permission":"iam:admin"}, route: ROUTES["iam-identity-groups"] },
  { ...{"component":"ObservabilityOverview","id":"observability","label":"Vue d’ensemble","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability"] },
  { ...{"component":"MonitoringPage","id":"observability-monitoring","label":"Monitoring","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-monitoring"] },
  { ...{"component":"LogsPage","id":"observability-logs","label":"Logs","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-logs"] },
  { ...{"component":"AuditPage","id":"observability-audit","label":"Audit","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-audit"] },
  { ...{"component":"SecurityEventsPage","id":"observability-security-events","label":"Événements de sécurité","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-security-events"] },
  { ...{"component":"AlertManagerPage","id":"observability-alerts","label":"Alertes","group":"observability","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"iam:admin"}, route: ROUTES["observability-alerts"] },
  {id:'adminOverview',group:'admin',label:'Vue d’ensemble',component:'ComingSoon',menu:true,protected:true,implemented:false,status:'NOT_IMPLEMENTED',classification:'PLANNED_PAGE',description:'La vue d’ensemble de l’administration de la plateforme n’est pas encore consolidée.',route:ROUTES["adminOverview"]},
  { ...{"id":"settingsGeneral","group":"admin","label":"Paramètres généraux","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"Les préférences générales de la plateforme ne disposent pas encore d’un écran dédié."}, route: ROUTES["settingsGeneral"] },
  { ...{"component":"IntegrationsView","id":"settingsIntegrations","label":"Vue d’ensemble","group":"api","status":"PARTIAL","menu":true,"moduleId":"api-layer","tab":"integrations","integrationTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["settingsIntegrations"] },
  { ...{"component":"Settings","id":"settingsErp","label":"Paramètres & diagnostics","group":"erp","status":"PARTIAL","menu":true,"protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"erp:read"}, route: ROUTES["settingsErp"] },
  { ...{"id":"settingsSecurity","group":"iam","permission":"iam:admin","label":"Sécurité","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"La configuration des options de sécurité ne dispose pas encore d’un écran dédié."}, route: ROUTES["settingsSecurity"] },
  { ...{"id":"settingsProfile","group":"admin","label":"Profil","component":"ComingSoon","menu":true,"protected":true,"status":"NOT_IMPLEMENTED","classification":"PLANNED_PAGE","implemented":false,"description":"La modification du profil utilisateur sera intégrée à la console dans une prochaine phase."}, route: ROUTES["settingsProfile"] },
  { ...{"component":"SpecificationsView","id":"specifications","label":"Spécifications","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["specifications"] },
  { ...{"component":"EnvironmentsView","id":"environments","label":"Environnements","group":"environments","status":"PARTIAL","menu":true,"moduleId":"01","tab":"environments","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["environments"] },
  { ...{"component":"ContractsView","id":"contracts","label":"Registre des contrats","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"contracts","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["contracts"] },
  { ...{"component":"SnapshotsRoute","id":"snapshots","label":"Snapshots","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"snapshots","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["snapshots"] },
  { ...{"component":"PlatformContractView","id":"platform-contract","label":"Socle & contrat","group":"environments","status":"PARTIAL","menu":false,"moduleId":"01","tab":"platform-contract","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["platform-contract"] },
  { ...{"component":"IntegrationsView","id":"integrations-connectors","label":"Connecteurs","group":"api","status":"PARTIAL","menu":true,"moduleId":"api-layer","tab":"integrations","integrationTab":"connectors","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["integrations-connectors"] },
  { ...{"component":"IntegrationsView","id":"integrations-apis","label":"apis","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"apis","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["integrations-apis"] },
  { ...{"component":"IntegrationsView","id":"integrations-webhooks","label":"Webhooks","group":"api","status":"PARTIAL","menu":true,"moduleId":"api-layer","tab":"integrations","integrationTab":"webhooks","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["integrations-webhooks"] },
  { ...{"component":"IntegrationsView","id":"integrations-credentials","label":"credentials","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"credentials","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:credential:read"}, route: ROUTES["integrations-credentials"] },
  { ...{"component":"IntegrationsView","id":"integrations-sync","label":"sync","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"sync","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["integrations-sync"] },
  { ...{"component":"IntegrationsView","id":"integrations-diagnostics","label":"Diagnostics","group":"api","status":"PARTIAL","menu":true,"moduleId":"api-layer","tab":"integrations","integrationTab":"diagnostics","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:diagnostic:read"}, route: ROUTES["integrations-diagnostics"] },
  { ...{"component":"IntegrationsView","id":"integrations-specifications","label":"specifications","group":"api","status":"PARTIAL","menu":false,"moduleId":"api-layer","tab":"integrations","integrationTab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":"integration:read"}, route: ROUTES["integrations-specifications"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment","label":"Vue d’ensemble","group":"deployments","status":"PARTIAL","menu":true,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment"] },
  { id:'history',tab:'history',protected:true,group:'deployments',label:'Historique',component:'HistoryRollbackView',menu:true,implemented:true,status:'PARTIAL',route:'/history' },
  { ...{"component":"DeploymentPublicationView","id":"deployment-cockpit","label":"cockpit","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"cockpit","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-cockpit"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-releases","label":"releases","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"releases","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-releases"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-pipelines","label":"pipelines","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"pipelines","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-pipelines"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-promotion","label":"promotion","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"promotions","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-promotion"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-rollback","label":"rollback","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"rollback","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-rollback"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-diagnostics","label":"diagnostics","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"diagnostics","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-diagnostics"] },
  { ...{"component":"DeploymentPublicationView","id":"deployment-specifications","label":"specifications","group":"deployments","status":"PARTIAL","menu":false,"moduleId":"dep-layer","tab":"deployment","deploymentTab":"specifications","protected":true,"classification":"EXISTING_PARTIAL_PAGE","implemented":true,"permission":null}, route: ROUTES["deployment-specifications"] },
];
export const routeDefinitions = pageDefinitions.filter(r => r.component);
export const legacyRedirects = [
  { from:'/packs/manager',to:'/packs/packs' },
  { from:'/packs/runtime',to:'/runtime' },

  {
    "from": "/business",
    "to": "/business-manager"
  },
  {
    "from": "/business/models",
    "to": "/business-manager/models"
  },
  {
    "from": "/business/features",
    "to": "/business-manager/features"
  },
  {
    "from": "/business/navigation",
    "to": "/business-manager/navigation"
  },
  {
    "from": "/business/configuration",
    "to": "/business-manager/configuration"
  },
  {
    "from": "/business/validation",
    "to": "/business-manager/validation"
  },
  {
    "from": "/cockpit",
    "to": "/dashboard"
  },
  {
    "from": "/workspace",
    "to": "/applications/workspace"
  },
  {
    "from": "/config",
    "to": "/business-manager/configuration"
  },
  {
    "from": "/validation",
    "to": "/business-manager/validation"
  },
  {
    "from": "/automation/history",
    "to": "/automation/executions"
  },
  {
    "from": "/overview",
    "to": "/packs"
  },
  {
    "from": "/versions",
    "to": "/packs/versions"
  },
  {
    "from": "/publication",
    "to": "/packs/publication"
  },
  {
    "from": "/mapping",
    "to": "/erp/mappings"
  },
  {
    "from": "/billing/overview",
    "to": "/billing"
  },
  {
    "from": "/iam/organisations",
    "to": "/iam/organizations"
  },
  {
    "from": "/iam/observability",
    "to": "/observability"
  },
  {
    "from": "/iam/observability/monitoring",
    "to": "/observability/monitoring"
  },
  {
    "from": "/iam/observability/logs",
    "to": "/observability/logs"
  },
  {
    "from": "/iam/observability/audit",
    "to": "/observability/audit"
  },
  {
    "from": "/iam/observability/security-events",
    "to": "/observability/security-events"
  },
  {
    "from": "/iam/observability/alerts",
    "to": "/observability/alerts"
  },
  {
    "from": "/integrations/cockpit",
    "to": "/settings/integrations"
  },
  {
    "from": "/settings",
    "to": "/settings/erp"
  },
  {
    "from": "/integrations",
    "to": "/settings/integrations"
  },
  {
    "from": "/",
    "to": "/dashboard"
  },
  {
    "from": "/iam",
    "to": "/iam/users"
  },
  {
    "from": "/billing",
    "to": "/billing/plans"
  },
  {
    "from": "/data",
    "to": "/data-runtime"
  }
];
export const redirects = [...legacyRedirects, ...pageDefinitions.filter(r => r.redirectTo).map(r => ({from:r.route,to:r.redirectTo}))];
export const navigationEntries = pageDefinitions.filter(r => r.menu);
export function resolveRoute(pathname) { const path = typeof pathname === 'string' ? pathname.split(/[?#]/)[0] : pathname; return [...pageDefinitions].sort((a,b) => Number(a.route.includes(':'))-Number(b.route.includes(':')) || b.route.length-a.route.length).find(r => matchPath({path:r.route,end:true},path)); }
export function activeNavigation(pathname) { const entry = resolveRoute(pathname); const ids = {bmDataModel:'bmModels',bmVersionDetail:'bmApplications',bmApplicationDetail:'bmApplications',bmApplicationNew:'bmApplications',bmVersions:'bmApplications',bmVersionsIndex:'bmApplications',applicationDetail:'bmApplications',applicationNew:'bmApplications',applications:'bmApplications',bmFeatures:'bmFeaturesIndex',bmNavigation:'bmNavigationIndex',bmValidation:'bmQuality','erp-clients':'erpResources','erp-products':'erpResources','erp-orders':'erpResources','erp-invoices':'erpResources','erp-stocks':'erpResources','erp-:moduleKey':'erpResources','erps-create':'erpRegistry','erps-edit-:id':'erpRegistry','uiBuilder':'uiPages','uiPage':'uiPages','automation-conditions':'automationRules'}; return ids[entry?.id] ? pageDefinitions.find(p => p.id === ids[entry.id]) : entry; }
export function groupEntries(id) { return navigationEntries.filter(r => r.group === id); }
export function groupDestination(id) { return groupEntries(id).find(r => r.component || r.redirectTo)?.route; }
export function routeForTab(tab) { return pageDefinitions.find(r => r.tab === (tab === 'contract-v1' ? 'platform-contract' : tab))?.route; }

export function effectiveNavigation(user, context = {}) {
  const safe = !context.tenantId || context.loading || context.error;
  return navigationGroups.filter(g=>!g.hidden && (!safe || g.id==='dashboard')).map(g=>({...g, entries:groupEntries(g.id).filter(e=>canAccess(e,user))})).filter(g=>g.entries.length);
}
