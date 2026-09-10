const express = require('express');
const controller = require('../controllers/entitlement.controller');
const { createOverrideSchema, consumeQuotaSchema } = require('../validators/entitlement.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/:subscriptionId', authenticate, controller.list);
router.get('/:subscriptionId/:featureCode', authenticate, controller.getOne);
router.post('/:subscriptionId/:featureCode/override', authenticate, requirePermission('billing.entitlements.manage'), validate(createOverrideSchema), controller.createOverride);
router.delete('/:subscriptionId/:featureCode/override', authenticate, requirePermission('billing.entitlements.manage'), controller.removeOverride);
router.get('/:subscriptionId/:featureCode/quota', authenticate, controller.getQuota);
router.post('/:subscriptionId/:featureCode/quota/consume', authenticate, validate(consumeQuotaSchema), controller.consumeQuota);

module.exports = router;