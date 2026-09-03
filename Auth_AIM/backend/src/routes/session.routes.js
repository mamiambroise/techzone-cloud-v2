const express = require('express');
const controller = require('../controllers/session.controller');
const { revokeReasonSchema } = require('../validators/session.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me/sessions', authenticate, controller.listMySessions);
router.post('/me/sessions/:id/revoke', authenticate, validate(revokeReasonSchema), controller.revokeMySession);
router.post('/me/sessions/revoke-others', authenticate, controller.revokeMyOtherSessions);

router.get('/devices', authenticate, controller.listMyDevices);
router.get('/devices/:id', authenticate, controller.getDeviceById);
router.post('/devices/:id/trust', authenticate, controller.trustDevice);
router.post('/devices/:id/untrust', authenticate, controller.untrustDevice);
router.post('/devices/:id/block', authenticate, validate(revokeReasonSchema), controller.blockDevice);

router.get('/sessions', authenticate, controller.listAllSessions);
router.get('/sessions/:id', authenticate, controller.getSessionById);
router.post('/sessions/:id/revoke', authenticate, validate(revokeReasonSchema), controller.revokeSessionById);
router.post('/users/:id/sessions/revoke-all', authenticate, validate(revokeReasonSchema), controller.revokeAllForUser);
router.post('/devices/:id/sessions/revoke', authenticate, validate(revokeReasonSchema), controller.revokeByDevice);

module.exports = router;