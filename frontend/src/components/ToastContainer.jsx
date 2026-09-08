import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../store/platformSlice.js';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useSelector((state) => state.platform.toasts);
  const dispatch = useDispatch();

  if (!toasts || toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-200/90 bg-white/95 text-slate-900 ring-1 ring-emerald-500/20',
    warning: 'border-amber-200/90 bg-white/95 text-slate-900 ring-1 ring-amber-500/20',
    error: 'border-rose-200/90 bg-white/95 text-slate-900 ring-1 ring-rose-500/20',
    info: 'border-blue-200/90 bg-white/95 text-slate-900 ring-1 ring-blue-500/20',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            borderMap[toast.type] || borderMap.info
          }`}
        >
          {iconMap[toast.type] || iconMap.info}
          <div className="flex-1 min-w-0">
            {toast.title && <div className="font-bold text-xs text-slate-900 tracking-tight">{toast.title}</div>}
            <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</div>
          </div>
          <button
            onClick={() => dispatch(removeToast(toast.id))}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
