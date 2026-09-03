import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";

export function ActionMenu({ label = "Actions", items = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-expanded={open}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-300"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
