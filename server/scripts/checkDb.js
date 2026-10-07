import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'MISSING');

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as health`;
    console.log('PostgreSQL Connection Test: SUCCESS', res);

    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('Database Tables:', tables.map(t => t.table_name));

    const orgCount = await prisma.organization.count();
    console.log('Organization count:', orgCount);
  } catch (err) {
    console.error('PostgreSQL Connection Test: FAILED');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
