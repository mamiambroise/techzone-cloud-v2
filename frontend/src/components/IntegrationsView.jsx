import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveIntegrationTab } from '../store/integrationSlice.js';
import IntegrationCockpitView from './integration/IntegrationCockpitView.jsx';
import ConnectorManagerView from './integration/ConnectorManagerView.jsx';
import ApiManagerView from './integration/ApiManagerView.jsx';
import WebhookManagerView from './integration/WebhookManagerView.jsx';
import CredentialsManagerView from './integration/CredentialsManagerView.jsx';
import SyncManagerView from './integration/SyncManagerView.jsx';
import IntegrationDiagnosticsView from './integration/IntegrationDiagnosticsView.jsx';
import IntegrationContractsV1View from './integration/IntegrationContractsV1View.jsx';
import ApiSpecificationsView from './integration/ApiSpecificationsView.jsx';
import {
  LayoutDashboard,
  Network,
  Cpu,
  Webhook,
  KeyRound,
  RefreshCw,
  Activity,
  ShieldCheck,
  Lock,
  BookOpen,
} from 'lucide-react';

export const INTEGRATION_NAV_TABS = [
  { id: 'contracts-v1', label: 'Socle & Contrat v1', icon: ShieldCheck },
  { id: 'cockpit', label: 'Integration Cockpit', icon: LayoutDashboard, badge: 'API-01' },
  { id: 'connectors', label: 'Connecteurs', icon: Network, badge: 'API-02' },
  { id: 'apis', label: 'APIs Exposées', icon: Cpu, badge: 'API-03' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, badge: 'API-04' },
  { id: 'credentials', label: 'Credentials & Secrets', icon: KeyRound, badge: 'API-05' },
  { id: 'sync', label: 'Synchronisation', icon: RefreshCw, badge: 'API-06' },
  { id: 'diagnostics', label: 'Diagnostics & Traces', icon: Activity, badge: 'API-07' },
  { id: 'specifications', label: 'Index CDC & Specs', icon: BookOpen, badge: 'API-DOC' },
];

export default function IntegrationsView() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.integration.activeIntegrationTab || 'cockpit');
  const contractV1Locked = useSelector((state) => state.integration.contractV1Locked);

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {INTEGRATION_NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch(setActiveIntegrationTab(tab.id))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-Views Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'contracts-v1' && <IntegrationContractsV1View />}
        {activeTab === 'cockpit' && <IntegrationCockpitView />}
        {activeTab === 'connectors' && <ConnectorManagerView />}
        {activeTab === 'apis' && <ApiManagerView />}
        {activeTab === 'webhooks' && <WebhookManagerView />}
        {activeTab === 'credentials' && <CredentialsManagerView />}
        {activeTab === 'sync' && <SyncManagerView />}
        {activeTab === 'diagnostics' && <IntegrationDiagnosticsView />}
        {activeTab === 'specifications' && <ApiSpecificationsView />}
      </div>
    </div>
  );
}
