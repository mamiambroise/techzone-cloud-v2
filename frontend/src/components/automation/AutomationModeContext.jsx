import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getAutomationErrorCode } from '../../lib/automation/errors.js';

const AutomationModeContext = createContext(null);

export function AutomationModeProvider({ children }) {
  const { pathname } = useLocation();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    setBanner((current) => current?.kind === 'SIMULATION' || current?.kind === 'TEST' ? null : current);
  }, [pathname]);

  const reportError = useCallback((error) => {
    if (getAutomationErrorCode(error) === 'AUTOMATION_RUNTIME_BLOCKED') {
      setBanner({
        kind: 'RUNTIME_BLOCKED',
        message: 'L’API Automation a refusé cette opération pour cause de blocage Runtime.',
      });
    }
  }, []);

  const value = useMemo(() => ({
    banner,
    setBanner,
    clearBanner: (kind) => setBanner((current) => !kind || current?.kind === kind ? null : current),
    reportError,
  }), [banner, reportError]);

  return <AutomationModeContext.Provider value={value}>{children}</AutomationModeContext.Provider>;
}

export function useAutomationMode() {
  const context = useContext(AutomationModeContext);
  if (!context) throw new Error('useAutomationMode doit être utilisé dans AutomationModeProvider.');
  return context;
}

export function AutomationModeBanners() {
  const providerMode = useSelector((state) => state.integration.providerMode);
  const { banner, clearBanner } = useAutomationMode();
  const notices = [
    ...(providerMode === 'MOCK' ? [{
      kind: 'MOCK',
      message: 'Les connecteurs sont configurés en mode Mock ; les pages Automation restent servies par l’API moteur.',
    }] : []),
    ...(banner ? [banner] : []),
  ];

  if (!notices.length) return null;

  return (
    <div aria-label="Bannières Automation" className="mb-5 space-y-2">
      {notices.map((notice) => {
        const blocked = notice.kind === 'RUNTIME_BLOCKED';
        const simulation = notice.kind === 'SIMULATION';
        const tone = blocked
          ? 'border-rose-300 bg-rose-50 text-rose-900'
          : simulation
            ? 'border-violet-200 bg-violet-50 text-violet-900'
            : 'border-amber-200 bg-amber-50 text-amber-900';
        return (
          <section
            key={notice.kind}
            role={blocked ? 'alert' : 'status'}
            aria-label={`Mode ${notice.kind}`}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${tone}`}
          >
            <p><strong className="mr-2 font-bold">{notice.kind}</strong>{notice.message}</p>
            {notice.kind !== 'MOCK' && (
              <button
                type="button"
                onClick={() => clearBanner(notice.kind)}
                className="rounded px-2 py-1 text-xs font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-current"
                aria-label={`Fermer la bannière ${notice.kind}`}
              >
                Fermer
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
