import { createSlice } from '@reduxjs/toolkit';

// REAL DATA ONLY : l'activité affichée provient exclusivement des
// historiques réels (GET /business-manager/activity → prisma *History).
// logAuditAction reste disponible pour tracer les actions locales réussies.
const auditSlice = createSlice({
  name: 'audit',
  initialState: {
    logs: [],
    filterAction: 'ALL',
  },
  reducers: {
    logAuditAction: (state, action) => {
      state.logs.unshift({
        id: 'aud-' + Date.now(),
        traceId: 'trc-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString(),
        status: action.payload.status || 'SUCCESS',
        ...action.payload,
      });
    },
    setFilterAction: (state, action) => {
      state.filterAction = action.payload;
    },
    clearAuditLogs: (state) => {
      state.logs = [];
    },
  },
});

export const { logAuditAction, setFilterAction, clearAuditLogs } = auditSlice.actions;
export default auditSlice.reducer;
