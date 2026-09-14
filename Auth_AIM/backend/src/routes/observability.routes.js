const express = require('express');
const controller = require('../controllers/observability.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/dashboard', authenticate, controller.dashboard);
router.get('/health', authenticate, controller.health);
router.get('/component-health', authenticate, controller.componentHealth);
router.get('/metrics', authenticate, controller.metrics);
router.get('/activity', authenticate, controller.activity);
router.get('/attention', authenticate, controller.attention);

module.exports = router;
