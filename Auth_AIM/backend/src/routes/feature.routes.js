const express = require('express');
const controller = require('../controllers/feature.controller');
const { createFeatureSchema, updateFeatureSchema } = require('../validators/feature.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, controller.list);
router.get('/:code', authenticate, controller.getByCode);
router.post('/', authenticate, requirePermission('billing.features.manage'), validate(createFeatureSchema), controller.create);
router.patch('/:code', authenticate, requirePermission('billing.features.manage'), validate(updateFeatureSchema), controller.update);
router.post('/:code/deprecate', authenticate, requirePermission('billing.features.manage'), controller.deprecate);

module.exports = router;