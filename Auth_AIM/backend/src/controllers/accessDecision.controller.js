const accessDecisionService = require('../services/accessDecision.service');
const { success } = require('../utils/response');

async function decide(req, res, next) {
  try {
    const decision = await accessDecisionService.decideAccess({
      userId: req.auth.userId,
      sessionId: req.auth.sessionId,
      ...req.body,
    });
    return success(res, { data: decision });
  } catch (err) {
    return next(err);
  }
}

module.exports = { decide };