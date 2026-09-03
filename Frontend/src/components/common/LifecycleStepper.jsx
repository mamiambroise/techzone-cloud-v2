import React from "react";
import { Check } from "lucide-react";

export function LifecycleStepper({ steps, current }) {
  const currentIndex = Math.max(0, steps.indexOf(current));
  return (
    <ol className="flex min-w-max items-center" aria-label="Cycle de vie">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex items-center">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black ${complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={`ml-2 text-[10px] font-bold ${active ? "text-blue-700" : complete ? "text-emerald-700" : "text-slate-400"}`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span
                className={`mx-3 h-px w-8 ${index < currentIndex ? "bg-emerald-500" : "bg-slate-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
