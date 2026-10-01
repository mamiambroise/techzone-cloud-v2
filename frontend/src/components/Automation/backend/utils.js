export function getErrorMessage(err, fallback = 'Une erreur est survenue') {
  const candidates = [err?.response?.data?.message, err?.normalized?.message, err?.message];
  const found = candidates.find((m) => typeof m === 'string' && m.trim());
  return found || fallback;
}

export function describeError(prefix, err) {
  return `${prefix} : ${getErrorMessage(err)}`;
}

// Accepte un tableau, ou un objet paginé { records | items | content }.
export function toArray(data) {
  if (Array.isArray(data)) return data;
  return data?.records || data?.items || data?.content || [];
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR');
}

export function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('fr-FR');
}

export function parseJson(text, label = 'JSON') {
  try {
    return { ok: true, value: JSON.parse(text), error: null };
  } catch (e) {
    const match = /position (\d+)/.exec(e?.message || '');
    let where = '';
    if (match) {
      const lines = text.slice(0, Number(match[1])).split('\n');
      where = ` (ligne ${lines.length}, colonne ${lines[lines.length - 1].length + 1})`;
    }
    return { ok: false, value: null, error: `${label} invalide${where}.` };
  }
}

export function formatJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function formatDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return '—';
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`;
}

export function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}
