// App.jsx — Root Application in pure React JavaScript (.jsx)
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './components/auth/LoginPage';
import { Toast } from './components/common/Toast';

function AppContent() {
  const { isAuthenticated, toast, showToast } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toast toast={toast} onClose={() => showToast(null)} />
      </>
    );
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
