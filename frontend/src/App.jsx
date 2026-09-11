import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './utils/api.js';
import { setApiStatus } from './store/platformSlice.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import SubNavBar from './components/SubNavBar.jsx';
import ToastContainer from './components/ToastContainer.jsx';

// Pack Manager Views matching the design screenshots
import GeneralOverviewView from './components/GeneralOverviewView.jsx';
import ApplicationsCatalogView from './components/ApplicationsCatalogView.jsx';
import WorkspaceConfigView from './components/WorkspaceConfigView.jsx';
import VersionsDetailView from './components/VersionsDetailView.jsx';
import PackValidationCockpitView from './components/PackValidationCockpitView.jsx';
import PublicationView from './components/PublicationView.jsx';
import HistoryRollbackView from './components/HistoryRollbackView.jsx';
import SpecificationsView from './components/SpecificationsView.jsx';

// Secondary foundation views for other platform modules
import CockpitView from './components/CockpitView.jsx';
import EnvironmentsView from './components/EnvironmentsView.jsx';
import ContractsView from './components/ContractsView.jsx';
import ConfigurationView from './components/ConfigurationView.jsx';
import SnapshotsView from './components/SnapshotsView.jsx';
import PlatformContractView from './components/PlatformContractView.jsx';
import IntegrationsView from './components/IntegrationsView.jsx';
import DeploymentPublicationView from './components/deployment/DeploymentPublicationView.jsx';

// Modals
import CreateAppModal from './components/CreateAppModal.jsx';
import CreateSnapshotModal from './components/CreateSnapshotModal.jsx';
import AuditLogModal from './components/AuditLogModal.jsx';

export default function App() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.platform.activeTab);
  const activeModuleId = useSelector((state) => state.platform.activeModuleId || '01');
  const sidebarCollapsed = useSelector((state) => state.platform.sidebarCollapsed);
  const activeUser = useSelector((state) => state.platform.activeUser);

  useEffect(() => {
    api.health()
      .then(() => dispatch(setApiStatus('CONNECTED')))
      .catch(() => dispatch(setApiStatus('OFFLINE')));
  }, [dispatch]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [showCreateSnapshotModal, setShowCreateSnapshotModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // All sub-sections are housed inside the Platform Foundation grand section
  const isPlatformFoundationActive =
    activeModuleId === '01' ||
    [
      'platform-contract',
      'contract-v1',
      'cockpit',
      'overview',
      'applications',
      'workspace',
      'versions',
      'validation',
      'publication',
      'environments',
      'contracts',
      'config',
      'snapshots',
      'history',
      'specifications',
      'integrations',
      'deployment',
    ].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Responsive Left Sidebar (Fixed on desktop, drawer on mobile/tablet) */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area: dynamically offsets according to desktop sidebar state */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-250 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenNewApp={() => setShowCreateAppModal(true)}
        />

        {/* Sub-Navigation Tabs Bar (Visible across all Platform Foundation sub-sections) */}
        {isPlatformFoundationActive && <SubNavBar />}

        {/* Primary View Container with responsive paddings */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
          <div className="animate-in fade-in duration-150">
            {/* 1. Pack Manager Sub-views */}
            {activeTab === 'overview' && (
              <GeneralOverviewView
                onOpenNewApp={() => setShowCreateAppModal(true)}
                onOpenAuditLogs={() => setShowAuditModal(true)}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsCatalogView onOpenNewApp={() => setShowCreateAppModal(true)} />
            )}

            {activeTab === 'workspace' && <WorkspaceConfigView />}

            {activeTab === 'versions' && <VersionsDetailView />}

            {activeTab === 'validation' && (
              <PackValidationCockpitView onOpenNewApp={() => setShowCreateAppModal(true)} />
            )}

            {activeTab === 'publication' && <PublicationView />}

            {activeTab === 'history' && <HistoryRollbackView />}

            {activeTab === 'specifications' && <SpecificationsView />}

            {/* 2. Secondary Foundation Modules */}
            {activeTab === 'cockpit' && (
              <CockpitView
                onOpenNewApp={() => setShowCreateAppModal(true)}
                onOpenNewSnapshot={() => setShowCreateSnapshotModal(true)}
              />
            )}

            {activeTab === 'environments' && <EnvironmentsView />}

            {activeTab === 'contracts' && <ContractsView />}

            {activeTab === 'config' && <ConfigurationView />}

            {activeTab === 'integrations' && <IntegrationsView />}

            {activeTab === 'deployment' && <DeploymentPublicationView />}

            {activeTab === 'snapshots' && (
              <SnapshotsView onOpenCreateSnapshot={() => setShowCreateSnapshotModal(true)} />
            )}

            {(activeTab === 'platform-contract' || activeTab === 'contract-v1') && (
              <PlatformContractView />
            )}
          </div>
        </main>

        {/* Responsive Footer */}
        <footer className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-6">
          <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5 font-mono">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800">
                Techzone Cloud — Platform Foundation (Team 4)
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-blue-600 font-medium px-2 py-0.5 rounded bg-blue-50 border border-blue-100 shrink-0">
                Série Officielle PF-CDC-00 à 06
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-emerald-700 font-medium px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 shrink-0">
                Platform Contract v1 🔒 Locked
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] flex-wrap justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Opérationnel
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-800 font-semibold">{activeUser?.name}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CreateAppModal
        isOpen={showCreateAppModal}
        onClose={() => setShowCreateAppModal(false)}
      />

      <CreateSnapshotModal
        isOpen={showCreateSnapshotModal}
        onClose={() => setShowCreateSnapshotModal(false)}
      />

      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
}
