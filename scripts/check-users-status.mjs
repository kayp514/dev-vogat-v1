import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { email: 'kamugishapacifique@live.com' },
        { email: 'pa.ka12@outlook.com' },
        { email: 'deleted_lOGpcVncIofIAAot5gC4jD7PTo53@deleted.local' },
        { email: 'deleted_EruCtmeuOrWQmC55lq13tYUYovN2@deleted.local' }
      ]
    },
    select: {
      uid: true,
      email: true,
      originalEmail: true,
      deleted: true,
      deletedAt: true
    }
  });

  console.log('Current state of users:');
  users.forEach(u => {
    console.log(`\nEmail: ${u.email}`);
    console.log(`Original Email: ${u.originalEmail}`);
    console.log(`Deleted: ${u.deleted}`);
    console.log(`DeletedAt: ${u.deletedAt}`);
  });

  await prisma.$disconnect();
}

checkUsers();
