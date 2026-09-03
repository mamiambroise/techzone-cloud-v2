const express = require('express');
const authRoutes = require('./auth.routes');
const sessionRoutes = require('./session.routes');
const identityRoutes = require('./identity.routes');
const contextRoutes = require('./context.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/context', contextRoutes);
router.use('/', sessionRoutes);
router.use('/', identityRoutes);

module.exports = router;