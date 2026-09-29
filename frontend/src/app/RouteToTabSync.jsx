import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setActiveTab, setActiveModuleId } from '../store/platformSlice.js';
import { setActiveIntegrationTab } from '../store/integrationSlice.js';
import { setActiveDeploymentTab } from '../store/deploymentSlice.js';
import { resolveRoute } from './navigationConfig.js';
export default function RouteToTabSync() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    const route = resolveRoute(pathname);
    if (!route) return;
    if (route.moduleId) dispatch(setActiveModuleId(route.moduleId));
    if (route.tab) dispatch(setActiveTab(route.tab));
    if (route.integrationTab) dispatch(setActiveIntegrationTab(route.integrationTab));
    if (route.deploymentTab) dispatch(setActiveDeploymentTab(route.deploymentTab));
  }, [pathname, dispatch]);
  return null;
}
