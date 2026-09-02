// AppShell.jsx — Central Layout Shell for Business Manager
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import { Footer } from './Footer';
import { Toast } from '../common/Toast';

// Views
import { OverviewView } from '../views/OverviewView';
import { ApplicationsView } from '../views/ApplicationsView';
import { ApplicationDetailView } from '../views/ApplicationDetailView';
import { NewApplicationView } from '../views/NewApplicationView';
import { VersionsView } from '../views/VersionsView';
import { DataModelView } from '../views/DataModelView';
import { FeatureCapabilityView } from '../views/FeatureCapabilityView';
import { MenuEngineView } from '../views/MenuEngineView';
import { ConfigurationView } from '../views/ConfigurationView';
import { IntegrationBridgeView } from '../views/IntegrationBridgeView';
import { ValidationView } from '../views/ValidationView';
import { AuditView } from '../views/AuditView';
import { E2EBenchView } from '../views/E2EBenchView';
import { IAMDashboardView } from '../views/IAMDashboardView';

// Pack Manager Views (PM-CDC-01 to PM-CDC-07)
import PackOverviewView from '../views/pack-manager/PackOverviewView';
import PacksView from '../views/pack-manager/PacksView';
import PackVersionsView from '../views/pack-manager/PackVersionsView';
import PackModulesView from '../views/pack-manager/PackModulesView';
import PackDependenciesView from '../views/pack-manager/PackDependenciesView';
import PackRulesView from '../views/pack-manager/PackRulesView';
import NewPackModal from '../views/pack-manager/NewPackModal';

// Modals
import { NewVersionModal } from '../modals/NewVersionModal';
import { PublishModal } from '../modals/PublishModal';
import { RollbackModal } from '../modals/RollbackModal';
import { CloneModal } from '../modals/CloneModal';
import { StatusTransitionModal } from '../modals/StatusTransitionModal';
import { HelpModal } from '../modals/HelpModal';
import { SettingsModal } from '../modals/SettingsModal';
import { LoginPage } from '../auth/LoginPage';

export function AppShell() {
  const { currentView, toast, showToast } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [appToClone, setAppToClone] = useState(null);
  const [isStatusTransitionOpen, setIsStatusTransitionOpen] = useState(false);
  const [appToTransition, setAppToTransition] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewPackModalOpen, setIsNewPackModalOpen] = useState(false);

  const handleOpenClone = (app) => {
    setAppToClone(app);
    setIsCloneOpen(true);
  };

  const handleOpenStatusTransition = (app) => {
    setAppToTransition(app);
    setIsStatusTransitionOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans antialiased relative">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* 1. Dark Enterprise Sidebar (Desktop static / Mobile sliding drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isMobileDrawer={mobileMenuOpen}
        />
      </div>

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onToggleDesktopSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5">
          <div className="w-full max-w-[1720px] 2xl:max-w-[1920px] mx-auto">
            {/* Navigational Breadcrumb */}
            <Breadcrumb />

            {/* Dynamic View Router */}
            {currentView === 'overview' && <OverviewView />}
            {currentView === 'applications' && (
              <ApplicationsView
                onOpenCloneModal={handleOpenClone}
                onOpenTransitionModal={handleOpenStatusTransition}
              />
            )}
            {currentView === 'new-application' && <NewApplicationView />}
            {currentView === 'application-detail' && (
              <ApplicationDetailView
                onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
                onOpenPublishModal={() => setIsPublishOpen(true)}
                onOpenRollbackModal={() => setIsRollbackOpen(true)}
              />
            )}
            {currentView === 'versions' && (
              <VersionsView
                onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
                onOpenPublishModal={() => setIsPublishOpen(true)}
                onOpenRollbackModal={() => setIsRollbackOpen(true)}
              />
            )}
            {currentView === 'data-model' && <DataModelView />}
            {currentView === 'features' && <FeatureCapabilityView />}
            {currentView === 'menus' && <MenuEngineView />}
            {currentView === 'configuration' && <ConfigurationView />}
            {currentView === 'integrations' && <IntegrationBridgeView />}
            {currentView === 'validation' && <ValidationView />}
            {currentView === 'audit' && <AuditView />}
            {currentView === 'e2e-bench' && <E2EBenchView />}
            {(currentView === 'iam-overview' || currentView === 'iam-users' || currentView === 'iam-roles' || currentView === 'iam-tenants') && (
              <IAMDashboardView />
            )}

            {/* Pack Manager Views (PM-CDC-01 to PM-CDC-07) */}
            {currentView === 'pack-overview' && (
              <PackOverviewView onOpenNewPackModal={() => setIsNewPackModalOpen(true)} />
            )}
            {currentView === 'packs' && <PacksView />}
            {currentView === 'pack-versions' && <PackVersionsView />}
            {currentView === 'pack-modules' && <PackModulesView />}
            {currentView === 'pack-dependencies' && <PackDependenciesView />}
            {currentView === 'pack-rules' && <PackRulesView />}
          </div>
        </main>

        {/* Bottom Platform Footer */}
        <Footer onOpenHelp={() => setIsHelpOpen(true)} />
      </div>

      {/* Modals & Notification Toasts */}
      <NewPackModal
        isOpen={isNewPackModalOpen}
        onClose={() => setIsNewPackModalOpen(false)}
      />
      <NewVersionModal
        isOpen={isNewVersionOpen}
        onClose={() => setIsNewVersionOpen(false)}
      />
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
      />
      <RollbackModal
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
      />
      <CloneModal
        isOpen={isCloneOpen}
        onClose={() => {
          setIsCloneOpen(false);
          setAppToClone(null);
        }}
        appToClone={appToClone}
      />
      <StatusTransitionModal
        isOpen={isStatusTransitionOpen}
        onClose={() => {
          setIsStatusTransitionOpen(false);
          setAppToTransition(null);
        }}
        targetApp={appToTransition}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => showToast(null)} />
    </div>
  );
}
