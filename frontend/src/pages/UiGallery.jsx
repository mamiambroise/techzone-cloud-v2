import React, { useState } from 'react';
import ModuleTabs from '../components/ui/ModuleTabs.jsx';
import { Card } from '../components/ui/Card.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';

const previewTabs = [
  { id: 'overview', label: 'Vue d’ensemble', route: '/demo/ui-gallery', icon: 'LayoutDashboard' },
  { id: 'forms', label: 'Formulaires', route: '/demo/ui-gallery?section=forms', icon: 'FormInput' },
  { id: 'states', label: 'États', route: '/demo/ui-gallery?section=states', icon: 'CheckCircle2' },
];

/**
 * Internal visual reference. It deliberately composes production primitives;
 * the global Header and Sidebar are supplied by TechzoneLayout.
 */
export default function UiGallery() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8" aria-labelledby="ui-gallery-title">
      <PageHeader
        title="Galerie UI/UX"
        subtitle="Référence interne Techzone Classic — composants réellement utilisés dans l’application."
        action={{ label: 'Ouvrir la confirmation', onClick: () => setDialogOpen(true) }}
      />

      <section aria-labelledby="ui-gallery-tabs">
        <h2 id="ui-gallery-tabs" className="mb-3 text-sm font-semibold text-[var(--color-text)]">Navigation de module</h2>
        <ModuleTabs tabs={previewTabs} activeId="overview" ariaLabel="Exemple d’onglets de module" />
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="États des cartes">
        <Card title="Carte standard" description="Surface, bordure et typographie partagées.">
          <span className="inline-flex rounded-full bg-[var(--color-info-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">Information</span>
        </Card>
        <Card title="État de chargement" description="Un chargement reste local au contenu concerné.">
          <div className="h-2 w-3/4 animate-pulse rounded bg-[var(--color-border)]" aria-label="Chargement" />
        </Card>
        <Card title="État d’erreur" description="Les messages restent explicites et actionnables.">
          <p className="rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">Impossible de charger les données.</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Formulaires et actions">
        <Card title="Champ et sélection" description="États normaux, focus et désactivés s’appuient sur les mêmes tokens.">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="gallery-name">Libellé
              <input id="gallery-name" className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" placeholder="Exemple" />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="gallery-scope">Contexte
              <select id="gallery-scope" className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                <option>Tenant</option>
                <option>Plateforme</option>
              </select>
            </label>
          </div>
        </Card>
        <Card title="Actions" description="Les variantes sont limitées aux actions réellement nécessaires.">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">Action principale</button>
            <button type="button" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">Secondaire</button>
            <button type="button" disabled className="rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white opacity-50">Désactivée</button>
          </div>
        </Card>
      </section>

      <ConfirmModal
        open={dialogOpen}
        title="Exemple de confirmation"
        message="Cette modale réutilise la primitive de confirmation de production."
        onConfirm={() => setDialogOpen(false)}
        onCancel={() => setDialogOpen(false)}
      />
    </main>
  );
}
