// Footer.jsx — Standard footer tag
import React from 'react';

export function Footer({ onOpenHelp }) {
  return (
    <footer className="py-2 px-3 sm:px-6 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-semibold flex-shrink-0">
      <div className="truncate">Copyright © 2026 Techzone Cloud</div>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-mono text-slate-500 hidden sm:inline">v P0.1 • BM-CDC-00 à 08</span>
        <div className="flex items-center gap-2.5 sm:gap-3 text-slate-500">
          <button onClick={onOpenHelp} className="hover:text-blue-600 transition-colors p-1">
            À propos
          </button>
          <span>•</span>
          <button onClick={onOpenHelp} className="hover:text-blue-600 transition-colors p-1">
            Support
          </button>
        </div>
      </div>
    </footer>
  );
}
