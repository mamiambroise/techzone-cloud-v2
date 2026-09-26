import { routeDefinitions } from './app/navigationConfig.js';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import TechzoneLayout from './layouts/TechzoneLayout.jsx';
import RouteToTabSync from './app/RouteToTabSync.jsx';
import { useModal } from './app/ModalContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFound from './pages/NotFound.jsx';
import { ModernSpinner } from './components/Loaders.jsx';

const GeneralOverviewView = lazy(() => import('./components/GeneralOverviewView.jsx'));
const ApplicationsCatalogView = lazy(() => import('./components/ApplicationsCatalogView.jsx'));
const WorkspaceConfigView = lazy(() => import('./components/WorkspaceConfigView.jsx'));
const VersionsDetailView = lazy(() => import('./components/VersionsDetailView.jsx'));
const PackValidationCockpitView = lazy(() => import('./components/PackValidationCockpitView.jsx'));
const PublicationView = lazy(() => import('./components/PublicationView.jsx'));
const HistoryRollbackView = lazy(() => import('./components/HistoryRollbackView.jsx'));
const SpecificationsView = lazy(() => import('./components/SpecificationsView.jsx'));
const CockpitView = lazy(() => import('./components/CockpitView.jsx'));
const EnvironmentsView = lazy(() => import('./components/EnvironmentsView.jsx'));
const ContractsView = lazy(() => import('./components/ContractsView.jsx'));
const ConfigurationView = lazy(() => import('./components/ConfigurationView.jsx'));
const SnapshotsView = lazy(() => import('./components/SnapshotsView.jsx'));
const PlatformContractView = lazy(() => import('./components/PlatformContractView.jsx'));
const IntegrationsView = lazy(() => import('./components/IntegrationsView.jsx'));
const DeploymentPublicationView = lazy(() => import('./components/deployment/DeploymentPublicationView.jsx'));

const Adapters = lazy(() => import('./pages/Adapters.jsx'));
const Mapping = lazy(() => import('./pages/Mapping.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const DemoPage = lazy(() => import('./pages/DemoPage.jsx'));

const ERPList = lazy(() => import('./pages/ERPList.jsx'));
const ERPCreate = lazy(() => import('./pages/ERPCreate.jsx'));
const ERPEdit = lazy(() => import('./pages/ERPEdit.jsx'));
const ErpModule = lazy(() => import('./pages/ErpModule.jsx'));
const ERPDashboard = lazy(() => import('./pages/ERPDashboard.jsx'));

const IamUsersPage = lazy(() => import('./pages/iam/UsersPage.jsx'));
const SessionsPage = lazy(() => import('./pages/iam/SessionsPage.jsx'));
const IdentitiesPage = lazy(() => import('./pages/iam/IdentitiesPage.jsx'));
const RolesPage = lazy(() => import('./pages/iam/RolesPage.jsx'));
const PoliciesPage = lazy(() => import('./pages/iam/PoliciesPage.jsx'));
const TenantsPage = lazy(() => import('./pages/iam/TenantsPage.jsx'));

const ObservabilityOverview = lazy(() => import('./pages/iam/observability/ObservabilityOverview.jsx'));
const LogsPage = lazy(() => import('./pages/iam/observability/LogsPage.jsx'));
const AuditPage = lazy(() => import('./pages/iam/observability/AuditPage.jsx'));
const SecurityEventsPage = lazy(() => import('./pages/iam/observability/SecurityEventsPage.jsx'));
const MonitoringPage = lazy(() => import('./pages/iam/observability/MonitoringPage.jsx'));
const AlertManagerPage = lazy(() => import('./pages/iam/observability/AlertManagerPage.jsx'));

const DataRuntime = lazy(() => import('./pages/DataRuntime.jsx'));
const DataRuntimeHistory = lazy(() => import('./pages/DataRuntimeHistory.jsx'));
const AutomationCockpit = lazy(() => import('./pages/AutomationCockpit.jsx'));
const AutomationConditions = lazy(() => import('./pages/AutomationConditions.jsx'));
const AutomationHistory = lazy(() => import('./pages/AutomationHistory.jsx'));
const AutomationRules = lazy(() => import('./pages/AutomationRules.jsx'));
const AutomationTriggers = lazy(() => import('./pages/AutomationTriggers.jsx'));
const AutomationWorkflows = lazy(() => import('./pages/AutomationWorkflows.jsx'));

function CockpitRoute() {
  const { openModal } = useModal();
  return (
    <CockpitView
      onOpenNewApp={() => openModal('createApp')}
      onOpenNewSnapshot={() => openModal('createSnapshot')}
    />
  );
}

function OverviewRoute() {
  const { openModal } = useModal();
  return (
    <GeneralOverviewView
      onOpenNewApp={() => openModal('createApp')}
      onOpenAuditLogs={() => openModal('auditLog')}
    />
  );
}

function ApplicationsRoute() {
  const { openModal } = useModal();
  return <ApplicationsCatalogView onOpenNewApp={() => openModal('createApp')} />;
}

function ValidationRoute() {
  const { openModal } = useModal();
  return <PackValidationCockpitView onOpenNewApp={() => openModal('createApp')} />;
}

function SnapshotsRoute() {
  const { openModal } = useModal();
  return <SnapshotsView onOpenCreateSnapshot={() => openModal('createSnapshot')} />;
}

const routeComponents = { CockpitRoute, OverviewRoute, ApplicationsRoute, WorkspaceConfigView, VersionsDetailView, ValidationRoute, PublicationView, HistoryRollbackView, SpecificationsView, EnvironmentsView, ContractsView, ConfigurationView, SnapshotsRoute, PlatformContractView, IntegrationsView, DeploymentPublicationView, IamUsersPage, SessionsPage, IdentitiesPage, RolesPage, PoliciesPage, TenantsPage, ObservabilityOverview, LogsPage, AuditPage, SecurityEventsPage, MonitoringPage, AlertManagerPage, ERPDashboard, ErpModule, ERPList, ERPCreate, ERPEdit, DataRuntime, DataRuntimeHistory, AutomationCockpit, AutomationConditions, AutomationHistory, AutomationRules, AutomationTriggers, AutomationWorkflows, Adapters, Mapping, Settings, DemoPage };

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteToTabSync />
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center min-h-[400px]"><ModernSpinner /></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<TechzoneLayout />}>
                <Route path="/" element={<Navigate to="/cockpit" replace />} />

                {routeDefinitions.map(({ route, component, pageId }) => {
                  const Component = routeComponents[component];
                  return <Route key={route} path={route} element={<Component pageId={pageId} />} />;
                })}
                <Route path="/iam" element={<Navigate to="/iam/users" replace />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
