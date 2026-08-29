export interface DolibarrConfig {
  baseUrl: string;
  apiKey: string;
  entity: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const DEFAULT_DOLIBARR_CONFIG: DolibarrConfig = {
  baseUrl: process.env.DOLIBARR_URL || 'http://localhost/dolibarr',
  apiKey: process.env.DOLIBARR_API_KEY || '',
  entity: 1,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};
