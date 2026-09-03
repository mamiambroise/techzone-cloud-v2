import React from "react";
import { Cable, X } from "lucide-react";
import { TechnicalDetails } from "./TechnicalDetails";

export function ApiNotImplementedAlert({
  title = "API pas encore implémentée",
  role,
  expectedEndpoint,
  cdc,
  technicalDetails,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-missing-title"
    >
      <section className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Cable className="h-5 w-5" />
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <h2
          id="api-missing-title"
          className="mt-5 text-xl font-black text-slate-950"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cette API permettra de {role || "réaliser cette action métier"}.
        </p>
        {(expectedEndpoint || cdc || technicalDetails) && (
          <div className="mt-5">
            <TechnicalDetails>
              {cdc && (
                <p>
                  <strong>CDC :</strong> {cdc}
                </p>
              )}
              {expectedEndpoint && (
                <p className="break-all font-mono">
                  <strong>Endpoint attendu :</strong> {expectedEndpoint}
                </p>
              )}
              {technicalDetails && <p className="mt-2">{technicalDetails}</p>}
            </TechnicalDetails>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            Compris
          </button>
        )}
      </section>
    </div>
  );
}
