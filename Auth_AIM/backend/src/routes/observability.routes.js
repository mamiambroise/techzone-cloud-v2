const express = require('express');
const controller = require('../controllers/observability.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
// These endpoints contain static demonstrations, not measured telemetry.
router.use(authenticate, (req, res) => res.status(503).json({
  success: false, code: 'OBSERVABILITY_NOT_CONNECTED',
  message: 'Real telemetry is not connected; demonstration data is disabled.',
  traceId: req.traceId,
}));

router.get('/dashboard', authenticate, controller.dashboard);
router.get('/health', authenticate, controller.health);
router.get('/component-health', authenticate, controller.componentHealth);
router.get('/metrics', authenticate, controller.metrics);
router.get('/activity', authenticate, controller.activity);
router.get('/attention', authenticate, controller.attention);

module.exports = router;
