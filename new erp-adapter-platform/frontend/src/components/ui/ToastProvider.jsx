import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircleIcon,
    ring: 'border-emerald-200 dark:border-emerald-800',
    accent: 'bg-emerald-500',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    title: 'Succès',
  },
  error: {
    icon: ExclamationTriangleIcon,
    ring: 'border-red-200 dark:border-red-800',
    accent: 'bg-red-500',
    iconClass: 'text-red-500 dark:text-red-400',
    title: 'Erreur',
  },
  info: {
    icon: InformationCircleIcon,
    ring: 'border-blue-200 dark:border-blue-800',
    accent: 'bg-blue-500',
    iconClass: 'text-blue-500 dark:text-blue-400',
    title: 'Information',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      const id = ++idRef.current;
      const duration = options.duration ?? 4500;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => {
    const toast = {
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      info: (m, o) => push('info', m, o),
      dismiss,
    };
    return { toast, dismiss };
  }, [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container fixed top-5 right-5 z-[2000] flex flex-col gap-3 w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto relative flex items-start gap-3 rounded-xl bg-white dark:bg-slate-800 border ${s.ring} shadow-2xl shadow-slate-900/20 overflow-hidden toast-enter`}
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.accent}`} />
              <div className="flex items-start gap-3 pl-4 pr-3 py-3.5 flex-1">
                <Icon className={`w-6 h-6 shrink-0 ${s.iconClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug break-words">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Fermer"
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <span
                className="toast-progress absolute bottom-0 left-0 h-0.5 bg-slate-200 dark:bg-slate-700"
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return ctx;
}