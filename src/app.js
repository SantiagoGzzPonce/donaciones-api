'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const userRoutes = require('./routes/users');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});
if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.env === 'test',
  message: { error: 'Demasiados intentos, intenta más tarde' }
});

app.use(['/api', '/health'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/users', userRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
