/**
 * Verify contacts table and functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyContacts() {
  console.log('🔍 Verifying contacts table...\n');
  console.log('═'.repeat(70));

  try {
    // Count total contacts
    const totalContacts = await prisma.contacts.count();
    console.log(`\n📊 Total contacts in table: ${totalContacts}`);

    // Sample contacts
    console.log('\n📋 Sample contacts (first 10):');
    console.log('─'.repeat(70));

    const sampleContacts = await prisma.contacts.findMany({
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        contact: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    for (const contact of sampleContacts) {
      const userName = contact.user.name || contact.user.email;
      const contactName = contact.contact.name || contact.contact.email;
      
      console.log(`\n${userName} → ${contactName}`);
      console.log(`  Status: ${contact.status}`);
      console.log(`  Created: ${contact.createdAt.toLocaleString()}`);
    }

    // Check bidirectional relationships
    console.log('\n\n🔄 Verifying bidirectional relationships...');
    console.log('─'.repeat(70));

    const allContacts = await prisma.contacts.findMany({
      select: {
        userId: true,
        contactId: true
      }
    });

    let bidirectionalCount = 0;
    let unidirectionalCount = 0;

    const checked = new Set();

    for (const contact of allContacts) {
      const pairKey = [contact.userId, contact.contactId].sort().join('_');
      
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      // Check if reverse relationship exists
      const reverse = allContacts.find(
        c => c.userId === contact.contactId && c.contactId === contact.userId
      );

      if (reverse) {
        bidirectionalCount++;
      } else {
        unidirectionalCount++;
        console.log(`⚠️  Unidirectional: ${contact.userId} → ${contact.contactId}`);
      }
    }

    console.log(`\n✅ Bidirectional pairs: ${bidirectionalCount}`);
    console.log(`${unidirectionalCount > 0 ? '⚠️' : '✅'}  Unidirectional: ${unidirectionalCount}`);

    if (unidirectionalCount === 0) {
      console.log('\n✅ All contacts are properly bidirectional!');
    }

    // Test query functions
    console.log('\n\n🧪 Testing contact query functions...');
    console.log('─'.repeat(70));

    // Find a user with contacts
    const userWithContacts = await prisma.contacts.findFirst({
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (userWithContacts) {
      console.log(`\nTest user: ${userWithContacts.user.name || userWithContacts.user.email}`);
      
      // Count their contacts
      const contactCount = await prisma.contacts.count({
        where: {
          userId: userWithContacts.userId,
          status: 'accepted'
        }
      });

      console.log(`  Contacts: ${contactCount}`);
      
      // List them
      const userContacts = await prisma.contacts.findMany({
        where: {
          userId: userWithContacts.userId,
          status: 'accepted'
        },
        include: {
          contact: {
            select: {
              name: true,
              email: true
            }
          }
        },
        take: 5
      });

      console.log(`  First ${Math.min(5, userContacts.length)} contacts:`);
      for (const c of userContacts) {
        console.log(`    • ${c.contact.name || c.contact.email}`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Contacts verification complete!');
    console.log('\n💡 Contacts are now workspace-independent');
    console.log('   They use the dedicated "contacts" table');
    console.log('   Compatible with room-based 1-on-1 chats');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyContacts();
