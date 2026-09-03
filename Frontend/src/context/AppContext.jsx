import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearAccessToken,
  getAccessToken,
  getTokenPayload,
  setSession,
} from "../lib/api";
import { isVersionEditable } from "../lib/versionGuard";
import { slugifyCode } from "../lib/slug";

const AppContext = createContext(null);
const itemsOf = (response) =>
  response?.items || response?.data?.items || response?.data || response || [];
const failed = (error) => ({ success: false, error });
const succeeded = (data) => ({ success: true, data });

export function AppProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dataModels, setDataModels] = useState([]);
  const [features, setFeatures] = useState([]);
  const [menus, setMenus] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [packs, setPacks] = useState([]);
  const [packVersions, setPackVersions] = useState([]);
  const [packActivities, setPackActivities] = useState([]);
  const [packAttentionItems, setPackAttentionItems] = useState([]);
  const [packModules, setPackModules] = useState([]);
  const [packFeatures, setPackFeatures] = useState([]);
  const [packCapabilities, setPackCapabilities] = useState([]);
  const [packDependencies, setPackDependencies] = useState([]);
  const [packRules, setPackRules] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedPackVersionId, setSelectedPackVersionId] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState("ALL");
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentView, setCurrentViewState] = useState("overview");
  const [toast, setToast] = useState(null);
  const [apiMissingNotice, setApiMissingNotice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(getAccessToken()),
  );
  const [sessionRevision, setSessionRevision] = useState(0);

  const payload = useMemo(() => getTokenPayload(), [sessionRevision]);
  const currentRole = payload?.role || "";
  const currentTenant = payload?.tenantId
    ? { id: payload.tenantId, name: payload.tenantId }
    : null;
  const currentUser = {
    id: payload?.sub || "",
    email: payload?.email || "",
    name: payload?.name || payload?.email || "Utilisateur",
    role: currentRole,
    avatarInitials: (payload?.name || payload?.email || "TZ")
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  };

  const showToast = useCallback((message, type = "success") => {
    if (!message) return setToast(null);
    setToast({ message, type, id: Date.now() });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const showApiMissing = useCallback((notice) => {
    setApiMissingNotice({ title: "API pas encore implémentée", ...notice });
    return failed({ code: "API_MISSING", message: notice.role });
  }, []);

  const requestAction = useCallback(
    async (operation, successMessage) => {
      try {
        const data = await operation();
        if (successMessage) showToast(successMessage);
        return succeeded(data);
      } catch (error) {
        showToast(error.message, "error");
        return failed(error);
      }
    },
    [showToast],
  );

  const setCurrentView = useCallback((view) => {
    setCurrentViewState(view);
    const paths = {
      overview: "/business-manager",
      applications: "/business-manager/applications",
      versions: "/business-manager/versions",
      "data-model": "/business-manager/data-model",
      features: "/business-manager/features",
      menus: "/business-manager/menus",
      configuration: "/business-manager/configuration",
      integrations: "/business-manager/contracts",
      validation: "/business-manager/validation",
      "pack-overview": "/pack-manager",
      packs: "/pack-manager/packs",
      "pack-versions": "/pack-manager/versions",
      "pack-modules": "/pack-manager/modules",
      "pack-dependencies": "/pack-manager/dependencies",
      "pack-rules": "/pack-manager/rules",
      "pack-runtime": "/pack-runtime",
      audit: "/observability/audit",
      "iam-overview": "/auth-iam",
    };
    const path = paths[view];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  const login = useCallback(
    async ({ email = "admin@techzone.io", name = "" } = {}) => {
      try {
        await setSession({ email, name });
        setSessionRevision((value) => value + 1);
        setIsAuthenticated(true);
        return { success: true, source: "backend-jwt" };
      } catch (error) {
        return failed(error);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setSessionRevision((value) => value + 1);
    setIsAuthenticated(false);
    showToast("Session fermée.", "info");
  }, [showToast]);

  const syncFromBackend = useCallback(async () => {
    const appResponse = await api.listApplications({ limit: 100 });
    const appItems = itemsOf(appResponse);
    setApplications(Array.isArray(appItems) ? appItems : []);
    const applicationId = selectedAppId || appItems[0]?.id;
    if (applicationId) {
      const [versionResponse, activityResponse] = await Promise.all([
        api.listVersions(applicationId),
        api.recentActivity(applicationId).catch(() => []),
      ]);
      const versionItems = itemsOf(versionResponse);
      setVersions(Array.isArray(versionItems) ? versionItems : []);
      setActivities(itemsOf(activityResponse));
      const versionId = selectedVersionId || versionItems[0]?.id;
      if (versionId) {
        setSelectedAppId(applicationId);
        setSelectedVersionId(versionId);
        const [
          models,
          featureResponse,
          capabilityResponse,
          menuResponse,
          configResponse,
          integrationResponse,
        ] = await Promise.all([
          api.listDataModels(applicationId, versionId).catch(() => []),
          api.listFeatures({ limit: 100 }),
          api.listCapabilities({ limit: 100 }),
          api.listMenus({ limit: 100 }),
          api.listConfigDefinitions({ limit: 100 }),
          api.listRuntimeIntegrations(),
        ]);
        setDataModels(itemsOf(models));
        const capabilityItems = itemsOf(capabilityResponse);
        setFeatures(
          itemsOf(featureResponse).map((feature) => ({
            ...feature,
            capabilities:
              feature.capabilities ||
              capabilityItems.filter(
                (capability) => capability.featureId === feature.id,
              ),
          })),
        );
        const menuItems = itemsOf(menuResponse);
        setMenus(
          await Promise.all(
            menuItems.map(async (menu) => ({
              ...menu,
              items: itemsOf(
                await api.get(`/v1/business-manager/menus/${menu.id}/items`),
              ),
            })),
          ),
        );
        setConfigs(itemsOf(configResponse));
        setIntegrations(itemsOf(integrationResponse));
      }
    } else {
      setVersions([]);
      setActivities([]);
      setDataModels([]);
      setFeatures([]);
      setMenus([]);
      setConfigs([]);
      setIntegrations([]);
    }

    const serverPacks = itemsOf(await api.listPacks({ limit: 100 }));
    setPacks(
      serverPacks.map((pack) => ({
        ...pack,
        version: pack.rowVersion,
        versionsCount: pack._count?.versions ?? 0,
      })),
    );
    const versionGroups = await Promise.all(
      serverPacks.map((pack) => api.listPackVersions(pack.id)),
    );
    const serverVersions = versionGroups
      .flat()
      .map((version) => ({ ...version, version: version.rowVersion }));
    setPackVersions(serverVersions);
    if (!selectedPackId && serverPacks[0]) setSelectedPackId(serverPacks[0].id);
    if (!selectedPackVersionId && serverVersions[0])
      setSelectedPackVersionId(serverVersions[0].id);
    const [
      moduleGroups,
      featureGroups,
      dependencyGroups,
      ruleGroups,
      capabilities,
      dashboard,
    ] = await Promise.all([
      Promise.all(
        serverVersions.map((version) => api.listPackModules(version.id)),
      ),
      Promise.all(
        serverVersions.map((version) => api.listPackFeatures(version.id)),
      ),
      Promise.all(
        serverVersions.map((version) => api.listPackDependencies(version.id)),
      ),
      Promise.all(
        serverVersions.map((version) => api.listPackRules(version.id)),
      ),
      api.listPackCapabilities(),
      api.packDashboard(),
    ]);
    setPackModules(
      moduleGroups
        .flat()
        .map((item) => ({
          ...item,
          sortOrder: item.displayOrder,
          isDefaultEnabled: item.enabled,
        })),
    );
    setPackFeatures(
      featureGroups
        .flat()
        .map((item) => ({ ...item, isDefaultEnabled: item.defaultEnabled })),
    );
    setPackCapabilities(
      itemsOf(capabilities).map((item) => ({
        ...item,
        capabilityCode: item.code,
      })),
    );
    setPackDependencies(
      dependencyGroups
        .flat()
        .map((item) => ({
          ...item,
          sourcePackVersionId: item.packVersionId,
          targetPackCode: item.targetRef,
        })),
    );
    setPackRules(
      ruleGroups
        .flat()
        .map((item) => ({
          ...item,
          isActive: item.enabled,
          condition: item.expression,
        })),
    );
    setPackActivities(
      Array.isArray(dashboard?.activity) ? dashboard.activity : [],
    );
    setPackAttentionItems(
      Array.isArray(dashboard?.attention) ? dashboard.attention : [],
    );
  }, [selectedAppId, selectedPackId, selectedPackVersionId, selectedVersionId]);

  useEffect(() => {
    if (isAuthenticated)
      syncFromBackend().catch((error) => showToast(error.message, "error"));
  }, [isAuthenticated]);

  const selectedApp =
    applications.find((item) => item.id === selectedAppId) ||
    applications[0] ||
    null;
  const appVersions = versions.filter(
    (item) => item.applicationId === selectedApp?.id,
  );
  const selectedVersion =
    versions.find((item) => item.id === selectedVersionId) ||
    appVersions[0] ||
    null;
  const selectedPack =
    packs.find((item) => item.id === selectedPackId) || packs[0] || null;
  const packVersionsScoped = packVersions.filter(
    (item) => item.packId === selectedPack?.id,
  );
  const selectedPackVersion =
    packVersions.find((item) => item.id === selectedPackVersionId) ||
    packVersionsScoped[0] ||
    null;
  const scopedPackModules = packModules.filter(
    (item) => item.packVersionId === selectedPackVersion?.id,
  );
  const scopedPackFeatures = packFeatures.filter(
    (item) => item.packVersionId === selectedPackVersion?.id,
  );
  const scopedPackCapabilities = packCapabilities.filter(
    (item) =>
      !item.packVersionId || item.packVersionId === selectedPackVersion?.id,
  );
  const scopedPackDependencies = packDependencies.filter(
    (item) => item.sourcePackVersionId === selectedPackVersion?.id,
  );
  const scopedPackRules = packRules.filter(
    (item) => item.packVersionId === selectedPackVersion?.id,
  );
  const appDataModels = dataModels;
  const appFeatures = features;
  const appConfigs = configs;
  const appIntegrations = integrations;
  const editable = isVersionEditable(selectedVersion);
  const hasPermission = useCallback(
    (permission) =>
      Boolean(getTokenPayload()?.permissions?.includes(permission)),
    [sessionRevision],
  );
  const refresh = async () => syncFromBackend();

  const createApplication = (input) =>
    requestAction(async () => {
      const application = await api.createApplication({
        code: slugifyCode(input.code || input.name),
        name: input.name,
        description: input.description,
        category: input.category,
        icon: input.icon,
      });
      const version = await api.createBusinessVersion(application.id, {
        versionNumber: input.initialVersionNumber || "1.0.0",
        comment: "Version initiale",
      });
      await refresh();
      setSelectedAppId(application.id);
      setSelectedVersionId(version.id);
      return application;
    }, "Application enregistrée.");
  const updateApplication = (id, input) =>
    requestAction(async () => {
      const data = await api.updateApplication(id, input);
      await refresh();
      return data;
    }, "Application mise à jour.");
  const transitionApplicationStatus = (id, targetStatus) =>
    requestAction(async () => {
      const data = await api.transitionApplication(id, targetStatus);
      await refresh();
      return data;
    }, "Statut mis à jour.");
  const createVersion = (appId, input = {}) =>
    requestAction(async () => {
      const data = await api.createBusinessVersion(appId, {
        versionNumber: input.versionNumber || input,
        comment: input.comment,
        sourceVersionId: input.sourceVersionId,
      });
      await refresh();
      return data;
    }, "Version créée.");
  const createNewVersion = createVersion;
  const validateVersion = (appOrVersionId, maybeVersionId) => {
    const id = maybeVersionId || appOrVersionId;
    return requestAction(async () => {
      const data = await api.validateBusinessVersion(selectedApp.id, id);
      await refresh();
      return data;
    }, "Validation terminée.");
  };
  const validateCurrentVersion = () =>
    selectedVersion
      ? validateVersion(selectedVersion.id)
      : failed("VERSION_REQUIRED");
  const publishVersion = (
    appOrVersionId,
    maybeVersionId,
    environment = "PRODUCTION",
  ) => {
    const id = maybeVersionId || appOrVersionId;
    return requestAction(async () => {
      const data = await api.publishBusinessVersion(
        selectedApp.id,
        id,
        environment,
      );
      await refresh();
      return data;
    }, "Version publiée.");
  };
  const rollbackVersion = (versionId, environment = "PRODUCTION") =>
    requestAction(async () => {
      const data = await api.rollbackBusinessVersion(
        selectedApp.id,
        versionId,
        environment,
      );
      await refresh();
      return data;
    }, "Rollback exécuté.");
  const rollbackToVersion = rollbackVersion;
  const createEntity = (input) =>
    selectedApp && selectedVersion
      ? requestAction(async () => {
          const data = await api.createDataModel(
            selectedApp.id,
            selectedVersion.id,
            input,
          );
          await refresh();
          return data;
        }, "Entité enregistrée.")
      : failed("CONTEXT_REQUIRED");

  const createFeature = (input) =>
    requestAction(async () => {
      const data = await api.post("/v1/business-manager/features", input);
      await refresh();
      return data;
    }, "Feature enregistrée.");
  const updateFeature = (id, input) =>
    requestAction(async () => {
      const data = await api.patch(
        `/v1/business-manager/features/${id}`,
        input,
      );
      await refresh();
      return data;
    }, "Feature mise à jour.");
  const deleteFeature = (id) =>
    requestAction(async () => {
      const data = await api.post(
        `/v1/business-manager/features/${id}/archive`,
      );
      await refresh();
      return data;
    }, "Feature archivée.");
  const toggleFeatureStatus = (id, enabled) =>
    selectedVersion
      ? requestAction(async () => {
          const data = await api.post(
            `/v1/business-manager/application-versions/${selectedVersion.id}/features/${id}/${enabled ? "enable" : "disable"}`,
          );
          await refresh();
          return data;
        }, "État de la feature mis à jour.")
      : failed("VERSION_REQUIRED");
  const addCapability = (featureId, input) =>
    requestAction(async () => {
      let capabilityId = input.id;
      if (!capabilityId)
        capabilityId = (
          await api.post("/v1/business-manager/capabilities", input)
        ).id;
      const data = await api.post(
        `/v1/business-manager/features/${featureId}/capabilities`,
        { capabilityId },
      );
      await refresh();
      return data;
    }, "Capability associée.");
  const removeCapability = (featureId, capabilityId) =>
    requestAction(async () => {
      const data = await api.del(
        `/v1/business-manager/features/${featureId}/capabilities/${capabilityId}`,
      );
      await refresh();
      return data;
    }, "Association supprimée.");

  const createMenuItem = (location, input) => {
    const menu = menus.find((item) => item.location === location);
    if (!menu)
      return showApiMissing({
        role: "créer le menu parent avant d’y enregistrer un item",
        expectedEndpoint: "POST /api/v1/business-manager/menus",
        cdc: "BM-CDC-05",
        technicalDetails: `Aucun menu persistant n’existe pour ${location}.`,
      });
    return requestAction(async () => {
      const data = await api.post(
        `/v1/business-manager/menus/${menu.id}/items`,
        {
          ...input,
          code: slugifyCode(input.code || input.label),
          sortOrder: menu.items?.length || 0,
        },
      );
      await refresh();
      return data;
    }, "Item de navigation enregistré.");
  };
  const createConfig = (input) =>
    requestAction(async () => {
      const data = await api.post(
        "/v1/business-manager/configuration/definitions",
        input,
      );
      await refresh();
      return data;
    }, "Paramètre enregistré.");
  const createIntegration = (input) =>
    requestAction(async () => {
      const data = await api.post("/v1/business-manager/integrations", input);
      await refresh();
      return data;
    }, "Intégration enregistrée.");
  const testIntegration = (id) =>
    showApiMissing({
      role: "tester une liaison d’intégration configurée",
      expectedEndpoint:
        "POST /api/v1/business-manager/integration-bindings/:id/test",
      cdc: "BM-CDC-07",
      technicalDetails: `La ligne ${id} est une définition, pas encore une liaison versionnée.`,
    });
  const generateRuntimeManifest = () =>
    selectedVersion
      ? requestAction(
          () =>
            api.post(
              `/v1/business-manager/application-versions/${selectedVersion.id}/runtime-snapshot`,
            ),
          "Snapshot Runtime généré.",
        )
      : failed("VERSION_REQUIRED");

  const createPack = (input) =>
    requestAction(async () => {
      const pack = await api.createPack({
        ...input,
        code: slugifyCode(input.code || input.name),
      });
      const version = await api.createPackVersion(pack.id, {
        versionNumber: "0.1.0",
        label: "Version initiale",
      });
      await refresh();
      setSelectedPackId(pack.id);
      setSelectedPackVersionId(version.id);
      return pack;
    }, "Pack enregistré.");
  const updatePack = (id, input) =>
    requestAction(async () => {
      const current = packs.find((item) => item.id === id);
      const data = await api.updatePack(id, {
        ...input,
        rowVersion: input.rowVersion ?? input.version ?? current?.rowVersion,
      });
      await refresh();
      return data;
    }, "Pack mis à jour.");
  const archivePack = (id, reason) =>
    requestAction(async () => {
      const data = await api.archivePack(id, reason);
      await refresh();
      return data;
    }, "Pack archivé.");
  const restorePack = (id) =>
    requestAction(async () => {
      const data = await api.restorePack(id);
      await refresh();
      return data;
    }, "Pack restauré.");
  const createPackVersion = (packId, input) =>
    requestAction(async () => {
      const data = await api.createPackVersion(packId, input);
      await refresh();
      return data;
    }, "Version de pack créée.");
  const validatePackVersion = (id) =>
    requestAction(async () => {
      const data = await api.validatePackVersion(id);
      await refresh();
      return data;
    }, "Validation PM terminée.");
  const generatePackManifestV1 = (id) =>
    requestAction(async () => {
      const data = await api.generatePackManifest(id);
      await refresh();
      return data;
    }, "Manifest généré.");
  const publishPackVersion = (id) =>
    requestAction(async () => {
      const data = await api.publishPackVersion(id);
      await refresh();
      return data;
    }, "Version du pack publiée.");
  const createPackModule = (input) =>
    requestAction(async () => {
      const data = await api.addPackModule(input.packVersionId, {
        ...input,
        code: slugifyCode(input.code || input.name),
        displayOrder: scopedPackModules.length + 1,
        enabled: input.isRequired || input.isDefaultEnabled,
      });
      await refresh();
      return data;
    }, "Module enregistré.");
  const createPackFeature = (input) =>
    requestAction(async () => {
      const data = await api.addPackFeature(input.packVersionId, {
        ...input,
        code: slugifyCode(input.code || input.name),
        enabled: input.isRequired || input.enabled,
        defaultEnabled: input.isRequired || input.isDefaultEnabled,
      });
      await refresh();
      return data;
    }, "Feature PM enregistrée.");
  const createPackCapability = (input) =>
    requestAction(async () => {
      const data = await api.createPackCapability({
        code: input.capabilityCode,
        name: input.name,
        description: input.description,
        capabilityType: input.category,
        metadata: {
          packCode: input.packCode,
          relationType: input.relationType,
          stability: input.stability,
        },
      });
      await refresh();
      return data;
    }, "Capability PM enregistrée.");
  const createPackDependency = (input) =>
    requestAction(async () => {
      const data = await api.addPackDependency(input.sourcePackVersionId, {
        sourceType: "PACK_VERSION",
        sourceId: input.sourcePackVersionId,
        targetType: "PACK",
        targetRef: input.targetPackCode,
        targetVersionRange: input.versionRange,
        dependencyType: input.dependencyType,
        required: input.dependencyType !== "OPTIONAL",
        reason: input.description,
      });
      await refresh();
      return data;
    }, "Dépendance enregistrée.");
  const createPackRule = (input) =>
    requestAction(async () => {
      const data = await api.addPackRule(input.packVersionId, {
        code: slugifyCode(input.code || input.name),
        name: input.name,
        targetType: input.targetType || "PACK",
        targetId: input.targetId || input.packVersionId,
        effect: input.effect || "ENABLE",
        priority: input.priority,
        expression: input.condition || input.expression,
      });
      await refresh();
      return data;
    }, "Règle enregistrée.");

  // API_MISSING registry: every action below is intentionally non-mutating.
  // Role, expected contract and CDC are mirrored in the API backlog document.
  // Never add a local business fallback here.
  const missing = (role, expectedEndpoint, cdc) => () =>
    showApiMissing({
      role,
      expectedEndpoint,
      cdc,
      technicalDetails: "Aucun fallback local ni succès simulé n’est exécuté.",
    });
  const cloneApplication = missing(
    "dupliquer une application et sa version dans le backend",
    "POST /api/v1/business-manager/applications/:id/clone",
    "BM-CDC-01",
  );
  const updateEntity = missing(
    "mettre à jour une entité du Data Model",
    "PATCH /api/v1/business-manager/.../models/:id",
    "BM-CDC-03",
  );
  const deleteEntity = missing(
    "archiver une entité du Data Model",
    "POST /api/v1/business-manager/.../models/:id/archive",
    "BM-CDC-03",
  );
  const addField = missing(
    "ajouter et enregistrer un champ d’entité",
    "POST /api/v1/business-manager/.../models/:id/fields",
    "BM-CDC-03",
  );
  const updateField = missing(
    "mettre à jour un champ d’entité",
    "PATCH /api/v1/business-manager/.../fields/:id",
    "BM-CDC-03",
  );
  const deleteField = missing(
    "supprimer un champ d’entité",
    "DELETE /api/v1/business-manager/.../fields/:id",
    "BM-CDC-03",
  );
  const addRelation = missing(
    "ajouter et enregistrer une relation entre entités",
    "POST /api/v1/business-manager/.../relations",
    "BM-CDC-03",
  );
  const deleteRelation = missing(
    "supprimer une relation entre entités",
    "DELETE /api/v1/business-manager/.../relations/:id",
    "BM-CDC-03",
  );
  const updateMenuItem = (id, input) =>
    requestAction(async () => {
      const data = await api.patch(
        `/v1/business-manager/menu-items/${id}`,
        input,
      );
      await refresh();
      return data;
    }, "Item de navigation mis à jour.");
  const deleteMenuItem = missing(
    "archiver un item de navigation",
    "POST /api/v1/business-manager/menu-items/:id/archive",
    "BM-CDC-05",
  );
  const resolveNavigationTree = async (location) => {
    if (!selectedVersion) return { menus: [] };
    return api.get(
          `/v1/business-manager/application-versions/${selectedVersion.id}/navigation/preview`,
          { query: { location } },
        );
  };
  const updateConfigValue = (code, value) =>
    selectedVersion
      ? requestAction(async () => {
          const data = await api.put(
            `/v1/business-manager/application-versions/${selectedVersion.id}/configuration/${code}`,
            {
              value,
              environment:
                selectedEnvironment === "ALL"
                  ? undefined
                  : selectedEnvironment,
            },
          );
          await refresh();
          return data;
        }, "Configuration enregistrée.")
      : failed("VERSION_REQUIRED");
  const resetConfigToDefault = (code) =>
    selectedVersion
      ? requestAction(async () => {
          const data = await api.del(
            `/v1/business-manager/application-versions/${selectedVersion.id}/configuration/${code}`,
          );
          await refresh();
          return data;
        }, "Valeur héritée restaurée.")
      : failed("VERSION_REQUIRED");
  const deleteConfig = missing(
    "archiver une définition de configuration",
    "POST /api/v1/business-manager/configuration/definitions/:id/archive",
    "BM-CDC-06",
  );
  const updateIntegration = missing(
    "mettre à jour une définition d’intégration",
    "PATCH /api/v1/business-manager/integrations/:id",
    "BM-CDC-07",
  );
  const deleteIntegration = missing(
    "archiver une définition d’intégration",
    "POST /api/v1/business-manager/integrations/:id/archive",
    "BM-CDC-07",
  );
  const duplicatePack = missing(
    "dupliquer un pack et sa version source",
    "POST /api/pack-manager/packs/:id/duplicate",
    "PM-CDC-02",
  );
  const updatePackVersion = (id, input) =>
    requestAction(async () => {
      const data = await api.updatePackVersion(id, input);
      await refresh();
      return data;
    }, "Version de pack mise à jour.");
  const rollbackPackVersion = missing(
    "restaurer une version de pack antérieure",
    "POST /api/pack-manager/versions/:id/rollback",
    "PM-CDC-03",
  );
  const deprecatePackVersion = missing(
    "déprécier une version de pack",
    "POST /api/pack-manager/versions/:id/deprecate",
    "PM-CDC-03",
  );
  const updatePackModule = missing(
    "mettre à jour un module de pack",
    "PATCH /api/pack-manager/modules/:id",
    "PM-CDC-04",
  );
  const deletePackModule = missing(
    "archiver un module de pack",
    "POST /api/pack-manager/modules/:id/archive",
    "PM-CDC-04",
  );
  const updatePackFeature = missing(
    "mettre à jour une feature de pack",
    "PATCH /api/pack-manager/features/:id",
    "PM-CDC-05",
  );
  const deletePackFeature = missing(
    "archiver une feature de pack",
    "POST /api/pack-manager/features/:id/archive",
    "PM-CDC-05",
  );
  const togglePackFeature = missing(
    "activer ou désactiver une feature de pack",
    "POST /api/pack-manager/features/:id/toggle",
    "PM-CDC-05",
  );
  const updatePackCapability = missing(
    "mettre à jour une capability de pack",
    "PATCH /api/pack-manager/capabilities/:id",
    "PM-CDC-05",
  );
  const deletePackCapability = missing(
    "archiver une capability de pack",
    "POST /api/pack-manager/capabilities/:id/archive",
    "PM-CDC-05",
  );
  const updatePackDependency = missing(
    "mettre à jour une dépendance de pack",
    "PATCH /api/pack-manager/dependencies/:id",
    "PM-CDC-06",
  );
  const deletePackDependency = missing(
    "supprimer une dépendance de pack",
    "DELETE /api/pack-manager/dependencies/:id",
    "PM-CDC-06",
  );
  const resolvePackDependencies = missing(
    "prévisualiser la résolution complète des dépendances",
    "POST /api/pack-manager/versions/:id/dependencies/resolve",
    "PM-CDC-06",
  );
  const updatePackRule = missing(
    "mettre à jour une règle de pack",
    "PATCH /api/pack-manager/rules/:id",
    "PM-CDC-07",
  );
  const deletePackRule = missing(
    "archiver une règle de pack",
    "POST /api/pack-manager/rules/:id/archive",
    "PM-CDC-07",
  );
  const togglePackRule = missing(
    "activer ou désactiver une règle de pack",
    "POST /api/pack-manager/rules/:id/toggle",
    "PM-CDC-07",
  );
  const simulatePackRules = missing(
    "simuler les règles côté backend",
    "POST /api/pack-manager/versions/:id/rules/simulate",
    "PM-CDC-07",
  );
  const openApplicationWorkspace = (id) => {
    setSelectedAppId(id);
    setCurrentViewState("application-detail");
  };
  const openPackWorkspace = (id) => {
    setSelectedPackId(id);
    setCurrentView("packs");
  };

  const stats = {
    totalApplications: applications.length,
    activeApplications: applications.filter((item) => item.status === "ACTIVE")
      .length,
  };
  const packStats = {
    totalPacks: packs.length,
    activePacks: packs.filter((item) => item.status === "ACTIVE").length,
    validationSummary: {},
    manifestSummary: {},
    dependencySummary: {},
    attentionItems: packAttentionItems,
    recentActivities: packActivities,
  };

  const value = {
    applications,
    versions,
    activities,
    dataModels,
    features,
    menus,
    configs,
    integrations,
    appDataModels,
    appFeatures,
    appConfigs,
    appIntegrations,
    stats,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    currentTenant,
    currentUser,
    currentRole,
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
    isEditable: editable,
    isVersionReadOnly: !editable,
    isVersionEditable,
    toast,
    showToast,
    apiMissingNotice,
    closeApiMissingNotice: () => setApiMissingNotice(null),
    showApiMissing,
    openApplicationWorkspace,
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
    createEntity,
    updateEntity,
    deleteEntity,
    addField,
    updateField,
    deleteField,
    addRelation,
    deleteRelation,
    createFeature,
    updateFeature,
    deleteFeature,
    toggleFeatureStatus,
    addCapability,
    removeCapability,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resolveNavigationTree,
    createConfig,
    updateConfigValue,
    resetConfigToDefault,
    deleteConfig,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    generateRuntimeManifest,
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
    createPack,
    updatePack,
    duplicatePack,
    archivePack,
    restorePack,
    openPackWorkspace,
    createPackVersion,
    updatePackVersion,
    validatePackVersion,
    generatePackManifestV1,
    publishPackVersion,
    rollbackPackVersion,
    deprecatePackVersion,
    createPackModule,
    updatePackModule,
    deletePackModule,
    createPackFeature,
    updatePackFeature,
    deletePackFeature,
    togglePackFeature,
    createPackCapability,
    updatePackCapability,
    deletePackCapability,
    createPackDependency,
    updatePackDependency,
    deletePackDependency,
    resolvePackDependencies,
    createPackRule,
    updatePackRule,
    deletePackRule,
    togglePackRule,
    simulatePackRules,
    syncFromBackend,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
