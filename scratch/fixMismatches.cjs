const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allEvents = await prisma.competitorEvent.findMany({
    include: { source: true, competitor: true }
  });

  const competitors = await prisma.competitor.findMany();
  const getCompByName = name => competitors.find(c => c.name.toLowerCase().includes(name.toLowerCase()));

  for (const evt of allEvents) {
    if (evt.source && evt.source.url) {
      const url = evt.source.url.toLowerCase();
      const compName = evt.competitor.name.toLowerCase();

      let targetComp = null;
      if (url.includes('microsoft.com') && !compName.includes('microsoft')) targetComp = getCompByName('Microsoft');
      if (url.includes('aws.amazon.com') && !compName.includes('aws')) targetComp = getCompByName('AWS');
      if (url.includes('cloud.google.com') && !compName.includes('google')) targetComp = getCompByName('Google Cloud');
      if (url.includes('oracle.com') && !compName.includes('oracle')) targetComp = getCompByName('Oracle');
      if (url.includes('salesforce.com') && !compName.includes('salesforce')) targetComp = getCompByName('Salesforce');
      if (url.includes('ibm.com') && !compName.includes('ibm')) targetComp = getCompByName('IBM');

      if (targetComp) {
        console.log(`Fixing Mismatch: ID ${evt.id} | Title: "${evt.title}" | URL: ${evt.source.url} | Old Comp: "${evt.competitor.name}" -> New Comp: "${targetComp.name}"`);
        await prisma.competitorEvent.update({
          where: { id: evt.id },
          data: { competitorId: targetComp.id }
        });
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
