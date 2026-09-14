const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const invoiceService = require('./invoice.service');

async function logPaymentEvent({ tenantId, subscriptionId, invoiceId, paymentId, eventType, payload }) {
  return prisma.billingEvent.create({
    data: { tenantId, subscriptionId, invoiceId, paymentId, eventType, payload },
  });
}

async function getPaymentById(id) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { invoice: true } });
  if (!payment) {
    throw new AppError('Paiement introuvable', 404, 'PAYMENT_NOT_FOUND');
  }
  return payment;
}

async function listPaymentsForInvoice(invoiceId) {
  return prisma.payment.findMany({ where: { invoiceId }, orderBy: { initiatedAt: 'desc' } });
}

async function initiatePayment({ invoiceId, provider, paymentMethod, amount, currency, externalReference }) {
  const invoice = await invoiceService.getInvoiceById(invoiceId);
  if (!['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
    throw new AppError('Cette facture n\'accepte plus de paiement', 409, 'INVOICE_NOT_PAYABLE');
  }

  if (externalReference) {
    const existing = await prisma.payment.findFirst({ where: { invoiceId, provider, externalReference } });
    if (existing) {
      return existing;
    }
  }

  const payment = await prisma.payment.create({
    data: { invoiceId, provider, paymentMethod, externalReference, amount, currency: currency || invoice.currency, status: 'PENDING' },
  });

  await logPaymentEvent({
    tenantId: invoice.tenantId,
    subscriptionId: invoice.subscriptionId,
    invoiceId,
    paymentId: payment.id,
    eventType: 'PAYMENT_CREATED',
    payload: { provider, amount },
  });

  return payment;
}

async function markProcessing(paymentId) {
  const payment = await getPaymentById(paymentId);
  if (payment.status !== 'PENDING') {
    throw new AppError('Seul un paiement PENDING peut passer en traitement', 409, 'PAYMENT_INVALID_TRANSITION');
  }
  return prisma.payment.update({ where: { id: paymentId }, data: { status: 'PROCESSING' } });
}

async function markSucceeded({ paymentId, externalReference }) {
  const payment = await getPaymentById(paymentId);
  if (payment.status === 'SUCCEEDED') {
    return payment;
  }
  if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
    throw new AppError('Transition invalide vers SUCCEEDED', 409, 'PAYMENT_INVALID_TRANSITION');
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'SUCCEEDED', completedAt: new Date(), externalReference: externalReference || payment.externalReference },
  });

  await invoiceService.applyPayment({ invoiceId: payment.invoiceId, amount: payment.amount });

  await logPaymentEvent({
    tenantId: payment.invoice.tenantId,
    subscriptionId: payment.invoice.subscriptionId,
    invoiceId: payment.invoiceId,
    paymentId,
    eventType: 'PAYMENT_SUCCEEDED',
    payload: { amount: payment.amount },
  });

  return updated;
}

async function markFailed({ paymentId, failureCode, failureMessage }) {
  const payment = await getPaymentById(paymentId);
  if (!['PENDING', 'PROCESSING'].includes(payment.status)) {
    throw new AppError('Transition invalide vers FAILED', 409, 'PAYMENT_INVALID_TRANSITION');
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'FAILED', failedAt: new Date(), failureCode, failureMessage },
  });

  await logPaymentEvent({
    tenantId: payment.invoice.tenantId,
    subscriptionId: payment.invoice.subscriptionId,
    invoiceId: payment.invoiceId,
    paymentId,
    eventType: 'PAYMENT_FAILED',
    payload: { failureCode, failureMessage },
  });

  return updated;
}

async function refund({ paymentId, amount, reason }) {
  const payment = await getPaymentById(paymentId);
  if (payment.status !== 'SUCCEEDED') {
    throw new AppError('Seul un paiement SUCCEEDED peut être remboursé', 409, 'PAYMENT_NOT_REFUNDABLE');
  }

  const refundAmount = amount || Number(payment.amount);
  const isFullRefund = refundAmount >= Number(payment.amount);

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED', refundedAt: new Date() },
  });

  await invoiceService.reversePayment({ invoiceId: payment.invoiceId, amount: refundAmount });

  await logPaymentEvent({
    tenantId: payment.invoice.tenantId,
    subscriptionId: payment.invoice.subscriptionId,
    invoiceId: payment.invoiceId,
    paymentId,
    eventType: 'REFUND_SUCCEEDED',
    payload: { amount: refundAmount, reason },
  });

  return updated;
}

module.exports = { getPaymentById, listPaymentsForInvoice, initiatePayment, markProcessing, markSucceeded, markFailed, refund };