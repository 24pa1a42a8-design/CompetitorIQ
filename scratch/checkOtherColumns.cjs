const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUP_ID = '930b351d-9b09-4634-89e0-bb37f0d4c601';

async function checkOtherColumns() {
  console.log(`Checking alternative foreign key columns for Duplicate AWS ID: ${DUP_ID}...`);
  const modelNames = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  
  const possibleCols = ['targetCompetitorId', 'sourceCompetitorId', 'competitorAId', 'competitorBId', 'relatedCompetitorId'];
  
  for (const model of modelNames) {
    for (const col of possibleCols) {
      try {
        if (typeof prisma[model].count === 'function') {
          const count = await prisma[model].count({
            where: { [col]: DUP_ID }
          });
          if (count > 0) {
            console.log(`  Table ${model} (column: ${col}): ${count} references`);
          }
        }
      } catch (err) {
        // Ignore
      }
    }
  }
}

checkOtherColumns().catch(console.error).finally(() => prisma.$disconnect());
