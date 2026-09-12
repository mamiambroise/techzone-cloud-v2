const express = require('express');
const controller = require('../controllers/adminTenant.controller');
const { changeTenantStatusSchema } = require('../validators/adminTenant.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('admin.tenants.manage'), controller.search);
router.get('/:id', authenticate, requirePermission('admin.tenants.manage'), controller.getProfile);
router.get('/:id/memberships', authenticate, requirePermission('admin.tenants.manage'), controller.getMemberships);
router.get('/:id/subscriptions', authenticate, requirePermission('admin.tenants.manage'), controller.getSubscriptions);
router.get('/:id/usage', authenticate, requirePermission('admin.tenants.manage'), controller.getUsage);
router.get('/:id/incidents', authenticate, requirePermission('admin.tenants.manage'), controller.getIncidents);
router.post('/:id/status', authenticate, requirePermission('admin.tenants.manage'), validate(changeTenantStatusSchema), controller.changeStatus);

module.exports = router;