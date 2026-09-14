const express = require('express');
const controller = require('../controllers/invoice.controller');
const validators = require('../validators/invoice.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('billing.invoices.manage'), controller.list);
router.get('/:id', authenticate, requirePermission('billing.invoices.manage'), controller.getById);
router.post('/', authenticate, requirePermission('billing.invoices.manage'), validate(validators.generateInvoiceSchema), controller.generate);
router.post('/:id/issue', authenticate, requirePermission('billing.invoices.manage'), controller.issue);
router.post('/:id/payments', authenticate, requirePermission('billing.invoices.manage'), validate(validators.applyPaymentSchema), controller.applyPayment);
router.post('/:id/mark-overdue', authenticate, requirePermission('billing.invoices.manage'), controller.markOverdue);
router.post('/:id/void', authenticate, requirePermission('billing.invoices.manage'), validate(validators.voidInvoiceSchema), controller.voidInvoice);

module.exports = router;