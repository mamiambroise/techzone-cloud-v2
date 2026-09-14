const express = require('express');
const controller = require('../controllers/plan.controller');
const validators = require('../validators/plan.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, requirePermission('billing.plans.manage'), validate(validators.createPlanSchema), controller.create);
router.patch('/:id', authenticate, requirePermission('billing.plans.manage'), validate(validators.updatePlanSchema), controller.update);
router.post('/:id/activate', authenticate, requirePermission('billing.plans.manage'), controller.activate);
router.post('/:id/deprecate', authenticate, requirePermission('billing.plans.manage'), controller.deprecate);
router.post('/:id/archive', authenticate, requirePermission('billing.plans.manage'), controller.archive);
router.post('/:id/new-version', authenticate, requirePermission('billing.plans.manage'), validate(validators.newVersionSchema), controller.newVersion);
router.post('/:id/entitlements', authenticate, requirePermission('billing.plans.manage'), validate(validators.addEntitlementSchema), controller.addEntitlement);
router.delete('/:id/entitlements/:entitlementId', authenticate, requirePermission('billing.plans.manage'), controller.removeEntitlement);

module.exports = router;