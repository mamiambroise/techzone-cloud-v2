import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function StaleDataBanner({ isStale }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isStale || !isVisible) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-amber-900">
          Mode hors ligne — données affichées non synchronisées avec le serveur (données de démonstration).
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
