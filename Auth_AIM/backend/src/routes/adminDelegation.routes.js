const express = require('express');
const controller = require('../controllers/adminDelegation.controller');
const { createDelegationSchema, revokeDelegationSchema } = require('../validators/adminDelegation.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authenticate, requirePermission('admin.delegations.manage'), controller.listDelegations);
router.get('/effective', authenticate, requirePermission('admin.delegations.manage'), controller.getEffectiveDelegations);
router.post('/', authenticate, requirePermission('admin.delegations.manage'), validate(createDelegationSchema), controller.createDelegation);
router.post('/:id/revoke', authenticate, requirePermission('admin.delegations.manage'), validate(revokeDelegationSchema), controller.revokeDelegation);

module.exports = router;
