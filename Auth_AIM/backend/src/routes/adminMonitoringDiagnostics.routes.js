const express = require('express');
const controller = require('../controllers/adminMonitoringDiagnostics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/health', authenticate, requirePermission('admin.governance.manage'), controller.getGlobalHealth);
router.get('/services/health', authenticate, requirePermission('admin.governance.manage'), controller.getServiceHealth);
router.get('/errors/critical', authenticate, requirePermission('admin.governance.manage'), controller.getCriticalErrors);
router.get('/latency', authenticate, requirePermission('admin.governance.manage'), controller.getLatencyOverview);
router.get('/dependencies/degraded', authenticate, requirePermission('admin.governance.manage'), controller.getDegradedDependencies);
router.get('/incidents/recent', authenticate, requirePermission('admin.governance.manage'), controller.getRecentIncidents);
router.get('/diagnostics/trace/:traceId', authenticate, requirePermission('admin.governance.manage'), controller.getTraceDiagnostics);
router.get('/diagnostics/trace', authenticate, requirePermission('admin.governance.manage'), controller.getTraceDiagnostics);

module.exports = router;
