import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/cockpit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Retour au cockpit
        </Link>
      </div>
    </div>
  );
}
