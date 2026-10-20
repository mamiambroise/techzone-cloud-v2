import { ROUTES } from "./routes.js";

const planned = (id, group, label, description) => ({
  id,
  group,
  label,
  description,
  route: ROUTES[id],
  component: "ComingSoon",
  menu: true,
  protected: true,
  implemented: false,
  status: "NOT_IMPLEMENTED",
  classification: "PLANNED_PAGE",
});

export const plannedPages = [
  planned("uiNavigation", "ui", "Navigation", "L’ordre visuel, les icônes et la visibilité des pages seront gérés ici ; la structure de navigation reste au Business Manager."),
  planned("uiEditor", "ui", "Éditeur visuel", "L’éditeur visuel s’ouvre depuis une page de l’application ; il sera disponible avec le futur Page Builder."),

  planned("automationSchedules", "automation", "Planifications", "La planification des workflows (récurrence, fuseaux horaires) n’est pas encore disponible."),
  planned("automationTemplates", "automation", "Modèles", "Les modèles de workflows réutilisables ne sont pas encore disponibles."),
  planned("automationDiagnostics", "automation", "Diagnostics", "Le diagnostic des automatisations (erreurs, exécutions bloquées) sera intégré avec le moteur d’automatisation."),

  planned("packModules", "packs", "Modules", "La composition des modules d’un pack sera disponible avec le futur Pack Manager."),
  planned("packFeatures", "packs", "Fonctionnalités", "Les fonctionnalités exposées par les packs seront disponibles avec le futur Pack Manager."),
  planned("packCapabilities", "packs", "Capacités", "Le catalogue des capacités fournies et requises par les packs n’est pas encore intégré."),
  planned("packRules", "packs", "Règles", "Les règles de composition et de compatibilité des packs seront disponibles avec le futur Pack Manager."),

  planned("runtimeContext", "runtime", "Contextes", "Les contextes d’exécution résolus ne sont pas encore exposés par le Runtime."),
  planned("runtimeManifest", "runtime", "Manifest", "Le manifest actif des packs publiés sera consultable avec le futur moteur Runtime."),
  planned("runtimeResolver", "runtime", "Résolution", "La résolution des modules, capacités et providers sera consultable avec le futur moteur Runtime."),
  planned("runtimeEffective", "runtime", "Configuration effective", "La configuration effective appliquée à l’exécution sera disponible avec le futur moteur Runtime."),
  planned("runtimeCache", "runtime", "Cache", "La gestion du cache d’exécution n’est pas encore disponible."),
  planned("runtimeDiagnostics", "runtime", "Diagnostics", "Les diagnostics d’exécution seront disponibles avec le futur moteur Runtime."),

  planned("data", "data", "Vue d’ensemble", "La vue d’ensemble des sources, contrats et accès sera intégrée avec la Data Platform."),
  planned("dataSources", "data", "Sources", "La gestion des sources de données n’est pas encore disponible."),
  planned("dataContracts", "data", "Modèles & Contrats", "Les modèles et contrats de données seront disponibles avec la Data Platform."),
  planned("dataPolicies", "data", "Politiques", "Les politiques d’accès aux données ne sont pas encore intégrées."),
  planned("dataDiagnostics", "data", "Diagnostics", "Les diagnostics des sources et des requêtes ne sont pas encore disponibles."),

  planned("erpSynchronizations", "erp", "Synchronisations", "Le suivi des synchronisations ERP sera intégré avec l’Integration Hub."),
  planned("erpDiagnostics", "erp", "Diagnostics", "Les diagnostics de la connexion ERP seront fournis par l’Integration Hub."),

  planned("deploymentActivations", "deployments", "Activations", "L’activation des versions de packs par environnement n’est pas encore intégrée."),

  planned("observability-traces", "observability", "Traces", "Les traces distribuées ne sont pas encore collectées par la plateforme."),
  planned("observability-errors", "observability", "Erreurs", "L’agrégation des erreurs applicatives n’est pas encore disponible."),

  planned("adminOverview", "admin", "Vue d’ensemble", "La vue d’ensemble de l’administration plateforme n’est pas encore disponible."),
  planned("adminFeatures", "admin", "Fonctionnalités", "L’activation des fonctionnalités de la plateforme n’est pas encore disponible."),
  planned("adminMaintenance", "admin", "Maintenance", "Les opérations de maintenance de la plateforme ne sont pas encore disponibles."),
];
