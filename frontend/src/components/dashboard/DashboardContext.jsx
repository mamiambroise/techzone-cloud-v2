import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../../services/apiClient.js";
import { useTenant } from "../../contexts/TenantProvider.jsx";
import { useAuth } from "../../auth/AuthProvider.jsx";
const Context = createContext(null);
export const alertKeys = [
  "businessAlerts",
  "packAlerts",
  "runtimeAlerts",
  "deploymentAlerts",
];
export function DashboardProvider({ children }) {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const scope = `${activeTenant?.id ?? ""}:${user?.id ?? ""}:${(user?.permissions ?? []).join(",")}`;
  const [state, setState] = useState({
    scope: null,
    widgets: {},
    loading: true,
    error: false,
  });
  const requests = useRef(new Map());
  const refresh = useCallback(
    async (widget) => {
      if (!activeTenant?.id || tenantLoading) return;
      const key = widget || "all";
      if (!widget) {
        requests.current.forEach((c) => c.abort());
        requests.current.clear();
      }
      requests.current.get(key)?.abort();
      const controller = new AbortController();
      requests.current.set(key, controller);
      setState((previous) => ({
        ...previous,
        scope,
        loading: !widget,
        error: false,
        widgets: widget
          ? { ...previous.widgets, [widget]: { state: "LOADING", data: null } }
          : {},
      }));
      try {
        const { data } = await api.get("/platform/dashboard", {
          params: widget ? { widget } : {},
          signal: controller.signal,
        });
        if (controller.signal.aborted || data.tenantId !== activeTenant.id)
          return;
        setState((previous) => ({
          scope,
          loading: false,
          error: false,
          generatedAt: data.generatedAt,
          widgets: widget
            ? { ...previous.widgets, ...data.widgets }
            : data.widgets,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) => ({
          ...previous,
          scope,
          loading: false,
          error: !widget,
          widgets: widget
            ? {
                ...previous.widgets,
                [widget]: {
                  state: error.response?.status === 403 ? "FORBIDDEN" : "ERROR",
                  data: null,
                },
              }
            : {},
        }));
      } finally {
        if (requests.current.get(key) === controller)
          requests.current.delete(key);
      }
    },
    [scope, activeTenant?.id, tenantLoading],
  );
  useEffect(() => {
    refresh();
    return () => {
      requests.current.forEach((c) => c.abort());
      requests.current.clear();
    };
  }, [refresh]);
  const current =
    state.scope === scope && !tenantLoading
      ? state
      : { widgets: {}, loading: true, error: false };
  return (
    <Context.Provider value={{ ...current, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useDashboard = () => useContext(Context);
