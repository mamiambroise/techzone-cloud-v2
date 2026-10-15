import { render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach,describe,expect,it,vi } from 'vitest';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import PackManagerPage from './PackManagerPage.jsx';

vi.mock('../../services/apiClient.js',() => ({ api:{ get:vi.fn(),post:vi.fn(),patch:vi.fn() } }));
vi.mock('../../contexts/TenantProvider.jsx',() => ({ useTenant:() => ({ activeTenant:{ id:'tenant-a',name:'Tenant A' } }) }));
vi.mock('../../auth/AuthProvider.jsx',() => ({ useAuth:() => ({ user:{ isAdmin:true,permissions:['*'] } }) }));

const manifest = {
  contract:'techzone.pack-manifest',
  contractVersion:'1.0.0',
  snapshotHash:'sha256:snapshot',
  definition:{ pack:{ code:'pack-a',name:'Pack A' },modules:[],features:[],dependencies:[],rules:[] },
};
const version = {
  id:'version-a',
  packId:'pack-a',
  versionNumber:'1.0.0',
  status:'PUBLISHED',
  validationStatus:'VALID',
  manifestStatus:'PUBLISHED',
  applicationVersionId:'application-version-a',
  applicationVersion:{ applicationId:'application-a',version:'2.0.0',status:'READY',application:{ name:'Application A' } },
  snapshot:{ id:'snapshot-a',createdAt:'2026-01-01T00:00:00.000Z',snapshotHash:'sha256:snapshot',content:{ modules:[],features:[],dependencies:[],rules:[] } },
  manifest:{ id:'manifest-a',contractVersion:'1.0.0',manifestHash:'sha256:manifest',status:'PUBLISHED',content:manifest },
  snapshotHash:'sha256:snapshot',
  manifestHash:'sha256:manifest',
  dependencies:[],
  modules:[],
  features:[],
  rules:[],
  createdAt:'2026-01-01T00:00:00.000Z',
  publishedAt:'2026-01-02T00:00:00.000Z',
};
const pack = {
  id:'pack-a',
  code:'pack-a',
  name:'Pack A',
  description:'Pack de test',
  status:'ACTIVE',
  applicationId:'application-a',
  archivedAt:null,
  versions:[version],
};

describe('PackManagerPage',() => {
  beforeEach(() => {
    sessionStorage.clear();
    api.get.mockImplementation(path => {
      const responses = {
        '/pack-manager/dashboard':{ counters:{ packs:1,drafts:0,published:1,attention:0 },activity:[] },
        '/pack-manager/packs?limit=100':[pack],
        '/pack-manager/capabilities':[],
        '/pack-manager/registry':[],
        '/pack-manager/packs/pack-a':pack,
        '/pack-manager/versions/version-a':version,
      };
      return Promise.resolve({ data:responses[path] });
    });
  });

  it('shows a published version as read-only and exposes the manifest views',async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/packs/manifest?pack=pack-a&version=version-a']}>
        <Routes><Route path="/packs/:section?" element={<PackManagerPage/>}/></Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('PUBLISHED — lecture seule')).toBeInTheDocument();
    expect(screen.getByRole('tab',{ name:'Manifest' })).toHaveAttribute('aria-selected','true');
    await user.click(screen.getByRole('tab',{ name:'JSON' }));
    expect(screen.getByText(/techzone\.pack-manifest/)).toBeInTheDocument();
    expect(screen.getAllByText(/sha256:snapshot/).length).toBeGreaterThan(0);
  });
});
