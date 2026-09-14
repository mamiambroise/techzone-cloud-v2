const express = require('express');
const controller = require('../controllers/session.controller');
const { revokeReasonSchema, validateTokenSchema } = require('../validators/session.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/me/sessions', authenticate, controller.listMySessions);
router.post('/me/sessions/:id/revoke', authenticate, validate(revokeReasonSchema), controller.revokeMySession);
router.post('/me/sessions/revoke-others', authenticate, controller.revokeMyOtherSessions);

router.get('/devices', authenticate, controller.listMyDevices);
router.get('/devices/:id', authenticate, controller.getDeviceById);
router.post('/devices/:id/trust', authenticate, controller.trustDevice);
router.post('/devices/:id/untrust', authenticate, controller.untrustDevice);
router.post('/devices/:id/block', authenticate, validate(revokeReasonSchema), controller.blockDevice);

router.get('/sessions', authenticate, requirePermission('iam.sessions.manage'), controller.listAllSessions);
router.get('/sessions/:id', authenticate, requirePermission('iam.sessions.manage'), controller.getSessionById);
router.post('/sessions/:id/revoke', authenticate, requirePermission('iam.sessions.manage'), validate(revokeReasonSchema), controller.revokeSessionById);
router.post('/users/:id/sessions/revoke-all', authenticate, requirePermission('iam.sessions.manage'), validate(revokeReasonSchema), controller.revokeAllForUser);
router.post('/devices/:id/sessions/revoke', authenticate, requirePermission('iam.sessions.manage'), validate(revokeReasonSchema), controller.revokeByDevice);
router.post('/sessions/:id/risk/recalculate', authenticate, requirePermission('iam.sessions.manage'), controller.recalculateRisk);
router.post('/sessions/validate', validate(validateTokenSchema), controller.validateSession);

module.exports = router;