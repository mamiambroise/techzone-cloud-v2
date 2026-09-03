// Footer.jsx — Standard footer tag
import React from 'react';

export function Footer({ onOpenHelp }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-400 sm:px-6">
      <div className="truncate">Copyright © 2026 Techzone Cloud</div>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-mono text-slate-500 hidden sm:inline">v P0.1 • BM-CDC-00 à 08</span>
        <div className="flex items-center gap-2.5 text-slate-500 sm:gap-3">
          <button onClick={onOpenHelp} className="rounded-md p-1 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            À propos
          </button>
          <span>•</span>
          <button onClick={onOpenHelp} className="rounded-md p-1 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Support
          </button>
        </div>
      </div>
    </footer>
  );
}
