const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
// const routes = require('./routes');
// const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ credentials: true, origin: env.corsOrigin }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// app.use('/api', routes);

// app.use(errorMiddleware);

module.exports = app;