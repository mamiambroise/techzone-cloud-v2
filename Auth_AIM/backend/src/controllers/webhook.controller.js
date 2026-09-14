const webhookService = require('../services/webhook.service');
const { success } = require('../utils/response');

async function receive(req, res, next) {
  try {
    const provider = req.params.provider;
    const providerEventId = req.body.id || req.body.eventId;
    if (!providerEventId) {
      return res.status(400).json({ success: false, message: 'providerEventId manquant', code: 'WEBHOOK_EVENT_ID_MISSING' });
    }

    const { deduplicated, webhookEvent } = await webhookService.receiveWebhook({
      provider,
      providerEventId,
      rawBody: req.rawBody,
      signatureHeader: req.headers['x-webhook-signature'],
      payload: req.body,
    });

    if (deduplicated) {
      return success(res, { data: { id: webhookEvent.id }, message: 'Événement déjà reçu (dédupliqué)' });
    }

    await webhookService.processWebhookEvent(webhookEvent.id);

    return success(res, { data: { id: webhookEvent.id }, statusCode: 202, message: 'Webhook reçu et traité' });
  } catch (err) {
    return next(err);
  }
}

async function retry(req, res, next) {
  try {
    const results = await webhookService.retryUnprocessedEvents();
    return success(res, { data: results });
  } catch (err) {
    return next(err);
  }
}

module.exports = { receive, retry };