import React, { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import pages from '../app/demoPages.json';
import Placeholder from './Placeholder.jsx';

// Vite removes these imports from the production bundle.
const modules = import.meta.env.DEV
  ? import.meta.glob('../features/iam-demo/pages/**/*.jsx')
  : {};
const components = Object.fromEntries(Object.entries(modules).map(([key, loader]) => [key, lazy(loader)]));

export default function DemoPage({ pageId }) {
  const { demoId } = useParams();
  const page = pages.find(p => p.id === (pageId || demoId));
  const Component = page && components[page.file];
  return <section className="space-y-4">
    <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      Placeholder — maquette conservée. Données fictives et actions locales uniquement ; aucune opération de facturation réelle.
    </div>
    {Component ? <Suspense fallback={<p>Chargement de la démonstration…</p>}><Component /></Suspense>
      : <Placeholder title={page?.label || 'Démonstrations IAM conservées'} />}
    {import.meta.env.DEV && <details><summary>Maquettes conservées</summary><ul>{pages.map(p =>
      <li key={p.id}><Link to={`/demo/iam/${p.id}`}>{p.label}</Link></li>
    )}</ul></details>}
  </section>;
}
