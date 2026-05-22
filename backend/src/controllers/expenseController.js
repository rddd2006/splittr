const prisma = require('../config/database');
const { calculateEqualSplit, calculatePercentageSplit } = require('../services/splitService');

const listExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: {
          groupId: req.params.id,
          paidBy: { members: { some: { userId: req.user.userId } } },
        },
        include: {
          payer: { select: { id: true, name: true, avatar: true } },
          splits: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.expense.count({ where: { groupId: req.params.id } }),
    ]);

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

const createExpense = async (req, res, next) => {
  try {
    const { title, description, amount, splitType, date, splits: rawSplits } = req.body;
    const groupId = req.params.id;

    // Verify user is a member
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.user.userId },
      include: { group: { include: { members: { select: { userId: true } } } } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a group member' });

    const memberIds = membership.group.members.map((m) => m.userId);
    let splits;

    if (splitType === 'EQUAL') {
      splits = calculateEqualSplit(amount, memberIds);
    } else if (splitType === 'PERCENTAGE') {
      splits = calculatePercentageSplit(amount, rawSplits);
    } else {
      splits = rawSplits;
    }

    const expense = await prisma.expense.create({
      data: {
        title, description, amount, splitType,
        date: date ? new Date(date) : new Date(),
        paidById: req.user.userId,
        groupId,
        splits: { create: splits },
      },
      include: {
        payer: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json(expense);
  } catch (err) { next(err); }
};

const getExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        paidBy: { members: { some: { userId: req.user.userId } } },
      },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
};

const updateExpense = async (req, res, next) => {
  try {
    const { title, description, amount, splitType, date } = req.body;
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, paidById: req.user.userId },
    });
    if (!expense) return res.status(403).json({ error: 'You can only edit your own expenses' });

    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: { title, description, amount, splitType, date: date ? new Date(date) : undefined },
      include: {
        payer: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, paidById: req.user.userId },
    });
    if (!expense) return res.status(403).json({ error: 'You can only delete your own expenses' });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
};

module.exports = { listExpenses, createExpense, getExpense, updateExpense, deleteExpense };
