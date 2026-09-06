export interface IntegrationContract {
  readonly name: string;
  readonly version: string;

  validateRequest(payload: unknown): boolean;

  validateResponse(payload: unknown): boolean;
}
