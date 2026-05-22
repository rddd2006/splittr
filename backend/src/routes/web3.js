const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getLimiters } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/web3AuthController');

const withAuthLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try { const { authLimiter } = await getLimiters(); authLimiter(req, res, next); } catch { next(); }
};

// Public
router.get('/nonce',  withAuthLimiter, ctrl.getNonce);
router.post('/verify', withAuthLimiter, ctrl.verifyWallet);

// Authenticated
router.post('/link',   authenticate, ctrl.linkWallet);
router.delete('/link', authenticate, ctrl.unlinkWallet);

module.exports = router;
