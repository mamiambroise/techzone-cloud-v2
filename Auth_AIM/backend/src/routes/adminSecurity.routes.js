const express = require('express');
const controller = require('../controllers/adminSecurityAudit.controller');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { securityStatusSchema } = require('../validators/adminSecurityAudit.validator');

const router = express.Router();

router.get('/events', authenticate, requirePermission('admin.governance.manage'), controller.listSecurityEvents);
router.get('/events/:id', authenticate, requirePermission('admin.governance.manage'), controller.getSecurityEventById);
router.get('/events/correlation', authenticate, requirePermission('admin.governance.manage'), controller.getCorrelation);
router.get('/events/summary', authenticate, requirePermission('admin.governance.manage'), controller.getSummary);
router.post('/events/:id/status', authenticate, requirePermission('admin.governance.manage'), validate(securityStatusSchema), controller.updateStatus);

module.exports = router;
