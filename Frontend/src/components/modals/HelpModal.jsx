// HelpModal.jsx — Interactive Reference & Architecture Guide (BM-CDC-00 / BM-P0.1 to P0.4)
import React from 'react';
import { HelpCircle, BookOpen, Layers, ShieldCheck, Database, GitBranch, X } from 'lucide-react';

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Spécifications & Architecture BM-CDC-00
              </h3>
              <p className="text-[11px] text-slate-500">
                Socle commun transversal pour Business Manager (Techzone Cloud)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 scrollbar-none">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>1. Finalité & Règle d or de BM-CDC-00</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              BM-CDC-00 ne développe <strong>aucune fonctionnalité métier spécifique</strong> (Features, Menus, Pages). Il construit le <strong>socle commun</strong> permettant à tous les moteurs (BM-P0.1 à BM-P0.8) de fonctionner de manière uniforme et découplée.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Les 7 Contrats Techniques Obligatoires</span>
            </h4>
            <ul className="list-disc pl-4 text-slate-600 space-y-1">
              <li><strong>Isolation Multi-tenant :</strong> Toutes les requêtes sont partitionnées par <code>tenantId</code>.</li>
              <li><strong>Garde de Version Immuable :</strong> Toute version publiée passe en mode <code>READ_ONLY</code>.</li>
              <li><strong>Verrouillage Optimiste :</strong> Gestion de la concurrence via le champ <code>version</code> numérique.</li>
              <li><strong>Snapshot Déterministe :</strong> Signature SHA-256 stable permettant la comparaison de versions.</li>
              <li><strong>Journal d Audit & Traçabilité :</strong> Chaque mutation enregistre un <code>traceId</code>, un acteur et un timestamp.</li>
              <li><strong>SemVer Rigoureux :</strong> Numérotation <code>MAJOR.MINOR.PATCH</code>.</li>
              <li><strong>États d UI Normalisés :</strong> LOADING, EMPTY, ERROR, READY, READ_ONLY, NO_PERMISSION.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <span>3. Hiérarchie des Moteurs Métier</span>
            </h4>
            <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1">
              <p className="text-blue-400">BM-CDC-00 (Socle & Contrats communs)</p>
              <p className="pl-4">↳ BM-P0.1 Application / Version Manager</p>
              <p className="pl-8">↳ BM-P0.2 Data Model Manager</p>
              <p className="pl-12">↳ BM-P0.3 Feature & Capability Manager</p>
              <p className="pl-16">↳ BM-P0.4 Menu Engine</p>
              <p className="pl-20">↳ BM-P0.5 Page & Form Designer</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
