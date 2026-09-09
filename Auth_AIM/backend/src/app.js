const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const openapi = require('./config/openapi');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api-docs.json', (req, res) => res.json(openapi));

app.use('/api/iam', routes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route introuvable', code: 'NOT_FOUND' });
});

app.use(errorMiddleware);

module.exports = app;