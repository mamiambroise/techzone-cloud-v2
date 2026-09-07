const express = require('express');
const controller = require('../controllers/mfa.controller');
const validators = require('../validators/mfa.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/enroll', authenticate, validate(validators.enrollSchema), controller.enroll);
router.post('/verify', authenticate, validate(validators.verifyEnrollmentSchema), controller.verifyEnrollment);
router.get('/factors', authenticate, controller.listMethods);
router.post('/factors/:id/revoke', authenticate, controller.revokeMethod);
router.post('/recovery-codes/regenerate', authenticate, controller.regenerateRecoveryCodes);

module.exports = router;
