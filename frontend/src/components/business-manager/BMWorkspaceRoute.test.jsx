import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BMWorkspaceRoute from './BMWorkspaceRoute.jsx';
import { BMResourceEditor } from './BMResourceEditor.jsx';
import { api } from '../../services/apiClient.js';
vi.mock('../../services/apiClient.js',()=>({api:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}}));
vi.mock('../../contexts/TenantProvider.jsx',()=>({useTenant:()=>({activeTenant:{id:'tenant-a',name:'Tenant A'}})}));
beforeEach(()=>{vi.clearAllMocks();sessionStorage.clear();});
function mount() { return render(<MemoryRouter initialEntries={['/business-manager/applications/app-a/versions/version-a/data-model']}><Routes><Route path="/business-manager/applications/:applicationId/versions/:versionId/data-model" element={<BMWorkspaceRoute />} /></Routes></MemoryRouter>); }
describe('BM workspace',()=>{
  it('loads schema for the explicitly selected version and preserves tenant context',async()=>{
    api.get.mockImplementation(async url=>({data:url.endsWith('/applications')?[{id:'app-a',name:'Application A'}]:url.endsWith('/versions')?[{id:'version-a',version:'1.0',status:'DRAFT'}]:[]}));
    mount();await screen.findAllByText('Créer une entité');
    expect(api.get).toHaveBeenCalledWith('/business-manager/data-model/version-a/schema');
    expect(JSON.parse(sessionStorage.getItem('bm-context:tenant-a'))).toEqual({applicationId:'app-a',versionId:'version-a'});
  });
  it('shows a safe retry state instead of exposing SQL failures',async()=>{
    api.get.mockRejectedValue(new Error('Prisma SQL secret'));
    mount();await screen.findByRole('alert');expect(screen.queryByText(/Prisma SQL/)).not.toBeInTheDocument();expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });
  it('submits only declared fields, retaining false checkbox values',async()=>{
    const save=vi.fn().mockResolvedValue({});render(<BMResourceEditor fields={[{key:'name',label:'Nom'},{key:'required',label:'Obligatoire',type:'checkbox'}]} initial={{id:'internal',tenantId:'private',name:'Name',required:true}} onSave={save} onCancel={()=>{}} />);
    fireEvent.click(screen.getByLabelText('Obligatoire'));fireEvent.click(screen.getByText('Enregistrer'));
    await waitFor(()=>expect(save).toHaveBeenCalledWith({name:'Name',required:false}));
  });
});
