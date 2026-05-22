const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

async function main() {
  console.log('🌱 Seeding database...');
  const pw = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({ where: { email:'alice@example.com' }, update:{}, create:{ email:'alice@example.com', name:'Alice Kumar', passwordHash:pw } });
  const bob   = await prisma.user.upsert({ where: { email:'bob@example.com'   }, update:{}, create:{ email:'bob@example.com',   name:'Bob Singh',  passwordHash:pw } });
  const carol = await prisma.user.upsert({ where: { email:'carol@example.com' }, update:{}, create:{ email:'carol@example.com', name:'Carol Sharma',passwordHash:pw } });

  const group = await prisma.group.create({
    data: {
      name:'Goa Trip 2025', description:'Beach vacation expenses', currency:'INR',
      joinCode: genCode(),
      members: { create: [{ userId:alice.id, role:'ADMIN' }, { userId:bob.id }, { userId:carol.id }] },
    },
  });

  await prisma.expense.create({ data: { title:'Hotel Stay',  amount:6000, splitType:'EQUAL', paidById:alice.id, groupId:group.id, splits:{ create:[{ userId:alice.id, amount:2000 },{ userId:bob.id, amount:2000 },{ userId:carol.id, amount:2000 }] } } });
  await prisma.expense.create({ data: { title:'Beach Dinner',amount:3000, splitType:'EQUAL', paidById:bob.id,   groupId:group.id, splits:{ create:[{ userId:alice.id, amount:1000 },{ userId:bob.id, amount:1000 },{ userId:carol.id, amount:1000 }] } } });

  console.log(`✅ Seed done! Group join code: ${group.joinCode}`);
  console.log('   alice@example.com / bob@example.com / carol@example.com  →  password123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
