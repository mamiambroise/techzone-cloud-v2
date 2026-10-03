import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { navigationGroups, groupEntries, groupDestination, resolveRoute } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from './AuthProvider.jsx';
import { ROUTES } from '../app/routes.js';

// Écran 403 rendu dans le shell applicatif : la navigation reste disponible
// et aucune donnée du module interdit n'est chargée.
export default function ForbiddenPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const segment = pathname.split('/').filter(Boolean)[0];
  const section = navigationGroups.find((group) =>
    groupEntries(group.id).some((entry) => entry.route.split('/').filter(Boolean)[0] === segment),
  );
  const homes = navigationGroups
    .map((group) => ({ group, home: groupDestination(group.id) }))
    // Ne jamais proposer une page elle-même planifiée : on retombe sur l'accueil.
    .filter(({ group, home }) => Boolean(home) && resolveRoute(home)?.implemented === true && canReach(group, user));
  const targets = homes.length > 0 ? homes : [{ group: null, home: ROUTES.dashboard }];
  return (
    <section role="alert" data-testid="forbidden-page" className="w-full py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
        <ShieldAlert className="mb-4 h-9 w-9 text-amber-600" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500">Erreur 403</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Accès refusé</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          {section
            ? `Vous ne disposez pas des droits nécessaires pour ouvrir cet écran de « ${section.label} ».`
            : 'Vous ne disposez pas des droits nécessaires pour ouvrir cet écran.'}
        </p>
        <nav aria-label="Modules autorisés" className="mt-6 flex flex-wrap gap-2">
            {targets.map(({ group, home }) => (
              <Link
                key={group?.id ?? 'dashboard'}
                to={home}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {group?.label ?? 'Tableau de bord'}
              </Link>
            ))}
          </nav>
      </div>
    </section>
  );
}

function canReach(group, user) {
  return groupEntries(group.id).some((entry) => canAccess(entry, user));
}