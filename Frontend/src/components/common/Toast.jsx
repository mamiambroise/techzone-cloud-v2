// Toast.jsx — Animated floating notification
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  };

  const bgColors = {
    success: 'bg-slate-900 border-emerald-500/30 text-white',
    warning: 'bg-slate-900 border-amber-500/30 text-white',
    error: 'bg-slate-900 border-red-500/30 text-white',
    info: 'bg-slate-900 border-blue-500/30 text-white',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-50 max-w-md shadow-2xl"
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md ${
            bgColors[toast.type] || bgColors.info
          }`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 text-xs font-semibold pr-2">{toast.message}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
