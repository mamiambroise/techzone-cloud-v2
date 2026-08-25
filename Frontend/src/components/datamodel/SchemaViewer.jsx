"use client";

import React, { useState, useMemo, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from "lucide-react";

const CARD_W = 230;
const CARD_H = 190;
const GAP_X = 70;
const GAP_Y = 60;
const COLS = 3;

const TYPE_COLORS = {
  TEXT: "#64748b", LONG_TEXT: "#64748b", EMAIL: "#0ea5e9", PHONE: "#0ea5e9", URL: "#0ea5e9",
  INTEGER: "#2563eb", BIG_INTEGER: "#2563eb", DECIMAL: "#2563eb", CURRENCY: "#16a34a", PERCENTAGE: "#16a34a",
  BOOLEAN: "#9333ea", DATE: "#d97706", DATETIME: "#d97706", TIME: "#d97706",
  ENUM: "#db2777", MULTI_ENUM: "#db2777", UUID: "#475569", SEQUENCE: "#475569",
  FILE: "#78716c", IMAGE: "#78716c", JSON: "#475569", FORMULA: "#7c3aed",
};

export function SchemaViewer({ entities, relations, onOpenEntity }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(20);
  const [ty, setTy] = useState(20);
  const [hoverEntity, setHoverEntity] = useState(null);
  const dragRef = useRef(null);

  const positions = useMemo(() => {
    const active = entities.filter((e) => e.status === "ACTIVE");
    const map = {};
    active.forEach((e, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      map[e.id] = { x: col * (CARD_W + GAP_X), y: row * (CARD_H + GAP_Y) };
    });
    return map;
  }, [entities]);

  const activeEntities = entities.filter((e) => positions[e.id]);
  const maxCol = Math.max(1, Math.min(COLS, activeEntities.length));
  const rows = Math.ceil(activeEntities.length / COLS) || 1;
  const canvasW = maxCol * (CARD_W + GAP_X);
  const canvasH = rows * (CARD_H + GAP_Y);

  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX - tx, y: e.clientY - ty };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setTx(e.clientX - dragRef.current.x);
    setTy(e.clientY - dragRef.current.y);
  };
  const onMouseUp = () => (dragRef.current = null);

  const center = (id) => {
    const p = positions[id];
    return p ? { x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 } : null;
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: 560 }}>
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
        <button onClick={() => setScale((s) => Math.min(2, s + 0.15))} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Zoom +">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setScale((s) => Math.max(0.4, s - 0.15))} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Zoom -">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setScale(1); setTx(20); setTy(20); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Recentrer">
          <Maximize className="w-4 h-4" />
        </button>
        <span className="px-2 text-[11px] font-bold text-slate-400">{Math.round(scale * 100)}%</span>
        <span className="px-2 text-[11px] text-slate-400 flex items-center gap-1"><MousePointer2 className="w-3.5 h-3.5" /> Glisser pour déplacer</span>
      </div>

      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ background: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      >
        <div style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "0 0", position: "relative", width: canvasW, height: canvasH }}>
          {/* Relation lines */}
          <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            {relations.map((r) => {
              const s = center(r.sourceEntityId);
              const t = center(r.targetEntityId);
              if (!s || !t) return null;
              const highlighted = hoverEntity === r.sourceEntityId || hoverEntity === r.targetEntityId;
              return (
                <g key={r.id}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={highlighted ? "#2563eb" : "#94a3b8"}
                    strokeWidth={highlighted ? 2.5 : 1.5}
                    strokeDasharray={r.relationType === "MANY_TO_MANY" ? "6 4" : undefined}
                    markerEnd="url(#arrow)"
                  />
                  <text x={(s.x + t.x) / 2 + 6} y={(s.y + t.y) / 2 - 6} fontSize="10" fill={highlighted ? "#2563eb" : "#64748b"} fontWeight="700">
                    {r.relationType.replace("_", ":").replace("ONE:", "1:").replace("MANY:", "N:")}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Entity cards */}
          {activeEntities.map((e) => {
            const p = positions[e.id];
            const fields = (e._fields || []).slice(0, 5);
            return (
              <div
                key={e.id}
                onMouseEnter={() => setHoverEntity(e.id)}
                onMouseLeave={() => setHoverEntity(null)}
                onMouseDown={(ev) => ev.stopPropagation()}
                className="absolute bg-white border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                style={{ left: p.x, top: p.y, width: CARD_W, height: CARD_H, borderColor: hoverEntity === e.id ? "#2563eb" : "#e2e8f0" }}
              >
                <button onClick={() => onOpenEntity && onOpenEntity(e.id)} className="w-full text-left p-3 pb-2 border-b border-slate-100">
                  <p className="text-sm font-extrabold text-slate-900">{e.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{e.code}</p>
                </button>
                <div className="p-2.5 space-y-1 overflow-hidden">
                  {fields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 truncate flex items-center gap-1">
                        {f.dataType === "FORMULA" && <span className="text-violet-600 font-black">ƒ</span>}
                        {f.code}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: TYPE_COLORS[f.dataType] || "#64748b", background: "#f1f5f9" }}>
                        {f.dataType}
                      </span>
                    </div>
                  ))}
                  {(e._fields || []).length > 5 && (
                    <p className="text-[10px] text-slate-400">+ {(e._fields || []).length - 5} champs…</p>
                  )}
                  {(e._fields || []).length === 0 && <p className="text-[10px] text-slate-400">Aucun champ</p>}
                </div>
              </div>
            );
          })}

          {activeEntities.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
              Aucune entité active à visualiser.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
