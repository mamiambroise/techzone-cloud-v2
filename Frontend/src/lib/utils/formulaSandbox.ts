// P0.2 — Sandbox / Sample Data (specs §30/§31, C4 §13.23/§14.17).
//
// This is a purely client-side, ephemeral evaluator used ONLY to preview a FORMULA field
// against sample values the user types into the Sandbox. It never touches the Data Model
// Metadata Store or any future Data Runtime (INV-DM-005: metadata ≠ runtime data) — nothing
// computed here is persisted anywhere. It intentionally mirrors the same restricted grammar
// the backend Formula Engine accepts (src/lib/services/datamodel/formula.ts: + - * / % , and
// only concat/round/min/max/coalesce) so what the Sandbox previews matches what the backend
// would actually accept at save time — but this file evaluates VALUES, not types, and must
// never be used to decide whether a formula is valid for persistence (that stays backend-only).

export interface FormulaEvalResult {
  ok: boolean;
  value: number | string | null;
  error?: string;
}

type Token = { kind: "num" | "str" | "ident" | "op" | "lp" | "rp" | "comma"; value: string };

const CONTROLLED_FUNCS = new Set(["concat", "round", "min", "max", "coalesce"]);

function tokenize(expr: string): { tokens: Token[]; error?: string } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(expr[i + 1] || ""))) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ kind: "num", value: expr.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < expr.length && expr[j] !== '"') j++;
      if (expr[j] !== '"') return { tokens, error: "Chaîne non terminée." };
      tokens.push({ kind: "str", value: expr.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j++;
      tokens.push({ kind: "ident", value: expr.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/%".includes(c)) { tokens.push({ kind: "op", value: c }); i++; continue; }
    if (c === "(") { tokens.push({ kind: "lp", value: c }); i++; continue; }
    if (c === ")") { tokens.push({ kind: "rp", value: c }); i++; continue; }
    if (c === ",") { tokens.push({ kind: "comma", value: c }); i++; continue; }
    return { tokens, error: `Caractère interdit: "${c}"` };
  }
  return { tokens };
}

/**
 * Evaluate a formula expression against a bag of sample values (field code -> value).
 * Read-only, side-effect free, no arbitrary code execution — only the same closed grammar
 * the backend Formula Engine parses.
 */
export function evaluateFormula(expression: string, values: Record<string, any>): FormulaEvalResult {
  if (!expression || !expression.trim()) return { ok: false, value: null, error: "Expression vide." };

  const { tokens, error } = tokenize(expression);
  if (error) return { ok: false, value: null, error };

  let pos = 0;
  let evalError: string | null = null;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const fail = (msg: string) => { if (!evalError) evalError = msg; };

  function toNumber(v: any): number {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) { fail(`Valeur non numérique: "${v}"`); return 0; }
    return n;
  }

  function parseExpr(): any {
    let left = parseTerm();
    while (!evalError && peek()?.kind === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = next().value;
      const right = parseTerm();
      if (evalError) return null;
      left = op === "+" ? toNumber(left) + toNumber(right) : toNumber(left) - toNumber(right);
    }
    return left;
  }

  function parseTerm(): any {
    let left = parseFactor();
    while (!evalError && peek()?.kind === "op" && ["*", "/", "%"].includes(peek().value)) {
      const op = next().value;
      const right = parseFactor();
      if (evalError) return null;
      const a = toNumber(left);
      const b = toNumber(right);
      if ((op === "/" || op === "%") && b === 0) { fail("Division par zéro."); return null; }
      left = op === "*" ? a * b : op === "/" ? a / b : a % b;
    }
    return left;
  }

  function parseFactor(): any {
    const t = peek();
    if (!t) { fail("Expression incomplète."); return null; }
    if (t.kind === "num") { next(); return Number(t.value); }
    if (t.kind === "str") { next(); return t.value; }
    if (t.kind === "op" && t.value === "-") { next(); const inner = parseFactor(); return evalError ? null : -toNumber(inner); }
    if (t.kind === "lp") {
      next();
      const inner = parseExpr();
      if (!peek() || peek().kind !== "rp") { fail("Parenthèse fermante manquante."); return null; }
      next();
      return inner;
    }
    if (t.kind === "ident") {
      next();
      if (peek()?.kind === "lp") {
        next();
        const args: any[] = [];
        if (peek()?.kind !== "rp") {
          for (;;) {
            const a = parseExpr();
            if (evalError) return null;
            args.push(a);
            if (peek()?.kind === "comma") { next(); continue; }
            break;
          }
        }
        if (!peek() || peek().kind !== "rp") { fail("Parenthèse fermante manquante."); return null; }
        next();
        return callFunction(t.value, args);
      }
      const code = t.value;
      if (!(code in values)) { fail(`Référence introuvable: "${code}" (pas de valeur d'exemple saisie).`); return null; }
      return values[code];
    }
    fail(`Token inattendu: "${t.value}".`);
    return null;
  }

  function callFunction(name: string, args: any[]): any {
    if (!CONTROLLED_FUNCS.has(name)) { fail(`Fonction non autorisée: "${name}".`); return null; }
    if (args.length === 0) { fail(`${name}() exige au moins un argument.`); return null; }
    if (name === "concat") return args.map((a) => (a === null || a === undefined ? "" : String(a))).join("");
    if (name === "coalesce") return args.find((a) => a !== null && a !== undefined && a !== "") ?? null;
    if (name === "round") {
      const n = toNumber(args[0]);
      const digits = args.length > 1 ? toNumber(args[1]) : 0;
      const factor = 10 ** digits;
      return Math.round(n * factor) / factor;
    }
    if (name === "min") return Math.min(...args.map(toNumber));
    if (name === "max") return Math.max(...args.map(toNumber));
    return null;
  }

  const result = parseExpr();
  if (!evalError && pos < tokens.length) fail(`Token inattendu en fin d'expression: "${tokens[pos]?.value}".`);
  if (evalError) return { ok: false, value: null, error: evalError };
  return { ok: true, value: result };
}

/** Generate a plausible sample value for a given data type — used by "Générer des données d'exemple". */
export function generateSampleValue(dataType: string, options?: { value: string; label: string }[]): any {
  switch (dataType) {
    case "TEXT": return "Exemple";
    case "LONG_TEXT": return "Texte d'exemple pour test Sandbox.";
    case "INTEGER": return 42;
    case "BIG_INTEGER": return 42000;
    case "DECIMAL": return 19.5;
    case "CURRENCY": return 1990;
    case "PERCENTAGE": return 15;
    case "BOOLEAN": return true;
    case "DATE": return new Date().toISOString().slice(0, 10);
    case "DATETIME": return new Date().toISOString().slice(0, 16);
    case "TIME": return "09:30";
    case "EMAIL": return "test@example.com";
    case "PHONE": return "+33612345678";
    case "URL": return "https://example.com";
    case "UUID": return "00000000-0000-0000-0000-000000000000";
    case "ENUM": return options?.[0]?.value ?? "";
    case "MULTI_ENUM": return options?.[0]?.value ? [options[0].value] : [];
    case "SEQUENCE": return 1;
    case "JSON": return "{}";
    default: return "";
  }
}

/** Run a set of declarative validation rules (specs §15) against one sample value. Client-side
 * preview only — the Backend Validation Engine remains the authority at actual save time. */
export function runValidationRules(
  value: any,
  rules: { id: string; type: string; configuration?: Record<string, any>; message?: string | null }[]
): { rule: (typeof rules)[number]; pass: boolean; message: string }[] {
  const isEmpty = value === null || value === undefined || value === "";
  return rules.map((rule) => {
    let pass = true;
    let message = rule.message || "";
    const cfg = rule.configuration || {};
    switch (rule.type) {
      case "REQUIRED":
        pass = !isEmpty;
        if (!pass) message = message || "Valeur obligatoire.";
        break;
      case "MIN":
        pass = isEmpty || Number(value) >= Number(cfg.value);
        if (!pass) message = message || `Doit être ≥ ${cfg.value}.`;
        break;
      case "MAX":
        pass = isEmpty || Number(value) <= Number(cfg.value);
        if (!pass) message = message || `Doit être ≤ ${cfg.value}.`;
        break;
      case "MIN_LENGTH":
        pass = isEmpty || String(value).length >= Number(cfg.value);
        if (!pass) message = message || `Longueur minimale: ${cfg.value}.`;
        break;
      case "MAX_LENGTH":
        pass = isEmpty || String(value).length <= Number(cfg.value);
        if (!pass) message = message || `Longueur maximale: ${cfg.value}.`;
        break;
      case "REGEX":
        try { pass = isEmpty || new RegExp(cfg.pattern).test(String(value)); }
        catch { pass = false; message = "Pattern regex invalide."; }
        if (!pass && !message) message = "Ne respecte pas le format attendu.";
        break;
      case "EMAIL":
        pass = isEmpty || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        if (!pass) message = message || "Adresse email invalide.";
        break;
      case "URL":
        try { pass = isEmpty || !!new URL(String(value)); }
        catch { pass = false; }
        if (!pass) message = message || "URL invalide.";
        break;
      default:
        pass = true;
    }
    return { rule, pass, message };
  });
}
