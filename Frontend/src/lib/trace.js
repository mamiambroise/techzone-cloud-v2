// Trace & ID Utilities for BM-CDC-00 / BM-CDC-01

export function generateTraceId() {
  const chars = '0123456789abcdef';
  let str = '';
  for (let i = 0; i < 12; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return `tr_${str}`;
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
