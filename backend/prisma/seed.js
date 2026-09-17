import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const plans = [
  { key: 'start', name: 'بداية', monthlyPrice: 19900, userLimit: 1, contactLimit: 1000 },
  { key: 'growth', name: 'نمو', monthlyPrice: 49900, userLimit: 5, contactLimit: 10000 },
  { key: 'business', name: 'أعمال', monthlyPrice: 99900, userLimit: 15, contactLimit: 50000 }
];

for (const plan of plans) await prisma.plan.upsert({ where: { key: plan.key }, update: plan, create: plan });
await prisma.$disconnect();
