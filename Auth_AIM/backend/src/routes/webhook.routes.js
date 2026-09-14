const express = require('express');
const controller = require('../controllers/webhook.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.post('/:provider', controller.receive);
router.post('/retry', authenticate, requirePermission('billing.webhooks.manage'), controller.retry);

module.exports = router;