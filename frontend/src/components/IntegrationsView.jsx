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
