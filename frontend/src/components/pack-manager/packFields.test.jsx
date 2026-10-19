import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BMResourceEditor } from '../business-manager/BMResourceEditor.jsx';
import { ApplicationVersionSelect } from './PackManagerPage.jsx';
import { versionFields } from './packFields.js';

describe('Pack Manager version fields', () => {
  it('requires an application version and clears it when the selected application changes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const applications = [
      { id:'app-a',name:'Application A',code:'APP_A' },
      { id:'app-b',name:'Application B',code:'APP_B' },
    ];
    const applicationVersions = [
      { id:'version-a',version:'1.0.0',status:'READY' },
      { id:'version-b',version:'2.0.0',status:'ACTIVE' },
    ];
    const fields = versionFields(applications,applicationVersions,false);

    render(
      <BMResourceEditor
        fields={fields}
        initial={{ applicationId:'app-a',applicationVersionId:'version-a' }}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    const applicationVersion = screen.getByLabelText('Application Version');
    expect(applicationVersion).toBeRequired();
    await user.selectOptions(screen.getByLabelText('Application'),'app-b');
    expect(applicationVersion).toHaveValue('');
    await user.selectOptions(applicationVersion,'version-b');
    await user.click(screen.getByRole('button',{ name:'Enregistrer' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('applicationId');
    expect(onSave.mock.calls[0][0]).toHaveProperty('applicationVersionId','version-b');
  });

  it('searches and filters ApplicationVersions by version and status', async () => {
    const user = userEvent.setup();
    render(
      <ApplicationVersionSelect
        value=""
        onChange={vi.fn()}
        loading={false}
        versions={[
          { id:'version-a',version:'1.0.0',status:'READY',validationStatus:'VALID' },
          { id:'version-b',version:'2.0.0',status:'ACTIVE',validationStatus:'VALID' },
        ]}
      />
    );

    await user.type(screen.getByLabelText('Rechercher une ApplicationVersion'),'2.0');
    let options = [...screen.getByLabelText('Application Version').options].map(option => option.value);
    expect(options).toEqual(['','version-b']);

    await user.clear(screen.getByLabelText('Rechercher une ApplicationVersion'));
    await user.selectOptions(screen.getByLabelText('Filtrer les ApplicationVersions par statut'),'READY');
    options = [...screen.getByLabelText('Application Version').options].map(option => option.value);
    expect(options).toEqual(['','version-a']);
  });

  it('shows the server error when saving fails', async () => {
    const user = userEvent.setup();
    render(
      <BMResourceEditor
        fields={[{ key:'name',label:'Nom',required:true }]}
        onSave={vi.fn().mockRejectedValue({ normalized:{ message:'APPLICATION_VERSION_NOT_FOUND' } })}
        onCancel={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText('Nom'),'Pack test');
    await user.click(screen.getByRole('button',{ name:'Enregistrer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('APPLICATION_VERSION_NOT_FOUND');
  });
});
