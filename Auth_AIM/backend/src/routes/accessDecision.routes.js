const express = require('express');
const controller = require('../controllers/accessDecision.controller');
const { decideAccessSchema } = require('../validators/accessDecision.validator');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/decide', authenticate, validate(decideAccessSchema), controller.decide);

module.exports = router;