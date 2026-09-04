export interface CredentialReferenceContract {
  readonly code: string;
  readonly type: string;
  readonly provider: string;

  maskSecret(secret: string): string;
  validateFormat(secret: string): { valid: boolean; reason?: string };
}
