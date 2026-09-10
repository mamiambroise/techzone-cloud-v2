import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { IamProvider } from './context/IamContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import UsersPage from './pages/Users/UsersPage';
import IdentitiesPage from './pages/Identities/IdentitiesPage';
import IdentityLinksPage from './pages/IdentityLinks/IdentityLinksPage';
import IdentityGroupsPage from './pages/IdentityGroups/IdentityGroupsPage';
import OrganisationsPage from './pages/Organisations/OrganisationsPage';
import TenantsPage from './pages/Tenants/TenantsPage';
import RolesPage from './pages/Roles/RolesPage';
import PoliciesPage from './pages/Policies/PoliciesPage';
import SessionsPage from './pages/Sessions/SessionsPage';
import ContextsPage from './pages/Contexts/ContextsPage';
import InvitationPage from './pages/Invitation/InvitationPage';
import IamOverviewPage from './pages/IamOverview/IamOverviewPage';
import ObservabilityOverview from './pages/Observability/ObservabilityOverview';
import LogsPage from './pages/Observability/LogsPage';
import AuditPage from './pages/Observability/AuditPage';
import SecurityEventsPage from './pages/Observability/SecurityEventsPage';
import MonitoringPage from './pages/Observability/MonitoringPage';
import AlertManagerPage from './pages/Observability/AlertManagerPage';
import OverviewPage from './pages/Admin/OverviewPage';
import UsersAdminPage from './pages/Admin/UsersAdminPage';
import OrganisationsTenantsAdminPage from './pages/Admin/OrganisationsTenantsAdminPage';
import AccessGovernancePage from './pages/Admin/AccessGovernancePage';
import DelegationPage from './pages/Admin/DelegationPage';
import SecurityAuditPage from './pages/Admin/SecurityAuditPage';
import AdminMonitoringPage from './pages/Admin/MonitoringPage';
import AdminActionsPage from './pages/Admin/AdminActionsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invitation/:token" element={<InvitationPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/iam/overview" element={<IamOverviewPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<Placeholder title="Détail utilisateur" />} />
        <Route path="/identities" element={<IdentitiesPage />} />
        <Route path="/identity-links" element={<IdentityLinksPage />} />
        <Route path="/identity-groups" element={<IdentityGroupsPage />} />
        <Route path="/organisations" element={<OrganisationsPage />} />
        <Route path="/organisations/:orgId" element={<Placeholder title="Détail organisation" />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/contexts" element={<ContextsPage />} />
        <Route path="/audit" element={<Placeholder title="Audit & Logs" />} />
        <Route path="/observability" element={<ObservabilityOverview />} />
        <Route path="/observability/logs" element={<LogsPage />} />
        <Route path="/observability/audit" element={<AuditPage />} />
        <Route path="/observability/security-events" element={<SecurityEventsPage />} />
        <Route path="/observability/monitoring" element={<MonitoringPage />} />
        <Route path="/observability/alerts" element={<AlertManagerPage />} />
        <Route path="/admin/overview" element={<OverviewPage />} />
        <Route path="/admin/users" element={<UsersAdminPage />} />
        <Route path="/admin/organisations-tenants" element={<OrganisationsTenantsAdminPage />} />
        <Route path="/admin/access-governance" element={<AccessGovernancePage />} />
        <Route path="/admin/delegation" element={<DelegationPage />} />
        <Route path="/admin/security-audit" element={<SecurityAuditPage />} />
        <Route path="/admin/monitoring" element={<AdminMonitoringPage />} />
        <Route path="/admin/actions" element={<AdminActionsPage />} />
        <Route path="/erps" element={<Placeholder title="ERP Registry" />} />
        <Route path="/mapping" element={<Placeholder title="Mapping" />} />
        <Route path="/adapters" element={<Placeholder title="Adapters" />} />
        <Route path="/settings" element={<Placeholder title="Parametres" />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <IamProvider>
          <AppRoutes />
        </IamProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;