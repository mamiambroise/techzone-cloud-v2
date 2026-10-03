/**
 * UI Builder — Form Builder (mission §18) : les champs viennent du
 * Business Manager (aucun second modèle métier). Cet écran liste les pages
 * de type FORM et permet de composer des Form/FormField à partir des
 * entités/fields BM réels ; la composition fine se fait dans l'éditeur visuel.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, ArrowRight } from 'lucide-react';

import { fetchPages, generateFormFromEntity, saveCurrentPage, selectPage } from '../store/uiBuilderSlice.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmCard, BmBadge, BmEmptyState, BmErrorState, BmLoading, BmSelect } from '../../../components/business-manager/bm/ui.jsx';
import { ROUTES } from '../../../app/routes.js';

export default function UiFormsBuilder() {
  return (
    <UiBuilderLayout subTab="forms">
      <FormsBody />
    </UiBuilderLayout>
  );
}

function FormsBody() {
  const dispatch = useDispatch();
  const { pages, pagesStatus, businessContext, applicationVersionId } = useSelector((state) => state.uiBuilder);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (applicationVersionId) dispatch(fetchPages(applicationVersionId));
  }, [applicationVersionId, dispatch]);

  const formPages = useMemo(() => pages.filter((p) => p.type === 'FORM'), [pages]);
  const entities = businessContext?.entities || [];
  const entity = entities.find((e) => e.code === selectedEntity);

  const addFormForEntity = async () => {
    if (!entity || !selectedPageId) return;
    // Compose un Form + FormField par champ requis du Business Entity,
    // directement dans la page FORM courante (ou la première page FORM).
    setSaveMessage('');
    dispatch(selectPage(selectedPageId));
    dispatch(generateFormFromEntity({ entity: entity.code, fields: entity.fields || [] }));
    try {
      await dispatch(saveCurrentPage()).unwrap();
      setSaveMessage(`Formulaire enregistré : ${(entity.fields || []).length} champ(s) liés à ${entity.name}.`);
    } catch {
      setSaveMessage('Composition créée, mais la sauvegarde a échoué. Réessayez depuis l’éditeur.');
    }
  };

  if (pagesStatus === 'LOADING') return <BmLoading label="Chargement des formulaires…" />;
  if (pagesStatus === 'ERROR') return <BmErrorState />;

  return (
    <div className="space-y-5">
      <BmCard
        title="Composer un formulaire métier"
        subtitle="Les champs proviennent des entités Business Manager de la version"
      >
        {entities.length === 0 ? (
          <BmEmptyState
            icon={ClipboardList}
            title="Aucune entité Business Manager"
            description="Créez vos modèles de données dans le Business Manager (Modèles de données) pour composer des formulaires."
            action={<Link to={ROUTES.bm} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Business Manager →</Link>}
          />
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <BmSelect
                label="Entité métier"
                value={selectedEntity}
                onChange={(event) => setSelectedEntity(event.target.value)}
                options={[{ value: '', label: '— Choisir une entité —' }, ...entities.map((e) => ({ value: e.code, label: `${e.name} (${e.fields.length} champ(s))` }))]}
              />
            </div>
            <div className="min-w-0 flex-1">
              <BmSelect
                label="Page FORM cible"
                value={selectedPageId}
                onChange={(event) => setSelectedPageId(event.target.value)}
                options={[{ value: '', label: '— Choisir une page —' }, ...formPages.map((page) => ({ value: page.id, label: `${page.title} (${page.route})` }))]}
              />
            </div>
            <button
              onClick={addFormForEntity}
              disabled={!entity || !selectedPageId}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Plus className="h-3.5 w-3.5" /> Composer dans l’éditeur
            </button>
          </div>
        )}
        {saveMessage && <p role="status" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">{saveMessage}</p>}
        {entity && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(entity.fields || []).map((field) => (
              <span key={field.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                {field.label}
                {field.required && <BmBadge tone="blue">requis</BmBadge>}
              </span>
            ))}
          </div>
        )}
      </BmCard>

      <BmCard title={`Pages de type FORM (${formPages.length})`} subtitle="Ouvrez la page dans l’éditeur visuel pour arranger le formulaire">
        {formPages.length === 0 ? (
          <BmEmptyState
            icon={ClipboardList}
            title="Aucune page FORM"
            description="Créez une page de type FORM dans l’écran Pages, puis composez son formulaire."
            action={<Link to={ROUTES.uiPages} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Aller aux Pages →</Link>}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {formPages.map((page) => (
              <li key={page.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{page.title}</p>
                  <p className="truncate font-mono text-xs text-slate-400">{page.route}</p>
                </div>
                <Link
                  to={ROUTES.uiBuilder.replace(':pageId', page.id)}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => dispatch(selectPage(page.id))}
                >
                  Éditer <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </BmCard>
    </div>
  );
}
