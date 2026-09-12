const express = require('express');
const controller = require('../controllers/adminSecurityAudit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/search', authenticate, requirePermission('admin.governance.manage'), controller.searchAudit);

module.exports = router;
