import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '../../../generated/prisma/enums';

/**
 * Contrat de provider de paiement (CDC 45).
 *
 * Ce contrat prepare l'architecture sans simuler le moindre provider :
 * aucun numero marchand, aucune API, aucun frais, aucun credential n'est
 * invente (CDC 44). Aucun adaptateur n'est enregistre en MVP — le paiement
 * manuel est le seul moyen reellement operationnel (CDC 49 / RG-BILL-039 :
 * aucun fallback paiement silencieux).
 *
 * Toute implementation future doit passers par cette interface, jamais par un
 * acces direct a une base externe.
 */
export interface CreatePaymentRequest {
  tenantId: string;
  invoiceId: string;
  amountMinorUnits: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  providerReference: string;
  status: PaymentStatus;
  /** Action attendue du payeur (URL de redirection, code USSD...). Absente en MVP. */
  actionUrl?: string | null;
}

export interface PaymentProviderAdapter {
  /** Identifiant technique du provider. Jamais expose au frontend. */
  readonly code: string;
  readonly displayName: string;
  /** Methodes de paiement reellement supportees par cet adaptateur. */
  readonly methods: readonly PaymentMethod[];

  isConfigured(): boolean;

  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult>;

  getPaymentStatus(providerReference: string): Promise<PaymentStatus>;

  cancelPayment(providerReference: string): Promise<void>;

  refundPayment(providerReference: string, amountMinorUnits: number): Promise<void>;

  /**
   * Verifie la signature d'un webhook. RG-BILL-022 : un webhook non verifie ne
   * modifie jamais un Payment. La verification doit etre constante dans le temps
   * et utiliser une comparaison resistant aux attaques temporelles.
   */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean;
}

export interface WebhookResolution {
  providerEventId: string;
  providerReference: string;
  status: PaymentStatus;
  amountMinorUnits?: number;
  currency?: string;
  occurredAt?: string;
}

/**
 * Registre de providers. Volontairement vide en MVP : il expose l'absence de
 * provider configure plutot que d'en simuler un.
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly adapters = new Map<string, PaymentProviderAdapter>();

  register(adapter: PaymentProviderAdapter): void {
    this.adapters.set(adapter.code, adapter);
  }

  /** Ne renvoie un adaptateur que s'il est REELLEMENT enregistre et configure. */
  resolve(code: string): PaymentProviderAdapter | null {
    const adapter = this.adapters.get(code);
    if (!adapter) return null;
    return adapter.isConfigured() ? adapter : null;
  }

  list(): Array<{ code: string; displayName: string; methods: readonly PaymentMethod[]; configured: boolean }> {
    return [...this.adapters.values()].map((adapter) => ({
      code: adapter.code,
      displayName: adapter.displayName,
      methods: adapter.methods,
      configured: adapter.isConfigured(),
    }));
  }

  get size(): number {
    return this.adapters.size;
  }
}