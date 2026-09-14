const express = require('express');
const controller = require('../controllers/adminGovernance.controller');
const { revokeAssignmentSchema } = require('../validators/adminGovernance.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/roles', authenticate, requirePermission('admin.governance.manage'), controller.listRoles);
router.get('/permissions', authenticate, requirePermission('admin.governance.manage'), controller.listPermissions);
router.get('/assignments', authenticate, requirePermission('admin.governance.manage'), controller.listAssignments);
router.get('/review', authenticate, requirePermission('admin.governance.manage'), controller.getAccessReview);
router.get('/critical-roles', authenticate, requirePermission('admin.governance.manage'), controller.getCriticalRoles);
router.get('/history', authenticate, requirePermission('admin.governance.manage'), controller.getHistory);
router.post('/assignments/:id/revoke', authenticate, requirePermission('admin.governance.manage'), validate(revokeAssignmentSchema), controller.revokeAssignment);

module.exports = router;
