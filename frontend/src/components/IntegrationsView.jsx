import React from 'react';
import { useSelector } from 'react-redux';
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
  const activeTab = useSelector((state) => state.integration.activeIntegrationTab || 'cockpit');

  return (
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
  );
}
