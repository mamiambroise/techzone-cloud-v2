import React from 'react';
import { ApiMissingState } from '../common/ApiMissingState';

export function IAMDashboardView() {
  return (
    <ApiMissingState
      title="API pas encore implémentée"
      description="Cette API permettra de consulter et administrer les utilisateurs, organisations et sessions IAM. La session JWT de développement reste disponible, sans annuaire local dans le navigateur."
      expectedEndpoint="GET /api/v1/iam/users"
      cdc="BM-CDC-00"
    />
  );
}
