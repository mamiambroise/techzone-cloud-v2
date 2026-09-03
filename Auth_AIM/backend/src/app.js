const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/iam', routes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route introuvable', code: 'NOT_FOUND' });
});

app.use(errorMiddleware);

module.exports = app;