require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const crypto  = require('crypto');

const authRoutes       = require('./routes/auth');
const groupRoutes      = require('./routes/groups');
const expenseRoutes    = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const web3Routes       = require('./routes/web3');
const errorHandler     = require('./middleware/errorHandler');
const { getLimiters }  = require('./middleware/rateLimiter');

const app = express();
app.set('trust proxy', 1);

// Parse CORS origins - handle both single and comma-separated values
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(o => o);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,  // Allow CORS
  crossOriginOpenerPolicy: false,    // Allow CORS
}));

app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 200,  // For legacy browser support
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use((req, _res, next) => { req.requestId = req.headers['x-request-id'] || crypto.randomUUID(); next(); });

if (process.env.NODE_ENV !== 'test') {
  morgan.token('reqid', r => r.requestId);
  morgan.token('user',  r => r.user?.userId || '-');
  app.use(morgan(':method :url :status :response-time ms id=:reqid user=:user'));
}

// Health & readiness — bypass rate limiting
app.get('/api/health', (_req, res) => res.json({ status:'ok', pid:process.pid, ts: new Date().toISOString() }));
app.get('/api/ready', async (_req, res) => {
  try { const p = require('./config/database'); await p.$queryRaw`SELECT 1`; res.json({ status:'ready', db:'ok' }); }
  catch (e) { res.status(503).json({ status:'not ready', db:'error', message: e.message }); }
});

// Global rate limiter (lazy init)
let limitersReady = false;
app.use(async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  if (!limitersReady) {
    try { app._limiters = await getLimiters(); limitersReady = true; } catch { return next(); }
  }
  app._limiters ? app._limiters.globalLimiter(req, res, next) : next();
});

app.use('/api/auth',        authRoutes);
app.use('/api/web3',        web3Routes);
app.use('/api/groups',      groupRoutes);
app.use('/api/expenses',    expenseRoutes);
app.use('/api/settlements', settlementRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
