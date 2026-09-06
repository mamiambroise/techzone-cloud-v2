import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
}

@Injectable()
export class WebhookSignatureService {
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256',
    toleranceSeconds = 300,
  ): SignatureVerificationResult {
    try {
      if (!signature || !secret) {
        return { valid: false, reason: 'Missing signature or secret' };
      }

      if (algorithm === 'sha256' && signature.startsWith('sha256=')) {
        const [headerSig] = this.extractTimestamp(signature);
        const expected = this.computeHmac(payload, secret, algorithm);

        if (!this.timingSafeEqual(headerSig, expected)) {
          return { valid: false, reason: 'Signature mismatch' };
        }

        return { valid: true };
      }

      if (signature.includes(',')) {
        const result = this.verifyTimestampedSignature(
          payload,
          signature,
          secret,
          algorithm,
          toleranceSeconds,
        );
        return result;
      }

      const expected = this.computeHmac(payload, secret, algorithm);

      if (!this.timingSafeEqual(signature, expected)) {
        return { valid: false, reason: 'Signature mismatch' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: `Verification error: ${error}` };
    }
  }

  private verifyTimestampedSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1',
    toleranceSeconds: number,
  ): SignatureVerificationResult {
    const [headerSig, timestamp] = this.extractTimestamp(signature);

    if (!timestamp) {
      return { valid: false, reason: 'Missing timestamp' };
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - Number(timestamp));

    if (diff > toleranceSeconds) {
      return { valid: false, reason: 'Timestamp outside tolerance (replay attack)' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = this.computeHmac(signedPayload, secret, algorithm);

    if (!this.timingSafeEqual(headerSig, expected)) {
      return { valid: false, reason: 'Signature mismatch' };
    }

    return { valid: true };
  }

  private extractTimestamp(signature: string): [string, string] {
    const parts = signature.split(',');
    if (parts.length >= 2) {
      const tsPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1=') || p.startsWith('sha256='));
      const timestamp = tsPart ? tsPart.replace('t=', '') : '';
      const sigValue = sigPart
        ? sigPart.replace('v1=', '').replace('sha256=', '')
        : '';
      return [sigValue, timestamp];
    }
    return [signature, ''];
  }

  private computeHmac(
    payload: string,
    secret: string,
    algorithm: 'sha256' | 'sha1',
  ): string {
    return crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }

  generateSignature(payload: string, secret: string, algorithm: 'sha256' = 'sha256'): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;

    const hmac = this.computeHmac(signedPayload, secret, algorithm);

    return `t=${timestamp},v1=${hmac}`;
  }

  validatePayload(payload: unknown): boolean {
    if (payload === null || payload === undefined) {
      return false;
    }

    if (typeof payload !== 'object') {
      return false;
    }

    const size = JSON.stringify(payload).length;

    return Object.keys(payload).length > 0 && size <= 1_000_000;
  }
}
