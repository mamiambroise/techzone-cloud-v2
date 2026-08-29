import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Zone de contenu */}
        <main className="p-6 min-h-[calc(100vh-4rem)]">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500">
          ERP Adapter Platform v1.0.0 — Phase 2
        </footer>
      </div>
    </div>
  );
}

export default Layout;
