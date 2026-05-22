const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try { schema.parse({ body: req.body, query: req.query, params: req.params }); next(); }
  catch (err) { next(err); }
};

const registerSchema = z.object({ body: z.object({
  email: z.string().email(), name: z.string().min(2).max(100), password: z.string().min(8),
})});

const loginSchema = z.object({ body: z.object({
  email: z.string().email(), password: z.string().min(1),
})});

const createGroupSchema = z.object({ body: z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('INR'),
})});

const createExpenseSchema = z.object({ body: z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  splitType: z.enum(['EQUAL','PERCENTAGE','EXACT']).default('EQUAL'),
  date: z.string().datetime().optional(),
  splits: z.array(z.object({ userId: z.string(), amount: z.number().positive().optional(), percentage: z.number().min(0).max(100).optional() })).optional(),
})});

const createSettlementSchema = z.object({ body: z.object({
  groupId:  z.string(),
  toUserId: z.string(),
  amount:   z.number().positive(),
  note:     z.string().max(200).optional(),
  txHash:   z.string().optional(),
  method:   z.enum(['manual','gpay','ethereum']).default('manual'),
})});

module.exports = { validate, registerSchema, loginSchema, createGroupSchema, createExpenseSchema, createSettlementSchema };
