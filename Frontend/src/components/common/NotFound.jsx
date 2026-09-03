import React from "react";
import { ArrowLeft, Compass } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function NotFound() {
  const { setCurrentView } = useApp();
  return (
    <section className="mx-auto max-w-2xl py-14 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <Compass
          className="mx-auto h-12 w-12 text-slate-400"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cette adresse ne correspond à aucune route de la plateforme.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("overview")}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
          >
            Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}
