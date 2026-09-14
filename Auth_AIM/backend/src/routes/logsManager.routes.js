const express = require('express');
const controller = require('../controllers/logsManager.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/search', authenticate, controller.search);

module.exports = router;
