import React, { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import SubNavBar from "../components/SubNavBar.jsx";
import ApiErrorBanner from "../components/ApiErrorBanner.jsx";
import ToastContainer from "../components/ToastContainer.jsx";
import { ModalProvider, useModal } from "../app/ModalContext.jsx";
import { DashboardProvider } from "../components/dashboard/DashboardContext.jsx";
import CreateAppModal from "../components/CreateAppModal.jsx";
import CreateSnapshotModal from "../components/CreateSnapshotModal.jsx";
import AuditLogModal from "../components/AuditLogModal.jsx";
function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  const { modals, closeModal } = useModal();
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[70] -translate-y-20 rounded bg-white p-3 text-sm shadow focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <ToastContainer />
      <Sidebar isOpen={mobileOpen} onClose={close} />
      <div id="workspace-content" className="flex min-w-0 flex-1 flex-col">
        <Header
          mobileOpen={mobileOpen}
          onToggleMobileSidebar={() => setMobileOpen(true)}
        />
        <SubNavBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 sm:py-6"
        >
          <ApiErrorBanner />
          <Outlet />
        </main>
        <footer className="flex flex-wrap justify-between gap-2 px-4 pb-5 text-[10px] text-slate-400 sm:px-6 lg:px-8">
          <span>Techzone Cloud</span>
          <span>Construction · Publication · Exécution</span>
        </footer>
      </div>
      <CreateAppModal
        isOpen={modals.createApp}
        onClose={() => closeModal("createApp")}
      />
      <CreateSnapshotModal
        isOpen={modals.createSnapshot}
        onClose={() => closeModal("createSnapshot")}
      />
      <AuditLogModal
        isOpen={modals.auditLog}
        onClose={() => closeModal("auditLog")}
      />
    </div>
  );
}
export default function TechzoneLayout() {
  return (
    <ModalProvider>
      <DashboardProvider>
        <Layout />
      </DashboardProvider>
    </ModalProvider>
  );
}
