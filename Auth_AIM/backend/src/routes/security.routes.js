const express = require('express');
const controller = require('../controllers/security.controller');
const { createSecurityEventSchema, resolveSchema } = require('../validators/security.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/alerts', authenticate, requirePermission('iam.security.manage'), controller.listAlerts);
router.get('/events', authenticate, requirePermission('iam.security.manage'), controller.listEvents);
router.post('/events', authenticate, requirePermission('iam.security.manage'), validate(createSecurityEventSchema), controller.createEvent);
router.get('/events/correlation', authenticate, requirePermission('iam.security.manage'), controller.getCorrelation);
router.get('/events/summary', authenticate, requirePermission('iam.security.manage'), controller.getSummary);
router.post('/alerts/:id/acknowledge', authenticate, requirePermission('iam.security.manage'), controller.acknowledge);
router.post('/alerts/:id/resolve', authenticate, requirePermission('iam.security.manage'), validate(resolveSchema), controller.resolve);

module.exports = router;