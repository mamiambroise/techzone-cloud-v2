const express = require('express');
const controller = require('../controllers/adminUser.controller');
const { changeStatusSchema, revokeSessionsSchema } = require('../validators/adminUser.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('admin.users.manage'), controller.search);
router.get('/:id', authenticate, requirePermission('admin.users.manage'), controller.getProfile);
router.get('/:id/memberships', authenticate, requirePermission('admin.users.manage'), controller.getMemberships);
router.get('/:id/sessions', authenticate, requirePermission('admin.users.manage'), controller.getSessions);
router.post('/:id/status', authenticate, requirePermission('admin.users.manage'), validate(changeStatusSchema), controller.changeStatus);
router.post('/:id/sessions/revoke-all', authenticate, requirePermission('admin.users.manage'), validate(revokeSessionsSchema), controller.revokeSessions);

module.exports = router;