/**
 * Soft Delete Orphaned Users Script
 * 
 * Purpose: Anonymize users who exist in PostgreSQL with old Firebase UIDs
 *          but have recreated accounts in Firebase with new UIDs.
 * 
 * This releases their emails for the new Firebase accounts to sync properly.
 * 
 * Usage: node scripts/soft-delete-orphaned-users.mjs
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// List of emails for users who have recreated accounts in Firebase
const ORPHANED_USER_EMAILS = [
  'kamugishapacifique@live.com',
  'pa.ka12@outlook.com'
];

async function softDeleteOrphanedUsers() {
  console.log('=== SOFT DELETE ORPHANED USERS ===\n');
  console.log(`Processing ${ORPHANED_USER_EMAILS.length} user(s)...\n`);

  const results = {
    processed: 0,
    deleted: 0,
    alreadyDeleted: 0,
    notFound: 0,
    errors: 0
  };

  for (const email of ORPHANED_USER_EMAILS) {
    try {
      results.processed++;
      console.log(`[${results.processed}/${ORPHANED_USER_EMAILS.length}] Processing: ${email}`);

      // Find user by email
      const user = await prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          uid: true,
          email: true,
          name: true,
          deleted: true,
          createdAt: true
        }
      });

      if (!user) {
        console.log(`  ✗ User not found in database\n`);
        results.notFound++;
        continue;
      }

      console.log(`  Found user:`);
      console.log(`    UID: ${user.uid}`);
      console.log(`    Name: ${user.name || 'N/A'}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log(`    Currently deleted: ${user.deleted}`);

      if (user.deleted) {
        console.log(`  ℹ User already soft deleted\n`);
        results.alreadyDeleted++;
        continue;
      }

      // Soft delete the user
      const anonymizedEmail = `deleted_${user.uid}@deleted.local`;

      await prisma.users.update({
        where: { uid: user.uid },
        data: {
          deleted: true,
          deletedAt: new Date(),
          disabled: true,
          originalEmail: user.email,
          email: anonymizedEmail
        }
      });

      console.log(`  ✓ User soft deleted successfully`);
      console.log(`    Original email: ${user.email}`);
      console.log(`    Anonymized to: ${anonymizedEmail}`);
      console.log(`    Email "${user.email}" is now available for new registration\n`);
      
      results.deleted++;

    } catch (error) {
      console.error(`  ✗ Error processing ${email}:`, error.message);
      console.error(`    ${error}\n`);
      results.errors++;
    }
  }

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Total processed: ${results.processed}`);
  console.log(`Successfully deleted: ${results.deleted}`);
  console.log(`Already deleted: ${results.alreadyDeleted}`);
  console.log(`Not found: ${results.notFound}`);
  console.log(`Errors: ${results.errors}`);

  if (results.deleted > 0) {
    console.log('\n✅ Email addresses are now available for new Firebase registrations');
  }

  if (results.errors > 0) {
    console.log('\n⚠️  Some users could not be processed. Check errors above.');
    process.exit(1);
  }
}

// Run the script
softDeleteOrphanedUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
