const prisma = require('../config/database');
const { calculateBalances, minimizeTransactions } = require('../services/settlementService');
const crypto = require('crypto');

/** Generate a random 8-char alphanumeric invite code (no O/0/I/l confusion) */
const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[crypto.randomInt(chars.length)]).join('');
};

const uniqueJoinCode = async () => {
  let code, exists;
  do {
    code = generateJoinCode();
    exists = await prisma.group.findUnique({ where: { joinCode: code } });
  } while (exists);
  return code;
};

const memberSelect = { include: { user: { select: { id: true, name: true, email: true, walletAddress: true, avatar: true } } } };

const listGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user.userId } } },
      include: { members: memberSelect, _count: { select: { expenses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (err) { next(err); }
};

const createGroup = async (req, res, next) => {
  try {
    const { name, description, currency } = req.body;
    const joinCode = await uniqueJoinCode();
    const group = await prisma.group.create({
      data: {
        name, description, currency, joinCode,
        members: { create: { userId: req.user.userId, role: 'ADMIN' } },
      },
      include: { members: memberSelect },
    });
    res.status(201).json(group);
  } catch (err) { next(err); }
};

const getGroup = async (req, res, next) => {
  try {
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, members: { some: { userId: req.user.userId } } },
      include: {
        members: memberSelect,
        expenses: {
          include: { payer: { select: { id: true, name: true } }, splits: { include: { user: { select: { id: true, name: true } } } } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        _count: { select: { expenses: true, settlements: true } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) { next(err); }
};

const updateGroup = async (req, res, next) => {
  try {
    const admin = await prisma.groupMember.findFirst({ where: { groupId: req.params.id, userId: req.user.userId, role: 'ADMIN' } });
    if (!admin) return res.status(403).json({ error: 'Only admins can update the group' });
    const { name, description, currency } = req.body;
    const group = await prisma.group.update({ where: { id: req.params.id }, data: { name, description, currency } });
    res.json(group);
  } catch (err) { next(err); }
};

const deleteGroup = async (req, res, next) => {
  try {
    const admin = await prisma.groupMember.findFirst({ where: { groupId: req.params.id, userId: req.user.userId, role: 'ADMIN' } });
    if (!admin) return res.status(403).json({ error: 'Only admins can delete the group' });
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ message: 'Group deleted' });
  } catch (err) { next(err); }
};

/** POST /api/groups/join  — join by invite code */
const joinGroup = async (req, res, next) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'joinCode is required' });

    const group = await prisma.group.findUnique({ where: { joinCode: joinCode.trim().toUpperCase() } });
    if (!group) return res.status(404).json({ error: 'Invalid invite code — no matching group' });

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.userId, groupId: group.id } },
    });
    if (existing) return res.status(409).json({ error: 'You are already a member of this group' });

    const member = await prisma.groupMember.create({
      data: { userId: req.user.userId, groupId: group.id, role: 'MEMBER' },
      include: { group: { include: { members: memberSelect } } },
    });
    res.status(201).json(member.group);
  } catch (err) { next(err); }
};

/** POST /api/groups/:id/regenerate-code — admin rotates the join code */
const regenerateJoinCode = async (req, res, next) => {
  try {
    const admin = await prisma.groupMember.findFirst({ where: { groupId: req.params.id, userId: req.user.userId, role: 'ADMIN' } });
    if (!admin) return res.status(403).json({ error: 'Only admins can regenerate the invite code' });
    const joinCode = await uniqueJoinCode();
    const group = await prisma.group.update({ where: { id: req.params.id }, data: { joinCode }, select: { joinCode: true } });
    res.json(group);
  } catch (err) { next(err); }
};

const listMembers = async (req, res, next) => {
  try {
    const members = await prisma.groupMember.findMany({ where: { groupId: req.params.id }, ...memberSelect });
    res.json(members);
  } catch (err) { next(err); }
};

const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = await prisma.groupMember.findUnique({ where: { userId_groupId: { userId: user.id, groupId: req.params.id } } });
    if (existing) return res.status(409).json({ error: 'User is already a member' });
    const member = await prisma.groupMember.create({ data: { userId: user.id, groupId: req.params.id }, ...memberSelect });
    res.status(201).json(member);
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    await prisma.groupMember.deleteMany({ where: { userId: req.params.memberId, groupId: req.params.id } });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

const getBalances = async (req, res, next) => {
  try {
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, members: { some: { userId: req.user.userId } } },
      include: { members: { include: { user: { select: { id: true, name: true } } } }, expenses: { include: { splits: true } }, settlements: true },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(calculateBalances(group));
  } catch (err) { next(err); }
};

const getSettlementPlan = async (req, res, next) => {
  try {
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, members: { some: { userId: req.user.userId } } },
      include: { members: { include: { user: { select: { id: true, name: true, walletAddress: true } } } }, expenses: { include: { splits: true } }, settlements: true },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const balances = calculateBalances(group);
    const plan = minimizeTransactions(balances);

    // Enrich each transaction with wallet address for ETH payments
    const memberMap = {};
    group.members.forEach(m => { memberMap[m.user.id] = m.user; });
    const enriched = plan.map(t => ({
      ...t,
      from: { ...t.from, walletAddress: memberMap[t.from.userId]?.walletAddress || null },
      to:   { ...t.to,   walletAddress: memberMap[t.to.userId]?.walletAddress   || null },
    }));
    res.json(enriched);
  } catch (err) { next(err); }
};

module.exports = {
  listGroups, createGroup, getGroup, updateGroup, deleteGroup,
  joinGroup, regenerateJoinCode,
  listMembers, addMember, removeMember,
  getBalances, getSettlementPlan,
};
