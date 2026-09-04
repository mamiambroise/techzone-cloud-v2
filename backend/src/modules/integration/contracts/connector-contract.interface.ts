export interface ConnectorContract {
  readonly code: string;
  readonly version: string;

  validateConfiguration(configuration: unknown): boolean;

  getCapabilities(): string[];
}
