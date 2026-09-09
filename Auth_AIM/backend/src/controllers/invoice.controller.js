const invoiceService = require('../services/invoice.service');
const { success } = require('../utils/response');

async function generate(req, res, next) {
  try {
    const invoice = await invoiceService.generateInvoiceForSubscription(req.body.subscriptionId);
    return success(res, { data: invoice, statusCode: 201, message: 'Facture générée' });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const invoices = await invoiceService.listInvoicesForTenant(req.query.tenantId, { status: req.query.status });
    return success(res, { data: invoices });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    return success(res, { data: invoice });
  } catch (err) {
    return next(err);
  }
}

async function issue(req, res, next) {
  try {
    const invoice = await invoiceService.issueInvoice(req.params.id);
    return success(res, { data: invoice, message: 'Facture émise' });
  } catch (err) {
    return next(err);
  }
}

async function applyPayment(req, res, next) {
  try {
    const invoice = await invoiceService.applyPayment({ invoiceId: req.params.id, amount: req.body.amount });
    return success(res, { data: invoice, message: 'Paiement appliqué' });
  } catch (err) {
    return next(err);
  }
}

async function markOverdue(req, res, next) {
  try {
    const invoice = await invoiceService.markOverdue(req.params.id);
    return success(res, { data: invoice, message: 'Facture marquée en retard' });
  } catch (err) {
    return next(err);
  }
}

async function voidInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.voidInvoice({ id: req.params.id, reason: req.body.reason });
    return success(res, { data: invoice, message: 'Facture annulée' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { generate, list, getById, issue, applyPayment, markOverdue, voidInvoice };