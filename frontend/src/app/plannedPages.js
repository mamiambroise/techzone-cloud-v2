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
  { ...planned("data", "data", "Vue d’ensemble", "Vue d’ensemble Data Runtime et état des sources du tenant courant."), component: "DataRuntime", implemented: true, status: "PARTIAL" },
  planned("uiNavigation", "ui", "Navigation", "L’ordre visuel, les icônes et la visibilité des pages seront gérés ici ; la structure de navigation reste au Business Manager."),
  planned("uiEditor", "ui", "Éditeur visuel", "L’éditeur visuel s’ouvre depuis une page de l’application ; il sera disponible avec le futur Page Builder."),

  planned("automationSchedules", "automation", "Planifications", "La planification des workflows (récurrence, fuseaux horaires) n’est pas encore disponible."),
  planned("automationTemplates", "automation", "Modèles", "Les modèles de workflows réutilisables ne sont pas encore disponibles."),
  planned("automationDiagnostics", "automation", "Diagnostics", "Le diagnostic des automatisations (erreurs, exécutions bloquées) sera intégré avec le moteur d’automatisation."),

  planned("packModules", "packs", "Modules", "La composition des modules d’un pack sera disponible avec le futur Pack Manager."),
  planned("packFeatures", "packs", "Fonctionnalités", "Les fonctionnalités exposées par les packs seront disponibles avec le futur Pack Manager."),
  planned("packCapabilities", "packs", "Capacités", "Le catalogue des capacités fournies et requises par les packs n’est pas encore intégré."),
  planned("packRules", "packs", "Règles", "Les règles de composition et de compatibilité des packs seront disponibles avec le futur Pack Manager."),

  { ...planned("dataSources", "data", "Sources", "Sources Data Runtime exposées par le contrat canonique."), component: "DataRuntimeGovernance", implemented: true, status: "PARTIAL" },
  { ...planned("dataContracts", "data", "Modèles & Contrats", "Contrat canonique et opérations exposées par Business Manager."), component: "DataRuntimeGovernance", implemented: true, status: "PARTIAL" },
  { ...planned("dataPolicies", "data", "Politiques", "Matrice des opérations exposées, complétée par la décision IAM serveur."), component: "DataRuntimeGovernance", implemented: true, status: "PARTIAL" },
  { ...planned("dataDiagnostics", "data", "Diagnostics", "Métriques et historique Data Runtime du tenant authentifié."), component: "DataRuntimeGovernance", implemented: true, status: "PARTIAL" },

  planned("erpSynchronizations", "erp", "Synchronisations", "Le suivi des synchronisations ERP sera intégré avec l’Integration Hub."),
  planned("erpDiagnostics", "erp", "Diagnostics", "Les diagnostics de la connexion ERP seront fournis par l’Integration Hub."),

  planned("deploymentActivations", "deployments", "Activations", "L’activation des versions de packs par environnement n’est pas encore intégrée."),

  planned("observability-traces", "observability", "Traces", "Les traces distribuées ne sont pas encore collectées par la plateforme."),
  planned("observability-errors", "observability", "Erreurs", "L’agrégation des erreurs applicatives n’est pas encore disponible."),

  planned("adminOverview", "admin", "Vue d’ensemble", "La vue d’ensemble de l’administration plateforme n’est pas encore disponible."),
  planned("adminFeatures", "admin", "Fonctionnalités", "L’activation des fonctionnalités de la plateforme n’est pas encore disponible."),
  planned("adminMaintenance", "admin", "Maintenance", "Les opérations de maintenance de la plateforme ne sont pas encore disponibles."),
];
