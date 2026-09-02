import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UsersListPage from './pages/UsersListPage';
import Placeholder from './pages/Placeholder';
import DashboardPage from './pages/Dashboard/DashboardPage';
import UsersPage from './pages/Users/UsersPage';
import OrganisationsPage from './pages/Organisations/OrganisationsPage';
import RolesPage from './pages/Roles/RolesPage';
import PoliciesPage from './pages/Policies/PoliciesPage';
import SessionsPage from './pages/Sessions/SessionsPage';
import ContextsPage from './pages/Contexts/ContextsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/:userId" element={<Placeholder title="Détail utilisateur" />} />
        <Route path="/organisations" element={<Placeholder title="Organisations" />} />
        <Route path="/organisations/:orgId" element={<Placeholder title="Détail organisation" />} />
        <Route path="/tenants" element={<Placeholder title="Tenants" />} />
        <Route path="/roles" element={<Placeholder title="Roles" />} />
        <Route path="/audit" element={<Placeholder title="Audit & Logs" />} />
        <Route path="/erps" element={<Placeholder title="ERP Registry" />} />
        <Route path="/mapping" element={<Placeholder title="Mapping" />} />
        <Route path="/adapters" element={<Placeholder title="Adapters" />} />
        <Route path="/settings" element={<Placeholder title="Parametres" />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/organisations" element={<OrganisationsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/contexts" element={<ContextsPage />} />
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
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;