import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { ROUTES } from '../app/routes.js';
export default function ComingSoon({ title, description, module, plannedPhase }) {
  return <section className="w-full py-8" data-testid="coming-soon">
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
      <Construction className="mb-4 h-9 w-9 text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500">{module}</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{description}</p>
      <p className="mt-4 text-sm text-slate-500">Fonctionnalité non disponible{plannedPhase ? ` — prévue en phase ${plannedPhase}` : ' dans cette version'}.</p>
      <Link to={ROUTES.bm} className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Retour au Business Manager</Link>
    </div>
  </section>;
}
