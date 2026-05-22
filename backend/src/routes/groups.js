const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { validate, createGroupSchema, createExpenseSchema } = require('../middleware/validate');
const groupController = require('../controllers/groupController');
const expenseController = require('../controllers/expenseController');
const { getLimiters } = require('../middleware/rateLimiter');

const withApi      = async (req, res, next) => { if (process.env.NODE_ENV==='test') return next(); try { const {apiLimiter} = await getLimiters(); apiLimiter(req,res,next); } catch{next();} };
const withExpense  = async (req, res, next) => { if (process.env.NODE_ENV==='test') return next(); try { const {expenseLimiter} = await getLimiters(); expenseLimiter(req,res,next); } catch{next();} };

router.use(authenticate);
router.use(withApi);

// Join by code (must be before /:id routes)
router.post('/join', groupController.joinGroup);

router.get('/',    groupController.listGroups);
router.post('/',   validate(createGroupSchema), groupController.createGroup);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

router.post('/:id/regenerate-code', groupController.regenerateJoinCode);

router.get('/:id/members',              groupController.listMembers);
router.post('/:id/members',             groupController.addMember);
router.delete('/:id/members/:memberId', groupController.removeMember);

router.get('/:id/balances',        groupController.getBalances);
router.get('/:id/settlement-plan', groupController.getSettlementPlan);

router.get('/:id/expenses',  expenseController.listExpenses);
router.post('/:id/expenses', withExpense, validate(createExpenseSchema), expenseController.createExpense);

module.exports = router;
