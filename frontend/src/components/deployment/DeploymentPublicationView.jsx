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

import {
  Rocket,
  ShieldCheck,
  Package,
  GitBranch,
  CheckCircle2,
  CornerUpLeft,
  Activity,
  BookOpen,
  Lock,
} from 'lucide-react';

const DEP_TABS = [
  { id: 'contracts-v1', code: 'DEP-00', label: 'Socle & Contrat v1', icon: ShieldCheck },
  { id: 'cockpit', code: 'DEP-01', label: 'Deployment Cockpit', icon: Rocket },
  { id: 'releases', code: 'DEP-02', label: 'Release Manager', icon: Package },
  { id: 'pipelines', code: 'DEP-03', label: 'Pipelines & Stratégies', icon: GitBranch },
  { id: 'promotions', code: 'DEP-04', label: 'Portes & Promotions', icon: CheckCircle2 },
  { id: 'rollback', code: 'DEP-05', label: 'Rollback & Reprise', icon: CornerUpLeft },
  { id: 'diagnostics', code: 'DEP-06', label: 'Diagnostics & Audit', icon: Activity },
  { id: 'specifications', code: 'DEP-DOC', label: 'Index CDC (00 à 06)', icon: BookOpen },
];

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
