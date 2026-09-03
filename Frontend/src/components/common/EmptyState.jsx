import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Inbox className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
      <h3 className="mt-4 text-sm font-extrabold text-slate-800">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
