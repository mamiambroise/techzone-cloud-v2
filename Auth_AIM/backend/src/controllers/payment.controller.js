const paymentService = require('../services/payment.service');
const { success } = require('../utils/response');

async function initiate(req, res, next) {
  try {
    const payment = await paymentService.initiatePayment(req.body);
    return success(res, { data: payment, statusCode: 201, message: 'Paiement initié' });
  } catch (err) {
    return next(err);
  }
}

async function listForInvoice(req, res, next) {
  try {
    const payments = await paymentService.listPaymentsForInvoice(req.params.invoiceId);
    return success(res, { data: payments });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    return success(res, { data: payment });
  } catch (err) {
    return next(err);
  }
}

async function markProcessing(req, res, next) {
  try {
    const payment = await paymentService.markProcessing(req.params.id);
    return success(res, { data: payment, message: 'Paiement en traitement' });
  } catch (err) {
    return next(err);
  }
}

async function markSucceeded(req, res, next) {
  try {
    const payment = await paymentService.markSucceeded({ paymentId: req.params.id, externalReference: req.body.externalReference });
    return success(res, { data: payment, message: 'Paiement réussi' });
  } catch (err) {
    return next(err);
  }
}

async function markFailed(req, res, next) {
  try {
    const payment = await paymentService.markFailed({ paymentId: req.params.id, ...req.body });
    return success(res, { data: payment, message: 'Paiement échoué' });
  } catch (err) {
    return next(err);
  }
}

async function refund(req, res, next) {
  try {
    const payment = await paymentService.refund({ paymentId: req.params.id, ...req.body });
    return success(res, { data: payment, message: 'Remboursement traité' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { initiate, listForInvoice, getById, markProcessing, markSucceeded, markFailed, refund };