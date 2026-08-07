require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

const distDir = path.join(__dirname, '../../frontend/dist/frontend/browser');
if (process.env.NODE_ENV === 'production' || process.env.SERVE_SPA === 'true') {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
