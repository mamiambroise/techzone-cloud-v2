// P0.2 — Formula Engine: controlled DSL, no arbitrary code execution.
// Pipeline: Tokenizer -> Parser -> AST -> Reference Resolver -> Type Checker -> Dependency Extractor

export interface FormulaCheckResult {
  valid: boolean;
  errors: string[];
  deps: string[];
  resultType: string | null;
}

type Token = { kind: "num" | "str" | "ident" | "op" | "lp" | "rp" | "comma"; value: string };

const NUMERIC_CAT = new Set(["INTEGER", "BIG_INTEGER", "DECIMAL", "CURRENCY", "PERCENTAGE"]);
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
      const raw = expr.slice(i, j);
      if ((raw.match(/\./g) || []).length > 1) return { tokens, error: `Nombre invalide: ${raw}` };
      tokens.push({ kind: "num", value: raw });
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
    return { tokens, error: `Caractère interdit dans une formule: "${c}"` };
  }
  return { tokens };
}

export function checkFormula(
  expression: string,
  fieldTypes: Record<string, string> // code -> dataType (formula fields use their resultType)
): FormulaCheckResult {
  const errors: string[] = [];
  const deps: string[] = [];

  if (!expression || !expression.trim()) {
    return { valid: false, errors: ["Expression vide."], deps: [], resultType: null };
  }

  const { tokens, error } = tokenize(expression);
  if (error) return { valid: false, errors: [error], deps: [], resultType: null };

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr(): { type: string | null } | null {
    let left = parseTerm();
    if (!left) return null;
    while (peek()?.kind === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = next().value;
      const right = parseTerm();
      if (!right) return null;
      if (!NUMERIC_CAT.has(left.type || "") || !NUMERIC_CAT.has(right.type || "")) {
        errors.push(`L'opérateur "${op}" exige deux opérandes numériques.`);
        return { type: null };
      }
      left = { type: mergeNumeric(left.type!, right.type!) };
    }
    return left;
  }

  function parseTerm(): { type: string | null } | null {
    let left = parseFactor();
    if (!left) return null;
    while (peek()?.kind === "op" && ["*", "/", "%"].includes(peek().value)) {
      const op = next().value;
      const right = parseFactor();
      if (!right) return null;
      if (!NUMERIC_CAT.has(left.type || "") || !NUMERIC_CAT.has(right.type || "")) {
        errors.push(`L'opérateur "${op}" exige deux opérandes numériques.`);
        return { type: null };
      }
      left = { type: mergeNumeric(left.type!, right.type!) };
    }
    return left;
  }

  function parseFactor(): { type: string | null } | null {
    const t = peek();
    if (!t) { errors.push("Expression incomplète."); return null; }
    if (t.kind === "num") { next(); return { type: t.value.includes(".") ? "DECIMAL" : "INTEGER" }; }
    if (t.kind === "str") { next(); return { type: "TEXT" }; }
    if (t.kind === "op" && t.value === "-") {
      next();
      const inner = parseFactor();
      if (!inner) return null;
      if (!NUMERIC_CAT.has(inner.type || "")) { errors.push("L'opérateur unaire \"-\" exige un opérande numérique."); return { type: null }; }
      return inner;
    }
    if (t.kind === "lp") {
      next();
      const inner = parseExpr();
      if (!peek() || peek().kind !== "rp") { errors.push("Parenthèse fermante manquante."); return null; }
      next();
      return inner;
    }
    if (t.kind === "ident") {
      next();
      // Function call?
      if (peek()?.kind === "lp") {
        next();
        const args: (string | null)[] = [];
        if (peek()?.kind !== "rp") {
          for (;;) {
            const a = parseExpr();
            if (!a) return null;
            args.push(a.type);
            if (peek()?.kind === "comma") { next(); continue; }
            break;
          }
        }
        if (!peek() || peek().kind !== "rp") { errors.push("Parenthèse fermante manquante."); return null; }
        next();
        return typeFunction(t.value, args);
      }
      // Field reference
      const code = t.value;
      if (!(code in fieldTypes)) {
        errors.push(`FORMULA_REFERENCE_NOT_FOUND: le champ "${code}" n'existe pas.`);
        return { type: null };
      }
      if (!deps.includes(code)) deps.push(code);
      return { type: fieldTypes[code] };
    }
    errors.push(`Token inattendu: "${t.value}".`);
    return null;
  }

  function typeFunction(name: string, args: (string | null)[]): { type: string | null } {
    if (!CONTROLLED_FUNCS.has(name)) {
      errors.push(`FORMULA_INVALID: fonction non autorisée "${name}". Fonctions supportées: concat, round, min, max, coalesce.`);
      return { type: null };
    }
    if (args.length === 0) { errors.push(`${name}() exige au moins un argument.`); return { type: null }; }
    if (name === "concat") return { type: "TEXT" };
    if (name === "coalesce") return { type: args[0] };
    // round, min, max
    for (const a of args) {
      if (!NUMERIC_CAT.has(a || "")) { errors.push(`${name}() exige des arguments numériques.`); return { type: null }; }
    }
    return { type: args[0] };
  }

  function mergeNumeric(a: string, b: string): string {
    if (a === "CURRENCY" || b === "CURRENCY") return "CURRENCY";
    if (a === "DECIMAL" || b === "DECIMAL") return "DECIMAL";
    if (a === "PERCENTAGE" || b === "PERCENTAGE") return "DECIMAL";
    if (a === "BIG_INTEGER" || b === "BIG_INTEGER") return "BIG_INTEGER";
    return "INTEGER";
  }

  const result = parseExpr();
  if (pos < tokens.length) errors.push(`Token inattendu en fin d'expression: "${tokens[pos]?.value}".`);
  if (!result && errors.length === 0) errors.push("Expression invalide.");

  return {
    valid: errors.length === 0,
    errors,
    deps,
    resultType: result?.type ?? null,
  };
}

// Cycle detection across FORMULA fields of an entity.
export function detectCycles(
  formulas: Record<string, string[]>, // formulaFieldCode -> dependency codes (formulas only)
  fieldLabels: Record<string, string>
): { hasCycle: boolean; cycles: string[][] } {
  const cycles: string[][] = [];
  const state: Record<string, 0 | 1 | 2> = {};

  function dfs(node: string, path: string[]) {
    state[node] = 1;
    for (const dep of formulas[node] || []) {
      if (!(dep in formulas)) continue;
      if (state[dep] === 1) {
        const start = path.indexOf(dep);
        cycles.push([...path.slice(start >= 0 ? start : 0), dep]);
      } else if (!state[dep]) {
        dfs(dep, [...path, dep]);
      }
    }
    state[node] = 2;
  }

  for (const code of Object.keys(formulas)) {
    if (!state[code]) dfs(code, [code]);
  }

  return { hasCycle: cycles.length > 0, cycles };
}
