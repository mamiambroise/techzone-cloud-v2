"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { IconRenderer } from "@/components/ui/IconRenderer";
export default function TemplatesCatalogPage() {
  const templates = [{
    key: "ecommerce",
    title: "Boutique E-commerce",
    icon: "ShoppingBag",
    category: "Commerce",
    tag: "Populaire",
    desc: "Gestion de catalogue produits, panier d'achat, passage de commande et relation clients.",
    models: ["Produits (SKU, Prix, Stock)", "Commandes & Paiements", "Clients & Adresses", "Promotions & Codes"]
  }, {
    key: "restaurant",
    title: "Restaurant Le Gourmet",
    icon: "UtensilsCrossed",
    category: "Restauration",
    tag: "Pack Salle",
    desc: "Gestion de la carte des menus du jour, plan des tables et réservations de salle.",
    models: ["Plats & Catégories", "Plan des Tables", "Réservations Clients", "Tickets Cuisine"]
  }, {
    key: "garage",
    title: "Garage Automobile Expert",
    icon: "Wrench",
    category: "Automobile",
    tag: "Métier",
    desc: "Suivi des ordres de réparation, fiches véhicules, pièces détachées et facturation.",
    models: ["Véhicules (Immatriculation, Modèle)", "Ordres de Réparation (OR)", "Stock Pièces", "Devis & Factures"]
  }, {
    key: "ecole",
    title: "École & Formation Digitale",
    icon: "GraduationCap",
    category: "Éducation",
    tag: "Éducation",
    desc: "Inscriptions des élèves, gestion des classes, matières, cours et professeurs.",
    models: ["Élèves & Niveaux", "Classes & Emplois du temps", "Professeurs & Matières", "Présences & Notes"]
  }, {
    key: "pharmacie",
    title: "Pharmacie & Santé Plus",
    icon: "Pill",
    category: "Santé",
    tag: "Santé",
    desc: "Suivi des ordonnances médicales, stock des médicaments et gestion des tiers payants.",
    models: ["Médicaments & Posologies", "Ordonnances", "Fournisseurs & Réassorts", "Tiers Payants"]
  }];
  return <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Bibliothèque de Modèles & Packs Métier
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Démarrez rapidement une nouvelle application en initialisant un pack pré-configuré.
          </p>
        </div>

        <Link href="/business-manager/applications/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Créer depuis un modèle</span>
        </Link>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => <div key={tpl.key} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <IconRenderer name={tpl.icon} className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider">
                  {tpl.tag}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tpl.title}
                </h3>
                <span className="text-[11px] font-bold text-slate-400">{tpl.category}</span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tpl.desc}</p>
              </div>

              {/* Data models included preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Schéma initial du Pack :
                </p>
                <div className="space-y-1">
                  {tpl.models.map((m, i) => <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-[11px] font-medium">{m}</span>
                    </div>)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href={`/business-manager/applications/new`} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all active:scale-95 shadow-xs">
                <span>Utiliser ce Modèle</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>)}
      </div>
    </div>;
}