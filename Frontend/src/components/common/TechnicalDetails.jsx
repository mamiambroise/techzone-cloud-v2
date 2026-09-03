import React from "react";

export function TechnicalDetails({
  children,
  title = "Détails techniques",
  defaultOpen = false,
}) {
  if (!children) return null;
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-slate-200 bg-slate-50/70 text-left"
    >
      <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-600">
        {title}
      </summary>
      <div className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-600">
        {children}
      </div>
    </details>
  );
}
