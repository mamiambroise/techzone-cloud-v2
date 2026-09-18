import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Fermer le drawer mobile à chaque changement de page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Verrouiller le scroll quand le drawer mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Sidebar : desktop collapsible, mobile = drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileOpen={mobileOpen}
      />

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[68px]'} ml-0`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onOpenMobile={() => setMobileOpen(true)} />

        <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">{children}</main>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
          ERP Adapter Platform v1.0.0 — Dolibarr connecte
        </footer>
      </div>
    </div>
  );
}

export default Layout;