/**
 * server.js — Main Entry Point
 * Secure Business Payout System
 */

require('dotenv').config();

// Override DNS only in development — local ISPs sometimes block MongoDB SRV queries.
// On Render/cloud, native DNS works perfectly so we skip this.
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const payoutRoutes = require('./routes/payouts');
const beneficiaryRoutes = require('./routes/beneficiaries');
const webhookRoutes = require('./routes/webhooks');

const app = express();

// ─── Connect to MongoDB ─────────────────────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────────────────────
app.use(helmet());

// CORS — only allow configured frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
}));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

// Stricter limiter specifically for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' }
});

// ─── Body Parsers ────────────────────────────────────────────────────
// Raw body for Razorpay webhook signature verification (must be before json parser)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
// JSON for all other routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL Injection Sanitization — must run AFTER body parsers to sanitize req.body
// Strips $ and . from user input to prevent MongoDB operator injection
app.use(mongoSanitize({ replaceWith: '_' }));

// ─── Request Logging Middleware ──────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} — IP: ${req.ip}`);
  next();
});

// ─── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payout System API is running',
    timestamp: new Date().toISOString()
    // Note: environment intentionally omitted to avoid reconnaissance
  });
});

// ─── API Routes ───────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/webhooks', webhookRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Payout System server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
