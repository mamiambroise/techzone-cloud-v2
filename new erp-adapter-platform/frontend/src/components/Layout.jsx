import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-16 sm:ml-64' : 'ml-16'}`}>
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Zone de contenu */}
        <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">{children}</main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
          ERP Adapter Platform v1.0.0 — Dolibarr connecte
        </footer>
      </div>
    </div>
  );
}

export default Layout;
