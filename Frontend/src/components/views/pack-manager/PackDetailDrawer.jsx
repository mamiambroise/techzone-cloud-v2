// PackDetailDrawer.jsx — PM-CDC-02 Pack Detail Slide-over Inspector
import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Boxes,
  X,
  Edit,
  Copy,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  GitBranch,
  FileCode,
  Tag,
  Users,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function PackDetailDrawer({
  isOpen,
  onClose,
  pack,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}) {
  const { packVersions, setSelectedPackId, setSelectedPackVersionId, setCurrentView } = useApp();

  if (!isOpen || !pack) return null;

  const versions = packVersions.filter((v) => v.packId === pack.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-xs text-slate-300">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#070D1F] flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
              style={{ backgroundColor: pack.color || '#3B82F6' }}
            >
              <Boxes className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white truncate">{pack.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pack.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : pack.status === 'ARCHIVED'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {pack.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Code : {pack.code}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-slate-800/80">
            <button
              onClick={() => onEdit(pack)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-blue-400" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => onDuplicate(pack)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Dupliquer</span>
            </button>
            {pack.status === 'ARCHIVED' ? (
              <button
                onClick={() => onRestore(pack.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer</span>
              </button>
            ) : (
              <button
                onClick={() => onArchive(pack)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/60 text-rose-300 font-semibold transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archiver</span>
              </button>
            )}
          </div>

          {/* General Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description fonctionnelle</h3>
            <p className="text-slate-300 leading-relaxed bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
              {pack.description || 'Aucune description fournie pour ce pack.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Versions</div>
              <div className="text-lg font-black text-white mt-0.5">{versions.length}</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Modules</div>
              <div className="text-lg font-black text-blue-400 mt-0.5">{pack.modulesCount || 0}</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Features</div>
              <div className="text-lg font-black text-purple-400 mt-0.5">{pack.featuresCount || 0}</div>
            </div>
          </div>

          {/* Versions Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Versions déclarées ({versions.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedPackId(pack.id);
                  setCurrentView('pack-versions');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Gérer les versions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => {
                    setSelectedPackId(pack.id);
                    setSelectedPackVersionId(ver.id);
                    setCurrentView('pack-versions');
                  }}
                  className="bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">v{ver.versionNumber}</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                          ver.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ver.status === 'READY'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{ver.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Métadonnées & Traçabilité</h3>
            <div className="grid grid-cols-2 gap-y-2 text-[11px]">
              <span className="text-slate-400">Typologie source :</span>
              <span className="text-white font-semibold">{pack.sourceType}</span>

              <span className="text-slate-400">Catégorie :</span>
              <span className="text-white font-semibold">{pack.category}</span>

              <span className="text-slate-400">Version doc (Lock) :</span>
              <span className="font-mono text-cyan-400">v{pack.version || 1}</span>

              <span className="text-slate-400">Créé le :</span>
              <span className="text-slate-300">{new Date(pack.createdAt).toLocaleDateString('fr-FR')}</span>

              <span className="text-slate-400">Créé par :</span>
              <span className="text-slate-300">{pack.createdBy}</span>

              <span className="text-slate-400">Dernière modif :</span>
              <span className="text-slate-300">{new Date(pack.updatedAt).toLocaleString('fr-FR')}</span>
            </div>
          </div>

          {/* Tags */}
          {pack.metadata?.tags && pack.metadata.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tags & Classification</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pack.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]"
                  >
                    <Tag className="w-3 h-3 text-blue-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
