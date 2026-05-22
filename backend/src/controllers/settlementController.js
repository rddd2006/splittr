const prisma = require('../config/database');

const createSettlement = async (req, res, next) => {
  try {
    const { groupId, toUserId, amount, note, txHash, method = 'manual' } = req.body;
    const membership = await prisma.groupMember.findFirst({ where: { groupId, userId: req.user.userId } });
    if (!membership) return res.status(403).json({ error: 'Not a group member' });

    const settlement = await prisma.settlement.create({
      data: { fromUserId: req.user.userId, toUserId, groupId, amount, note, txHash, method },
      include: { from: { select:{id:true,name:true} }, to: { select:{id:true,name:true} } },
    });
    res.status(201).json(settlement);
  } catch (err) { next(err); }
};

const listSettlements = async (req, res, next) => {
  try {
    const settlements = await prisma.settlement.findMany({
      where: { groupId: req.params.groupId },
      include: {
        from: { select:{id:true,name:true} },
        to:   { select:{id:true,name:true} },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(settlements);
  } catch (err) { next(err); }
};

module.exports = { createSettlement, listSettlements };
