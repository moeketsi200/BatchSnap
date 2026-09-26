import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batch.findMany({ include: { units: true } });
  console.log(JSON.stringify(batches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
