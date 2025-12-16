import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function directDatabaseCheck() {
  console.log('=== DIRECT DATABASE QUERY ===\n');
  
  // Check using raw SQL
  const rawResult = await prisma.$queryRaw`
    SELECT uid, email, "originalEmail", deleted, "deletedAt", disabled
    FROM users 
    WHERE uid IN ('lOGpcVncIofIAAot5gC4jD7PTo53', 'EruCtmeuOrWQmC55lq13tYUYovN2')
    OR email IN ('kamugishapacifique@live.com', 'pa.ka12@outlook.com')
    OR "originalEmail" IN ('kamugishapacifique@live.com', 'pa.ka12@outlook.com')
  `;
  
  console.log('Raw SQL query result:');
  console.log(JSON.stringify(rawResult, null, 2));
  
  await prisma.$disconnect();
}

directDatabaseCheck().catch(console.error);
