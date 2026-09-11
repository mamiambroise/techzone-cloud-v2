import React from 'react';
import { useSelector } from 'react-redux';
import DeploymentContractsV1View from './DeploymentContractsV1View.jsx';
import DeploymentCockpitView from './DeploymentCockpitView.jsx';
import ReleaseManagerView from './ReleaseManagerView.jsx';
import PipelinesManagerView from './PipelinesManagerView.jsx';
import PromotionGatewaysView from './PromotionGatewaysView.jsx';
import RollbackRecoveryView from './RollbackRecoveryView.jsx';
import DeploymentDiagnosticsView from './DeploymentDiagnosticsView.jsx';
import DepSpecificationsView from './DepSpecificationsView.jsx';

export default function DeploymentPublicationView() {
  const activeTab = useSelector((state) => state.deployment?.activeTab || 'cockpit');

  const renderContent = () => {
    switch (activeTab) {
      case 'contracts-v1':
        return <DeploymentContractsV1View />;
      case 'cockpit':
        return <DeploymentCockpitView />;
      case 'releases':
        return <ReleaseManagerView />;
      case 'pipelines':
        return <PipelinesManagerView />;
      case 'promotions':
        return <PromotionGatewaysView />;
      case 'rollback':
        return <RollbackRecoveryView />;
      case 'diagnostics':
        return <DeploymentDiagnosticsView />;
      case 'specifications':
        return <DepSpecificationsView />;
      default:
        return <DeploymentCockpitView />;
    }
  };

  return <div className="animate-in fade-in duration-200">{renderContent()}</div>;
}
