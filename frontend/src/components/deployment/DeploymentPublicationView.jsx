import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveDeploymentTab } from '../../store/deploymentSlice.js';
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
  { id: 'contracts-v1', code: 'DEP-00', label: 'Socle & Contrat v1 🔒', icon: ShieldCheck },
  { id: 'cockpit', code: 'DEP-01', label: 'Deployment Cockpit', icon: Rocket },
  { id: 'releases', code: 'DEP-02', label: 'Release Manager', icon: Package },
  { id: 'pipelines', code: 'DEP-03', label: 'Pipelines & Stratégies', icon: GitBranch },
  { id: 'promotions', code: 'DEP-04', label: 'Portes & Promotions', icon: CheckCircle2 },
  { id: 'rollback', code: 'DEP-05', label: 'Rollback & Reprise', icon: CornerUpLeft },
  { id: 'diagnostics', code: 'DEP-06', label: 'Diagnostics & Audit', icon: Activity },
  { id: 'specifications', code: 'DEP-DOC', label: 'Index CDC (00 à 06)', icon: BookOpen },
];

export default function DeploymentPublicationView() {
  const dispatch = useDispatch();
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

  return (
    <div className="space-y-6">
      {/* Top Secondary Tab Navigator for DEP Publication */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {DEP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`dep-nav-tab-${tab.id}`}
                onClick={() => dispatch(setActiveDeploymentTab(tab.id))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.code}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected View */}
      {renderContent()}
    </div>
  );
}
