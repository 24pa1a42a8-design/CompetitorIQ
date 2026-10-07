const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUP_ID = '930b351d-9b09-4634-89e0-bb37f0d4c601';
const CANONICAL_ID = 'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10';

async function checkAllTables() {
  console.log(`Checking all references for Duplicate AWS ID: ${DUP_ID}...`);
  
  // Inspect Prisma client keys for models
  const modelNames = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  
  for (const model of modelNames) {
    try {
      if (typeof prisma[model].count === 'function') {
        const count = await prisma[model].count({
          where: { competitorId: DUP_ID }
        });
        if (count > 0) {
          console.log(`  Table ${model}: ${count} references`);
        }
      }
    } catch (err) {
      // Model might not have competitorId column, ignore error
    }
  }
}

checkAllTables().catch(console.error).finally(() => prisma.$disconnect());
