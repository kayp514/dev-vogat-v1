/**
 * Migration Script: Move Workspace-Based Contacts to Contacts Table
 * 
 * This script:
 * 1. Finds all workspace members in personal workspaces
 * 2. Creates corresponding entries in the contacts table
 * 3. Makes contacts workspace-independent
 * 4. Preserves bidirectional relationships
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateContactsToTable() {
  console.log('🔄 Starting migration of workspace contacts to contacts table\n');
  console.log('═'.repeat(70));

  try {
    // Step 1: Find all personal workspaces
    console.log('\n📊 Step 1: Finding personal workspaces...\n');
    
    const personalWorkspaces = await prisma.workspaces.findMany({
      where: {
        type: 'personal'
      },
      include: {
        owner: {
          select: {
            uid: true,
            email: true,
            name: true
          }
        },
        workspaceMembers: {
          include: {
            user: {
              select: {
                uid: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${personalWorkspaces.length} personal workspaces`);

    // Step 2: Extract all contact relationships
    console.log('\n📦 Step 2: Extracting contact relationships...\n');
    
    const contactPairs = new Set();
    const contactPairsArray = [];
    let totalWorkspaceMembers = 0;

    for (const workspace of personalWorkspaces) {
      const ownerId = workspace.ownerId;
      
      for (const member of workspace.workspaceMembers) {
        // Skip if member is the owner themselves
        if (member.userId === ownerId) continue;
        
        totalWorkspaceMembers++;
        
        // Create normalized pair key (sorted UIDs)
        const uids = [ownerId, member.userId].sort();
        const pairKey = `${uids[0]}_${uids[1]}`;
        
        if (!contactPairs.has(pairKey)) {
          contactPairs.add(pairKey);
          contactPairsArray.push({
            key: pairKey,
            user1: { uid: uids[0] },
            user2: { uid: uids[1] },
            createdAt: member.joinedAt
          });
        }
      }
    }

    console.log(`Total workspace members: ${totalWorkspaceMembers}`);
    console.log(`Unique contact pairs identified: ${contactPairsArray.length}`);

    // Step 3: Check existing contacts in the new table
    console.log('\n🔍 Step 3: Checking existing contacts in contacts table...\n');
    
    const existingContacts = await prisma.contacts.count();
    console.log(`Existing contacts in table: ${existingContacts}`);

    if (existingContacts > 0) {
      console.log('⚠️  Contacts table already has data. Will skip duplicates.');
    }

    // Step 4: Migrate contacts
    console.log('\n🔧 Step 4: Creating workspace-independent contacts...\n');
    console.log('─'.repeat(70));

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const pair of contactPairsArray) {
      try {
        // Check if contact already exists (both directions)
        const existing = await prisma.contacts.findFirst({
          where: {
            OR: [
              { userId: pair.user1.uid, contactId: pair.user2.uid },
              { userId: pair.user2.uid, contactId: pair.user1.uid }
            ]
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create bidirectional contact relationship
        await prisma.$transaction([
          prisma.contacts.create({
            data: {
              userId: pair.user1.uid,
              contactId: pair.user2.uid,
              status: 'accepted',
              createdAt: pair.createdAt
            }
          }),
          prisma.contacts.create({
            data: {
              userId: pair.user2.uid,
              contactId: pair.user1.uid,
              status: 'accepted',
              createdAt: pair.createdAt
            }
          })
        ]);

        created++;
        
        if (created % 10 === 0) {
          console.log(`   ✅ Migrated ${created} contact pairs...`);
        }

      } catch (error) {
        console.error(`   ❌ Error migrating pair ${pair.key}:`, error.message);
        errors++;
      }
    }

    // Step 5: Summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Personal workspaces processed: ${personalWorkspaces.length}`);
    console.log(`   • Workspace members found: ${totalWorkspaceMembers}`);
    console.log(`   • Unique contact pairs: ${contactPairsArray.length}`);
    console.log(`   • Contact relationships created: ${created * 2} (${created} pairs × 2 directions)`);
    console.log(`   • Skipped (already exist): ${skipped}`);
    console.log(`   • Errors: ${errors}`);

    // Verification
    console.log('\n🔍 Verification:');
    const finalContactCount = await prisma.contacts.count();
    console.log(`   • Total contacts in table: ${finalContactCount}`);
    console.log(`   • Expected: ${created * 2 + existingContacts}`);

    if (finalContactCount === created * 2 + existingContacts) {
      console.log('\n✅ All contacts successfully migrated!');
    } else {
      console.log(`\n⚠️  Count mismatch detected`);
    }

    console.log('\n💡 Note: Workspace members in personal workspaces are preserved.');
    console.log('   They can be used for business/group features in the future.');
    console.log('   1-on-1 contacts now use the new contacts table.');

    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateContactsToTable()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
