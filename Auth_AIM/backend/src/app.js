const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const openapi = require('./config/openapi');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
app.use(require('cookie-parser')());
app.use((req, res, next) => {
  const traceId = require('node:crypto').randomUUID();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ success: false, code: 'CROSS_SITE_REQUEST', message: 'Cross-site request refused', traceId });
  }
  next();
});

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));


app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
// Liveness is separate from readiness: HTTP alone does not prove SQL access.
app.get('/ready', async (req, res) => {
  try {
    await require('./config/database').prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ready', database: 'reachable' });
  } catch (err) {
    const failure = require('./utils/database-error').databaseError(err);
    return res.status(503).json({
      status: 'not_ready', database: 'unavailable',
      code: failure?.code || 'DATABASE_UNAVAILABLE', traceId: req.traceId,
    });
  }
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api-docs.json', (req, res) => res.json(openapi));

app.use('/api/iam', routes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route introuvable', code: 'NOT_FOUND' });
});

app.use(errorMiddleware);

module.exports = app;
