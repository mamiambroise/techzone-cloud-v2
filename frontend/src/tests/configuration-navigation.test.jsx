import React, { StrictMode } from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import ConfigurationView from '../components/ConfigurationView.jsx';
import configReducer from '../store/configSlice.js';
import { TenantContext } from '../contexts/TenantProvider.jsx';
import { AuthContext } from '../auth/AuthProvider.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { getConfigs } from '../services/api/platformConfigService.js';
import { navigationGroups, pageDefinitions, resolveRoute } from '../app/navigationConfig.js';
vi.mock('../services/api/platformConfigService.js',()=>({getConfigs:vi.fn(),createConfig:vi.fn(),updateConfig:vi.fn(),getEffective:vi.fn()}));
afterEach(cleanup);
beforeEach(()=>{getConfigs.mockReset();});
function Wrapper({children}) {
 const store=configureStore({reducer:{config:configReducer,platform:(s={providerMode:'REAL',searchQuery:'',activeUser:{id:'u'},sidebarCollapsed:false})=>s,integration:(s={providerMode:'REAL'})=>s}});
 return <Provider store={store}><AuthContext.Provider value={{user:{id:'u',isAdmin:true,permissions:['*'],isSuperAdmin:true}}}><TenantContext.Provider value={{activeTenant:{id:'tenant',name:'Recette'}}}><MemoryRouter initialEntries={['/business-manager/configuration']}>{children}</MemoryRouter></TenantContext.Provider></AuthContext.Provider></Provider>;
}
describe('configuration workspace',()=>{
 it('fetches once under StrictMode and renders truthful empty state and tabs',async()=>{
  let complete;getConfigs.mockImplementation(()=>new Promise(resolve=>{complete=resolve;}));
  render(<Wrapper><StrictMode><ConfigurationView/></StrictMode></Wrapper>);
  await waitFor(()=>expect(getConfigs).toHaveBeenCalledTimes(1));complete([]);
  await screen.findByText(/Aucune clé de configuration/);
  expect(screen.getByRole('heading',{name:'Configuration'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/Ajouter un paramètre/})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab',{name:'Configuration effective'}));
  expect(screen.getByText(/Le contexte complet/)).toBeInTheDocument();
 });
 it('surfaces API failure without falling back to mock configuration rows',async()=>{
  getConfigs.mockRejectedValue(new Error('Unavailable'));
  render(<Wrapper><ConfigurationView/></Wrapper>);
  await screen.findByRole('alert');expect(screen.queryByText('platform.http.timeout_ms')).not.toBeInTheDocument();
 });
});
describe('canonical sidebar',()=>{
 it('renders each of the visible groups once for an admin and uses concrete registered URLs',()=>{
  const {container}=render(<Wrapper><Sidebar isOpen={false} onClose={()=>{}}/></Wrapper>);
  expect(container.querySelectorAll('[data-navigation-group]')).toHaveLength(navigationGroups.filter(g=>!g.hidden).length);
  for(const group of navigationGroups.filter(g=>!g.hidden))expect(container.querySelectorAll(`[data-navigation-group="${group.id}"]`)).toHaveLength(1);
  for(const link of container.querySelectorAll('a')) { expect(link.getAttribute('href')).not.toContain(':');expect(resolveRoute(link.getAttribute('href'))).toBeDefined(); }
 });
 it('registers unavailable destinations as ComingSoon and keeps them unimplemented',()=>{
  for(const route of pageDefinitions.filter(r=>r.classification==='MISSING_PAGE')) {expect(route.component).toBe('ComingSoon');expect(route.implemented).toBe(false);}
  expect(resolveRoute('/business-manager/configuration').component).toBe('ConfigurationView');
 });
});
