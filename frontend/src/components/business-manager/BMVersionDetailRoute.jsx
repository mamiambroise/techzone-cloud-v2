import { useState } from 'react';
import { useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader.jsx';
import { ContextBar } from '../ContextBar.jsx';
import { pageDefinitions } from '../../app/navigationConfig.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';

const bmSubTabs = pageDefinitions.filter(entry => entry.versionSection);

export function BMVersionDetailRoute() {
  const { applicationId, versionId } = useParams();
  const { activeTenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('data-model');

  return (
    <>
      <ContextBar
        application={applicationId}
        version={versionId}
        status={null}
        environment={null}
        tenant={activeTenant?.name}
      />
      <PageHeader
        title={`Version ${versionId || '—'}`}
        subtitle={`Application: ${applicationId || '—'}`}
        breadcrumb={[
          { label: 'Business Manager', onClick: () => navigate('/business-manager') },
          { label: 'Applications', onClick: () => navigate('/business-manager/applications') },
          { label: applicationId, onClick: () => navigate(`/business-manager/applications/${applicationId}`) },
          { label: 'Versions', onClick: () => navigate(`/business-manager/applications/${applicationId}/versions`) },
          { label: versionId },
        ]}
      />
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 bg-gray-50">
          {bmSubTabs.map(tab => {
            const isActive = location.pathname.includes(`/${tab.id}`);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.route.replace(':applicationId', applicationId).replace(':versionId', versionId));
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs text-gray-400">Phase {tab.phase}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          {activeTab.replace('-', ' ')} — fonctionnalité en développement (Phase {bmSubTabs.find(t => t.id === activeTab)?.phase || '?'})
        </div>
      </div>
    </>
  );
}
