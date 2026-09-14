const express = require('express');
const controller = require('../controllers/alertManager.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('iam.security.manage'), controller.list);
router.post('/', authenticate, requirePermission('iam.security.manage'), controller.create);
router.get('/summary', authenticate, requirePermission('iam.security.manage'), controller.summary);
router.post('/:id/acknowledge', authenticate, requirePermission('iam.security.manage'), controller.acknowledge);
router.post('/:id/resolve', authenticate, requirePermission('iam.security.manage'), controller.resolve);

module.exports = router;
