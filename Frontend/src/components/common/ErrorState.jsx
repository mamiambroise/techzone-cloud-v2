import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "Impossible de charger les données",
  description,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center">
      <AlertCircle
        className="mx-auto h-9 w-9 text-rose-500"
        aria-hidden="true"
      />
      <h3 className="mt-4 text-sm font-extrabold text-rose-950">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-rose-800/80">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Réessayer
        </button>
      )}
    </div>
  );
}
