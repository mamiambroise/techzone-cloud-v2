// AppShell.jsx — Central Layout Shell for Business Manager
import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumb } from "./Breadcrumb";
import { Footer } from "./Footer";
import { Toast } from "../common/Toast";

// Views
import { OverviewView } from "../views/OverviewView";
import { ApplicationsView } from "../views/ApplicationsView";
import { ApplicationDetailView } from "../views/ApplicationDetailView";
import { NewApplicationView } from "../views/NewApplicationView";
import { VersionsView } from "../views/VersionsView";
import { DataModelView } from "../views/DataModelView";
import { FeatureCapabilityView } from "../views/FeatureCapabilityView";
import { MenuEngineView } from "../views/MenuEngineView";
import { ConfigurationView } from "../views/ConfigurationView";
import { IntegrationBridgeView } from "../views/IntegrationBridgeView";
import { ValidationView } from "../views/ValidationView";
import { AuditView } from "../views/AuditView";
import { E2EBenchView } from "../views/E2EBenchView";
import { IAMDashboardView } from "../views/IAMDashboardView";

// Pack Manager Views (PM-CDC-01 to PM-CDC-07)
import PackOverviewView from "../views/pack-manager/PackOverviewView";
import PacksView from "../views/pack-manager/PacksView";
import PackVersionsView from "../views/pack-manager/PackVersionsView";
import PackModulesView from "../views/pack-manager/PackModulesView";
import PackDependenciesView from "../views/pack-manager/PackDependenciesView";
import PackRulesView from "../views/pack-manager/PackRulesView";
import NewPackModal from "../views/pack-manager/NewPackModal";
import RuntimeCockpitView from "../views/pack-runtime/RuntimeCockpitView";

// Modals
import { NewVersionModal } from "../modals/NewVersionModal";
import { PublishModal } from "../modals/PublishModal";
import { RollbackModal } from "../modals/RollbackModal";
import { CloneModal } from "../modals/CloneModal";
import { StatusTransitionModal } from "../modals/StatusTransitionModal";
import { HelpModal } from "../modals/HelpModal";
import { SettingsModal } from "../modals/SettingsModal";
import { LoginPage } from "../auth/LoginPage";
import { DevelopmentPlaceholder } from "../common/DevelopmentPlaceholder";
import { NotFound } from "../common/NotFound";
import { ApiNotImplementedAlert } from "../common/ApiNotImplementedAlert";
import { findNavigationItem } from "../../lib/navigationConfig";

export function AppShell() {
  const {
    currentView,
    toast,
    showToast,
    apiMissingNotice,
    closeApiMissingNotice,
  } = useApp();
  const [routePath, setRoutePath] = useState(
    () => window.location.pathname || "/dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("ui.sidebar.collapsed") === "true";
    } catch {
      return false;
    }
  });
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

  useEffect(() => {
    const handlePopState = () =>
      setRoutePath(window.location.pathname || "/dashboard");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ui.sidebar.collapsed", String(sidebarCollapsed));
    } catch {
      // UI preference persistence is best effort.
    }
  }, [sidebarCollapsed]);

  const routeItem = findNavigationItem(routePath);
  const transientViews = ["new-application", "application-detail"];
  const routedView = transientViews.includes(currentView)
    ? currentView
    : routeItem?.view || (currentView.startsWith("/") ? null : currentView);
  const isComingSoon = Boolean(routeItem && routeItem.status === "COMING_SOON");
  const isUnknownRoute = !routeItem && routePath !== "/dashboard";

  const handleOpenClone = (app) => {
    setAppToClone(app);
    setIsCloneOpen(true);
  };

  const handleOpenStatusTransition = (app) => {
    setAppToTransition(app);
    setIsStatusTransitionOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FB] overflow-hidden text-slate-900 font-sans antialiased relative">
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
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden border-l border-slate-200/40">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onToggleDesktopSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1720px] 2xl:max-w-[1920px]">
            {/* Navigational Breadcrumb */}
            <Breadcrumb />

            {/* Dynamic View Router */}
            {isUnknownRoute && <NotFound />}
            {isComingSoon && (
              <DevelopmentPlaceholder
                title={routeItem.label}
                module={routeItem.id.split(".")[0]}
                description={routeItem.description}
              />
            )}
            {!isUnknownRoute && !isComingSoon && routedView === "overview" && (
              <OverviewView />
            )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "applications" && (
                <ApplicationsView
                  onOpenCloneModal={handleOpenClone}
                  onOpenTransitionModal={handleOpenStatusTransition}
                />
              )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "new-application" && <NewApplicationView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "application-detail" && (
                <ApplicationDetailView
                  onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
                  onOpenPublishModal={() => setIsPublishOpen(true)}
                  onOpenRollbackModal={() => setIsRollbackOpen(true)}
                />
              )}
            {!isUnknownRoute && !isComingSoon && routedView === "versions" && (
              <VersionsView
                onOpenNewVersionModal={() => setIsNewVersionOpen(true)}
                onOpenPublishModal={() => setIsPublishOpen(true)}
                onOpenRollbackModal={() => setIsRollbackOpen(true)}
              />
            )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "data-model" && <DataModelView />}
            {!isUnknownRoute && !isComingSoon && routedView === "features" && (
              <FeatureCapabilityView />
            )}
            {!isUnknownRoute && !isComingSoon && routedView === "menus" && (
              <MenuEngineView />
            )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "configuration" && <ConfigurationView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "integrations" && <IntegrationBridgeView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "validation" && <ValidationView />}
            {!isUnknownRoute && !isComingSoon && routedView === "audit" && (
              <AuditView />
            )}
            {!isUnknownRoute && !isComingSoon && routedView === "e2e-bench" && (
              <E2EBenchView />
            )}
            {!isUnknownRoute &&
              !isComingSoon &&
              (routedView === "iam-overview" ||
                routedView === "iam-users" ||
                routedView === "iam-roles" ||
                routedView === "iam-tenants") && <IAMDashboardView />}

            {/* Pack Manager Views (PM-CDC-01 to PM-CDC-07) */}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-overview" && (
                <PackOverviewView
                  onOpenNewPackModal={() => setIsNewPackModalOpen(true)}
                />
              )}
            {!isUnknownRoute && !isComingSoon && routedView === "packs" && (
              <PacksView />
            )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-versions" && (
                <PackVersionsView mode={routeItem?.id?.split(".").pop()} />
              )}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-modules" && <PackModulesView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-dependencies" && <PackDependenciesView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-rules" && <PackRulesView />}
            {!isUnknownRoute &&
              !isComingSoon &&
              routedView === "pack-runtime" && (
                <RuntimeCockpitView
                  mode={routeItem?.id?.endsWith(".manifest") ? "manifest" : routeItem?.id?.split(".").pop() || "overview"}
                />
              )}
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
      {apiMissingNotice && (
        <ApiNotImplementedAlert
          {...apiMissingNotice}
          onClose={closeApiMissingNotice}
        />
      )}
    </div>
  );
}
