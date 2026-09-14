const crypto = require('crypto');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const config = require('../config/env');
const paymentService = require('./payment.service');

const STATUS_MAP = {
  succeeded: 'SUCCEEDED',
  paid: 'SUCCEEDED',
  completed: 'SUCCEEDED',
  failed: 'FAILED',
  declined: 'FAILED',
  refunded: 'REFUNDED',
  cancelled: 'FAILED',
};

function mapExternalStatus(externalStatus) {
  const normalized = String(externalStatus || '').toLowerCase();
  return STATUS_MAP[normalized] || null;
}

function verifySignature({ rawBody, signatureHeader }) {
  if (!config.webhookSecret) {
    throw new AppError('WEBHOOK_SECRET non configuré côté serveur', 500, 'WEBHOOK_SECRET_MISSING');
  }
  if (!signatureHeader || !rawBody) return false;

  const expected = crypto.createHmac('sha256', config.webhookSecret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '');

  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function extractWebhookData(payload) {
  const data = payload.data || payload;
  return {
    externalReference: data.reference || data.externalReference || data.id,
    externalStatus: data.status,
    amount: data.amount,
  };
}

async function receiveWebhook({ provider, providerEventId, rawBody, signatureHeader, payload }) {
  const existing = await prisma.webhookEvent.findUnique({ where: { providerEventId } });
  if (existing) {
    return { deduplicated: true, webhookEvent: existing };
  }

  const signatureValid = verifySignature({ rawBody, signatureHeader });

  const webhookEvent = await prisma.webhookEvent.create({
    data: { provider, providerEventId, signatureValid, payload, processed: false },
  });

  if (!signatureValid) {
    throw new AppError('Signature webhook invalide', 401, 'WEBHOOK_SIGNATURE_INVALID');
  }

  return { deduplicated: false, webhookEvent };
}

async function processWebhookEvent(webhookEventId) {
  const webhookEvent = await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } });
  if (!webhookEvent) {
    throw new AppError('Événement webhook introuvable', 404, 'WEBHOOK_EVENT_NOT_FOUND');
  }
  if (webhookEvent.processed) {
    return webhookEvent;
  }
  if (!webhookEvent.signatureValid) {
    throw new AppError('Impossible de traiter un événement à signature invalide', 409, 'WEBHOOK_SIGNATURE_INVALID');
  }

  const { externalReference, externalStatus } = extractWebhookData(webhookEvent.payload);
  const internalStatus = mapExternalStatus(externalStatus);

  if (!externalReference || !internalStatus) {
    throw new AppError('Payload webhook non exploitable (référence ou statut manquant/non mappé)', 422, 'WEBHOOK_PAYLOAD_UNMAPPABLE');
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: webhookEvent.provider, externalReference },
  });
  if (!payment) {
    throw new AppError('Aucun paiement correspondant à cette référence externe', 404, 'PAYMENT_NOT_FOUND_FOR_WEBHOOK');
  }

  if (internalStatus === 'SUCCEEDED') {
    await paymentService.markSucceeded({ paymentId: payment.id, externalReference });
  } else if (internalStatus === 'FAILED') {
    await paymentService.markFailed({ paymentId: payment.id, failureCode: 'WEBHOOK_REPORTED_FAILURE' });
  } else if (internalStatus === 'REFUNDED') {
    await paymentService.refund({ paymentId: payment.id, reason: 'Remboursement rapporté par webhook' });
  }

  return prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { processed: true, processedAt: new Date() },
  });
}

async function listUnprocessedEvents() {
  return prisma.webhookEvent.findMany({
    where: { processed: false, signatureValid: true },
    orderBy: { receivedAt: 'asc' },
  });
}

async function retryUnprocessedEvents() {
  const events = await listUnprocessedEvents();
  const results = [];
  for (const event of events) {
    try {
      await processWebhookEvent(event.id);
      results.push({ id: event.id, status: 'PROCESSED' });
    } catch (err) {
      results.push({ id: event.id, status: 'FAILED', reason: err.code || 'UNKNOWN_ERROR' });
    }
  }
  return results;
}

module.exports = {
  verifySignature,
  mapExternalStatus,
  receiveWebhook,
  processWebhookEvent,
  listUnprocessedEvents,
  retryUnprocessedEvents,
};