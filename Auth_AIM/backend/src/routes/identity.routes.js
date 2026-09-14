const express = require('express');
const controller = require('../controllers/identity.controller');
const { updateUserSchema, statusActionSchema } = require('../validators/identity.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/me', authenticate, controller.getMe);

router.get('/users', authenticate, requirePermission('iam.users.manage'), controller.listUsers);
router.get('/users/:id', authenticate, requirePermission('iam.users.manage'), controller.getUserById);
router.patch('/users/:id', authenticate, requirePermission('iam.users.manage'), validate(updateUserSchema), controller.updateUser);
router.post('/users/:id/activate', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.activate);
router.post('/users/:id/suspend', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.suspend);
router.post('/users/:id/lock', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.lock);
router.post('/users/:id/unlock', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.unlock);
router.post('/users/:id/disable', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.disable);
router.post('/users/:id/archive', authenticate, requirePermission('iam.users.manage'), validate(statusActionSchema), controller.archive);

module.exports = router;