import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export function JsonViewer({ value, maxHeight = 520 }) {
  const [copied, setCopied] = useState(false);
  const content = JSON.stringify(value ?? null, null, 2);
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        JSON
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-800 hover:text-white"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre
        style={{ maxHeight }}
        className="overflow-auto p-4 text-xs leading-5"
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}
