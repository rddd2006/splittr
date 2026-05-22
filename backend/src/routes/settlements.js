const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { validate, createSettlementSchema } = require('../middleware/validate');
const settlementController = require('../controllers/settlementController');
const { getLimiters } = require('../middleware/rateLimiter');

const withSettlementLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try { const { settlementLimiter } = await getLimiters(); settlementLimiter(req, res, next); } catch { next(); }
};
const withApiLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try { const { apiLimiter } = await getLimiters(); apiLimiter(req, res, next); } catch { next(); }
};

router.use(authenticate);

router.post('/',             withSettlementLimiter, validate(createSettlementSchema), settlementController.createSettlement);
router.get('/group/:groupId', withApiLimiter, settlementController.listSettlements);

module.exports = router;
