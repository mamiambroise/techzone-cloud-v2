"use client";

import React from "react";
import {
  Database,
  Layers,
  Menu,
  FileText,
  FormInput,
  BarChart3,
  Workflow,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const MODULE_CONFIGS = {
  data: {
    title: "Data Model Manager",
    phase: "P0.2",
    icon: Database,
    description:
      "Création et modélisation des entités métier (ex: Produit, Commande, Client) rattachées à la version active de l'application.",
    highlights: [
      "Point de rattachement: application_id & version_id",
      "Modélisation No-Code de tables et champs relationnels",
      "Migration déclarative intégrée aux snapshots de version",
    ],
  },
  features: {
    title: "Feature Manager",
    phase: "P0.3",
    icon: Layers,
    description:
      "Activation, configuration et granularité des modules métier (ex: Paiement CB, Fidélité, Réservation).",
    highlights: [
      "Feature Flags par version applicative",
      "Activation conditionnelle selon l'environnement (Dev/Prod)",
      "Contrôle d'accès par rôle utilisateur",
    ],
  },
  menus: {
    title: "Menu & Navigation Engine",
    phase: "P0.3",
    icon: Menu,
    description: "Arborescence de navigation, menus latéraux et hiérarchie d'accès de l'application.",
    highlights: [
      "Structure hiérarchique dynamique",
      "Liaison directe aux pages métier créées",
      "Filtrage contextuel par permissions",
    ],
  },
  pages: {
    title: "Page Builder",
    phase: "P0.4",
    icon: FileText,
    description: "Constructeur visuel d'interfaces, grilles, vues tabulaires et composants applicatifs.",
    highlights: [
      "Composants UI modulaires pré-câblés",
      "Mise en page réactive dynamique",
      "Intégration directe aux Data Models P0.2",
    ],
  },
  forms: {
    title: "Form Engine",
    phase: "P0.5",
    icon: FormInput,
    description: "Générateur dynamique de formulaires de saisie, validation et soumission de données.",
    highlights: [
      "Règles de validation côté client & serveur",
      "Champs conditionnels et masquage dynamique",
      "Soumission connectée aux entités de données",
    ],
  },
  dashboards: {
    title: "Dashboard Engine",
    phase: "P0.6",
    icon: BarChart3,
    description: "Widgets de statistiques, graphiques d'activité et indicateurs de performance en temps réel.",
    highlights: [
      "Indicateurs agrégés et KPIs métier",
      "Graphiques temporels et distributions",
      "Filtres interactifs par période et segment",
    ],
  },
  workflows: {
    title: "Workflow Engine",
    phase: "P0.8",
    icon: Workflow,
    description: "Moteur de processus métier, approbations séquentielles et étapes de validation.",
    highlights: [
      "Graph de flux d'états personnalisable",
      "Déclencheurs d'événements automatiques",
      "Gestion des rôles d'approbation",
    ],
  },
  automations: {
    title: "Automation Engine",
    phase: "P0.9",
    icon: Zap,
    description: "Déclencheurs (triggers), webhooks, emails transactionnels et synchronisations externes.",
    highlights: [
      "Déclencheurs temps-réel (onCreated, onPublished)",
      "Connecteurs et adaptateurs système isolés",
      "Exécution asynchrone avec suivi d'erreurs",
    ],
  },
};

export function PackModulesPreview({ application, moduleId }) {
  const config = MODULE_CONFIGS[moduleId] || {
    title: "Module Pack Avancé",
    phase: "Futur",
    icon: Sparkles,
    description: "Ce moteur viendra se brancher directement sur l'identifiant de cette application.",
    highlights: ["Isolation garantie", "Intégration versionnée"],
  };

  const Icon = config.icon;

  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{config.title}</h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black uppercase">
                {config.phase} Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">{config.description}</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold self-start">
          Rattaché à : {application.name}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Conformité d'Intégration Architecture (Specs Section 67 & 68)
        </h3>
        <p className="text-xs text-slate-600">
          Ce module utilisera directement <strong className="font-mono text-indigo-700">application_id = {application.id}</strong> et{" "}
          <strong className="font-mono text-indigo-700">current_version_id</strong> comme clé primaire d'isolation.
        </p>

        <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          {config.highlights.map((h, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
