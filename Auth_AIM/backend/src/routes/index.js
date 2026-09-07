const express = require('express');
const authRoutes = require('./auth.routes');
const sessionRoutes = require('./session.routes');
const identityRoutes = require('./identity.routes');
const contextRoutes = require('./context.routes');
const mfaRoutes = require('./mfa.routes');
const securityRoutes = require('./security.routes');
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/context', contextRoutes);
router.use('/', sessionRoutes);
router.use('/', identityRoutes);
router.use('/mfa', mfaRoutes);
router.use('/security', securityRoutes);
module.exports = router;
