import { useSelector } from 'react-redux';

function providerModeLabel(mode) {
  if (mode === 'MOCK') return { label: 'MOCK', className: 'border-amber-200 bg-amber-50 text-amber-900' };
  if (mode === 'REAL') return { label: 'RÉEL', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  return { label: 'INDÉFINI', className: 'border-slate-200 bg-slate-100 text-slate-700' };
}

export default function AutomationModuleHeader() {
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const application = useSelector((state) => state.applications.applications.find((app) => app.id === selectedAppId));
  const version = useSelector((state) => state.applications.versions.find(
    (item) => item.applicationId === selectedAppId && item.status === 'ACTIVE',
  ));
  const mode = useSelector((state) => state.integration.providerMode);
  const providerMode = providerModeLabel(mode);

  return (
    <section
      aria-label="Contexte Automation"
      className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Application</p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {application?.name || application?.label || application?.code || 'Non sélectionnée'}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Version active</p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {version?.version || version?.versionNumber || 'Aucune'}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-500">Mode connecteurs</span>
        <span
          role="status"
          aria-label={`Mode connecteurs : ${providerMode.label}`}
          className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-bold tracking-wide ${providerMode.className}`}
        >
          {providerMode.label}
        </span>
      </div>
    </section>
  );
}
