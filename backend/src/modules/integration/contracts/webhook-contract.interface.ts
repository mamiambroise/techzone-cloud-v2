export interface WebhookContract {
  readonly code: string;
  readonly direction: 'INBOUND' | 'OUTBOUND';
  readonly event: string;

  verifySignature(payload: string | Buffer, signature: string, secret: string): boolean;
  validatePayload(payload: unknown): { valid: boolean; errors?: string[] };
}
