const crypto = require('crypto');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const subscriptionService = require('./subscription.service');

function generateInvoiceNumber() {
  return `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function getInvoiceById(id) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!invoice) {
    throw new AppError('Facture introuvable', 404, 'INVOICE_NOT_FOUND');
  }
  return invoice;
}

async function listInvoicesForTenant(tenantId, { status } = {}) {
  return prisma.invoice.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function generateInvoiceForSubscription(subscriptionId) {
  const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

  if (!['ACTIVE', 'TRIAL'].includes(subscription.status)) {
    throw new AppError('Facturation possible uniquement pour un abonnement ACTIVE ou TRIAL', 409, 'SUBSCRIPTION_NOT_BILLABLE');
  }
  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    throw new AppError('Période de facturation non définie sur cet abonnement', 409, 'SUBSCRIPTION_PERIOD_UNDEFINED');
  }

  const existing = await prisma.invoice.findFirst({
    where: {
      subscriptionId,
      status: { notIn: ['VOID', 'CANCELLED'] },
      metadata: { path: ['periodStart'], equals: subscription.currentPeriodStart.toISOString() },
    },
  });
  if (existing) {
    throw new AppError('Une facture existe déjà pour cette période', 409, 'INVOICE_PERIOD_ALREADY_BILLED');
  }

  const plan = subscription.plan;
  const lineTotal = plan.price;

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: subscription.tenantId,
      subscriptionId,
      invoiceNumber: generateInvoiceNumber(),
      status: 'DRAFT',
      currency: plan.currency,
      subtotal: lineTotal,
      taxTotal: 0,
      discountTotal: 0,
      total: lineTotal,
      amountPaid: 0,
      amountDue: lineTotal,
      dueAt: subscription.currentPeriodStart,
      metadata: {
        periodStart: subscription.currentPeriodStart.toISOString(),
        periodEnd: subscription.currentPeriodEnd.toISOString(),
      },
      items: {
        create: [{
          code: plan.code,
          description: `Abonnement ${plan.name} (${subscription.currentPeriodStart.toISOString().slice(0, 10)} → ${subscription.currentPeriodEnd.toISOString().slice(0, 10)})`,
          quantity: 1,
          unitPrice: lineTotal,
          subtotal: lineTotal,
          taxAmount: 0,
          total: lineTotal,
        }],
      },
    },
    include: { items: true },
  });

  await prisma.billingEvent.create({
    data: { tenantId: subscription.tenantId, subscriptionId, invoiceId: invoice.id, eventType: 'INVOICE_GENERATED', payload: { amount: lineTotal } },
  });

  return invoice;
}

async function issueInvoice(id) {
  const invoice = await getInvoiceById(id);
  if (invoice.status !== 'DRAFT') {
    throw new AppError('Seule une facture DRAFT peut être émise', 409, 'INVOICE_INVALID_TRANSITION');
  }
  const updated = await prisma.invoice.update({ where: { id }, data: { status: 'OPEN', issuedAt: new Date() } });
  await prisma.billingEvent.create({
    data: { tenantId: invoice.tenantId, invoiceId: id, subscriptionId: invoice.subscriptionId, eventType: 'INVOICE_ISSUED', payload: {} },
  });
  return updated;
}

async function applyPayment({ invoiceId, amount }) {
  const invoice = await getInvoiceById(invoiceId);
  if (!['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
    throw new AppError('Cette facture n\'accepte plus de paiement', 409, 'INVOICE_NOT_PAYABLE');
  }

  const newAmountPaid = Number(invoice.amountPaid) + Number(amount);
  const newAmountDue = Math.max(Number(invoice.total) - newAmountPaid, 0);
  const isFullyPaid = newAmountDue <= 0;

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      paidAt: isFullyPaid ? new Date() : invoice.paidAt,
    },
  });

  await prisma.billingEvent.create({
    data: {
      tenantId: invoice.tenantId,
      invoiceId,
      subscriptionId: invoice.subscriptionId,
      eventType: isFullyPaid ? 'INVOICE_PAID' : 'INVOICE_PARTIALLY_PAID',
      payload: { amount, amountDue: newAmountDue },
    },
  });

  return updated;
}

async function markOverdue(id) {
  const invoice = await getInvoiceById(id);
  if (!['OPEN', 'PARTIALLY_PAID'].includes(invoice.status)) {
    throw new AppError('Seule une facture OPEN ou PARTIALLY_PAID peut passer en retard', 409, 'INVOICE_INVALID_TRANSITION');
  }
  if (invoice.dueAt >= new Date()) {
    throw new AppError('Échéance non encore dépassée', 409, 'INVOICE_NOT_YET_DUE');
  }

  const updated = await prisma.invoice.update({ where: { id }, data: { status: 'OVERDUE' } });

  if (invoice.subscriptionId) {
    await subscriptionService.markPastDue(invoice.subscriptionId);
  }

  await prisma.billingEvent.create({
    data: { tenantId: invoice.tenantId, invoiceId: id, subscriptionId: invoice.subscriptionId, eventType: 'INVOICE_OVERDUE', payload: {} },
  });

  return updated;
}

async function voidInvoice({ id, reason }) {
  const invoice = await getInvoiceById(id);
  if (invoice.status === 'PAID') {
    throw new AppError('Une facture déjà payée ne peut pas être annulée — utilise un remboursement', 409, 'INVOICE_ALREADY_PAID');
  }
  const updated = await prisma.invoice.update({ where: { id }, data: { status: 'VOID' } });
  await prisma.billingEvent.create({
    data: { tenantId: invoice.tenantId, invoiceId: id, subscriptionId: invoice.subscriptionId, eventType: 'INVOICE_VOIDED', payload: { reason } },
  });
  return updated;
}
async function reversePayment({ invoiceId, amount }) {
  const invoice = await getInvoiceById(invoiceId);
  const newAmountPaid = Math.max(Number(invoice.amountPaid) - Number(amount), 0);
  const newAmountDue = Math.max(Number(invoice.total) - newAmountPaid, 0);
  const status = newAmountPaid <= 0 ? 'OPEN' : (newAmountDue > 0 ? 'PARTIALLY_PAID' : 'PAID');

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: newAmountPaid, amountDue: newAmountDue, status },
  });
}


module.exports = {
  getInvoiceById,
  listInvoicesForTenant,
  generateInvoiceForSubscription,
  issueInvoice,
  applyPayment,
  markOverdue,
  voidInvoice,
  reversePayment,
};