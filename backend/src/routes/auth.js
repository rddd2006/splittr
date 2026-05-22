const router = require('express').Router();
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { getLimiters } = require('../middleware/rateLimiter');

// Apply auth-specific rate limiters lazily
const withAuthLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try {
    const { authLimiter } = await getLimiters();
    authLimiter(req, res, next);
  } catch { next(); }
};

const withStrictAuthLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try {
    const { strictAuthLimiter } = await getLimiters();
    strictAuthLimiter(req, res, next);
  } catch { next(); }
};

router.post('/register', withAuthLimiter, validate(registerSchema), authController.register);
router.post('/login',    withAuthLimiter, withStrictAuthLimiter, validate(loginSchema), authController.login);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authenticate, authController.logout);
router.get('/me',        authenticate, authController.me);

module.exports = router;
