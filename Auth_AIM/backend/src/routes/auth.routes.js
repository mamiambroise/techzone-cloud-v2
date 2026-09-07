const express = require('express');
const controller = require('../controllers/auth.controller');
const validators = require('../validators/auth.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', validate(validators.registerSchema), controller.register);
router.post('/login', validate(validators.loginSchema), controller.login);
router.post('/login/mfa', validate(validators.mfaVerifySchema), controller.verifyMfa);
router.post('/refresh', validate(validators.refreshSchema), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.post('/logout-all', authenticate, validate(validators.logoutAllSchema), controller.logoutAll);
router.post('/change-password', authenticate, validate(validators.changePasswordSchema), controller.changePassword);
router.post('/step-up', authenticate, validate(validators.stepUpSchema), controller.stepUp);
router.post('/step-up/verify', authenticate, validate(validators.stepUpVerifySchema), controller.stepUpVerify);
module.exports = router;