import React from "react";
import { StatusBadge } from "./StatusBadge";

export function ValidationSummary({ status, sections = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-950">Validation</h2>
        <StatusBadge status={status || "NOT_RUN"} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
          >
            <span className="font-semibold text-slate-600">
              {section.label}
            </span>
            <StatusBadge status={section.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
