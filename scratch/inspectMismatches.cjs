const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allEvents = await prisma.competitorEvent.findMany({ include: { source: true, competitor: true } });
  let count = 0;
  for (const evt of allEvents) {
    if (evt.source && evt.source.url) {
      const url = evt.source.url.toLowerCase();
      const compName = evt.competitor ? evt.competitor.name.toLowerCase() : '';
      let isMismatch = false;
      if (url.includes('microsoft.com') && !compName.includes('microsoft')) isMismatch = true;
      if (url.includes('aws.amazon.com') && !compName.includes('aws')) isMismatch = true;
      if (url.includes('cloud.google.com') && !compName.includes('google')) isMismatch = true;
      if (url.includes('oracle.com') && !compName.includes('oracle')) isMismatch = true;
      if (url.includes('salesforce.com') && !compName.includes('salesforce')) isMismatch = true;
      if (url.includes('ibm.com') && !compName.includes('ibm')) isMismatch = true;

      if (isMismatch) {
        count++;
        console.log(`Mismatch #${count}: ID=${evt.id} | Title="${evt.title}" | CompName="${evt.competitor ? evt.competitor.name : 'NULL'}" | URL=${evt.source.url}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
