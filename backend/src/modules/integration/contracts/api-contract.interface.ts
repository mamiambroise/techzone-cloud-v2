export interface ApiContract {
  readonly apiCode: string;
  readonly version: string;
  readonly basePath: string;

  validateOperation(method: string, path: string): boolean;
  validateRequestPayload(method: string, path: string, payload: unknown): { valid: boolean; errors?: string[] };
  validateResponsePayload(method: string, path: string, payload: unknown): { valid: boolean; errors?: string[] };
}
