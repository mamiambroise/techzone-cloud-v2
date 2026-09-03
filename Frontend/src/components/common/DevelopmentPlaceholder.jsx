import React from "react";
import { ArrowLeft, Construction } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function DevelopmentPlaceholder({
  title,
  module,
  description,
  plannedFeatures = [],
  backPath = "/dashboard",
}) {
  const { setCurrentView } = useApp();

  return (
    <section className="max-w-3xl mx-auto py-8 sm:py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-8">
          <button
            type="button"
            onClick={() => setCurrentView("overview")}
            className="hover:text-blue-600"
          >
            Dashboard
          </button>
          <span>/</span>
          <span>{module}</span>
          <span>/</span>
          <span className="text-slate-900">{title}</span>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
          <Construction className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-800">
          EN COURS DE DÉVELOPPEMENT
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description || `Le module ${title} est planifié dans ${module}.`}
        </p>
        <p className="mt-5 text-sm leading-6 text-slate-500">
          Cette entrée est disponible dans la navigation, mais aucune donnée
          métier n'est encore exposée ici.
        </p>
        {plannedFeatures.length > 0 && (
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            {plannedFeatures.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-amber-500">•</span>
                {feature}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() =>
            setCurrentView(backPath === "/dashboard" ? "overview" : "overview")
          }
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Retour au
          dashboard
        </button>
      </div>
    </section>
  );
}
