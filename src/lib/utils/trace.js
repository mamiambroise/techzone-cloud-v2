import { randomUUID } from "crypto";
export function generateTraceId() {
  const shortId = randomUUID().replace(/-/g, "").slice(0, 12);
  return `tr_${shortId}`;
}