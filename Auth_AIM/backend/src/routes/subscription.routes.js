const express = require('express');
const controller = require('../controllers/subscription.controller');
const validators = require('../validators/subscription.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('billing.subscriptions.manage'), controller.list);
router.get('/:id', authenticate, requirePermission('billing.subscriptions.manage'), controller.getById);
router.post('/', authenticate, requirePermission('billing.subscriptions.manage'), validate(validators.subscribeSchema), controller.subscribe);
router.post('/:id/activate', authenticate, requirePermission('billing.subscriptions.manage'), controller.activate);
router.post('/:id/change-plan', authenticate, requirePermission('billing.subscriptions.manage'), validate(validators.changePlanSchema), controller.changePlan);
router.post('/:id/suspend', authenticate, requirePermission('billing.subscriptions.manage'), validate(validators.suspendSchema), controller.suspend);
router.post('/:id/resume', authenticate, requirePermission('billing.subscriptions.manage'), controller.resume);
router.post('/:id/cancel', authenticate, requirePermission('billing.subscriptions.manage'), validate(validators.cancelSchema), controller.cancel);
router.post('/:id/renew', authenticate, requirePermission('billing.subscriptions.manage'), controller.renew);

module.exports = router;