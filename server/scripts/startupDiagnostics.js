import { env } from '../config/env.js';
import { getPrismaClient, checkDatabaseHealth, executeWithDbRetry } from '../config/database.js';

async function runDiagnostics() {
  console.log('\n==================================================');
  console.log('       COMPETITORIQ STARTUP DIAGNOSTICS          ');
  console.log('==================================================');

  let envPass = false;
  let prismaPass = false;
  let postgresPass = false;
  let orgPass = false;
  let compPass = false;
  let eventPass = false;

  // 1. Environment check
  if (env.DATABASE_URL && env.PORT) {
    envPass = true;
    console.log('Environment:  PASS (PORT=' + env.PORT + ')');
  } else {
    console.log('Environment:  FAIL (Missing DATABASE_URL or PORT)');
  }

  // 2. Prisma initialization
  const prisma = getPrismaClient();
  if (prisma) {
    prismaPass = true;
    console.log('Prisma:       PASS (Singleton Client Initialized)');
  } else {
    console.log('Prisma:       FAIL (Could not get Prisma singleton)');
  }

  // 3. PostgreSQL connectivity (SELECT 1)
  if (prismaPass) {
    const health = await checkDatabaseHealth();
    if (health === 'ok') {
      postgresPass = true;
      console.log('PostgreSQL:   PASS (SELECT 1 succeeded)');
    } else {
      console.log('PostgreSQL:   FAIL (Database connection check returned ' + health + ')');
    }
  }

  // 4. Entity queries
  if (postgresPass) {
    try {
      const orgs = await executeWithDbRetry(() => prisma.organization.findMany({ take: 1 }));
      orgPass = Array.isArray(orgs);
      console.log(`Organization: ${orgPass ? 'PASS' : 'FAIL'} (${orgs.length} orgs inspected)`);
    } catch (err) {
      console.log('Organization: FAIL (' + err.message + ')');
    }

    try {
      const comps = await executeWithDbRetry(() => prisma.competitor.findMany({ take: 5 }));
      compPass = Array.isArray(comps);
      console.log(`Competitors:  ${compPass ? 'PASS' : 'FAIL'} (${comps.length} competitors found)`);
    } catch (err) {
      console.log('Competitors:  FAIL (' + err.message + ')');
    }

    try {
      const events = await executeWithDbRetry(() => prisma.competitorEvent.findMany({ take: 5 }));
      eventPass = Array.isArray(events);
      console.log(`Events:       ${eventPass ? 'PASS' : 'FAIL'} (${events.length} events found)`);
    } catch (err) {
      console.log('Events:       FAIL (' + err.message + ')');
    }
  }

  const allPass = envPass && prismaPass && postgresPass && orgPass && compPass && eventPass;
  console.log('--------------------------------------------------');
  console.log(`OVERALL DIAGNOSTIC RESULT: ${allPass ? 'ALL PASS ✓' : 'DEGRADED ✖'}`);
  console.log('==================================================\n');

  if (!allPass) {
    process.exit(1);
  }
}

runDiagnostics().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
