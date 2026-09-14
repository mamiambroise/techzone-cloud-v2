const express = require('express');
const controller = require('../controllers/adminActions.controller');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { adminActionRequestSchema, adminActionExecutionSchema } = require('../validators/adminActions.validator');

const router = express.Router();

router.get('/', authenticate, requirePermission('admin.actions.manage'), controller.listActions);
router.get('/:id', authenticate, requirePermission('admin.actions.manage'), controller.getActionById);
router.post('/', authenticate, requirePermission('admin.actions.manage'), validate(adminActionRequestSchema), controller.requestAction);
router.post('/:id/execute', authenticate, requirePermission('admin.actions.manage'), validate(adminActionExecutionSchema), controller.executeAction);

module.exports = router;
