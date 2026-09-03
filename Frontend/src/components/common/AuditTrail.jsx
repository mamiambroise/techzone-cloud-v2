// AuditTrail.jsx — Centralized Audit & Governance Log Component
// Comprehensive Search & Filter interface for logs by user, action type, date range, category, and traceId.
import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Calendar,
  CalendarDays,
  Clock,
  User,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileCode,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  GitBranch,
  Boxes,
  Database,
  Sliders,
  ExternalLink,
  Code2,
  Table as TableIcon,
  ListFilter,
  FileSpreadsheet,
  X,
  ArrowUpDown,
  Zap,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "./StatusBadge";

export function AuditTrail({
  applicationId = null,
  versionId = null,
  compact = false,
  title = null,
  subtitle = null,
  showStats = true,
  showFilters = true,
  showExport = true,
  limit = null,
  defaultViewMode = "timeline", // 'timeline' | 'table'
  onSelectLog = null,
  className = "",
}) {
  const {
    activities = [],
    applications = [],
    versions = [],
    currentUser,
    currentTenant,
    showToast,
  } = useApp();

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedActionType, setSelectedActionType] = useState("ALL");
  const [selectedAppFilter, setSelectedAppFilter] = useState(
    applicationId || "ALL",
  );
  const [selectedVersionFilter, setSelectedVersionFilter] = useState(
    versionId || "ALL",
  );
  const [selectedActorFilter, setSelectedActorFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Date range filters
  const [timeRange, setTimeRange] = useState("ALL"); // 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Sorting & Display
  const [sortOrder, setSortOrder] = useState("DESC"); // 'DESC' | 'ASC'
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Inspector Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedTraceId, setCopiedTraceId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState("diff"); // 'diff' | 'raw' | 'details'

  // --- Dynamic Metadata Extractors ---
  // Unique actors with event counts
  const uniqueActors = useMemo(() => {
    const actorsMap = new Map();
    activities.forEach((act) => {
      const id = act.actorId || "usr_unknown";
      const existing = actorsMap.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        actorsMap.set(id, {
          id,
          name: act.actorName || "Utilisateur",
          role: act.actorRole || act.metadata?.role || "USER",
          email: act.actorEmail || act.metadata?.userEmail || "",
          count: 1,
        });
      }
    });
    return Array.from(actorsMap.values());
  }, [activities]);

  // Unique specific action types with event counts
  const uniqueActionTypes = useMemo(() => {
    const actionMap = new Map();
    activities.forEach((act) => {
      const actName = act.action || act.eventType || "ACTION";
      const count = actionMap.get(actName) || 0;
      actionMap.set(actName, count + 1);
    });
    return Array.from(actionMap.entries()).map(([action, count]) => ({
      action,
      count,
    }));
  }, [activities]);

  // Available versions for selected application
  const availableVersions = useMemo(() => {
    if (applicationId) {
      return versions.filter((v) => v.applicationId === applicationId);
    }
    if (selectedAppFilter !== "ALL") {
      return versions.filter((v) => v.applicationId === selectedAppFilter);
    }
    return versions;
  }, [versions, applicationId, selectedAppFilter]);

  // --- Core Filtering Engine ---
  const filteredActivities = useMemo(() => {
    let list = [...activities];

    // 1. Application scope
    const effectiveAppId =
      applicationId || (selectedAppFilter !== "ALL" ? selectedAppFilter : null);
    if (effectiveAppId) {
      list = list.filter((act) => act.applicationId === effectiveAppId);
    }

    // 2. Version scope
    const effectiveVerId =
      versionId ||
      (selectedVersionFilter !== "ALL" ? selectedVersionFilter : null);
    if (effectiveVerId) {
      list = list.filter(
        (act) =>
          act.versionId === effectiveVerId ||
          act.targetId === effectiveVerId ||
          act.versionNumber === effectiveVerId,
      );
    }

    // 3. User / Actor Filter
    if (selectedActorFilter !== "ALL") {
      list = list.filter((act) => act.actorId === selectedActorFilter);
    }

    // 4. Specific Action Type Filter
    if (selectedActionType !== "ALL") {
      list = list.filter(
        (act) => (act.action || act.eventType) === selectedActionType,
      );
    }

    // 5. Category Filter
    if (selectedCategory !== "ALL") {
      if (selectedCategory === "VERSIONING") {
        list = list.filter(
          (act) =>
            act.targetType === "APPLICATION_VERSION" ||
            act.targetType === "PUBLICATION" ||
            act.action?.includes("VERSION") ||
            act.eventType?.includes("version") ||
            act.action?.includes("PUBLISH") ||
            act.action?.includes("ROLLBACK"),
        );
      } else if (selectedCategory === "LIFECYCLE") {
        list = list.filter(
          (act) =>
            act.targetType === "APPLICATION" ||
            act.action?.includes("APPLICATION") ||
            act.action?.includes("STATUS") ||
            act.action?.includes("CLONE") ||
            act.eventType?.includes("application"),
        );
      } else if (selectedCategory === "DATA_MODEL") {
        list = list.filter(
          (act) =>
            act.targetType === "DATA_MODEL" ||
            act.targetType === "DATA_SCHEMA" ||
            act.action?.includes("DATA") ||
            act.action?.includes("SCHEMA") ||
            act.action?.includes("ENTITY") ||
            act.action?.includes("FIELD"),
        );
      } else if (selectedCategory === "FEATURES_MENUS") {
        list = list.filter(
          (act) =>
            act.targetType === "FEATURE" ||
            act.targetType === "MENU" ||
            act.action?.includes("FEATURE") ||
            act.action?.includes("MENU") ||
            act.action?.includes("CAPABILITY"),
        );
      } else if (selectedCategory === "INTEGRATIONS") {
        list = list.filter(
          (act) =>
            act.targetType === "INTEGRATION" ||
            act.action?.includes("INTEGRATION") ||
            act.eventType?.includes("integration"),
        );
      } else if (selectedCategory === "PACKS") {
        list = list.filter(
          (act) =>
            act.targetType?.includes("PACK") ||
            act.action?.includes("PACK") ||
            act.eventType?.includes("pack"),
        );
      }
    }

    // 6. Status / Outcome Filter
    if (selectedStatusFilter !== "ALL") {
      list = list.filter(
        (act) =>
          act.result?.toUpperCase() === selectedStatusFilter.toUpperCase(),
      );
    }

    // 7. Date Range & Preset Filter
    if (timeRange !== "ALL") {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (timeRange === "TODAY") {
        list = list.filter(
          (act) => now - new Date(act.createdAt).getTime() <= oneDay,
        );
      } else if (timeRange === "7_DAYS") {
        list = list.filter(
          (act) => now - new Date(act.createdAt).getTime() <= 7 * oneDay,
        );
      } else if (timeRange === "30_DAYS") {
        list = list.filter(
          (act) => now - new Date(act.createdAt).getTime() <= 30 * oneDay,
        );
      } else if (timeRange === "THIS_MONTH") {
        const currentDate = new Date();
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        ).getTime();
        list = list.filter(
          (act) => new Date(act.createdAt).getTime() >= startOfMonth,
        );
      } else if (timeRange === "CUSTOM") {
        if (customStartDate) {
          const startTs = new Date(customStartDate).setHours(0, 0, 0, 0);
          list = list.filter(
            (act) => new Date(act.createdAt).getTime() >= startTs,
          );
        }
        if (customEndDate) {
          const endTs = new Date(customEndDate).setHours(23, 59, 59, 999);
          list = list.filter(
            (act) => new Date(act.createdAt).getTime() <= endTs,
          );
        }
      }
    }

    // 8. Omni-Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((act) => {
        const text = `
          ${act.action || ""}
          ${act.eventType || ""}
          ${act.details || ""}
          ${act.actorName || ""}
          ${act.actorId || ""}
          ${act.actorEmail || ""}
          ${act.applicationName || ""}
          ${act.traceId || ""}
          ${act.versionNumber || ""}
          ${act.targetId || ""}
          ${JSON.stringify(act.metadata || {})}
        `.toLowerCase();
        return text.includes(q);
      });
    }

    // 9. Sorting (Newest vs Oldest)
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "DESC" ? timeB - timeA : timeA - timeB;
    });

    if (limit && typeof limit === "number" && limit > 0) {
      return list.slice(0, limit);
    }

    return list;
  }, [
    activities,
    applicationId,
    versionId,
    selectedAppFilter,
    selectedVersionFilter,
    selectedActorFilter,
    selectedActionType,
    selectedCategory,
    selectedStatusFilter,
    timeRange,
    customStartDate,
    customEndDate,
    searchQuery,
    sortOrder,
    limit,
  ]);

  // --- Platform Metrics ---
  const auditMetrics = useMemo(() => {
    const total = activities.length;
    const versioningCount = activities.filter(
      (a) =>
        a.targetType === "APPLICATION_VERSION" ||
        a.targetType === "PUBLICATION" ||
        a.action?.includes("VERSION") ||
        a.eventType?.includes("version") ||
        a.action?.includes("PUBLISH") ||
        a.action?.includes("ROLLBACK"),
    ).length;
    const successCount = activities.filter(
      (a) => a.result === "SUCCESS",
    ).length;
    const successRate =
      total > 0 ? Math.round((successCount / total) * 100) : 100;
    const distinctActors = uniqueActors.length;
    const latestEvent = activities.length > 0 ? activities[0] : null;

    return {
      total,
      versioningCount,
      successRate,
      distinctActors,
      latestEvent,
    };
  }, [activities, uniqueActors]);

  // Count of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== "ALL") count++;
    if (selectedActionType !== "ALL") count++;
    if (!applicationId && selectedAppFilter !== "ALL") count++;
    if (!versionId && selectedVersionFilter !== "ALL") count++;
    if (selectedActorFilter !== "ALL") count++;
    if (selectedStatusFilter !== "ALL") count++;
    if (timeRange !== "ALL") count++;
    if (timeRange === "CUSTOM" && (customStartDate || customEndDate)) count++;
    return count;
  }, [
    searchQuery,
    selectedCategory,
    selectedActionType,
    applicationId,
    selectedAppFilter,
    versionId,
    selectedVersionFilter,
    selectedActorFilter,
    selectedStatusFilter,
    timeRange,
    customStartDate,
    customEndDate,
  ]);

  // --- Preset Filter Buttons ---
  const applyPreset = (type) => {
    resetFilters(false);
    if (type === "MY_ACTIONS") {
      const myId = currentUser?.id || "usr_admin_01";
      setSelectedActorFilter(myId);
      showToast("Filtre : Mes actions uniquement");
    } else if (type === "PUBLICATIONS") {
      setSelectedCategory("VERSIONING");
      setSelectedActionType("BUSINESS.VERSION.PUBLISHED");
      showToast("Filtre : Publications de versions");
    } else if (type === "ROLLBACKS") {
      setSelectedCategory("VERSIONING");
      setSelectedActionType("BUSINESS.VERSION.ROLLBACK");
      showToast("Filtre : Rollbacks & Restaurations");
    } else if (type === "INCIDENTS") {
      setSelectedStatusFilter("FAIL");
      showToast("Filtre : Échecs & Alertes");
    } else if (type === "RECENT_24H") {
      setTimeRange("TODAY");
      showToast("Filtre : Dernières 24 heures");
    }
  };

  // Helpers
  const copyToClipboard = (text, type = "trace") => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    if (type === "trace") {
      setCopiedTraceId(text);
      setTimeout(() => setCopiedTraceId(null), 2000);
      showToast(`Trace ID ${text} copié dans le presse-papier.`);
    } else if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      showToast("Payload JSON copié dans le presse-papier.");
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredActivities, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${applicationId || "global"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      `${filteredActivities.length} événements d'audit exportés au format JSON.`,
    );
  };

  const handleExportCSV = () => {
    if (filteredActivities.length === 0) {
      showToast("Aucun événement à exporter.", "warning");
      return;
    }
    const headers = [
      "ID",
      "Date (ISO)",
      "Application",
      "Version",
      "Action",
      "Type Evenement",
      "Resultat",
      "ID Acteur",
      "Nom Acteur",
      "Role Acteur",
      "Trace ID",
      "Details",
    ];
    const rows = filteredActivities.map((act) => [
      act.id,
      act.createdAt,
      `"${(act.applicationName || "").replace(/"/g, '""')}"`,
      act.versionNumber || "",
      `"${(act.action || "").replace(/"/g, '""')}"`,
      `"${(act.eventType || "").replace(/"/g, '""')}"`,
      act.result || "SUCCESS",
      act.actorId || "",
      `"${(act.actorName || "").replace(/"/g, '""')}"`,
      act.actorRole || "",
      act.traceId || "",
      `"${(act.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${applicationId || "global"}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      `${filteredActivities.length} événements d'audit exportés au format CSV.`,
    );
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "Récemment";
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "À l instant";
    if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400)
      return `Il y a ${Math.floor(diffSeconds / 3600)} h`;
    if (diffSeconds < 604800)
      return `Il y a ${Math.floor(diffSeconds / 86400)} j`;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getActionColor = (action = "", result = "SUCCESS") => {
    if (result === "FAIL" || result === "ERROR" || result === "DENIED") {
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        icon: XCircle,
        iconBg: "bg-rose-100 text-rose-700",
      };
    }
    if (result === "WARNING") {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        icon: AlertTriangle,
        iconBg: "bg-amber-100 text-amber-700",
      };
    }
    if (action.includes("PUBLISH")) {
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        icon: CheckCircle2,
        iconBg: "bg-emerald-100 text-emerald-700",
      };
    }
    if (action.includes("VALIDAT")) {
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
        icon: Shield,
        iconBg: "bg-blue-100 text-blue-700",
      };
    }
    if (action.includes("ROLLBACK")) {
      return {
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
        icon: RotateCcw,
        iconBg: "bg-purple-100 text-purple-700",
      };
    }
    if (action.includes("CREATE") || action.includes("CLONE")) {
      return {
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-500",
        icon: Sparkles,
        iconBg: "bg-indigo-100 text-indigo-700",
      };
    }
    if (action.includes("DATA") || action.includes("SCHEMA")) {
      return {
        badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
        dot: "bg-cyan-500",
        icon: Database,
        iconBg: "bg-cyan-100 text-cyan-700",
      };
    }
    return {
      badge: "bg-slate-50 text-slate-700 border-slate-200",
      dot: "bg-slate-500",
      icon: History,
      iconBg: "bg-slate-100 text-slate-700",
    };
  };

  const getActorInitials = (act) => {
    if (act.actorId && act.actorId.length <= 3)
      return act.actorId.toUpperCase();
    if (act.actorName) {
      const parts = act.actorName.split(" ");
      if (parts.length >= 2)
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return act.actorName.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const openInspector = (act) => {
    setSelectedEvent(act);
    setActiveInspectorTab(act.before || act.after ? "diff" : "details");
    if (onSelectLog) onSelectLog(act);
  };

  const resetFilters = (notify = true) => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedActionType("ALL");
    setSelectedAppFilter(applicationId || "ALL");
    setSelectedVersionFilter(versionId || "ALL");
    setSelectedActorFilter("ALL");
    setSelectedStatusFilter("ALL");
    setTimeRange("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setSortOrder("DESC");
    if (notify) showToast("Filtres réinitialisés.");
  };

  return (
    <div id="centralized-audit-trail" className={`space-y-5 ${className}`}>
      {/* 1. Header & Title Banner */}
      {!compact && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {title || "Piste d Audit Centralisée & Traçabilité"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {subtitle ||
                    "Journal immuable des actions historiques, mutations de versioning, utilisateurs et traces transactionnelles."}
                </p>
              </div>
            </div>
          </div>

          {/* Export & View Mode Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {showExport && (
              <>
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
                  title="Exporter les événements filtrés au format CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  id="btn-export-json"
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
                  title="Exporter les événements filtrés au format JSON"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export JSON</span>
                </button>
              </>
            )}

            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                id="btn-view-timeline"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "timeline"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Chronologie</span>
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tableau</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Stats Ribbon */}
      {showStats && !compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                Événements Journalisés
              </span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <History className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">
              {auditMetrics.total}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {filteredActivities.length} visibles après filtres
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                Mutations Versioning
              </span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <GitBranch className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-black text-purple-900 mt-1">
              {auditMetrics.versioningCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Publications, rollbacks & drafts
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                Acteurs IAM Identifiés
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <User className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-black text-indigo-900 mt-1">
              {auditMetrics.distinctActors}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Rôles Admin, Builder, Lecteur
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                Taux de Succès
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {auditMetrics.successRate}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Opérations sans incident
            </p>
          </div>
        </div>
      )}

      {/* 3. Comprehensive Search & Filter Control Center */}
      {showFilters && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          {/* A. Quick Smart Presets Ribbon */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Filtres Rapides :</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => applyPreset("MY_ACTIONS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  selectedActorFilter === (currentUser?.id || "usr_admin_01")
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Mes actions</span>
              </button>

              <button
                onClick={() => applyPreset("PUBLICATIONS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  selectedActionType === "BUSINESS.VERSION.PUBLISHED"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Publications</span>
              </button>

              <button
                onClick={() => applyPreset("ROLLBACKS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  selectedActionType === "BUSINESS.VERSION.ROLLBACK"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <RotateCcw className="w-3 h-3 text-purple-500" />
                <span>Rollbacks</span>
              </button>

              <button
                onClick={() => applyPreset("INCIDENTS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  selectedStatusFilter === "FAIL"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Incidents & Alertes</span>
              </button>

              <button
                onClick={() => applyPreset("RECENT_24H")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  timeRange === "TODAY"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Clock className="w-3 h-3 text-blue-500" />
                <span>24h Récentes</span>
              </button>
            </div>
          </div>

          {/* B. Main Search & Filter Row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-audit-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par utilisateur (nom/ID), type d action, version, traceId, ou mot-clé..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                  title="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons: Advanced toggle, Sort Order & Reset */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
              {/* Sort Order Button */}
              <button
                id="btn-toggle-sort"
                onClick={() =>
                  setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC")
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                title="Inverser l'ordre chronologique"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {sortOrder === "DESC"
                    ? "Plus récents d abord"
                    : "Plus anciens d abord"}
                </span>
              </button>

              {/* Advanced Filter Toggle */}
              <button
                id="btn-toggle-advanced-filters"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  showAdvancedFilters || activeFilterCount > 0
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtres avancés</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showAdvancedFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Reset All Filters */}
              {activeFilterCount > 0 && (
                <button
                  id="btn-reset-filters"
                  onClick={() => resetFilters(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all"
                  title="Réinitialiser tous les filtres actifs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Effacer filtres</span>
                </button>
              )}
            </div>
          </div>

          {/* C. Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: "ALL", label: "Tous les événements" },
              {
                id: "VERSIONING",
                label: "Versioning & Releases",
                icon: GitBranch,
              },
              { id: "LIFECYCLE", label: "Cycle de vie App", icon: Boxes },
              { id: "DATA_MODEL", label: "Modèles & Données", icon: Database },
              {
                id: "FEATURES_MENUS",
                label: "Fonctionnalités & Menus",
                icon: Sliders,
              },
              {
                id: "INTEGRATIONS",
                label: "Intégrations & Ponts",
                icon: Code2,
              },
              { id: "PACKS", label: "Packs & Modules", icon: Layers },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* D. Expanded Multi-Dimensional Filters (User, Action Type, Date Range) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {/* 1. Filter by User / Actor */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Utilisateur / Acteur</span>
                </span>
                {selectedActorFilter !== "ALL" && (
                  <button
                    onClick={() => setSelectedActorFilter("ALL")}
                    className="text-blue-600 hover:underline normal-case font-bold"
                  >
                    Effacer
                  </button>
                )}
              </label>
              <select
                id="select-filter-actor"
                value={selectedActorFilter}
                onChange={(e) => setSelectedActorFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">
                  Tous les utilisateurs ({uniqueActors.length})
                </option>
                {uniqueActors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name} ({actor.role}) — {actor.count} act.
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Filter by Specific Action Type */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Type d Action Précis</span>
                </span>
                {selectedActionType !== "ALL" && (
                  <button
                    onClick={() => setSelectedActionType("ALL")}
                    className="text-blue-600 hover:underline normal-case font-bold"
                  >
                    Effacer
                  </button>
                )}
              </label>
              <select
                id="select-filter-action-type"
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">
                  Tous les types d actions ({uniqueActionTypes.length})
                </option>
                {uniqueActionTypes.map((item) => (
                  <option key={item.action} value={item.action}>
                    {item.action} ({item.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filter by Date Range Preset */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-slate-400" />
                  <span>Période / Date Range</span>
                </span>
                {timeRange !== "ALL" && (
                  <button
                    onClick={() => {
                      setTimeRange("ALL");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-blue-600 hover:underline normal-case font-bold"
                  >
                    Effacer
                  </button>
                )}
              </label>
              <select
                id="select-filter-timerange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tout l historique</option>
                <option value="TODAY">Aujourd hui (&lt; 24h)</option>
                <option value="7_DAYS">7 derniers jours</option>
                <option value="30_DAYS">30 derniers jours</option>
                <option value="THIS_MONTH">Ce mois-ci</option>
                <option value="CUSTOM">
                  Plage personnalisée (Date Picker)
                </option>
              </select>
            </div>

            {/* 4. Filter by Outcome Status */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Statut / Résultat</span>
                </span>
                {selectedStatusFilter !== "ALL" && (
                  <button
                    onClick={() => setSelectedStatusFilter("ALL")}
                    className="text-blue-600 hover:underline normal-case font-bold"
                  >
                    Effacer
                  </button>
                )}
              </label>
              <select
                id="select-filter-status"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="SUCCESS">Succès (SUCCESS)</option>
                <option value="WARNING">Avertissement (WARNING)</option>
                <option value="FAIL">Échec (FAIL/ERROR)</option>
              </select>
            </div>
          </div>

          {/* E. Custom Date Range Pickers (Visible when timeRange === 'CUSTOM' or showAdvancedFilters is open) */}
          {(timeRange === "CUSTOM" || showAdvancedFilters) && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sélection de plage calendaire personnalisée</span>
                </span>
                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    Réinitialiser les dates
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Date de début (Du)
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setTimeRange("CUSTOM");
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Date de fin (Au)
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setTimeRange("CUSTOM");
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Scope: Application dropdown (if global) */}
                {!applicationId && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Cible Application
                    </label>
                    <select
                      value={selectedAppFilter}
                      onChange={(e) => setSelectedAppFilter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="ALL">Toutes les applications</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Scope: Version dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Version Applicative
                  </label>
                  <select
                    value={selectedVersionFilter}
                    onChange={(e) => setSelectedVersionFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Toutes les versions</option>
                    {availableVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.versionNumber} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* F. Active Filters Badge Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400">
                Filtres actifs ({activeFilterCount}) :
              </span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedActorFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                  <User className="w-3 h-3" />
                  <span>
                    Utilisateur :{" "}
                    {uniqueActors.find((a) => a.id === selectedActorFilter)
                      ?.name || selectedActorFilter}
                  </span>
                  <button
                    onClick={() => setSelectedActorFilter("ALL")}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedActionType !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                  <Tag className="w-3 h-3" />
                  <span>Action : {selectedActionType}</span>
                  <button
                    onClick={() => setSelectedActionType("ALL")}
                    className="hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-[11px] font-bold border border-cyan-200">
                  <span>Catégorie : {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className="hover:text-cyan-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {timeRange !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {timeRange === "TODAY" && "Période : Dernières 24h"}
                    {timeRange === "7_DAYS" && "Période : 7 jours"}
                    {timeRange === "30_DAYS" && "Période : 30 jours"}
                    {timeRange === "THIS_MONTH" && "Période : Ce mois-ci"}
                    {timeRange === "CUSTOM" &&
                      `Du ${customStartDate || "début"} au ${customEndDate || "aujourd hui"}`}
                  </span>
                  <button
                    onClick={() => {
                      setTimeRange("ALL");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="hover:text-amber-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span>Statut : {selectedStatusFilter}</span>
                  <button
                    onClick={() => setSelectedStatusFilter("ALL")}
                    className="hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={() => resetFilters(true)}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-1"
              >
                Tout réinitialiser
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Main Event Stream: Timeline View */}
      {viewMode === "timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Flux d Activité Chronologique ({filteredActivities.length} /{" "}
              {activities.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Horodatage ISO 8601 & Traçabilité IAM
            </span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Aucun enregistrement d audit trouvé
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Aucune action ne correspond aux critères de recherche actuels
                (utilisateur, type d action ou période).
              </p>
              <button
                onClick={() => resetFilters(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredActivities.map((act, index) => {
                const colors = getActionColor(act.action, act.result);
                const IconComponent = colors.icon;
                const actorInitials = getActorInitials(act);
                const isVersioningEvent =
                  act.targetType === "APPLICATION_VERSION" ||
                  act.targetType === "PUBLICATION" ||
                  act.action?.includes("VERSION") ||
                  act.eventType?.includes("version");

                return (
                  <div
                    key={act.id || index}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start justify-between gap-4 group"
                  >
                    {/* Left: Avatar / Status Icon + Main Content */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Event Status Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Action Badge, Application Name, Version & Result */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() =>
                              setSelectedActionType(act.action || act.eventType)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black border transition-transform hover:scale-105 ${colors.badge}`}
                            title="Filtrer par cette action"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                            />
                            {act.action || act.eventType || "ACTION"}
                          </button>

                          {act.applicationName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                              <Boxes className="w-3 h-3 text-slate-400" />
                              {act.applicationName}
                            </span>
                          )}

                          {act.versionNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-black">
                              <GitBranch className="w-3 h-3" />v
                              {act.versionNumber}
                            </span>
                          )}

                          {isVersioningEvent &&
                            !act.versionNumber &&
                            act.targetId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-mono font-bold">
                                {act.targetId}
                              </span>
                            )}

                          {/* Result status tag */}
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              act.result === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : act.result === "WARNING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {act.result || "SUCCESS"}
                          </span>
                        </div>

                        {/* Details Message */}
                        <p className="text-xs font-semibold text-slate-800 break-words">
                          {act.details ||
                            "Opération enregistrée dans la piste d audit."}
                        </p>

                        {/* Actor Identity, Tenant & Trace Bar */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                          {/* Actor Identifier (Clickable to filter) */}
                          <button
                            onClick={() =>
                              setSelectedActorFilter(
                                act.actorId || "usr_unknown",
                              )
                            }
                            className="flex items-center gap-1.5 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors text-left"
                            title={`Filtrer les logs pour l'utilisateur ${act.actorName}`}
                          >
                            <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center">
                              {actorInitials}
                            </div>
                            <span className="font-bold text-slate-700 hover:text-blue-600">
                              {act.actorName || "Administrateur"}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">
                              {act.actorId || "usr_admin_01"}
                            </span>
                            {act.actorRole && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold text-[9px]">
                                {act.actorRole}
                              </span>
                            )}
                          </button>

                          {/* Trace ID */}
                          {act.traceId && (
                            <button
                              onClick={() =>
                                copyToClipboard(act.traceId, "trace")
                              }
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-blue-600 transition-colors"
                              title="Cliquer pour copier le Trace ID"
                            >
                              <Shield className="w-3 h-3 text-slate-300" />
                              <span>{act.traceId}</span>
                              {copiedTraceId === act.traceId ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamps & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 sm:gap-1 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRelativeTime(act.createdAt)}</span>
                      </div>
                      <span
                        className="text-[10px] text-slate-400 font-mono"
                        title={act.createdAt}
                      >
                        {new Date(act.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}{" "}
                        {new Date(act.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>

                      {/* Inspect Button */}
                      <button
                        onClick={() => openInspector(act)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors mt-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspecter</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Main Event Stream: Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Horodatage (ISO)</th>
                  <th className="py-3 px-4">Action / Événement</th>
                  <th className="py-3 px-4">Application & Version</th>
                  <th className="py-3 px-4">Acteur & Rôle</th>
                  <th className="py-3 px-4">Trace ID</th>
                  <th className="py-3 px-4">Résultat</th>
                  <th className="py-3 px-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-slate-500"
                    >
                      Aucun événement correspondant aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act, index) => {
                    const colors = getActionColor(act.action, act.result);
                    return (
                      <tr
                        key={act.id || index}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-slate-800">
                            {new Date(act.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(act.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              setSelectedActionType(act.action || act.eventType)
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black border hover:scale-105 transition-transform ${colors.badge}`}
                          >
                            {act.action || act.eventType}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">
                            {act.applicationName || "—"}
                          </div>
                          {act.versionNumber ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-purple-700">
                              <GitBranch className="w-2.5 h-2.5" /> v
                              {act.versionNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {act.targetId || "Global"}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              setSelectedActorFilter(
                                act.actorId || "usr_unknown",
                              )
                            }
                            className="text-left hover:text-blue-600 transition-colors"
                          >
                            <div className="font-bold text-slate-800">
                              {act.actorName || "Admin"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                              <span>{act.actorId || "AD"}</span>
                              {act.actorRole && <span>• {act.actorRole}</span>}
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {act.traceId || "—"}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              act.result === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : act.result === "WARNING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {act.result || "SUCCESS"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openInspector(act)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Inspecter le payload et le diff"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Deep Inspector Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl ${
                    getActionColor(selectedEvent.action, selectedEvent.result)
                      .iconBg
                  } flex items-center justify-center`}
                >
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Détail de l Événement d Audit
                    </h3>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedEvent.result === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {selectedEvent.result || "SUCCESS"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {selectedEvent.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveInspectorTab("diff")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeInspectorTab === "diff"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Diff d État (Avant / Après)</span>
              </button>
              <button
                onClick={() => setActiveInspectorTab("details")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeInspectorTab === "details"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Identité & Traçabilité</span>
              </button>
              <button
                onClick={() => setActiveInspectorTab("raw")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeInspectorTab === "raw"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Payload JSON Brut</span>
              </button>
            </div>

            {/* Modal Tab Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Tab 1: Diff Viewer */}
              {activeInspectorTab === "diff" && (
                <div className="space-y-4">
                  {/* Action Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">
                        Action Exécutée :
                      </span>
                      <span className="font-mono font-black text-blue-600">
                        {selectedEvent.action}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">
                      {selectedEvent.details}
                    </p>
                  </div>

                  {/* Before vs After Side-by-Side Comparison */}
                  {selectedEvent.before || selectedEvent.after ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Before State */}
                      <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-2">
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>État Précédent (Avant)</span>
                        </div>
                        {selectedEvent.before ? (
                          <pre className="p-2.5 rounded-xl bg-white border border-rose-100 text-[11px] font-mono text-rose-900 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(selectedEvent.before, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[11px] text-rose-600 italic">
                            Aucun état préalable (Création initiale)
                          </p>
                        )}
                      </div>

                      {/* After State */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Nouvel État (Après)</span>
                        </div>
                        {selectedEvent.after ? (
                          <pre className="p-2.5 rounded-xl bg-white border border-emerald-100 text-[11px] font-mono text-emerald-900 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(selectedEvent.after, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[11px] text-emerald-600 italic">
                            Aucun état de sortie
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                      Aucune mutation d état enregistrée pour cette action d
                      audit.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Identity & Traceability Details */}
              {activeInspectorTab === "details" && (
                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Acteur (IAM)
                      </span>
                      <p className="font-bold text-slate-800">
                        {selectedEvent.actorName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        ID: {selectedEvent.actorId}
                      </p>
                      {selectedEvent.actorRole && (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          Rôle : {selectedEvent.actorRole}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Cible Applicative
                      </span>
                      <p className="font-bold text-slate-800">
                        {selectedEvent.applicationName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        App ID: {selectedEvent.applicationId || "—"}
                      </p>
                      {selectedEvent.versionNumber && (
                        <p className="font-bold text-purple-700 text-[11px]">
                          Version : v{selectedEvent.versionNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timestamps & Trace */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">
                        Horodatage ISO 8601 :
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {selectedEvent.createdAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">
                        Trace ID Transactionnelle :
                      </span>
                      <span className="font-mono text-blue-600 font-bold">
                        {selectedEvent.traceId || "—"}
                      </span>
                    </div>
                    {selectedEvent.metadata?.tenantId && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-600">
                          Tenant Isolation ID :
                        </span>
                        <span className="font-mono text-slate-700">
                          {selectedEvent.metadata.tenantId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Raw JSON Payload */}
              {activeInspectorTab === "raw" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      Structure de l Événement :
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedEvent, null, 2),
                          "json",
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copier JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-72">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
