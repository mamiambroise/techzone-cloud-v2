const express = require('express');
const controller = require('../controllers/context.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/resolve', authenticate, controller.resolve);
router.post('/switch-tenant', authenticate, controller.switchTenant);
router.get('/tenants', authenticate, controller.listActiveTenants);
router.post('/invalidate', authenticate, controller.invalidate);

module.exports = router;