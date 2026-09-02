// AuditView.jsx — Complete Audit Trail & Traceability Explorer (BM-CDC-00 Section 30)
import React from 'react';
import { AuditTrail } from '../common/AuditTrail';

export function AuditView() {
  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      <AuditTrail
        title="Journal d Audit & Traçabilité (BM-CDC-00)"
        subtitle="Historique immuable des événements système, traçabilité traceId, mutations de versioning et identification des acteurs."
        showStats={true}
        showFilters={true}
        showExport={true}
        defaultViewMode="timeline"
      />
    </div>
  );
}

export default AuditView;
