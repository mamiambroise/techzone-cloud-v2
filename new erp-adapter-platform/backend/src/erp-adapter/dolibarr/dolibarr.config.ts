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
  entity: Number(process.env.DOLIBARR_ENTITY) || 1,
  timeout: Number(process.env.DOLIBARR_TIMEOUT) || 10000,
  retryAttempts: Number(process.env.DOLIBARR_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.DOLIBARR_RETRY_DELAY) || 1000,
};
