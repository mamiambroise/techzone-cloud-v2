export type DashboardHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
export type AttentionSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export interface DashboardQuery {
  applicationId?: string;
  applicationVersionId?: string;
  environment?: string;
  status?: string;
  validationStatus?: string;
  category?: string;
  search?: string;
}
