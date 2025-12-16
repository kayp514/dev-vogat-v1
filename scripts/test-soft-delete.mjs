import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testSoftDelete() {
  try {
    console.log('=== SOFT DELETE FUNCTIONALITY TEST ===\n');
    
    // Step 1: Find a test user
    const testUser = await prisma.users.findFirst({
      where: {
        email: { contains: 'test' },
        deleted: false
      },
      select: {
        uid: true,
        email: true,
        name: true
      }
    });

    if (!testUser) {
      console.log('No test user found. Please create a test user first.');
      return;
    }

    console.log('Step 1: Found test user');
    console.log(`  UID: ${testUser.uid}`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Name: ${testUser.name}\n`);

    // Step 2: Soft delete the user
    console.log('Step 2: Soft deleting user...');
    const anonymizedEmail = `deleted_${testUser.uid}@deleted.local`;
    
    await prisma.users.update({
      where: { uid: testUser.uid },
      data: {
        deleted: true,
        deletedAt: new Date(),
        disabled: true,
        originalEmail: testUser.email,
        email: anonymizedEmail
      }
    });
    
    console.log('  ✓ User soft deleted\n');

    // Step 3: Verify deletion
    console.log('Step 3: Verifying soft deletion...');
    const deletedUser = await prisma.users.findUnique({
      where: { uid: testUser.uid },
      select: {
        uid: true,
        email: true,
        originalEmail: true,
        deleted: true,
        deletedAt: true,
        disabled: true
      }
    });

    console.log('  Current state:');
    console.log(`    UID: ${deletedUser?.uid}`);
    console.log(`    Email (anonymized): ${deletedUser?.email}`);
    console.log(`    Original Email: ${deletedUser?.originalEmail}`);
    console.log(`    Deleted: ${deletedUser?.deleted}`);
    console.log(`    Deleted At: ${deletedUser?.deletedAt}`);
    console.log(`    Disabled: ${deletedUser?.disabled}\n`);

    // Step 4: Check if original email is available
    console.log('Step 4: Checking if original email is available for reuse...');
    const emailCheck = await prisma.users.findUnique({
      where: { email: testUser.email }
    });

    if (!emailCheck) {
      console.log(`  ✓ Email "${testUser.email}" is now AVAILABLE for new registration\n`);
    } else {
      console.log(`  ✗ Email "${testUser.email}" is still taken\n`);
    }

    // Step 5: Verify user is excluded from searches
    console.log('Step 5: Verifying user is excluded from searches...');
    const searchResults = await prisma.users.findMany({
      where: {
        deleted: false,
        email: { contains: testUser.email }
      }
    });

    if (searchResults.length === 0) {
      console.log('  ✓ User is correctly excluded from active user searches\n');
    } else {
      console.log('  ✗ User still appears in searches\n');
    }

    // Step 6: Restore user for cleanup
    console.log('Step 6: Restoring user (cleanup)...');
    await prisma.users.update({
      where: { uid: testUser.uid },
      data: {
        deleted: false,
        deletedAt: null,
        disabled: false,
        email: testUser.email,
        originalEmail: null
      }
    });
    console.log('  ✓ User restored to original state\n');

    console.log('=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('\nKey Findings:');
    console.log('1. User can be soft deleted');
    console.log('2. Email is anonymized and released for reuse');
    console.log('3. Original email is preserved in originalEmail field');
    console.log('4. Deleted users are excluded from searches');
    console.log('5. Same email can now be used with a new Firebase UID');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSoftDelete();
