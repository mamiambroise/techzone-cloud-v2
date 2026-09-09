const express = require('express');
const controller = require('../controllers/payment.controller');
const validators = require('../validators/payment.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.post('/', authenticate, requirePermission('billing.payments.manage'), validate(validators.initiatePaymentSchema), controller.initiate);
router.get('/invoice/:invoiceId', authenticate, requirePermission('billing.payments.manage'), controller.listForInvoice);
router.get('/:id', authenticate, requirePermission('billing.payments.manage'), controller.getById);
router.post('/:id/processing', authenticate, requirePermission('billing.payments.manage'), controller.markProcessing);
router.post('/:id/succeed', authenticate, requirePermission('billing.payments.manage'), validate(validators.markSucceededSchema), controller.markSucceeded);
router.post('/:id/fail', authenticate, requirePermission('billing.payments.manage'), validate(validators.markFailedSchema), controller.markFailed);
router.post('/:id/refund', authenticate, requirePermission('billing.payments.manage'), validate(validators.refundSchema), controller.refund);

module.exports = router;