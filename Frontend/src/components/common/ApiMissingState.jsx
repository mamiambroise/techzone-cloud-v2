import React from "react";
import { Cable } from "lucide-react";
import { TechnicalDetails } from "./TechnicalDetails";

export function ApiMissingState({
  title = "API pas encore implémentée",
  description = "Cette API permettra d’exécuter cette fonctionnalité avec une source backend persistante.",
  expectedEndpoint,
  cdc,
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center shadow-sm">
      <Cable className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
      <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold tracking-wide text-amber-800">API_MISSING</span>
      <h2 className="mt-4 text-xl font-extrabold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {(expectedEndpoint || cdc) && <div className="mt-5"><TechnicalDetails>
        {expectedEndpoint && <p className="font-mono">{expectedEndpoint}</p>}
        {cdc && <p className="mt-1 font-semibold">Référence : {cdc}</p>}
      </TechnicalDetails></div>}
    </section>
  );
}
