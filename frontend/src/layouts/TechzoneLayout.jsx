import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SubNavBar from '../components/SubNavBar.jsx';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import ToastContainer from '../components/ToastContainer.jsx';
import { ModalProvider, useModal } from '../app/ModalContext.jsx';

import CreateAppModal from '../components/CreateAppModal.jsx';
import CreateSnapshotModal from '../components/CreateSnapshotModal.jsx';
import AuditLogModal from '../components/AuditLogModal.jsx';

function TechzoneLayoutInner() {
  const isBM = useLocation().pathname.startsWith('/business-manager');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { openModal } = useModal();
  const activeUser = useSelector((state) => state.platform.activeUser);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <ToastContainer />

      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-250">
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenNewApp={() => openModal('createApp')}
        />

        <SubNavBar />

        <main className="flex-1 w-full px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
          <div className="min-w-0">
            <ApiErrorBanner />
            <Outlet />
          </div>
        </main>

        {!isBM && <footer className="w-full px-3.5 sm:px-6 lg:px-8 pb-6">
          <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5 font-mono">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800">
                Techzone Cloud — Platform Cockpit
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-blue-600 font-medium px-2 py-0.5 rounded bg-blue-50 border border-blue-100 shrink-0">
                Série Officielle PF-CDC-00 à 06
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] flex-wrap justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Opérationnel
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-800 font-semibold">{activeUser?.name || activeUser?.displayName || 'Utilisateur'}</span>
            </div>
          </div>
        </footer>}
      </div>

      <Modals />
    </div>
  );
}

function Modals() {
  const { modals, closeModal } = useModal();

  return (
    <>
      <CreateAppModal
        isOpen={modals.createApp}
        onClose={() => closeModal('createApp')}
      />
      <CreateSnapshotModal
        isOpen={modals.createSnapshot}
        onClose={() => closeModal('createSnapshot')}
      />
      <AuditLogModal
        isOpen={modals.auditLog}
        onClose={() => closeModal('auditLog')}
      />
    </>
  );
}

export default function TechzoneLayout() {
  return (
    <ModalProvider>
      <TechzoneLayoutInner />
    </ModalProvider>
  );
}
