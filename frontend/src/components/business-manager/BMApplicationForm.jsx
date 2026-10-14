import { useState } from 'react';
import { BmButton, BmField, BmFormSection } from './bm/ui.jsx';

export function BMApplicationForm({ onSubmit, onCancel, submitting }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ code, name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <BmFormSection title="Informations générales" description="Identifiez clairement l’application pour les équipes et les intégrations.">
        <div className="grid gap-4 sm:grid-cols-2">
          <BmField label="Code" htmlFor="application-code" required hint="Identifiant technique stable.">
            <input
              id="application-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 bm-focus focus:border-blue-400"
              required
            />
          </BmField>
          <BmField label="Nom" htmlFor="application-name" required>
            <input
              id="application-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 bm-focus focus:border-blue-400"
              required
            />
          </BmField>
        </div>
        <BmField label="Description" htmlFor="application-description" className="mt-4">
          <textarea
            id="application-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 bm-focus focus:border-blue-400"
            rows={3}
          />
        </BmField>
      </BmFormSection>
      <div className="flex flex-wrap justify-end gap-2">
        <BmButton type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</BmButton>
        <BmButton type="submit" disabled={submitting}>{submitting ? 'Création…' : 'Créer l’application'}</BmButton>
      </div>
    </form>
  );
}
