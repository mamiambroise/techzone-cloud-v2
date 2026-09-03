const express = require('express');
const controller = require('../controllers/identity.controller');
const { updateUserSchema, statusActionSchema } = require('../validators/identity.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', authenticate, controller.getMe);

router.get('/users', authenticate, controller.listUsers);
router.get('/users/:id', authenticate, controller.getUserById);
router.patch('/users/:id', authenticate, validate(updateUserSchema), controller.updateUser);
router.post('/users/:id/activate', authenticate, validate(statusActionSchema), controller.activate);
router.post('/users/:id/suspend', authenticate, validate(statusActionSchema), controller.suspend);
router.post('/users/:id/lock', authenticate, validate(statusActionSchema), controller.lock);
router.post('/users/:id/unlock', authenticate, validate(statusActionSchema), controller.unlock);
router.post('/users/:id/disable', authenticate, validate(statusActionSchema), controller.disable);
router.post('/users/:id/archive', authenticate, validate(statusActionSchema), controller.archive);

module.exports = router;