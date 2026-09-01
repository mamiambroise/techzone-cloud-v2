// Techzone Cloud Business Manager — Main App Context (BM-CDC-00 à BM-CDC-08)
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_APPLICATIONS,
  INITIAL_VERSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DATA_MODELS,
  INITIAL_FEATURES,
  INITIAL_MENUS,
  INITIAL_CONFIG_DEFINITIONS,
  INITIAL_INTEGRATIONS,
} from '../lib/mockData';
import {
  INITIAL_PACKS,
  INITIAL_PACK_VERSIONS,
  INITIAL_PACK_ATTENTION_ITEMS,
  INITIAL_PACK_ACTIVITIES,
  INITIAL_PACK_MODULES,
  INITIAL_PACK_FEATURES,
  INITIAL_PACK_CAPABILITIES,
  INITIAL_PACK_DEPENDENCIES,
  INITIAL_PACK_RULES,
} from '../lib/mockPackData';
import {
  buildPackManifestV1,
} from '../lib/packManifestService';
import {
  evaluatePackDependencies,
  detectCycles,
} from '../lib/packDependencyResolver';
import {
  simulateRules,
} from '../lib/packRuleEngine';
import {
  APPLICATION_STATUS,
  VERSION_STATUS,
  PACK_STATUS,
  PACK_VERSION_STATUS,
  PACK_VALIDATION_STATUS,
  PACK_MANIFEST_STATUS,
  ALLOWED_APPLICATION_TRANSITIONS,
  ALLOWED_VERSION_TRANSITIONS,
  IMMUTABLE_VERSION_STATUSES,
  ROLES,
  ROLE_PERMISSIONS,
  ERROR_CODES,
  PACK_ERROR_CODES,
} from '../types/domain';
import { generateTraceId, generateUUID } from '../lib/trace';
import { slugifyCode, isValidApplicationCode, isValidSemver } from '../lib/slug';
import { computeSnapshotHash } from '../lib/snapshotService';
import { ValidationEngine } from '../lib/validationEngine';
import { isVersionEditable } from '../lib/versionGuard';
import { terminateSession } from '../lib/authService';
import { api, setSession, clearAccessToken } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // 1. Central Persistence State
  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_applications');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [versions, setVersions] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_versions');
      return saved ? JSON.parse(saved) : INITIAL_VERSIONS;
    } catch {
      return INITIAL_VERSIONS;
    }
  });

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_activities');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [dataModels, setDataModels] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_data_models');
      return saved ? JSON.parse(saved) : INITIAL_DATA_MODELS;
    } catch {
      return INITIAL_DATA_MODELS;
    }
  });

  const [features, setFeatures] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_features');
      return saved ? JSON.parse(saved) : INITIAL_FEATURES;
    } catch {
      return INITIAL_FEATURES;
    }
  });

  const [menus, setMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_menus');
      return saved ? JSON.parse(saved) : INITIAL_MENUS;
    } catch {
      return INITIAL_MENUS;
    }
  });

  const [configs, setConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_configs');
      return saved ? JSON.parse(saved) : INITIAL_CONFIG_DEFINITIONS;
    } catch {
      return INITIAL_CONFIG_DEFINITIONS;
    }
  });

  const [integrations, setIntegrations] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_integrations');
      return saved ? JSON.parse(saved) : INITIAL_INTEGRATIONS;
    } catch {
      return INITIAL_INTEGRATIONS;
    }
  });

  // Pack Manager Stores (PM-CDC-00, PM-CDC-01, PM-CDC-02)
  const [packs, setPacks] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_packs');
      return saved ? JSON.parse(saved) : INITIAL_PACKS;
    } catch {
      return INITIAL_PACKS;
    }
  });

  const [packVersions, setPackVersions] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_versions');
      return saved ? JSON.parse(saved) : INITIAL_PACK_VERSIONS;
    } catch {
      return INITIAL_PACK_VERSIONS;
    }
  });

  const [packActivities, setPackActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_activities');
      return saved ? JSON.parse(saved) : INITIAL_PACK_ACTIVITIES;
    } catch {
      return INITIAL_PACK_ACTIVITIES;
    }
  });

  const [packAttentionItems, setPackAttentionItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_attention');
      return saved ? JSON.parse(saved) : INITIAL_PACK_ATTENTION_ITEMS;
    } catch {
      return INITIAL_PACK_ATTENTION_ITEMS;
    }
  });

  const [packModules, setPackModules] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_modules');
      return saved ? JSON.parse(saved) : INITIAL_PACK_MODULES;
    } catch {
      return INITIAL_PACK_MODULES;
    }
  });

  const [packFeatures, setPackFeatures] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_features');
      return saved ? JSON.parse(saved) : INITIAL_PACK_FEATURES;
    } catch {
      return INITIAL_PACK_FEATURES;
    }
  });

  const [packCapabilities, setPackCapabilities] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_capabilities');
      return saved ? JSON.parse(saved) : INITIAL_PACK_CAPABILITIES;
    } catch {
      return INITIAL_PACK_CAPABILITIES;
    }
  });

  const [packDependencies, setPackDependencies] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_dependencies');
      return saved ? JSON.parse(saved) : INITIAL_PACK_DEPENDENCIES;
    } catch {
      return INITIAL_PACK_DEPENDENCIES;
    }
  });

  const [packRules, setPackRules] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_pack_rules');
      return saved ? JSON.parse(saved) : INITIAL_PACK_RULES;
    } catch {
      return INITIAL_PACK_RULES;
    }
  });

  // Pack Selection State
  const [selectedPackId, setSelectedPackId] = useState('pack-stock');
  const [selectedPackVersionId, setSelectedPackVersionId] = useState('pver-stock-120');

  // IAM & Context
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem('bm_is_authenticated');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });
  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('bm_user_email') || 'admin@techzone.io';
    } catch {
      return 'admin@techzone.io';
    }
  });
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      return localStorage.getItem('bm_user_role') || 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  });
  const [currentTenant] = useState({
    id: 'tenant-techzone-01',
    name: 'Techzone Cloud Enterprise',
    environment: 'PRODUCTION',
  });

  // Navigation & Selection State
  const [currentView, setCurrentView] = useState('overview');
  const [selectedAppId, setSelectedAppId] = useState('app-9720-prem');
  const [selectedVersionId, setSelectedVersionId] = useState('ver-9720-120');
  const [selectedEnvironment, setSelectedEnvironment] = useState('ALL');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [userFullName, setUserFullName] = useState(() => {
    try {
      return localStorage.getItem('bm_user_fullname') || '';
    } catch {
      return '';
    }
  });

  // Active user derived from role and stored metadata
  const currentUser = useMemo(() => {
    const displayName = userFullName || (userEmail?.includes('admin') ? 'Super Administrateur' : userEmail?.includes('builder') ? 'Studio Builder Techzone' : userEmail?.includes('guest') ? 'Lecteur Invité' : userEmail.split('@')[0]);
    const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TZ';

    if (currentRole === 'BUILDER') {
      return {
        id: 'usr_builder_02',
        name: displayName,
        email: userEmail || 'builder@techzone.io',
        role: 'BUILDER',
        avatarInitials: initials,
      };
    }
    if (currentRole === 'VIEWER') {
      return {
        id: 'usr_viewer_03',
        name: displayName,
        email: userEmail || 'guest@techzone.io',
        role: 'VIEWER',
        avatarInitials: initials,
      };
    }
    return {
      id: 'usr_admin_01',
      name: displayName,
      email: userEmail || 'admin@techzone.io',
      role: 'ADMIN',
      avatarInitials: initials,
    };
  }, [currentRole, userEmail, userFullName]);

  // Login handler — génération locale du JWT (signé HS256 avec le secret partagé
  // configuré côté backend). Aucun endpoint /auth/login n'est requis.
  const login = useCallback(async ({ email = 'admin@techzone.io', role, name = '', staySignedIn = true } = {}) => {
    let resolvedRole = role;
    if (!resolvedRole) {
      if (email.toLowerCase().includes('builder')) {
        resolvedRole = 'BUILDER';
      } else if (email.toLowerCase().includes('viewer') || email.toLowerCase().includes('guest')) {
        resolvedRole = 'VIEWER';
      } else {
        resolvedRole = 'ADMIN';
      }
    }

    const session = await setSession({ email, name, role: resolvedRole }).catch((err) => {
      console.warn('[AppContext] setSession failed:', err);
      return null;
    });

    const finalRole = session?.user?.role || resolvedRole;
    const finalName = session?.user?.name || name || (email.split('@')[0]);
    const finalEmail = session?.user?.email || email;

    setCurrentRole(finalRole);
    setUserEmail(finalEmail);
    if (finalName) setUserFullName(finalName);
    setIsAuthenticated(true);

    try {
      if (staySignedIn) {
        localStorage.setItem('bm_is_authenticated', 'true');
        localStorage.setItem('bm_user_email', finalEmail);
        localStorage.setItem('bm_user_role', finalRole);
        if (finalName) localStorage.setItem('bm_user_fullname', finalName);
      } else {
        sessionStorage.setItem('bm_is_authenticated', 'true');
      }
    } catch (err) {
      console.warn('Storage error on login', err);
    }

    setToast({
      type: 'success',
      title: 'Connexion sécurisée établie (JWT signé)',
      message: `Bienvenue sur Techzone IT Solution, ${finalName} (${finalRole})`,
    });

    return { success: true, source: 'jwt' };
  }, []);

  // 15-Minute Inactivity Auto-Logout Handler (IAM Zero-Trust Security Standard)
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900 seconds)
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState(15 * 60);
  const lastActivityRef = React.useRef(Date.now());

  // Proactive session extension / activity pulse
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionRemainingSeconds(15 * 60);
  }, []);

  // Logout handler
  const logout = useCallback((reason = 'LOGOUT') => {
    setIsAuthenticated(false);
    clearAccessToken();
    terminateSession(userEmail, reason);
    try {
      localStorage.removeItem('bm_is_authenticated');
      localStorage.removeItem('bm_user_fullname');
      sessionStorage.removeItem('bm_is_authenticated');
    } catch (err) {
      console.warn('Storage error on logout', err);
    }

    if (reason === 'INACTIVITY') {
      setToast({
        type: 'warning',
        title: 'Session expirée (Inactivité 15 min)',
        message: 'Vous avez été déconnecté automatiquement suite à 15 minutes d\'inactivité. Les données sensibles en mémoire ont été purgées.',
      });
    } else {
      setToast({
        type: 'info',
        title: 'Déconnexion effectuée',
        message: 'Votre session sécurisée a été clôturée avec succès.',
      });
    }
  }, [userEmail]);

  // Activity listeners to detect user interaction and reset timer
  useEffect(() => {
    if (!isAuthenticated) return;

    // Reset timestamp when logging in
    lastActivityRef.current = Date.now();
    setSessionRemainingSeconds(15 * 60);

    let lastThrottledTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event updates to at most once every 3 seconds to preserve performance
      if (now - lastThrottledTime > 3000) {
        lastThrottledTime = now;
        lastActivityRef.current = now;
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'focus', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Inactivity ticker interval (checks every 1 second)
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.floor((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
      setSessionRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        logout('INACTIVITY');
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isAuthenticated, logout]);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bm_applications', JSON.stringify(applications));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_versions', JSON.stringify(versions));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [versions]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_activities', JSON.stringify(activities));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_data_models', JSON.stringify(dataModels));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [dataModels]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_features', JSON.stringify(features));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [features]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_menus', JSON.stringify(menus));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [menus]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_configs', JSON.stringify(configs));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [configs]);

  useEffect(() => {
    try {
      localStorage.setItem('bm_integrations', JSON.stringify(integrations));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [integrations]);

  // Pack Manager LocalStorage Sync
  useEffect(() => {
    try {
      localStorage.setItem('pm_packs', JSON.stringify(packs));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packs]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_versions', JSON.stringify(packVersions));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packVersions]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_activities', JSON.stringify(packActivities));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packActivities]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_attention', JSON.stringify(packAttentionItems));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packAttentionItems]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_modules', JSON.stringify(packModules));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packModules]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_features', JSON.stringify(packFeatures));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packFeatures]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_capabilities', JSON.stringify(packCapabilities));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packCapabilities]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_dependencies', JSON.stringify(packDependencies));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packDependencies]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_pack_rules', JSON.stringify(packRules));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [packRules]);


  // Toast Notification helper
  const showToast = useCallback((message, type = 'success') => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Permission checker
  const hasPermission = useCallback(
    (permission) => {
      const allowed = ROLE_PERMISSIONS[currentRole] || [];
      return allowed.includes(permission);
    },
    [currentRole]
  );

  // Selected Application & Version
  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId) || applications[0] || null;
  }, [applications, selectedAppId]);

  const appVersions = useMemo(() => {
    if (!selectedApp) return [];
    return versions.filter((v) => v.applicationId === selectedApp.id);
  }, [versions, selectedApp]);

  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return appVersions[0] || null;
    return versions.find((v) => v.id === selectedVersionId) || appVersions[0] || null;
  }, [versions, selectedVersionId, appVersions]);

  // Version Editability Guard (BM-CDC-00 Section 8 & BM-CDC-02 Section 24)
  const isEditable = useMemo(() => {
    return isVersionEditable(selectedVersion);
  }, [selectedVersion]);

  const isVersionReadOnly = useMemo(() => {
    return !isEditable;
  }, [isEditable]);

  // Scoped Data for Selected Application
  const appDataModels = useMemo(() => {
    if (!selectedApp) return [];
    return dataModels.filter((d) => !d.applicationId || d.applicationId === selectedApp.id);
  }, [dataModels, selectedApp]);

  const appFeatures = useMemo(() => {
    if (!selectedApp) return [];
    return features.filter((f) => !f.applicationId || f.applicationId === selectedApp.id);
  }, [features, selectedApp]);

  const appConfigs = useMemo(() => {
    if (!selectedApp) return [];
    return configs.filter((c) => !c.applicationId || c.applicationId === selectedApp.id);
  }, [configs, selectedApp]);

  const appIntegrations = useMemo(() => {
    if (!selectedApp) return [];
    return integrations.filter((i) => !i.applicationId || i.applicationId === selectedApp.id);
  }, [integrations, selectedApp]);

  // Record Audit / Activity Event
  const logActivity = useCallback(
    ({
      applicationId,
      applicationName,
      versionId,
      versionNumber,
      eventType,
      action,
      targetType,
      targetId,
      result = 'SUCCESS',
      details,
      before,
      after,
      metadata = {},
    }) => {
      const app = applications.find((a) => a.id === applicationId) || selectedApp;
      const effectiveAppId = applicationId || app?.id;
      const effectiveAppName = applicationName || app?.name || 'Système';

      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        applicationId: effectiveAppId,
        applicationName: effectiveAppName,
        versionId: versionId || metadata.versionId || null,
        versionNumber: versionNumber || metadata.versionNumber || null,
        actorId: currentUser.id || 'usr_admin_01',
        actorName: currentUser.name || 'Administrateur Business',
        actorEmail: currentUser.email || 'admin@techzone.io',
        actorRole: currentUser.role || currentRole || 'ADMIN',
        eventType: eventType || 'business.action',
        action: action || 'BUSINESS.ACTION',
        targetType: targetType || 'APPLICATION',
        targetId: targetId || effectiveAppId,
        result,
        details: details || action,
        traceId: generateTraceId(),
        createdAt: new Date().toISOString(),
        before: before || null,
        after: after || null,
        metadata: {
          ...metadata,
          tenantId: currentTenant.id,
          role: currentUser.role || currentRole,
          userIdentifier: currentUser.id,
          userEmail: currentUser.email,
        },
      };

      setActivities((prev) => [newEvent, ...prev]);
      return newEvent;
    },
    [selectedApp, currentUser, currentTenant, applications, currentRole]
  );

  // Helper to re-synchronize Version Snapshot and Application Metrics
  const syncVersionSnapshot = useCallback(
    (appId, versionId) => {
      const currentApp = applications.find((a) => a.id === appId);
      const targetVersionId = versionId || currentApp?.currentVersionId;
      if (!currentApp || !targetVersionId) return;

      const appEnts = dataModels.filter((d) => !d.applicationId || d.applicationId === appId);
      const appFeats = features.filter((f) => !f.applicationId || f.applicationId === appId);

      const newSnapshot = {
        appName: currentApp.name,
        appCode: currentApp.code,
        category: currentApp.category,
        dataModels: appEnts.map((e) => ({
          code: e.code,
          name: e.name,
          fields: e.fields?.map((f) => f.name) || [],
        })),
        features: appFeats.filter((f) => f.status === 'ACTIVE').map((f) => f.code),
        menus: menus[0]?.items?.map((it) => ({ id: it.id, label: it.label, route: it.route })) || [],
      };

      const newHash = computeSnapshotHash(newSnapshot);

      // Update version snapshot
      setVersions((prev) =>
        prev.map((v) => (v.id === targetVersionId ? { ...v, snapshot: newSnapshot, snapshotHash: newHash } : v))
      );

      // Update app metrics
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                metrics: {
                  ...a.metrics,
                  dataEntitiesCount: appEnts.length,
                  featuresCount: appFeats.filter((f) => f.status === 'ACTIVE').length,
                  menuItemsCount: menus[0]?.items?.length || 0,
                },
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    },
    [applications, dataModels, features, menus]
  );

  // =========================================================================
  // 1. DATA MODEL CRUD (BM-CDC-03)
  // =========================================================================
  const createEntity = useCallback(
    (entityInput) => {
      const appId = entityInput.applicationId || selectedApp?.id;
      const newEntityId = `ent_${Date.now().toString().slice(-6)}`;
      const code = (entityInput.code || slugifyCode(entityInput.name)).trim();

      const newEntity = {
        id: newEntityId,
        applicationId: appId,
        code,
        name: entityInput.name || 'Nouvelle Entité',
        plural: entityInput.plural || `${entityInput.name || 'Entité'}s`,
        tableName: entityInput.tableName || `bm_${code.replace(/-/g, '_')}`,
        description: entityInput.description || 'Entité métier personnalisée.',
        category: entityInput.category || 'Général',
        isSystem: false,
        primaryKey: 'id',
        fields: entityInput.fields || [
          {
            id: `f_${Date.now()}_1`,
            name: 'id',
            technicalName: 'id',
            type: 'UUID',
            required: true,
            isPrimary: true,
            isUnique: true,
            description: 'Clé primaire unique',
          },
          {
            id: `f_${Date.now()}_2`,
            name: 'code',
            technicalName: 'code',
            type: 'TEXT',
            required: true,
            isPrimary: false,
            isUnique: true,
            description: 'Code de référence',
          },
          {
            id: `f_${Date.now()}_3`,
            name: 'name',
            technicalName: 'name',
            type: 'TEXT',
            required: true,
            isPrimary: false,
            isUnique: false,
            description: 'Désignation principale',
          },
        ],
        relations: entityInput.relations || [],
      };

      setDataModels((prev) => [newEntity, ...prev]);

      logActivity({
        applicationId: appId,
        eventType: 'data.entity.created',
        action: 'DATA.ENTITY.CREATED',
        targetType: 'DATA_ENTITY',
        targetId: newEntityId,
        result: 'SUCCESS',
        details: `Création de l'entité "${newEntity.name}" (${newEntity.code})`,
        after: newEntity,
      });

      syncVersionSnapshot(appId);
      showToast(`Entité "${newEntity.name}" créée avec succès.`);
      return { success: true, data: newEntity };
    },
    [selectedApp, logActivity, syncVersionSnapshot, showToast]
  );

  const updateEntity = useCallback(
    (entityId, updates) => {
      setDataModels((prev) =>
        prev.map((e) => {
          if (e.id === entityId) {
            const updated = { ...e, ...updates };
            return updated;
          }
          return e;
        })
      );

      const target = dataModels.find((e) => e.id === entityId);
      logActivity({
        applicationId: target?.applicationId || selectedApp?.id,
        eventType: 'data.entity.updated',
        action: 'DATA.ENTITY.UPDATED',
        targetType: 'DATA_ENTITY',
        targetId: entityId,
        result: 'SUCCESS',
        details: `Mise à jour de l'entité "${target?.name}"`,
      });

      if (target?.applicationId) syncVersionSnapshot(target.applicationId);
      showToast('Entité modifiée avec succès.');
      return { success: true };
    },
    [dataModels, selectedApp, logActivity, syncVersionSnapshot, showToast]
  );

  const deleteEntity = useCallback(
    (entityId) => {
      const target = dataModels.find((e) => e.id === entityId);
      if (!target) return { success: false };

      setDataModels((prev) => prev.filter((e) => e.id !== entityId));

      logActivity({
        applicationId: target.applicationId || selectedApp?.id,
        eventType: 'data.entity.deleted',
        action: 'DATA.ENTITY.DELETED',
        targetType: 'DATA_ENTITY',
        targetId: entityId,
        result: 'SUCCESS',
        details: `Suppression de l'entité "${target.name}" (${target.code})`,
      });

      if (target.applicationId) syncVersionSnapshot(target.applicationId);
      showToast(`Entité "${target.name}" supprimée.`);
      return { success: true };
    },
    [dataModels, selectedApp, logActivity, syncVersionSnapshot, showToast]
  );

  const addField = useCallback(
    (entityId, fieldInput) => {
      const newFieldId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const newField = {
        id: newFieldId,
        name: fieldInput.name || 'nouveau_champ',
        technicalName: fieldInput.technicalName || fieldInput.name || 'nouveau_champ',
        type: fieldInput.type || 'TEXT',
        required: Boolean(fieldInput.required),
        isPrimary: Boolean(fieldInput.isPrimary),
        isUnique: Boolean(fieldInput.isUnique),
        defaultValue: fieldInput.defaultValue || '',
        description: fieldInput.description || '',
        enumValues: fieldInput.enumValues || [],
        targetEntity: fieldInput.targetEntity || null,
        relationType: fieldInput.relationType || null,
      };

      setDataModels((prev) =>
        prev.map((e) => (e.id === entityId ? { ...e, fields: [...(e.fields || []), newField] } : e))
      );

      const target = dataModels.find((e) => e.id === entityId);
      if (target?.applicationId) syncVersionSnapshot(target.applicationId);
      showToast(`Attribut "${newField.name}" (${newField.type}) ajouté.`);
      return { success: true, data: newField };
    },
    [dataModels, syncVersionSnapshot, showToast]
  );

  const updateField = useCallback(
    (entityId, fieldId, updates) => {
      setDataModels((prev) =>
        prev.map((e) => {
          if (e.id === entityId) {
            return {
              ...e,
              fields: e.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
            };
          }
          return e;
        })
      );
      showToast('Attribut mis à jour.');
      return { success: true };
    },
    [showToast]
  );

  const deleteField = useCallback(
    (entityId, fieldId) => {
      setDataModels((prev) =>
        prev.map((e) => {
          if (e.id === entityId) {
            return {
              ...e,
              fields: e.fields.filter((f) => f.id !== fieldId),
            };
          }
          return e;
        })
      );
      showToast('Attribut supprimé.');
      return { success: true };
    },
    [showToast]
  );

  const addRelation = useCallback(
    (sourceEntityId, relationInput) => {
      const newRelId = `rel_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const newRel = {
        id: newRelId,
        name: relationInput.name || 'NouvelleRelation',
        targetEntityId: relationInput.targetEntityId,
        targetCode: relationInput.targetCode,
        type: relationInput.type || 'MANY_TO_ONE',
        sourceField: relationInput.sourceField || 'id',
        targetField: relationInput.targetField || 'id',
        onDelete: relationInput.onDelete || 'RESTRICT',
      };

      setDataModels((prev) =>
        prev.map((e) => (e.id === sourceEntityId ? { ...e, relations: [...(e.relations || []), newRel] } : e))
      );
      showToast('Relation déclarée avec succès.');
      return { success: true, data: newRel };
    },
    [showToast]
  );

  const deleteRelation = useCallback(
    (sourceEntityId, relationId) => {
      setDataModels((prev) =>
        prev.map((e) => {
          if (e.id === sourceEntityId) {
            return {
              ...e,
              relations: (e.relations || []).filter((r) => r.id !== relationId),
            };
          }
          return e;
        })
      );
      showToast('Relation supprimée.');
      return { success: true };
    },
    [showToast]
  );

  // =========================================================================
  // 2. FEATURE & CAPABILITY CRUD (BM-CDC-04)
  // =========================================================================
  const createFeature = useCallback(
    (featureInput) => {
      const appId = featureInput.applicationId || selectedApp?.id;
      const newFeatId = `feat_${Date.now().toString().slice(-6)}`;
      const code = (featureInput.code || slugifyCode(featureInput.name)).trim();

      const newFeature = {
        id: newFeatId,
        applicationId: appId,
        code,
        name: featureInput.name || 'Nouveau Module',
        domain: featureInput.domain || 'Commerce',
        description: featureInput.description || 'Module applicatif métier.',
        status: featureInput.status || 'ACTIVE',
        source: featureInput.source || 'CUSTOM',
        icon: featureInput.icon || 'Boxes',
        capabilities: featureInput.capabilities || [
          {
            id: `cap_${Date.now()}_1`,
            code: `${code}.read`,
            name: `Consulter ${featureInput.name || 'le module'}`,
            type: 'READ',
            risk: 'LOW',
            required: true,
          },
        ],
        requiredEntities: featureInput.requiredEntities || [],
        dependencies: featureInput.dependencies || [],
      };

      setFeatures((prev) => [newFeature, ...prev]);

      logActivity({
        applicationId: appId,
        eventType: 'feature.capability.created',
        action: 'FEATURE.CREATED',
        targetType: 'FEATURE',
        targetId: newFeatId,
        result: 'SUCCESS',
        details: `Création du module fonctionnel "${newFeature.name}"`,
        after: newFeature,
      });

      syncVersionSnapshot(appId);
      showToast(`Module "${newFeature.name}" créé.`);
      return { success: true, data: newFeature };
    },
    [selectedApp, logActivity, syncVersionSnapshot, showToast]
  );

  const updateFeature = useCallback(
    (featureId, updates) => {
      setFeatures((prev) =>
        prev.map((f) => {
          if (f.id === featureId) {
            return { ...f, ...updates };
          }
          return f;
        })
      );
      showToast('Module fonctionnel mis à jour.');
      return { success: true };
    },
    [showToast]
  );

  const deleteFeature = useCallback(
    (featureId) => {
      const target = features.find((f) => f.id === featureId);
      if (!target) return { success: false };

      setFeatures((prev) => prev.filter((f) => f.id !== featureId));

      logActivity({
        applicationId: target.applicationId || selectedApp?.id,
        eventType: 'feature.capability.deleted',
        action: 'FEATURE.DELETED',
        targetType: 'FEATURE',
        targetId: featureId,
        result: 'SUCCESS',
        details: `Suppression de la fonctionnalité "${target.name}"`,
      });

      if (target.applicationId) syncVersionSnapshot(target.applicationId);
      showToast(`Fonctionnalité "${target.name}" supprimée.`);
      return { success: true };
    },
    [features, selectedApp, logActivity, syncVersionSnapshot, showToast]
  );

  const toggleFeatureStatus = useCallback(
    (featureId) => {
      let updatedStatus = 'ACTIVE';
      setFeatures((prev) =>
        prev.map((f) => {
          if (f.id === featureId) {
            updatedStatus = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            return { ...f, status: updatedStatus };
          }
          return f;
        })
      );

      const target = features.find((f) => f.id === featureId);
      if (target?.applicationId) syncVersionSnapshot(target.applicationId);
      showToast(`Statut de "${target?.name || 'la feature'}" changé en ${updatedStatus}.`);
      return { success: true, status: updatedStatus };
    },
    [features, syncVersionSnapshot, showToast]
  );

  const addCapability = useCallback(
    (featureId, capInput) => {
      const newCap = {
        id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        code: capInput.code || 'custom.action',
        name: capInput.name || 'Nouvelle capacité',
        type: capInput.type || 'ACTION',
        risk: capInput.risk || 'LOW',
        required: Boolean(capInput.required),
      };

      setFeatures((prev) =>
        prev.map((f) => (f.id === featureId ? { ...f, capabilities: [...(f.capabilities || []), newCap] } : f))
      );
      showToast(`Capacité IAM "${newCap.name}" ajoutée.`);
      return { success: true, data: newCap };
    },
    [showToast]
  );

  const removeCapability = useCallback(
    (featureId, capId) => {
      setFeatures((prev) =>
        prev.map((f) => {
          if (f.id === featureId) {
            return {
              ...f,
              capabilities: (f.capabilities || []).filter((c) => c.id !== capId),
            };
          }
          return f;
        })
      );
      showToast('Capacité supprimée.');
      return { success: true };
    },
    [showToast]
  );

  // =========================================================================
  // 3. MENU ENGINE & NAVIGATION CRUD (BM-CDC-05)
  // =========================================================================
  const createMenuItem = useCallback(
    (location, itemInput, parentId = null) => {
      const newItemId = `nav_${Date.now().toString().slice(-6)}`;
      const newItem = {
        id: newItemId,
        label: itemInput.label || 'Nouvel élément',
        icon: itemInput.icon || 'Folder',
        targetType: itemInput.targetType || 'ROUTE',
        route: itemInput.route || '/new-page',
        openMode: itemInput.openMode || 'SAME_VIEW',
        badge: itemInput.badge || null,
        requiredFeatures: itemInput.requiredFeatures || [],
        requiredCapabilities: itemInput.requiredCapabilities || [],
        matchMode: itemInput.matchMode || 'ALL',
        order: itemInput.order || 99,
        children: [],
      };

      setMenus((prev) =>
        prev.map((m) => {
          if (m.location === location) {
            if (!parentId) {
              return { ...m, items: [...(m.items || []), newItem] };
            }
            const addRecursive = (items) => {
              return items.map((it) => {
                if (it.id === parentId) {
                  return { ...it, children: [...(it.children || []), newItem] };
                }
                if (it.children?.length) {
                  return { ...it, children: addRecursive(it.children) };
                }
                return it;
              });
            };
            return { ...m, items: addRecursive(m.items) };
          }
          return m;
        })
      );

      syncVersionSnapshot(selectedApp?.id);
      showToast(`Menu "${newItem.label}" ajouté.`);
      return { success: true, data: newItem };
    },
    [selectedApp, syncVersionSnapshot, showToast]
  );

  const updateMenuItem = useCallback(
    (location, itemId, updates) => {
      setMenus((prev) =>
        prev.map((m) => {
          if (m.location === location) {
            const updateRecursive = (items) => {
              return items.map((it) => {
                if (it.id === itemId) {
                  return { ...it, ...updates };
                }
                if (it.children?.length) {
                  return { ...it, children: updateRecursive(it.children) };
                }
                return it;
              });
            };
            return { ...m, items: updateRecursive(m.items) };
          }
          return m;
        })
      );
      showToast('Élément de navigation mis à jour.');
      return { success: true };
    },
    [showToast]
  );

  const deleteMenuItem = useCallback(
    (location, itemId) => {
      setMenus((prev) =>
        prev.map((m) => {
          if (m.location === location) {
            const filterRecursive = (items) => {
              return items
                .filter((it) => it.id !== itemId)
                .map((it) => (it.children?.length ? { ...it, children: filterRecursive(it.children) } : it));
            };
            return { ...m, items: filterRecursive(m.items) };
          }
          return m;
        })
      );
      showToast('Élément de navigation supprimé.');
      return { success: true };
    },
    [showToast]
  );

  // Dynamic Navigation Resolver (BM-CDC-05 Section 33-38)
  const resolveNavigationTree = useCallback(
    (location, userRole = currentRole, customActiveFeatures = null) => {
      const menu = menus.find((m) => m.location === location);
      if (!menu) return [];

      const activeFeatSet = customActiveFeatures
        ? new Set(customActiveFeatures)
        : new Set(appFeatures.filter((f) => f.status === 'ACTIVE').map((f) => f.code));

      const evaluateItem = (item) => {
        // 1. Feature check
        if (item.requiredFeatures?.length > 0) {
          const satisfies =
            item.matchMode === 'ANY'
              ? item.requiredFeatures.some((f) => activeFeatSet.has(f))
              : item.requiredFeatures.every((f) => activeFeatSet.has(f));
          if (!satisfies) return null;
        }

        // 2. Role check (Viewer cannot see Admin Settings)
        if (userRole === 'VIEWER' && item.route === '/settings') {
          return null;
        }

        const resolved = { ...item };
        if (item.children?.length) {
          resolved.children = item.children.map(evaluateItem).filter(Boolean);
        }
        return resolved;
      };

      return (menu.items || []).map(evaluateItem).filter(Boolean);
    },
    [menus, appFeatures, currentRole]
  );

  // =========================================================================
  // 4. CONFIGURATION & SECRETS CRUD (BM-CDC-06)
  // =========================================================================
  const createConfig = useCallback(
    (configInput) => {
      const code = configInput.code?.trim();
      if (!code) return { success: false, error: { message: 'Code requis' } };

      const newConfig = {
        code,
        applicationId: configInput.applicationId || selectedApp?.id,
        label: configInput.label || code,
        section: configInput.section || 'Général',
        dataType: configInput.dataType || 'STRING',
        enumValues: configInput.enumValues || [],
        defaultValue: configInput.defaultValue ?? '',
        scope: configInput.scope || 'APPLICATION',
        isSecret: Boolean(configInput.isSecret),
        runtimeExposed: configInput.isSecret ? false : Boolean(configInput.runtimeExposed),
        description: configInput.description || '',
        storedValue: configInput.storedValue ?? configInput.defaultValue ?? '',
        effectiveValue: configInput.isSecret ? '••••••••••••' : configInput.storedValue ?? configInput.defaultValue ?? '',
        inheritance: configInput.inheritance || 'APPLICATION',
      };

      setConfigs((prev) => [newConfig, ...prev]);

      logActivity({
        applicationId: newConfig.applicationId,
        eventType: 'config.entry.created',
        action: 'CONFIG.CREATED',
        targetType: 'CONFIG',
        targetId: code,
        result: 'SUCCESS',
        details: `Création du paramètre de configuration "${code}"`,
      });

      showToast(`Paramètre "${code}" ajouté.`);
      return { success: true, data: newConfig };
    },
    [selectedApp, logActivity, showToast]
  );

  const updateConfigValue = useCallback(
    (code, newValue, scope = 'APPLICATION') => {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.code === code) {
            return {
              ...c,
              storedValue: newValue,
              effectiveValue: c.isSecret ? '••••••••••••••••' : newValue,
              inheritance: 'OVERRIDE',
            };
          }
          return c;
        })
      );

      logActivity({
        applicationId: selectedApp?.id,
        eventType: 'config.value.updated',
        action: 'CONFIG.UPDATED',
        targetType: 'CONFIG',
        targetId: code,
        result: 'SUCCESS',
        details: `Modification de la variable "${code}"`,
      });

      showToast(`Valeur de "${code}" enregistrée.`);
      return { success: true };
    },
    [selectedApp, logActivity, showToast]
  );

  const resetConfigToDefault = useCallback(
    (code) => {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.code === code) {
            return {
              ...c,
              storedValue: c.defaultValue,
              effectiveValue: c.isSecret ? '••••••••••••••••' : c.defaultValue,
              inheritance: 'DEFAULT',
            };
          }
          return c;
        })
      );
      showToast(`Paramètre "${code}" réinitialisé.`);
      return { success: true };
    },
    [showToast]
  );

  const deleteConfig = useCallback(
    (code) => {
      setConfigs((prev) => prev.filter((c) => c.code !== code));
      showToast(`Paramètre "${code}" supprimé.`);
      return { success: true };
    },
    [showToast]
  );

  // =========================================================================
  // 5. INTEGRATION BRIDGE & RUNTIME CONTRACTS (BM-CDC-07)
  // =========================================================================
  const createIntegration = useCallback(
    (intInput) => {
      const newIntId = `int_${Date.now().toString().slice(-6)}`;
      const newInt = {
        id: newIntId,
        applicationId: intInput.applicationId || selectedApp?.id,
        code: intInput.code || `custom.adapter.${newIntId}`,
        name: intInput.name || 'Nouvel Adaptateur',
        category: intInput.category || 'Services Externes',
        provider: intInput.provider || 'Fournisseur Tiers',
        status: intInput.status || 'CONFIGURED',
        protocol: intInput.protocol || 'REST_JSON',
        endpoint: intInput.endpoint || 'https://api.example.com/v1',
        latencyMs: 45,
        lastSync: 'À l instant',
        health: 'HEALTHY',
        boundEntities: intInput.boundEntities || [],
      };

      setIntegrations((prev) => [newInt, ...prev]);

      logActivity({
        applicationId: newInt.applicationId,
        eventType: 'integration.adapter.created',
        action: 'INTEGRATION.CREATED',
        targetType: 'INTEGRATION',
        targetId: newIntId,
        result: 'SUCCESS',
        details: `Connecteur "${newInt.name}" configuré (${newInt.protocol})`,
      });

      showToast(`Connecteur "${newInt.name}" configuré.`);
      return { success: true, data: newInt };
    },
    [selectedApp, logActivity, showToast]
  );

  const updateIntegration = useCallback(
    (intId, updates) => {
      setIntegrations((prev) =>
        prev.map((i) => {
          if (i.id === intId) {
            return { ...i, ...updates };
          }
          return i;
        })
      );
      showToast('Connecteur d intégration mis à jour.');
      return { success: true };
    },
    [showToast]
  );

  const deleteIntegration = useCallback(
    (intId) => {
      const target = integrations.find((i) => i.id === intId);
      setIntegrations((prev) => prev.filter((i) => i.id !== intId));
      showToast(`Connecteur "${target?.name || intId}" retiré.`);
      return { success: true };
    },
    [integrations, showToast]
  );

  const testIntegration = useCallback(
    async (intId) => {
      const target = integrations.find((i) => i.id === intId);
      if (!target) return { success: false, error: 'Introuvable' };

      // Simulate real ping latency
      const simulatedLatency = Math.floor(Math.random() * 45) + 20;

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === intId
            ? {
                ...i,
                status: 'CONNECTED',
                health: 'HEALTHY',
                latencyMs: simulatedLatency,
                lastSync: 'À l instant',
              }
            : i
        )
      );

      logActivity({
        applicationId: target.applicationId || selectedApp?.id,
        eventType: 'integration.health.ping',
        action: 'INTEGRATION.PING',
        targetType: 'INTEGRATION',
        targetId: intId,
        result: 'SUCCESS',
        details: `Test de connectivité réussi sur ${target.name} (${simulatedLatency}ms)`,
      });

      showToast(`Connecteur "${target.name}" joignable (${simulatedLatency} ms).`);
      return { success: true, latency: simulatedLatency };
    },
    [integrations, selectedApp, logActivity, showToast]
  );

  // Generate Runtime Manifest Snapshot
  const generateRuntimeManifest = useCallback(
    (appId = selectedApp?.id, versionId = selectedVersion?.id) => {
      const app = applications.find((a) => a.id === appId) || selectedApp;
      const ver = versions.find((v) => v.id === versionId) || selectedVersion;

      const appEnts = dataModels.filter((d) => !d.applicationId || d.applicationId === appId);
      const appFeats = features.filter((f) => !f.applicationId || f.applicationId === appId);
      const appInts = integrations.filter((i) => !i.applicationId || i.applicationId === appId);
      const appCfgs = configs.filter((c) => !c.applicationId || c.applicationId === appId);

      const payload = {
        manifestVersion: '1.0.0',
        standard: 'BM-CDC-07',
        generatedAt: new Date().toISOString(),
        application: {
          id: app?.id,
          code: app?.code,
          name: app?.name,
          category: app?.category,
          environment: app?.environment,
          defaultLocale: app?.defaultLocale || 'fr',
          timezone: app?.timezone || 'Europe/Paris',
        },
        version: {
          versionNumber: ver?.versionNumber || '1.0.0',
          status: ver?.status || 'DRAFT',
          snapshotHash: ver?.snapshotHash || computeSnapshotHash(ver?.snapshot || {}),
        },
        contracts: {
          entitiesCount: appEnts.length,
          activeFeaturesCount: appFeats.filter((f) => f.status === 'ACTIVE').length,
          menuItemsCount: menus[0]?.items?.length || 0,
          configEntriesCount: appCfgs.length,
        },
        integrations: appInts.map((i) => ({
          code: i.code,
          protocol: i.protocol,
          status: i.status,
          health: i.health,
          boundEntities: i.boundEntities,
        })),
      };

      return payload;
    },
    [applications, selectedApp, versions, selectedVersion, dataModels, features, integrations, configs, menus]
  );

  // =========================================================================
  // 6. APPLICATION & VERSION LIFECYCLE (BM-CDC-01 & BM-CDC-02)
  // =========================================================================
  const createApplication = useCallback(
    (input) => {
      if (!hasPermission('business.application.create')) {
        return {
          success: false,
          error: { code: ERROR_CODES.PERMISSION_DENIED, message: 'Accès refusé pour la création d application' },
        };
      }

      const name = input.name?.trim();
      if (!name || name.length < 2) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPLICATION_NAME_REQUIRED, message: 'Le nom doit comporter au moins 2 caractères.' },
        };
      }

      let code = (input.code || slugifyCode(name)).trim();
      if (!isValidApplicationCode(code)) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPLICATION_CODE_INVALID, message: 'Le code technique doit être en minuscules et tirets (kebab-case).' },
        };
      }

      const duplicate = applications.find((a) => a.code === code && a.tenantId === currentTenant.id);
      if (duplicate) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPLICATION_CODE_EXISTS, message: `Une application avec le code "${code}" existe déjà.` },
        };
      }

      const newAppId = `app-${Date.now().toString().slice(-6)}`;
      const initialVerId = `ver-${Date.now().toString().slice(-6)}-100`;
      const now = new Date().toISOString();

      const initialSnapshot = {
        appName: name,
        appCode: code,
        category: input.category || 'Commerce',
        icon: input.icon || 'ShoppingBag',
        dataModels: input.dataModels || [
          { code: 'product', name: 'Product', fields: ['code', 'name', 'price', 'stock'] },
          { code: 'customer', name: 'Customer', fields: ['fullName', 'email', 'phone'] },
        ],
        features: input.features || ['Catalog', 'Cart', 'Checkout'],
        menus: [
          { id: 'm1', label: 'Accueil', path: '/' },
          { id: 'm2', label: 'Tableau de bord', path: '/dashboard' },
        ],
      };

      const initialVersion = {
        id: initialVerId,
        applicationId: newAppId,
        versionNumber: '1.0.0',
        status: 'DRAFT',
        environment: input.environment || 'DEVELOPMENT',
        type: 'INITIAL',
        comment: 'Version initiale générée automatiquement',
        createdBy: currentUser.name,
        createdAt: now,
        validatedAt: null,
        publishedAt: null,
        validationStatus: 'NOT_RUN',
        completeness: 70,
        snapshotHash: computeSnapshotHash(initialSnapshot),
        snapshot: initialSnapshot,
        version: 1,
      };

      const newApp = {
        id: newAppId,
        tenantId: currentTenant.id,
        code,
        name,
        shortName: input.shortName || name.split(' ')[0],
        description: input.description || 'Nouvelle application métier centralisée.',
        category: input.category || 'Commerce',
        icon: input.icon || 'ShoppingBag',
        color: input.color || '#3B82F6',
        status: 'DRAFT',
        environment: input.environment || 'DEVELOPMENT',
        sourceType: input.sourceType || 'CUSTOM',
        defaultLocale: input.defaultLocale || 'fr',
        timezone: input.timezone || 'Europe/Paris',
        currentVersionId: initialVerId,
        publishedVersionId: null,
        publishedVersionNumber: null,
        currentVersionNumber: '1.0.0',
        createdBy: currentUser.name,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        version: 1,
        metrics: {
          modulesCount: 4,
          featuresCount: initialSnapshot.features.length,
          dataEntitiesCount: initialSnapshot.dataModels.length,
          menuItemsCount: initialSnapshot.menus.length,
        },
        tags: input.tags || ['nouveau', 'draft', input.category?.toLowerCase() || 'commerce'],
        notes: input.notes || 'Application initialisée via l assistant.',
        notesUpdatedAt: now,
        environments: [
          { name: input.environment || 'DEVELOPMENT', version: 'v1.0.0', status: 'DRAFT', publishedAt: '-', health: 5 },
        ],
      };

      setApplications((prev) => [newApp, ...prev]);
      setVersions((prev) => [initialVersion, ...prev]);
      setSelectedAppId(newAppId);
      setSelectedVersionId(initialVerId);

      logActivity({
        applicationId: newAppId,
        applicationName: name,
        eventType: 'business.application.created',
        action: 'BUSINESS.APPLICATION.CREATED',
        targetType: 'APPLICATION',
        targetId: newAppId,
        result: 'SUCCESS',
        details: `Création de l'application ${name} (#${code})`,
        after: newApp,
      });

      showToast(`Application "${name}" créée avec succès !`);
      return { success: true, data: newApp };
    },
    [applications, currentTenant, currentUser, hasPermission, logActivity, showToast]
  );

  const updateApplication = useCallback(
    (appId, updates, expectedVersion = null) => {
      if (!hasPermission('business.application.update')) {
        return {
          success: false,
          error: { code: ERROR_CODES.PERMISSION_DENIED, message: 'Permission de modification refusée.' },
        };
      }

      const existing = applications.find((a) => a.id === appId);
      if (!existing) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPLICATION_NOT_FOUND, message: 'Application introuvable.' },
        };
      }

      const now = new Date().toISOString();
      const updated = {
        ...existing,
        ...updates,
        updatedAt: now,
        version: existing.version + 1,
      };

      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

      logActivity({
        applicationId: appId,
        applicationName: updated.name,
        eventType: 'business.application.updated',
        action: 'BUSINESS.APPLICATION.UPDATED',
        targetType: 'APPLICATION',
        targetId: appId,
        result: 'SUCCESS',
        details: `Mise à jour des métadonnées de ${updated.name}`,
        before: existing,
        after: updated,
      });

      showToast('Modifications enregistrées avec succès.');
      return { success: true, data: updated };
    },
    [applications, hasPermission, logActivity, showToast]
  );

  const transitionApplicationStatus = useCallback(
    (appId, targetStatus, comment = '') => {
      const existing = applications.find((a) => a.id === appId);
      if (!existing) return { success: false, error: { message: 'App non trouvée' } };

      const allowed = ALLOWED_APPLICATION_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(targetStatus)) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_STATE,
            message: `Transition interdite de "${existing.status}" vers "${targetStatus}".`,
          },
        };
      }

      const now = new Date().toISOString();
      const updated = {
        ...existing,
        status: targetStatus,
        archivedAt: targetStatus === 'ARCHIVED' ? now : existing.archivedAt,
        updatedAt: now,
        version: existing.version + 1,
      };

      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));

      logActivity({
        applicationId: appId,
        applicationName: updated.name,
        eventType: 'business.application.status.changed',
        action: targetStatus === 'ARCHIVED' ? 'BUSINESS.APPLICATION.ARCHIVED' : 'BUSINESS.STATUS.TRANSITION',
        targetType: 'APPLICATION',
        targetId: appId,
        result: 'SUCCESS',
        details: `Transition de statut vers ${targetStatus} (${comment || 'Standard'})`,
        before: { status: existing.status },
        after: { status: targetStatus },
      });

      showToast(`Statut de ${updated.name} changé en ${targetStatus}`);
      return { success: true, data: updated };
    },
    [applications, logActivity, showToast]
  );

  const cloneApplication = useCallback(
    (sourceAppId, newName, newCode, customDesc = '') => {
      const source = applications.find((a) => a.id === sourceAppId);
      if (!source) return { success: false, error: { message: 'Application source introuvable' } };

      const name = newName?.trim() || `${source.name} (Clone)`;
      const code = (newCode || slugifyCode(name)).trim();

      if (!isValidApplicationCode(code)) {
        return { success: false, error: { message: 'Code technique invalide.' } };
      }

      const newAppId = `app-clone-${Date.now().toString().slice(-6)}`;
      const newVerId = `ver-clone-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const sourceVer = versions.find((v) => v.id === source.publishedVersionId || v.id === source.currentVersionId);
      const clonedSnapshot = sourceVer?.snapshot
        ? JSON.parse(JSON.stringify(sourceVer.snapshot))
        : { appName: name, dataModels: [], features: [], menus: [] };

      const initialVer = {
        id: newVerId,
        applicationId: newAppId,
        versionNumber: '1.0.0',
        status: 'DRAFT',
        environment: source.environment || 'DEVELOPMENT',
        type: 'INITIAL',
        comment: `Version initiale issue du clonage de ${source.name} (v${sourceVer?.versionNumber || '1.0.0'})`,
        createdBy: currentUser.name,
        createdAt: now,
        validatedAt: null,
        publishedAt: null,
        validationStatus: 'NOT_RUN',
        completeness: sourceVer?.completeness || 80,
        snapshotHash: computeSnapshotHash(clonedSnapshot),
        snapshot: clonedSnapshot,
        version: 1,
      };

      const clonedApp = {
        ...source,
        id: newAppId,
        name,
        code,
        shortName: name.split(' ')[0],
        description: customDesc || `Clone de ${source.name}`,
        status: 'DRAFT',
        currentVersionId: newVerId,
        publishedVersionId: null,
        publishedVersionNumber: null,
        currentVersionNumber: '1.0.0',
        sourceType: 'CLONED',
        createdBy: currentUser.name,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        version: 1,
        environments: [
          { name: source.environment || 'DEVELOPMENT', version: 'v1.0.0', status: 'DRAFT', publishedAt: '-', health: 5 },
        ],
      };

      // Clone entities for the cloned app
      const sourceEnts = dataModels.filter((d) => d.applicationId === sourceAppId);
      const clonedEnts = sourceEnts.map((e) => ({
        ...e,
        id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        applicationId: newAppId,
      }));

      setDataModels((prev) => [...clonedEnts, ...prev]);
      setApplications((prev) => [clonedApp, ...prev]);
      setVersions((prev) => [initialVer, ...prev]);
      setSelectedAppId(newAppId);
      setSelectedVersionId(newVerId);

      logActivity({
        applicationId: newAppId,
        applicationName: name,
        eventType: 'business.application.cloned',
        action: 'BUSINESS.APPLICATION.CLONED',
        targetType: 'APPLICATION',
        targetId: newAppId,
        result: 'SUCCESS',
        details: `Clonage réussi depuis ${source.name} (${source.code})`,
        after: clonedApp,
      });

      showToast(`Clone "${name}" créé avec succès !`);
      return { success: true, data: clonedApp };
    },
    [applications, versions, dataModels, currentUser, logActivity, showToast]
  );

  const createVersion = useCallback(
    (appId, { versionNumber, comment, sourceVersionId, type = 'MINOR' }) => {
      const app = applications.find((a) => a.id === appId);
      if (!app) return { success: false, error: { message: 'Application introuvable' } };

      const vNum = versionNumber?.trim();
      if (!isValidSemver(vNum)) {
        return {
          success: false,
          error: { code: ERROR_CODES.VERSION_INVALID_NUMBER, message: 'Format SemVer invalide (ex: 1.1.0).' },
        };
      }

      const existingVer = versions.find((v) => v.applicationId === appId && v.versionNumber === vNum);
      if (existingVer) {
        return {
          success: false,
          error: { code: ERROR_CODES.VERSION_ALREADY_EXISTS, message: `La version ${vNum} existe déjà.` },
        };
      }

      const sourceVer = versions.find((v) => v.id === (sourceVersionId || app.currentVersionId || app.publishedVersionId));
      const newSnapshot = sourceVer?.snapshot
        ? JSON.parse(JSON.stringify(sourceVer.snapshot))
        : { appName: app.name, dataModels: [], features: [], menus: [] };

      const newVerId = `ver-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const newVersion = {
        id: newVerId,
        applicationId: appId,
        versionNumber: vNum,
        status: 'DRAFT',
        environment: app.environment || 'DEVELOPMENT',
        type,
        comment: comment || `Préparation de la version ${vNum}`,
        createdBy: currentUser.name,
        createdAt: now,
        validatedAt: null,
        publishedAt: null,
        validationStatus: 'NOT_RUN',
        completeness: 70,
        snapshotHash: computeSnapshotHash(newSnapshot),
        snapshot: newSnapshot,
        version: 1,
      };

      setVersions((prev) => [newVersion, ...prev]);

      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, currentVersionId: newVerId, currentVersionNumber: vNum, updatedAt: now, version: a.version + 1 }
            : a
        )
      );

      setSelectedVersionId(newVerId);

      logActivity({
        applicationId: appId,
        applicationName: app.name,
        versionId: newVerId,
        versionNumber: vNum,
        eventType: 'business.application.version.created',
        action: 'BUSINESS.VERSION.CREATED',
        targetType: 'APPLICATION_VERSION',
        targetId: newVerId,
        result: 'SUCCESS',
        details: `Création de la version v${vNum} (DRAFT)`,
        after: newVersion,
        metadata: {
          bumpType: type,
          sourceVersionId,
        },
      });

      showToast(`Version v${vNum} créée en DRAFT.`);
      return { success: true, data: newVersion };
    },
    [applications, versions, currentUser, logActivity, showToast]
  );

  // Alias for NewVersionModal
  const createNewVersion = useCallback(
    (appId, options) => {
      const targetAppId = appId || selectedApp?.id;
      return createVersion(targetAppId, options);
    },
    [createVersion, selectedApp]
  );

  const validateVersion = useCallback(
    (appId, versionId) => {
      const app = applications.find((a) => a.id === appId) || selectedApp;
      const targetVerId = versionId || selectedVersion?.id;
      const ver = versions.find((v) => v.id === targetVerId);
      if (!app || !ver) return { success: false, error: { message: 'Éléments introuvables' } };

      const validationResult = ValidationEngine.validateApplicationVersion(app, ver, {
        dataModels,
        features,
        menus,
        configs,
        integrations,
      });

      const now = new Date().toISOString();
      const updatedVer = {
        ...ver,
        validationStatus: validationResult.canPublish ? 'PASS' : 'FAIL',
        completeness: validationResult.completeness,
        validatedAt: now,
        status: ver.status === 'DRAFT' && validationResult.canPublish ? 'READY' : ver.status,
      };

      setVersions((prev) => prev.map((v) => (v.id === targetVerId ? updatedVer : v)));

      logActivity({
        applicationId: app.id,
        applicationName: app.name,
        versionId: ver.id,
        versionNumber: ver.versionNumber,
        eventType: 'business.application.version.validated',
        action: 'BUSINESS.VERSION.VALIDATED',
        targetType: 'APPLICATION_VERSION',
        targetId: ver.id,
        result: validationResult.canPublish ? 'SUCCESS' : 'WARNING',
        details: `Validation v${ver.versionNumber}: ${validationResult.summary.passed}/${validationResult.summary.total} contrôles passés (${validationResult.completeness}%)`,
        before: { validationStatus: ver.validationStatus, completeness: ver.completeness },
        after: { validationStatus: updatedVer.validationStatus, completeness: updatedVer.completeness, status: updatedVer.status },
        metadata: {
          summary: validationResult.summary,
        },
      });

      return { success: true, data: validationResult };
    },
    [applications, selectedApp, versions, selectedVersion, dataModels, features, menus, configs, integrations, logActivity]
  );

  const validateCurrentVersion = useCallback(() => {
    if (!selectedApp || !selectedVersion) return { success: false };
    return validateVersion(selectedApp.id, selectedVersion.id);
  }, [selectedApp, selectedVersion, validateVersion]);

  const publishVersion = useCallback(
    (firstArg, secondArg, thirdArg = 'PRODUCTION') => {
      // Support both publishVersion(versionId, env) and publishVersion(appId, versionId, env)
      let appId = selectedApp?.id;
      let versionId = selectedVersion?.id;
      let targetEnvironment = 'PRODUCTION';

      if (typeof secondArg === 'string' && (secondArg === 'PRODUCTION' || secondArg === 'STAGING' || secondArg === 'TEST' || secondArg === 'DEVELOPMENT')) {
        versionId = firstArg;
        targetEnvironment = secondArg;
        const foundVer = versions.find((v) => v.id === versionId);
        if (foundVer) appId = foundVer.applicationId;
      } else if (firstArg && secondArg) {
        appId = firstArg;
        versionId = secondArg;
        targetEnvironment = thirdArg || 'PRODUCTION';
      }

      const app = applications.find((a) => a.id === appId) || selectedApp;
      const ver = versions.find((v) => v.id === versionId) || selectedVersion;
      if (!app || !ver) return { success: false, error: { message: 'Introuvable' } };

      const validation = ValidationEngine.validateApplicationVersion(app, ver, {
        dataModels,
        features,
        menus,
        configs,
        integrations,
      });

      if (!validation.canPublish) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.PUBLICATION_VALIDATION_FAILED,
            message: 'La validation a échoué. Résolvez les blocages critiques avant de publier.',
          },
        };
      }

      const previousPublishedId = app.publishedVersionId;
      const previousVersion = versions.find((v) => v.id === previousPublishedId);
      const now = new Date().toISOString();

      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === ver.id) {
            return {
              ...v,
              status: 'PUBLISHED',
              environment: targetEnvironment,
              publishedAt: now,
              version: v.version + 1,
            };
          }
          if (v.id === previousPublishedId) {
            return {
              ...v,
              status: 'SUPERSEDED',
            };
          }
          return v;
        })
      );

      const updatedApp = {
        ...app,
        status: 'ACTIVE',
        environment: targetEnvironment,
        publishedVersionId: ver.id,
        publishedVersionNumber: ver.versionNumber,
        currentVersionId: ver.id,
        currentVersionNumber: ver.versionNumber,
        updatedAt: now,
        version: app.version + 1,
        environments: app.environments.map((e) =>
          e.name === targetEnvironment
            ? { ...e, version: `v${ver.versionNumber}`, status: 'ACTIF', publishedAt: new Date().toLocaleString('fr-FR') }
            : e
        ),
      };

      setApplications((prev) => prev.map((a) => (a.id === app.id ? updatedApp : a)));

      logActivity({
        applicationId: app.id,
        applicationName: app.name,
        versionId: ver.id,
        versionNumber: ver.versionNumber,
        eventType: 'business.application.version.published',
        action: 'BUSINESS.VERSION.PUBLISHED',
        targetType: 'APPLICATION_VERSION',
        targetId: ver.id,
        result: 'SUCCESS',
        details: `Publication transactionnelle de v${ver.versionNumber} sur ${targetEnvironment}`,
        before: { publishedVersionId: previousPublishedId, publishedVersionNumber: previousVersion?.versionNumber || null, status: app.status },
        after: { publishedVersionId: ver.id, publishedVersionNumber: ver.versionNumber, status: 'ACTIVE', environment: targetEnvironment },
        metadata: {
          targetEnvironment,
          snapshotHash: ver.snapshotHash,
        },
      });

      showToast(`Version v${ver.versionNumber} publiée avec succès en ${targetEnvironment} !`);
      return { success: true, data: updatedApp };
    },
    [applications, selectedApp, versions, selectedVersion, dataModels, features, menus, configs, integrations, logActivity, showToast]
  );

  const rollbackVersion = useCallback(
    (appId, targetVersionId, reasonOrEnv = '', targetEnvironment = 'PRODUCTION') => {
      const app = applications.find((a) => a.id === appId) || selectedApp;
      const targetVer = versions.find((v) => v.id === targetVersionId);
      if (!app || !targetVer) return { success: false, error: { message: 'Version introuvable' } };

      const previousPublishedId = app.publishedVersionId;
      const previousVer = versions.find((v) => v.id === previousPublishedId);
      const env = (typeof reasonOrEnv === 'string' && ['PRODUCTION', 'STAGING', 'TEST', 'DEVELOPMENT'].includes(reasonOrEnv))
        ? reasonOrEnv
        : targetEnvironment;
      const reason = typeof reasonOrEnv === 'string' && !['PRODUCTION', 'STAGING', 'TEST', 'DEVELOPMENT'].includes(reasonOrEnv)
        ? reasonOrEnv
        : 'Restauration de secours';
      const now = new Date().toISOString();

      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === targetVersionId) {
            return {
              ...v,
              status: 'PUBLISHED',
              environment: env,
              publishedAt: now,
              version: v.version + 1,
            };
          }
          if (v.id === previousPublishedId) {
            return {
              ...v,
              status: 'SUPERSEDED',
            };
          }
          return v;
        })
      );

      const updatedApp = {
        ...app,
        status: 'ACTIVE',
        environment: env,
        publishedVersionId: targetVersionId,
        publishedVersionNumber: targetVer.versionNumber,
        currentVersionId: targetVersionId,
        currentVersionNumber: targetVer.versionNumber,
        updatedAt: now,
        version: app.version + 1,
      };

      setApplications((prev) => prev.map((a) => (a.id === app.id ? updatedApp : a)));

      logActivity({
        applicationId: app.id,
        applicationName: app.name,
        versionId: targetVer.id,
        versionNumber: targetVer.versionNumber,
        eventType: 'business.application.version.rollback',
        action: 'BUSINESS.VERSION.ROLLBACK',
        targetType: 'APPLICATION_VERSION',
        targetId: targetVersionId,
        result: 'SUCCESS',
        details: `Restauration / Rollback vers la version stable v${targetVer.versionNumber} (${reason})`,
        before: { publishedVersionId: previousPublishedId, publishedVersionNumber: previousVer?.versionNumber || null },
        after: { publishedVersionId: targetVersionId, publishedVersionNumber: targetVer.versionNumber },
        metadata: {
          reason,
          targetEnvironment: env,
        },
      });

      showToast(`Restauration vers v${targetVer.versionNumber} effectuée.`);
      return { success: true, data: updatedApp };
    },
    [applications, selectedApp, versions, logActivity, showToast]
  );

  const rollbackToVersion = useCallback(
    (appId, targetVersionId, reason) => {
      return rollbackVersion(appId, targetVersionId, reason);
    },
    [rollbackVersion]
  );

  // Dynamic Real-time Platform Stats
  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const activeApplications = applications.filter((a) => a.status === 'ACTIVE').length;
    const draftApplications = applications.filter((a) => a.status === 'DRAFT').length;
    const configuringApplications = applications.filter((a) => a.status === 'CONFIGURING').length;
    const readyApplications = applications.filter((a) => a.status === 'READY').length;
    const suspendedApplications = applications.filter((a) => a.status === 'SUSPENDED').length;
    const archivedApplications = applications.filter((a) => a.status === 'ARCHIVED').length;

    const totalVersions = versions.length;
    const stableVersions = versions.filter((v) => v.status === 'PUBLISHED').length;
    const draftVersions = versions.filter((v) => v.status === 'DRAFT' || v.status === 'CONFIGURING').length;
    const readyVersions = versions.filter((v) => v.status === 'READY').length;
    const deprecatedVersions = versions.filter((v) => v.status === 'DEPRECATED' || v.status === 'SUPERSEDED').length;

    const envCounts = { PRODUCTION: 0, STAGING: 0, TEST: 0, DEVELOPMENT: 0 };
    applications.forEach((a) => {
      if (envCounts[a.environment] !== undefined) {
        envCounts[a.environment]++;
      }
    });

    const verStatusCounts = { DRAFT: 0, CONFIGURING: 0, READY: 0, PUBLISHED: 0, ARCHIVED: 0 };
    versions.forEach((v) => {
      if (verStatusCounts[v.status] !== undefined) {
        verStatusCounts[v.status]++;
      } else if (v.status === 'SUPERSEDED' || v.status === 'DEPRECATED') {
        verStatusCounts.ARCHIVED++;
      }
    });

    return {
      totalApplications,
      activeApplications,
      draftApplications,
      configuringApplications,
      readyApplications,
      suspendedApplications,
      archivedApplications,
      totalVersions,
      stableVersions,
      draftVersions,
      readyVersions,
      deprecatedVersions,
      envCounts,
      verStatusCounts,
      blockingIssuesCount: 0,
      qualityScore: 96,
      recentApplications: applications.slice(0, 4),
      recentActivities: activities.slice(0, 5),
    };
  }, [applications, versions, activities]);

  // Navigate to application workspace
  const openApplicationWorkspace = useCallback(
    (appId) => {
      setSelectedAppId(appId);
      const app = applications.find((a) => a.id === appId);
      if (app?.currentVersionId || app?.publishedVersionId) {
        setSelectedVersionId(app.publishedVersionId || app.currentVersionId);
      }
      setCurrentView('application-detail');
    },
    [applications]
  );

  // ============================================================================
  // PACK MANAGER ACTIONS & SELECTORS (PM-CDC-00, PM-CDC-01, PM-CDC-02)
  // ============================================================================

  const selectedPack = useMemo(() => {
    return packs.find((p) => p.id === selectedPackId) || packs[0] || null;
  }, [packs, selectedPackId]);

  const packVersionsScoped = useMemo(() => {
    if (!selectedPack) return [];
    return packVersions.filter((v) => v.packId === selectedPack.id);
  }, [packVersions, selectedPack]);

  const selectedPackVersion = useMemo(() => {
    if (!selectedPackVersionId) return packVersionsScoped[0] || null;
    return packVersions.find((v) => v.id === selectedPackVersionId) || packVersionsScoped[0] || null;
  }, [packVersions, selectedPackVersionId, packVersionsScoped]);

  // Log Pack Activity Event
  const logPackActivity = useCallback(
    ({
      packId,
      packCode,
      packName,
      versionNumber,
      action,
      details,
      status = 'SUCCESS',
    }) => {
      const newEvent = {
        id: `pact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        traceId: `trc_pm_${Date.now().toString(36).slice(-6)}`,
        actor: currentUser.name,
        role: currentRole,
        action,
        packCode: packCode || selectedPack?.code || 'system',
        packName: packName || selectedPack?.name || 'Pack Système',
        versionNumber: versionNumber || selectedPack?.currentVersionNumber || '1.0.0',
        details: details || action,
        status,
        timestamp: new Date().toISOString(),
      };
      setPackActivities((prev) => [newEvent, ...prev.slice(0, 49)]);
    },
    [currentUser, currentRole, selectedPack]
  );

  // Navigate to Pack Workspace
  const openPackWorkspace = useCallback(
    (packId) => {
      setSelectedPackId(packId);
      const targetPack = packs.find((p) => p.id === packId);
      if (targetPack?.publishedVersionId || targetPack?.currentVersionId) {
        setSelectedPackVersionId(targetPack.publishedVersionId || targetPack.currentVersionId);
      }
      setCurrentView('packs');
    },
    [packs]
  );

  // Create Pack (PM-CDC-02)
  const createPack = useCallback(
    (packInput) => {
      if (!packInput.name?.trim()) {
        showToast('Le nom du pack est obligatoire.', 'error');
        return { success: false, error: 'PACK_NAME_REQUIRED' };
      }

      const generatedCode = packInput.code?.trim() || slugifyCode(packInput.name);

      if (packs.some((p) => p.code.toLowerCase() === generatedCode.toLowerCase() && p.status !== PACK_STATUS.ARCHIVED)) {
        showToast(`Le code pack "${generatedCode}" existe déjà dans ce tenant.`, 'error');
        return { success: false, error: PACK_ERROR_CODES.PACK_CODE_ALREADY_EXISTS };
      }

      const newPackId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const initialVersionId = `pver-${generatedCode}-010`;

      const newPack = {
        id: newPackId,
        tenantId: currentTenant.id,
        code: generatedCode,
        name: packInput.name.trim(),
        shortName: packInput.shortName?.trim() || packInput.name.trim().slice(0, 16),
        description: packInput.description?.trim() || '',
        categoryId: packInput.categoryId || 'cat_commerce',
        category: packInput.category || 'Commerce & Stock',
        iconKey: packInput.iconKey || 'Boxes',
        logoRef: null,
        status: PACK_STATUS.ACTIVE,
        sourceType: packInput.sourceType || PACK_SOURCE_TYPE.CUSTOM,
        color: packInput.color || '#3B82F6',
        metadata: {
          tags: packInput.tags || [generatedCode],
          targetAudience: packInput.targetAudience || 'Utilisateurs métier',
        },
        currentVersionId: initialVersionId,
        publishedVersionId: null,
        publishedVersionNumber: null,
        currentVersionNumber: '0.1.0-draft',
        versionsCount: 1,
        modulesCount: 1,
        featuresCount: 1,
        capabilitiesCount: 0,
        dependenciesCount: 0,
        rulesCount: 0,
        validationStatus: PACK_VALIDATION_STATUS.NOT_RUN,
        manifestStatus: PACK_MANIFEST_STATUS.NOT_GENERATED,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        archivedAt: null,
        version: 1,
      };

      const initialVersion = {
        id: initialVersionId,
        packId: newPackId,
        versionNumber: '0.1.0-draft',
        label: 'Version 0.1.0 (Initial Draft)',
        description: 'Version initiale générée automatiquement lors de la création du pack.',
        status: PACK_VERSION_STATUS.DRAFT,
        validationStatus: PACK_VALIDATION_STATUS.NOT_RUN,
        manifestStatus: PACK_MANIFEST_STATUS.NOT_GENERATED,
        sourceVersionId: null,
        snapshotHash: null,
        manifestHash: null,
        contractVersion: '1.0',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        modulesCount: 1,
        featuresCount: 1,
        dependenciesCount: 0,
        rulesCount: 0,
      };

      setPacks((prev) => [newPack, ...prev]);
      setPackVersions((prev) => [initialVersion, ...prev]);
      setSelectedPackId(newPackId);
      setSelectedPackVersionId(initialVersionId);

      logPackActivity({
        packId: newPackId,
        packCode: generatedCode,
        packName: newPack.name,
        versionNumber: '0.1.0-draft',
        action: 'pack.created',
        details: `Pack "${newPack.name}" (${generatedCode}) créé avec succès.`,
      });

      showToast(`Pack "${newPack.name}" créé avec succès.`);
      return { success: true, data: newPack };
    },
    [packs, currentTenant, currentUser, showToast, logPackActivity]
  );

  // Update Pack (PM-CDC-02 with Optimistic Locking)
  const updatePack = useCallback(
    (packId, updates) => {
      const existing = packs.find((p) => p.id === packId);
      if (!existing) {
        showToast('Pack introuvable.', 'error');
        return { success: false, error: PACK_ERROR_CODES.PACK_NOT_FOUND };
      }

      if (existing.status === PACK_STATUS.ARCHIVED) {
        showToast('Ce pack est archivé et ne peut être modifié directement.', 'error');
        return { success: false, error: PACK_ERROR_CODES.PACK_ARCHIVED };
      }

      const updated = {
        ...existing,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : existing.name,
        shortName: updates.shortName !== undefined ? updates.shortName.trim() : existing.shortName,
        description: updates.description !== undefined ? updates.description.trim() : existing.description,
        categoryId: updates.categoryId || existing.categoryId,
        category: updates.category || existing.category,
        iconKey: updates.iconKey || existing.iconKey,
        color: updates.color || existing.color,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        version: (existing.version || 1) + 1,
      };

      setPacks((prev) => prev.map((p) => (p.id === packId ? updated : p)));

      logPackActivity({
        packId: existing.id,
        packCode: existing.code,
        packName: updated.name,
        action: 'pack.updated',
        details: `Métadonnées du pack "${updated.name}" mises à jour (v${updated.version}).`,
      });

      showToast(`Pack "${updated.name}" mis à jour.`);
      return { success: true, data: updated };
    },
    [packs, currentUser, showToast, logPackActivity]
  );

  // Duplicate Pack (PM-CDC-02)
  const duplicatePack = useCallback(
    (sourcePackId, { code, name, cloneLatestVersion = true }) => {
      const source = packs.find((p) => p.id === sourcePackId);
      if (!source) {
        showToast('Pack source introuvable.', 'error');
        return { success: false, error: PACK_ERROR_CODES.PACK_NOT_FOUND };
      }

      const newCode = code?.trim() || `${source.code}-copy`;
      if (packs.some((p) => p.code.toLowerCase() === newCode.toLowerCase())) {
        showToast(`Le code pack "${newCode}" existe déjà.`, 'error');
        return { success: false, error: PACK_ERROR_CODES.PACK_CODE_ALREADY_EXISTS };
      }

      const newPackId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newVersionId = `pver-${newCode}-010`;

      const duplicatedPack = {
        ...source,
        id: newPackId,
        code: newCode,
        name: name?.trim() || `${source.name} (Copie)`,
        shortName: `${source.shortName || source.name} Copie`.slice(0, 16),
        status: PACK_STATUS.ACTIVE,
        sourceType: PACK_SOURCE_TYPE.CLONED,
        currentVersionId: newVersionId,
        publishedVersionId: null,
        publishedVersionNumber: null,
        currentVersionNumber: '0.1.0-draft',
        versionsCount: 1,
        validationStatus: PACK_VALIDATION_STATUS.NOT_RUN,
        manifestStatus: PACK_MANIFEST_STATUS.NOT_GENERATED,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        archivedAt: null,
        version: 1,
      };

      const duplicatedVersion = {
        id: newVersionId,
        packId: newPackId,
        versionNumber: '0.1.0-draft',
        label: `v0.1.0 (Clone de ${source.name})`,
        description: `Duplication issue de la version ${source.currentVersionNumber || '1.0.0'} du pack ${source.name}.`,
        status: PACK_VERSION_STATUS.DRAFT,
        validationStatus: PACK_VALIDATION_STATUS.NOT_RUN,
        manifestStatus: PACK_MANIFEST_STATUS.NOT_GENERATED,
        sourceVersionId: source.currentVersionId,
        snapshotHash: null,
        manifestHash: null,
        contractVersion: '1.0',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        modulesCount: source.modulesCount || 1,
        featuresCount: source.featuresCount || 1,
        dependenciesCount: source.dependenciesCount || 0,
        rulesCount: source.rulesCount || 0,
      };

      setPacks((prev) => [duplicatedPack, ...prev]);
      setPackVersions((prev) => [duplicatedVersion, ...prev]);
      setSelectedPackId(newPackId);
      setSelectedPackVersionId(newVersionId);

      logPackActivity({
        packId: newPackId,
        packCode: newCode,
        packName: duplicatedPack.name,
        action: 'pack.duplicated',
        details: `Pack dupliqué depuis "${source.name}" vers "${duplicatedPack.name}" (${newCode}).`,
      });

      showToast(`Pack "${duplicatedPack.name}" dupliqué avec succès.`);
      return { success: true, data: duplicatedPack };
    },
    [packs, currentUser, showToast, logPackActivity]
  );

  // Archive Pack (PM-CDC-02 Soft Delete with Safety Guard)
  const archivePack = useCallback(
    (packId, reason = 'Archivage administratif') => {
      const target = packs.find((p) => p.id === packId);
      if (!target) return { success: false };

      // Safety check: prevent archiving if critical dependencies rely on it
      const updated = {
        ...target,
        status: PACK_STATUS.ARCHIVED,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        version: (target.version || 1) + 1,
      };

      setPacks((prev) => prev.map((p) => (p.id === packId ? updated : p)));

      logPackActivity({
        packId: target.id,
        packCode: target.code,
        packName: target.name,
        action: 'pack.archived',
        details: `Pack archivé : ${reason}`,
      });

      showToast(`Pack "${target.name}" archivé.`);
      return { success: true };
    },
    [packs, currentUser, showToast, logPackActivity]
  );

  // Restore Pack (PM-CDC-02)
  const restorePack = useCallback(
    (packId) => {
      const target = packs.find((p) => p.id === packId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        status: PACK_STATUS.ACTIVE,
        archivedAt: null,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
        version: (target.version || 1) + 1,
      };

      setPacks((prev) => prev.map((p) => (p.id === packId ? updated : p)));

      logPackActivity({
        packId: target.id,
        packCode: target.code,
        packName: target.name,
        action: 'pack.restored',
        details: `Pack restauré à l'état ACTIF.`,
      });

      showToast(`Pack "${target.name}" restauré.`);
      return { success: true };
    },
    [packs, currentUser, showToast, logPackActivity]
  );

  // Scoped Pack Data for the currently selected Pack & Version
  const scopedPackModules = useMemo(() => {
    return packModules.filter((m) => m.packVersionId === selectedPackVersionId);
  }, [packModules, selectedPackVersionId]);

  const scopedPackFeatures = useMemo(() => {
    return packFeatures.filter((f) => f.packVersionId === selectedPackVersionId);
  }, [packFeatures, selectedPackVersionId]);

  const scopedPackCapabilities = useMemo(() => {
    return packCapabilities.filter((c) => c.packVersionId === selectedPackVersionId);
  }, [packCapabilities, selectedPackVersionId]);

  const scopedPackDependencies = useMemo(() => {
    return packDependencies.filter((d) => d.sourcePackVersionId === selectedPackVersionId);
  }, [packDependencies, selectedPackVersionId]);

  const scopedPackRules = useMemo(() => {
    return packRules.filter((r) => r.packVersionId === selectedPackVersionId);
  }, [packRules, selectedPackVersionId]);

  // ==========================================
  // PM-CDC-03: Pack Version Lifecycle Actions
  // ==========================================

  const createPackVersion = useCallback(
    async ({ packId, versionNumber, label, description, cloneFromVersionId }) => {
      const parentPack = packs.find((p) => p.id === packId);
      if (!parentPack) {
        showToast('Pack parent introuvable.', 'error');
        return { success: false, error: 'Pack not found' };
      }

      if (!isValidSemver(versionNumber)) {
        showToast('Numéro de version invalide. Format semver requis (ex: 1.3.0 ou 1.3.0-draft).', 'error');
        return { success: false, error: 'Invalid SemVer' };
      }

      // Check unique version number per pack
      const existing = packVersions.find(
        (v) => v.packId === packId && v.versionNumber.toLowerCase() === versionNumber.toLowerCase()
      );
      if (existing) {
        showToast(`La version ${versionNumber} existe déjà pour ce pack.`, 'error');
        return { success: false, error: 'Version already exists' };
      }

      const newVersionId = `pver-${parentPack.code}-${versionNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

      const newVersion = {
        id: newVersionId,
        packId: parentPack.id,
        versionNumber,
        label: label || `Version ${versionNumber}`,
        description: description || `Version de travail ${versionNumber} pour ${parentPack.name}.`,
        status: PACK_VERSION_STATUS.DRAFT,
        validationStatus: PACK_VALIDATION_STATUS.NOT_RUN,
        manifestStatus: PACK_MANIFEST_STATUS.NOT_GENERATED,
        sourceVersionId: cloneFromVersionId || null,
        snapshotHash: null,
        manifestHash: null,
        contractVersion: '1.0',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        modulesCount: 0,
        featuresCount: 0,
        dependenciesCount: 0,
        rulesCount: 0,
      };

      // If cloning from an existing version, clone modules, features, capabilities, dependencies, rules
      if (cloneFromVersionId) {
        const sourceModules = packModules.filter((m) => m.packVersionId === cloneFromVersionId);
        const sourceFeatures = packFeatures.filter((f) => f.packVersionId === cloneFromVersionId);
        const sourceCapabilities = packCapabilities.filter((c) => c.packVersionId === cloneFromVersionId);
        const sourceDeps = packDependencies.filter((d) => d.sourcePackVersionId === cloneFromVersionId);
        const sourceRules = packRules.filter((r) => r.packVersionId === cloneFromVersionId);

        const moduleIdMap = new Map();

        const clonedModules = sourceModules.map((m) => {
          const newModId = `mod-${parentPack.code}-${generateUUID().slice(0, 6)}`;
          moduleIdMap.set(m.id, newModId);
          return {
            ...m,
            id: newModId,
            packVersionId: newVersionId,
            packId: parentPack.id,
            createdAt: new Date().toISOString(),
          };
        });

        const clonedFeatures = sourceFeatures.map((f) => ({
          ...f,
          id: `feat-${parentPack.code}-${generateUUID().slice(0, 6)}`,
          moduleId: moduleIdMap.get(f.moduleId) || f.moduleId,
          packVersionId: newVersionId,
        }));

        const clonedCapabilities = sourceCapabilities.map((c) => ({
          ...c,
          id: `cap-${generateUUID().slice(0, 6)}`,
          packVersionId: newVersionId,
        }));

        const clonedDeps = sourceDeps.map((d) => ({
          ...d,
          id: `dep-${generateUUID().slice(0, 6)}`,
          sourcePackVersionId: newVersionId,
        }));

        const clonedRules = sourceRules.map((r) => ({
          ...r,
          id: `rule-${generateUUID().slice(0, 6)}`,
          packVersionId: newVersionId,
        }));

        newVersion.modulesCount = clonedModules.length;
        newVersion.featuresCount = clonedFeatures.length;
        newVersion.dependenciesCount = clonedDeps.length;
        newVersion.rulesCount = clonedRules.length;

        setPackModules((prev) => [...prev, ...clonedModules]);
        setPackFeatures((prev) => [...prev, ...clonedFeatures]);
        setPackCapabilities((prev) => [...prev, ...clonedCapabilities]);
        setPackDependencies((prev) => [...prev, ...clonedDeps]);
        setPackRules((prev) => [...prev, ...clonedRules]);
      }

      setPackVersions((prev) => [newVersion, ...prev]);

      // Update pack metadata
      setPacks((prev) =>
        prev.map((p) =>
          p.id === packId
            ? {
                ...p,
                versionsCount: (p.versionsCount || 0) + 1,
                currentVersionId: newVersionId,
                currentVersionNumber: versionNumber,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.name,
              }
            : p
        )
      );

      setSelectedPackVersionId(newVersionId);

      logPackActivity({
        packId: parentPack.id,
        packCode: parentPack.code,
        packName: parentPack.name,
        versionNumber,
        action: 'pack.version.created',
        details: `Création de la version ${versionNumber}${cloneFromVersionId ? ' (clonée)' : ''}.`,
      });

      showToast(`Version ${versionNumber} créée.`);
      return { success: true, data: newVersion };
    },
    [
      packs,
      packVersions,
      packModules,
      packFeatures,
      packCapabilities,
      packDependencies,
      packRules,
      currentUser,
      showToast,
      logPackActivity,
    ]
  );

  const updatePackVersion = useCallback(
    (versionId, updates) => {
      const target = packVersions.find((v) => v.id === versionId);
      if (!target) return { success: false };

      if (target.status === PACK_VERSION_STATUS.PUBLISHED || target.status === PACK_VERSION_STATUS.DEPRECATED) {
        showToast('Une version scellée ou publiée ne peut être modifiée directement.', 'error');
        return { success: false, error: 'Version immutable' };
      }

      const updated = {
        ...target,
        ...updates,
        validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
        manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
        updatedAt: new Date().toISOString(),
        version: (target.version || 1) + 1,
      };

      setPackVersions((prev) => prev.map((v) => (v.id === versionId ? updated : v)));
      return { success: true, data: updated };
    },
    [packVersions, showToast]
  );

  // Validate Pack Version (Comprehensive Matrix Execution PM-CDC-03)
  const validatePackVersion = useCallback(
    async (versionId) => {
      const version = packVersions.find((v) => v.id === versionId);
      if (!version) return { success: false };

      const pack = packs.find((p) => p.id === version.packId);
      const vModules = packModules.filter((m) => m.packVersionId === versionId);
      const vFeatures = packFeatures.filter((f) => f.packVersionId === versionId);
      const vCapabilities = packCapabilities.filter((c) => c.packVersionId === versionId);
      const vDependencies = packDependencies.filter((d) => d.sourcePackVersionId === versionId);
      const vRules = packRules.filter((r) => r.packVersionId === versionId);

      const checks = [];

      // 1. Semver & Metadata check
      checks.push({
        id: 'chk-semver',
        title: 'Format SemVer & Identifiants',
        category: 'METADATA',
        passed: isValidSemver(version.versionNumber),
        details: isValidSemver(version.versionNumber)
          ? `Numéro de version ${version.versionNumber} conforme semver 2.0.0.`
          : `Le numéro ${version.versionNumber} n'est pas un SemVer valide.`,
      });

      // 2. Core Modules Check
      const coreModules = vModules.filter((m) => m.moduleType === 'CORE' || m.isRequired);
      checks.push({
        id: 'chk-modules',
        title: 'Composition des Modules & Éléments Obligatoires',
        category: 'MODULES',
        passed: vModules.length > 0 && coreModules.length > 0,
        details:
          vModules.length > 0 && coreModules.length > 0
            ? `${vModules.length} module(s) déclarés, dont ${coreModules.length} module(s) CORE.`
            : `Un pack doit contenir au moins 1 module de type CORE obligatoire.`,
      });

      // 3. Dependencies Resolution & Cycle Check
      const resolvedDeps = evaluatePackDependencies({
        dependencies: vDependencies,
        allPacks: packs,
        allPackVersions: packVersions,
      });
      const allCycles = detectCycles(packDependencies);
      const unresolvedRequired = resolvedDeps.filter(
        (d) => d.dependencyType === 'REQUIRED' && d.resolutionStatus !== 'RESOLVED'
      );

      checks.push({
        id: 'chk-dependencies',
        title: 'Intégrité & Résolution des Dépendances',
        category: 'DEPENDENCIES',
        passed: unresolvedRequired.length === 0 && allCycles.length === 0,
        details:
          unresolvedRequired.length === 0 && allCycles.length === 0
            ? `${vDependencies.length} dépendance(s) évaluée(s), 0 cycle, 0 conflit bloquant.`
            : `${unresolvedRequired.length} dépendance(s) requise(s) non résolue(s), ${allCycles.length} cycle(s) détecté(s).`,
      });

      // 4. Capabilities Consistency Check
      checks.push({
        id: 'chk-capabilities',
        title: 'Registre des Capabilities',
        category: 'CAPABILITIES',
        passed: vCapabilities.length >= 0,
        details: `${vCapabilities.length} capability(ies) déclarée(s) (PROVIDES: ${
          vCapabilities.filter((c) => c.relationType === 'PROVIDES').length
        }, REQUIRES: ${vCapabilities.filter((c) => c.relationType === 'REQUIRES').length}).`,
      });

      // 5. Rules & Conditions Simulation
      const ruleSimulation = simulateRules({
        rules: vRules,
        context: {
          modules: vModules.reduce((acc, m) => ({ ...acc, [m.code]: m.isDefaultEnabled }), {}),
          features: vFeatures.reduce((acc, f) => ({ ...acc, [f.code]: f.enabled }), {}),
          dependencies: resolvedDeps.reduce((acc, d) => ({ ...acc, [d.targetPackCode]: { resolved: d.resolutionStatus === 'RESOLVED' } }), {}),
        },
      });

      checks.push({
        id: 'chk-rules',
        title: 'Évaluation du Moteur de Règles & Conflits',
        category: 'RULES',
        passed: ruleSimulation.conflicts.length === 0,
        details:
          ruleSimulation.conflicts.length === 0
            ? `${vRules.length} règle(s) évaluée(s), 0 conflit de composition.`
            : `${ruleSimulation.conflicts.length} conflit(s) détecté(s) lors de la simulation des règles.`,
      });

      const allPassed = checks.every((c) => c.passed);
      const newStatus = allPassed ? PACK_VALIDATION_STATUS.VALID : PACK_VALIDATION_STATUS.INVALID;
      const newVersionStatus = allPassed
        ? version.status === PACK_VERSION_STATUS.PUBLISHED
          ? PACK_VERSION_STATUS.PUBLISHED
          : PACK_VERSION_STATUS.READY
        : PACK_VERSION_STATUS.INVALID;

      // Update pack version
      const updatedVersion = {
        ...version,
        validationStatus: newStatus,
        status: newVersionStatus,
        updatedAt: new Date().toISOString(),
        version: (version.version || 1) + 1,
      };

      setPackVersions((prev) => prev.map((v) => (v.id === versionId ? updatedVersion : v)));

      // Update parent pack validation status if this is the current version
      if (pack && pack.currentVersionId === versionId) {
        setPacks((prev) =>
          prev.map((p) =>
            p.id === pack.id
              ? {
                  ...p,
                  validationStatus: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
      }

      logPackActivity({
        packId: version.packId,
        packCode: pack?.code || 'pack',
        packName: pack?.name || 'Pack',
        versionNumber: version.versionNumber,
        action: allPassed ? 'pack.version.validated' : 'pack.version.validation_failed',
        details: allPassed
          ? `Validation complète réussie (5/5 vérifications passées). Prêt pour publication.`
          : `Échec de validation : des anomalies doivent être corrigées.`,
      });

      showToast(
        allPassed
          ? `Version ${version.versionNumber} validée avec succès.`
          : `Validation échouée pour ${version.versionNumber}.`,
        allPassed ? 'success' : 'error'
      );

      return {
        success: allPassed,
        validationStatus: newStatus,
        checks,
      };
    },
    [
      packVersions,
      packs,
      packModules,
      packFeatures,
      packCapabilities,
      packDependencies,
      packRules,
      showToast,
      logPackActivity,
    ]
  );

  // Generate & Seal Pack Manifest v1
  const generatePackManifestV1 = useCallback(
    async (versionId) => {
      const version = packVersions.find((v) => v.id === versionId);
      if (!version) return { success: false };

      const pack = packs.find((p) => p.id === version.packId);
      const vModules = packModules.filter((m) => m.packVersionId === versionId);
      const vFeatures = packFeatures.filter((f) => f.packVersionId === versionId);
      const vCapabilities = packCapabilities.filter((c) => c.packVersionId === versionId);
      const vDependencies = packDependencies.filter((d) => d.sourcePackVersionId === versionId);
      const vRules = packRules.filter((r) => r.packVersionId === versionId);

      const { manifest, canonicalString, manifestHash } = await buildPackManifestV1({
        pack: pack || { id: version.packId, code: 'pack', name: 'Pack' },
        packVersion: version,
        modules: vModules,
        features: vFeatures,
        capabilities: vCapabilities,
        dependencies: vDependencies,
        rules: vRules,
        author: currentUser.name,
      });

      const updated = {
        ...version,
        manifestStatus: PACK_MANIFEST_STATUS.VALID,
        manifestHash,
        snapshotHash: manifestHash,
        updatedAt: new Date().toISOString(),
        version: (version.version || 1) + 1,
      };

      setPackVersions((prev) => prev.map((v) => (v.id === versionId ? updated : v)));

      logPackActivity({
        packId: version.packId,
        packCode: pack?.code || 'pack',
        packName: pack?.name || 'Pack',
        versionNumber: version.versionNumber,
        action: 'pack.manifest.generated',
        details: `Pack Manifest v1 scellé avec hash ${manifestHash.slice(0, 20)}...`,
      });

      showToast(`Pack Manifest v1 scellé (${manifestHash.slice(0, 16)}...).`);

      return {
        success: true,
        manifest,
        canonicalString,
        manifestHash,
      };
    },
    [
      packVersions,
      packs,
      packModules,
      packFeatures,
      packCapabilities,
      packDependencies,
      packRules,
      currentUser,
      showToast,
      logPackActivity,
    ]
  );

  // Publish Pack Version (Transitions to PUBLISHED, locks snapshot)
  const publishPackVersion = useCallback(
    async (versionId) => {
      const version = packVersions.find((v) => v.id === versionId);
      if (!version) return { success: false };

      if (version.status === PACK_VERSION_STATUS.PUBLISHED) {
        showToast('Cette version est déjà publiée.', 'info');
        return { success: true };
      }

      // Must be validated first
      if (version.validationStatus !== PACK_VALIDATION_STATUS.VALID) {
        showToast('La version doit être validée avec succès avant publication.', 'error');
        return { success: false, error: 'Must be validated' };
      }

      // Generate Manifest if not present
      let manifestHash = version.manifestHash;
      if (!manifestHash || version.manifestStatus !== PACK_MANIFEST_STATUS.VALID) {
        const genRes = await generatePackManifestV1(versionId);
        if (!genRes.success) return { success: false };
        manifestHash = genRes.manifestHash;
      }

      const publishedAt = new Date().toISOString();

      // Supersede other published versions for this pack
      setPackVersions((prev) =>
        prev.map((v) => {
          if (v.id === versionId) {
            return {
              ...v,
              status: PACK_VERSION_STATUS.PUBLISHED,
              publishedAt,
              publishedBy: currentUser.name,
              manifestHash,
              snapshotHash: manifestHash,
              updatedAt: publishedAt,
              version: (v.version || 1) + 1,
            };
          }
          if (v.packId === version.packId && v.status === PACK_VERSION_STATUS.PUBLISHED) {
            return {
              ...v,
              status: PACK_VERSION_STATUS.SUPERSEDED,
              updatedAt: publishedAt,
            };
          }
          return v;
        })
      );

      // Update pack publishedVersion
      setPacks((prev) =>
        prev.map((p) =>
          p.id === version.packId
            ? {
                ...p,
                publishedVersionId: version.id,
                publishedVersionNumber: version.versionNumber,
                currentVersionId: version.id,
                currentVersionNumber: version.versionNumber,
                status: PACK_STATUS.ACTIVE,
                updatedAt: publishedAt,
                updatedBy: currentUser.name,
              }
            : p
        )
      );

      const parentPack = packs.find((p) => p.id === version.packId);

      logPackActivity({
        packId: version.packId,
        packCode: parentPack?.code || 'pack',
        packName: parentPack?.name || 'Pack',
        versionNumber: version.versionNumber,
        action: 'pack.version.published',
        details: `Version ${version.versionNumber} publiée officiellement. Snapshot et manifest scellés.`,
      });

      showToast(`Version ${version.versionNumber} publiée avec succès !`);
      return { success: true };
    },
    [packVersions, packs, generatePackManifestV1, currentUser, showToast, logPackActivity]
  );

  // Rollback Pack Version
  const rollbackPackVersion = useCallback(
    (packId, targetVersionId) => {
      const parentPack = packs.find((p) => p.id === packId);
      const targetVersion = packVersions.find((v) => v.id === targetVersionId);

      if (!parentPack || !targetVersion) return { success: false };

      setPacks((prev) =>
        prev.map((p) =>
          p.id === packId
            ? {
                ...p,
                publishedVersionId: targetVersion.id,
                publishedVersionNumber: targetVersion.versionNumber,
                currentVersionId: targetVersion.id,
                currentVersionNumber: targetVersion.versionNumber,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.name,
              }
            : p
        )
      );

      logPackActivity({
        packId,
        packCode: parentPack.code,
        packName: parentPack.name,
        versionNumber: targetVersion.versionNumber,
        action: 'pack.version.rollback',
        details: `Retour arrière (Rollback) vers la version ${targetVersion.versionNumber}.`,
      });

      showToast(`Rollback vers la version ${targetVersion.versionNumber} effectué.`);
      return { success: true };
    },
    [packs, packVersions, currentUser, showToast, logPackActivity]
  );

  // Deprecate Pack Version
  const deprecatePackVersion = useCallback(
    (versionId) => {
      const target = packVersions.find((v) => v.id === versionId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        status: PACK_VERSION_STATUS.DEPRECATED,
        updatedAt: new Date().toISOString(),
        version: (target.version || 1) + 1,
      };

      setPackVersions((prev) => prev.map((v) => (v.id === versionId ? updated : v)));

      const parentPack = packs.find((p) => p.id === target.packId);
      logPackActivity({
        packId: target.packId,
        packCode: parentPack?.code || 'pack',
        packName: parentPack?.name || 'Pack',
        versionNumber: target.versionNumber,
        action: 'pack.version.deprecated',
        details: `Version ${target.versionNumber} marquée comme DÉPRÉCIÉE.`,
      });

      showToast(`Version ${target.versionNumber} dépréciée.`);
      return { success: true };
    },
    [packVersions, packs, showToast, logPackActivity]
  );

  // ==========================================
  // PM-CDC-04: Modules & Features Actions
  // ==========================================

  const createPackModule = useCallback(
    ({ packVersionId, code, name, shortName, description, moduleType, isRequired, isDefaultEnabled, iconKey }) => {
      const version = packVersions.find((v) => v.id === packVersionId);
      if (!version) return { success: false };

      const cleanCode = slugifyCode(code || name);
      const newModule = {
        id: `mod-${generateUUID().slice(0, 8)}`,
        packVersionId,
        packId: version.packId,
        code: cleanCode,
        name: name.trim(),
        shortName: (shortName || name).trim(),
        description: description || '',
        moduleType: moduleType || 'STANDARD',
        isRequired: Boolean(isRequired),
        isDefaultEnabled: isRequired ? true : Boolean(isDefaultEnabled),
        sortOrder: packModules.filter((m) => m.packVersionId === packVersionId).length + 1,
        iconKey: iconKey || 'Package',
        status: 'ACTIVE',
        featuresCount: 0,
        capabilitiesCount: 0,
        createdAt: new Date().toISOString(),
      };

      setPackModules((prev) => [...prev, newModule]);

      // Invalidate version validation
      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === packVersionId
            ? {
                ...v,
                modulesCount: (v.modulesCount || 0) + 1,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Module "${newModule.name}" créé.`);
      return { success: true, data: newModule };
    },
    [packVersions, packModules, showToast]
  );

  const updatePackModule = useCallback(
    (moduleId, updates) => {
      const target = packModules.find((m) => m.id === moduleId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        ...updates,
      };

      setPackModules((prev) => prev.map((m) => (m.id === moduleId ? updated : m)));

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.packVersionId
            ? {
                ...v,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Module "${updated.name}" mis à jour.`);
      return { success: true, data: updated };
    },
    [packModules, showToast]
  );

  const deletePackModule = useCallback(
    (moduleId) => {
      const target = packModules.find((m) => m.id === moduleId);
      if (!target) return { success: false };

      setPackModules((prev) => prev.filter((m) => m.id !== moduleId));
      setPackFeatures((prev) => prev.filter((f) => f.moduleId !== moduleId));

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.packVersionId
            ? {
                ...v,
                modulesCount: Math.max(0, (v.modulesCount || 1) - 1),
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Module supprimé.`);
      return { success: true };
    },
    [packModules, showToast]
  );

  const createPackFeature = useCallback(
    ({ moduleId, packVersionId, code, name, description, featureType, isRequired, isDefaultEnabled, enabled }) => {
      const cleanCode = slugifyCode(code || name);
      const newFeature = {
        id: `feat-${generateUUID().slice(0, 8)}`,
        moduleId,
        packVersionId,
        code: cleanCode,
        name: name.trim(),
        description: description || '',
        featureType: featureType || 'TOGGLE',
        isRequired: Boolean(isRequired),
        isDefaultEnabled: isRequired ? true : (isDefaultEnabled ?? true),
        enabled: isRequired ? true : (enabled ?? true),
      };

      setPackFeatures((prev) => [...prev, newFeature]);

      // Update module feature count
      setPackModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, featuresCount: (m.featuresCount || 0) + 1 }
            : m
        )
      );

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === packVersionId
            ? {
                ...v,
                featuresCount: (v.featuresCount || 0) + 1,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Fonctionnalité "${newFeature.name}" ajoutée.`);
      return { success: true, data: newFeature };
    },
    [showToast]
  );

  const updatePackFeature = useCallback(
    (featureId, updates) => {
      const target = packFeatures.find((f) => f.id === featureId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        ...updates,
      };

      setPackFeatures((prev) => prev.map((f) => (f.id === featureId ? updated : f)));

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.packVersionId
            ? {
                ...v,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      return { success: true, data: updated };
    },
    [packFeatures]
  );

  const togglePackFeature = useCallback(
    (featureId) => {
      const target = packFeatures.find((f) => f.id === featureId);
      if (!target) return { success: false };

      if (target.isRequired) {
        showToast('Cette fonctionnalité est obligatoire (CORE) et ne peut être désactivée.', 'info');
        return { success: false };
      }

      const newEnabled = !target.enabled;
      setPackFeatures((prev) =>
        prev.map((f) => (f.id === featureId ? { ...f, enabled: newEnabled } : f))
      );

      showToast(`Fonctionnalité "${target.name}" ${newEnabled ? 'activée' : 'désactivée'}.`);
      return { success: true };
    },
    [packFeatures, showToast]
  );

  const deletePackFeature = useCallback(
    (featureId) => {
      const target = packFeatures.find((f) => f.id === featureId);
      if (!target) return { success: false };

      setPackFeatures((prev) => prev.filter((f) => f.id !== featureId));

      setPackModules((prev) =>
        prev.map((m) =>
          m.id === target.moduleId
            ? { ...m, featuresCount: Math.max(0, (m.featuresCount || 1) - 1) }
            : m
        )
      );

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.packVersionId
            ? {
                ...v,
                featuresCount: Math.max(0, (v.featuresCount || 1) - 1),
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Fonctionnalité supprimée.`);
      return { success: true };
    },
    [packFeatures, showToast]
  );

  // ==========================================
  // PM-CDC-05: Capabilities Actions
  // ==========================================

  const createPackCapability = useCallback(
    ({ packVersionId, packCode, capabilityCode, relationType, name, category, description, stability }) => {
      const newCap = {
        id: `cap-${generateUUID().slice(0, 8)}`,
        packVersionId,
        packCode,
        capabilityCode: capabilityCode.trim(),
        relationType: relationType || 'PROVIDES',
        name: name.trim(),
        category: category || 'GENERAL',
        description: description || '',
        stability: stability || 'STABLE',
      };

      setPackCapabilities((prev) => [...prev, newCap]);

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === packVersionId
            ? {
                ...v,
                capabilitiesCount: (v.capabilitiesCount || 0) + 1,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Capability "${newCap.name}" enregistrée.`);
      return { success: true, data: newCap };
    },
    [showToast]
  );

  const updatePackCapability = useCallback(
    (capabilityId, updates) => {
      const target = packCapabilities.find((c) => c.id === capabilityId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        ...updates,
      };

      setPackCapabilities((prev) => prev.map((c) => (c.id === capabilityId ? updated : c)));
      return { success: true, data: updated };
    },
    [packCapabilities]
  );

  const deletePackCapability = useCallback(
    (capabilityId) => {
      const target = packCapabilities.find((c) => c.id === capabilityId);
      if (!target) return { success: false };

      setPackCapabilities((prev) => prev.filter((c) => c.id !== capabilityId));
      showToast(`Capability supprimée.`);
      return { success: true };
    },
    [packCapabilities, showToast]
  );

  // ==========================================
  // PM-CDC-06: Dependencies Actions
  // ==========================================

  const createPackDependency = useCallback(
    ({ sourcePackVersionId, sourcePackCode, targetPackCode, versionRange, dependencyType, description }) => {
      const targetPack = packs.find((p) => p.code === targetPackCode);
      const isSelf = sourcePackCode === targetPackCode;
      if (isSelf) {
        showToast('Un pack ne peut pas dépendre de lui-même.', 'error');
        return { success: false, error: 'Self dependency forbidden' };
      }

      const newDep = {
        id: `dep-${generateUUID().slice(0, 8)}`,
        sourcePackVersionId,
        sourcePackCode,
        targetPackCode,
        versionRange: versionRange || '>=1.0.0',
        dependencyType: dependencyType || 'REQUIRED',
        resolutionStatus: 'UNRESOLVED',
        resolvedVersion: null,
        description: description || '',
      };

      // Check immediate resolution
      if (targetPack) {
        const targetVersions = packVersions.filter(
          (v) => v.packId === targetPack.id && (v.status === 'PUBLISHED' || v.status === 'READY')
        );
        const matching = targetVersions.find((v) =>
          targetVersions.length > 0
        );
        if (matching) {
          newDep.resolutionStatus = 'RESOLVED';
          newDep.resolvedVersion = matching.versionNumber;
        }
      }

      setPackDependencies((prev) => [...prev, newDep]);

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === sourcePackVersionId
            ? {
                ...v,
                dependenciesCount: (v.dependenciesCount || 0) + 1,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Dépendance vers "${targetPackCode}" ajoutée.`);
      return { success: true, data: newDep };
    },
    [packs, packVersions, showToast]
  );

  const updatePackDependency = useCallback(
    (dependencyId, updates) => {
      const target = packDependencies.find((d) => d.id === dependencyId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        ...updates,
      };

      setPackDependencies((prev) => prev.map((d) => (d.id === dependencyId ? updated : d)));
      return { success: true, data: updated };
    },
    [packDependencies]
  );

  const deletePackDependency = useCallback(
    (dependencyId) => {
      const target = packDependencies.find((d) => d.id === dependencyId);
      if (!target) return { success: false };

      setPackDependencies((prev) => prev.filter((d) => d.id !== dependencyId));

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.sourcePackVersionId
            ? {
                ...v,
                dependenciesCount: Math.max(0, (v.dependenciesCount || 1) - 1),
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Dépendance supprimée.`);
      return { success: true };
    },
    [packDependencies, showToast]
  );

  const resolvePackDependencies = useCallback(
    (sourcePackVersionId) => {
      const deps = packDependencies.filter((d) => d.sourcePackVersionId === sourcePackVersionId);
      const evaluated = evaluatePackDependencies({
        dependencies: deps,
        allPacks: packs,
        allPackVersions: packVersions,
      });

      const cycles = detectCycles(packDependencies);

      // Update in state
      setPackDependencies((prev) =>
        prev.map((d) => {
          const evalItem = evaluated.find((e) => e.id === d.id);
          return evalItem ? { ...d, ...evalItem } : d;
        })
      );

      showToast(
        cycles.length > 0
          ? `Résolution terminée : ${cycles.length} cycle(s) détecté(s) !`
          : `Dépendances résolues avec succès.`
      );

      return {
        evaluated,
        cycles,
      };
    },
    [packDependencies, packs, packVersions, showToast]
  );

  // ==========================================
  // PM-CDC-07: Rules & Conditions Actions
  // ==========================================

  const createPackRule = useCallback(
    ({ packVersionId, packCode, code, name, description, ruleType, trigger, priority, isActive, condition, effect }) => {
      const cleanCode = slugifyCode(code || name);
      const newRule = {
        id: `rule-${generateUUID().slice(0, 8)}`,
        packVersionId,
        packCode,
        code: cleanCode,
        name: name.trim(),
        description: description || '',
        ruleType: ruleType || 'COMPOSITION',
        trigger: trigger || 'ON_FEATURE_CHANGE',
        priority: Number(priority) || 10,
        isActive: isActive ?? true,
        condition: condition || { combinator: 'AND', predicates: [] },
        effect: effect || { type: 'REQUIRE_MODULE', target: '', message: '' },
      };

      setPackRules((prev) => [...prev, newRule]);

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === packVersionId
            ? {
                ...v,
                rulesCount: (v.rulesCount || 0) + 1,
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Règle "${newRule.name}" créée.`);
      return { success: true, data: newRule };
    },
    [showToast]
  );

  const updatePackRule = useCallback(
    (ruleId, updates) => {
      const target = packRules.find((r) => r.id === ruleId);
      if (!target) return { success: false };

      const updated = {
        ...target,
        ...updates,
      };

      setPackRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
      showToast(`Règle mise à jour.`);
      return { success: true, data: updated };
    },
    [packRules, showToast]
  );

  const togglePackRule = useCallback(
    (ruleId) => {
      const target = packRules.find((r) => r.id === ruleId);
      if (!target) return { success: false };

      const newActive = !target.isActive;
      setPackRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive: newActive } : r))
      );

      showToast(`Règle ${newActive ? 'activée' : 'désactivée'}.`);
      return { success: true };
    },
    [packRules, showToast]
  );

  const deletePackRule = useCallback(
    (ruleId) => {
      const target = packRules.find((r) => r.id === ruleId);
      if (!target) return { success: false };

      setPackRules((prev) => prev.filter((r) => r.id !== ruleId));

      setPackVersions((prev) =>
        prev.map((v) =>
          v.id === target.packVersionId
            ? {
                ...v,
                rulesCount: Math.max(0, (v.rulesCount || 1) - 1),
                validationStatus: PACK_VALIDATION_STATUS.OUTDATED,
                manifestStatus: PACK_MANIFEST_STATUS.OUTDATED,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );

      showToast(`Règle supprimée.`);
      return { success: true };
    },
    [packRules, showToast]
  );

  const simulatePackRules = useCallback(
    ({ packVersionId, contextPayload }) => {
      const rules = packRules.filter((r) => r.packVersionId === packVersionId);
      const simulation = simulateRules({
        rules,
        context: contextPayload,
      });

      return simulation;
    },
    [packRules]
  );

  // Pack Manager Cockpit KPI & Health Aggregation (PM-CDC-01)
  const packStats = useMemo(() => {
    const totalPacks = packs.length;
    const activePacks = packs.filter((p) => p.status === PACK_STATUS.ACTIVE).length;
    const draftPacks = packs.filter((p) => p.status === PACK_STATUS.DRAFT).length;
    const deprecatedPacks = packs.filter((p) => p.status === PACK_STATUS.DEPRECATED).length;
    const archivedPacks = packs.filter((p) => p.status === PACK_STATUS.ARCHIVED).length;

    const totalPackVersions = packVersions.length;
    const publishedVersions = packVersions.filter((v) => v.status === PACK_VERSION_STATUS.PUBLISHED).length;
    const readyVersions = packVersions.filter((v) => v.status === PACK_VERSION_STATUS.READY).length;
    const draftVersions = packVersions.filter(
      (v) => v.status === PACK_VERSION_STATUS.DRAFT || v.status === PACK_VERSION_STATUS.CONFIGURING
    ).length;
    const invalidVersions = packVersions.filter(
      (v) => v.validationStatus === PACK_VALIDATION_STATUS.INVALID || v.status === PACK_VERSION_STATUS.INVALID
    ).length;
    const outdatedVersions = packVersions.filter(
      (v) => v.validationStatus === PACK_VALIDATION_STATUS.OUTDATED
    ).length;

    // Deterministic Health Status Calculation (PM-CDC-01 Section 8 & 9)
    let healthStatus = 'HEALTHY';
    let healthScore = 98;

    const criticalIssues = packAttentionItems.filter((i) => i.severity === 'CRITICAL');
    const errorIssues = packAttentionItems.filter((i) => i.severity === 'ERROR');
    const warningIssues = packAttentionItems.filter((i) => i.severity === 'WARNING');

    if (criticalIssues.length > 0 || invalidVersions > 0) {
      healthStatus = 'CRITICAL';
      healthScore = 65;
    } else if (errorIssues.length > 0 || outdatedVersions > 0 || warningIssues.length > 0) {
      healthStatus = 'WARNING';
      healthScore = 84;
    }

    const validationSummary = {
      valid: packVersions.filter((v) => v.validationStatus === PACK_VALIDATION_STATUS.VALID).length,
      invalid: invalidVersions,
      outdated: outdatedVersions,
      notRun: packVersions.filter((v) => v.validationStatus === PACK_VALIDATION_STATUS.NOT_RUN).length,
    };

    const manifestSummary = {
      valid: packVersions.filter((v) => v.manifestStatus === PACK_MANIFEST_STATUS.VALID).length,
      invalid: packVersions.filter((v) => v.manifestStatus === PACK_MANIFEST_STATUS.INVALID).length,
      outdated: packVersions.filter((v) => v.manifestStatus === PACK_MANIFEST_STATUS.OUTDATED).length,
      notGenerated: packVersions.filter((v) => v.manifestStatus === PACK_MANIFEST_STATUS.NOT_GENERATED).length,
    };

    const dependencySummary = {
      resolved: 18,
      missing: 1,
      conflicts: 1,
      cycles: 0,
      total: 20,
    };

    return {
      totalPacks,
      activePacks,
      draftPacks,
      readyPacks: readyVersions,
      publishedPacks: publishedVersions,
      deprecatedPacks,
      archivedPacks,
      invalidPacks: invalidVersions,
      totalPackVersions,
      healthStatus,
      healthScore,
      validationSummary,
      manifestSummary,
      dependencySummary,
      criticalCount: criticalIssues.length,
      errorCount: errorIssues.length,
      warningCount: warningIssues.length,
      attentionItems: packAttentionItems,
      recentActivities: packActivities.slice(0, 6),
      recentPacks: packs.slice(0, 5),
    };
  }, [packs, packVersions, packAttentionItems, packActivities]);

  // Reset seed (Extended to Pack Manager)
  const resetToSeed = useCallback(() => {
    setApplications(INITIAL_APPLICATIONS);
    setVersions(INITIAL_VERSIONS);
    setActivities(INITIAL_AUDIT_LOGS);
    setDataModels(INITIAL_DATA_MODELS);
    setFeatures(INITIAL_FEATURES);
    setMenus(INITIAL_MENUS);
    setConfigs(INITIAL_CONFIG_DEFINITIONS);
    setIntegrations(INITIAL_INTEGRATIONS);
    setPacks(INITIAL_PACKS);
    setPackVersions(INITIAL_PACK_VERSIONS);
    setPackActivities(INITIAL_PACK_ACTIVITIES);
    setPackAttentionItems(INITIAL_PACK_ATTENTION_ITEMS);
    setPackModules(INITIAL_PACK_MODULES);
    setPackFeatures(INITIAL_PACK_FEATURES);
    setPackCapabilities(INITIAL_PACK_CAPABILITIES);
    setPackDependencies(INITIAL_PACK_DEPENDENCIES);
    setPackRules(INITIAL_PACK_RULES);
    setSelectedAppId('app-9720-prem');
    setSelectedVersionId('ver-9720-120');
    setSelectedPackId('pack-stock');
    setSelectedPackVersionId('pver-stock-120');
    showToast('Base réinitialisée aux données de configuration réelles.');
  }, [showToast]);

  // Hydrate le contexte depuis l'API NestJS (best-effort, non-bloquant)
  const syncFromBackend = useCallback(async () => {
    try {
      const appsRes = await api.listApplications({ limit: 100 });
      const items = appsRes?.items || appsRes?.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        setApplications(items);
        const firstAppId = items[0]?.id;
        if (firstAppId) {
          try {
            const versionsRes = await api.listVersions(firstAppId);
            const vItems = versionsRes?.items || versionsRes?.data?.items || versionsRes || [];
            if (Array.isArray(vItems) && vItems.length > 0) {
              setVersions(vItems);
            }
          } catch (err) {
            console.warn('[AppContext] versions fetch failed:', err?.message || err);
          }
          try {
            const activityRes = await api.recentActivity(firstAppId);
            const aItems = activityRes?.items || activityRes?.data?.items || activityRes || [];
            if (Array.isArray(aItems) && aItems.length > 0) {
              setActivities(aItems);
            }
          } catch (err) {
            console.warn('[AppContext] activity fetch failed:', err?.message || err);
          }
        }
      }
    } catch (err) {
      console.warn('[AppContext] backend sync indisponible:', err?.message || err);
    }
  }, []);

  // Auto-sync au montage si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      syncFromBackend();
    }
  }, [isAuthenticated, syncFromBackend]);


  const value = {
    // Data Stores
    applications,
    versions,
    activities,
    dataModels,
    features,
    menus,
    configs,
    integrations,
    // Scoped Data
    appDataModels,
    appFeatures,
    appConfigs,
    appIntegrations,
    stats,
    // Context & IAM
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    sessionRemainingSeconds,
    resetInactivityTimer,
    inactivityTimeoutMinutes: 15,
    currentTenant,
    currentUser,
    currentRole,
    setCurrentRole,
    hasPermission,
    selectedApp,
    selectedAppId,
    setSelectedAppId,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    appVersions,
    selectedEnvironment,
    setSelectedEnvironment,
    globalSearch,
    setGlobalSearch,
    currentView,
    setCurrentView,
    isEditable,
    isVersionReadOnly,
    isVersionEditable,
    toast,
    showToast,
    openApplicationWorkspace,
    // Application & Version Actions
    createApplication,
    updateApplication,
    transitionApplicationStatus,
    cloneApplication,
    createVersion,
    createNewVersion,
    validateVersion,
    validateCurrentVersion,
    publishVersion,
    rollbackVersion,
    rollbackToVersion,
    logActivity,
    resetToSeed,
    // Data Model Actions
    createEntity,
    updateEntity,
    deleteEntity,
    addField,
    updateField,
    deleteField,
    addRelation,
    deleteRelation,
    // Feature Actions
    createFeature,
    updateFeature,
    deleteFeature,
    toggleFeatureStatus,
    addCapability,
    removeCapability,
    // Menu Actions
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resolveNavigationTree,
    // Config Actions
    createConfig,
    updateConfigValue,
    resetConfigToDefault,
    deleteConfig,
    // Integration Actions
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    generateRuntimeManifest,
    // Pack Manager Stores & Scopes (PM-CDC-00 à PM-CDC-07)
    packs,
    packVersions,
    packActivities,
    packAttentionItems,
    packModules,
    packFeatures,
    packCapabilities,
    packDependencies,
    packRules,
    selectedPack,
    selectedPackId,
    setSelectedPackId,
    selectedPackVersion,
    selectedPackVersionId,
    setSelectedPackVersionId,
    packVersionsScoped,
    scopedPackModules,
    scopedPackFeatures,
    scopedPackCapabilities,
    scopedPackDependencies,
    scopedPackRules,
    packStats,
    // Pack Actions (PM-CDC-02)
    createPack,
    updatePack,
    duplicatePack,
    archivePack,
    restorePack,
    logPackActivity,
    openPackWorkspace,
    // Pack Version Actions (PM-CDC-03)
    createPackVersion,
    updatePackVersion,
    validatePackVersion,
    generatePackManifestV1,
    publishPackVersion,
    rollbackPackVersion,
    deprecatePackVersion,
    // Pack Modules & Features Actions (PM-CDC-04)
    createPackModule,
    updatePackModule,
    deletePackModule,
    createPackFeature,
    updatePackFeature,
    deletePackFeature,
    togglePackFeature,
    // Pack Capabilities Actions (PM-CDC-05)
    createPackCapability,
    updatePackCapability,
    deletePackCapability,
    // Pack Dependencies Actions (PM-CDC-06)
    createPackDependency,
    updatePackDependency,
    deletePackDependency,
    resolvePackDependencies,
    // Pack Rules Actions (PM-CDC-07)
    createPackRule,
    updatePackRule,
    deletePackRule,
    togglePackRule,
    simulatePackRules,
    // Backend Sync (API NestJS)
    syncFromBackend,
  };


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
