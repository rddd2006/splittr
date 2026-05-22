const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { validate, createExpenseSchema } = require('../middleware/validate');
const expenseController = require('../controllers/expenseController');

router.use(authenticate);

router.get('/:id', expenseController.getExpense);
router.put('/:id', validate(createExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
