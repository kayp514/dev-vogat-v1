#!/usr/bin/env node

/**
 * Script to add bidirectional contact relationship between two users
 * Usage: node scripts/add-contact.mjs
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const USER_1_UID = '1xWCNXLsvyUH7I0vkdM3DZkZGLP2';
const USER_2_UID = '7IdoSSpKpyQBrsHmRi5qEHJL1Zp1';

async function addContact() {
  try {
    console.log('🔍 Looking up users...');
    
    // Verify both users exist
    const [user1, user2] = await Promise.all([
      prisma.users.findUnique({ 
        where: { uid: USER_1_UID },
        select: { uid: true, email: true, name: true }
      }),
      prisma.users.findUnique({ 
        where: { uid: USER_2_UID },
        select: { uid: true, email: true, name: true }
      })
    ]);

    if (!user1) {
      console.error(`❌ User not found: ${USER_1_UID}`);
      process.exit(1);
    }

    if (!user2) {
      console.error(`❌ User not found: ${USER_2_UID}`);
      process.exit(1);
    }

    console.log(`✅ User 1: ${user1.name || user1.email} (${user1.uid})`);
    console.log(`✅ User 2: ${user2.name || user2.email} (${user2.uid})`);

    // Check if contact relationship already exists
    const existingContact = await prisma.contacts.findFirst({
      where: {
        userId: USER_1_UID,
        contactId: USER_2_UID
      }
    });

    if (existingContact) {
      console.log('⚠️  Contact relationship already exists!');
      process.exit(0);
    }

    console.log('\n📝 Creating bidirectional contact relationship...');

    // Create bidirectional contact relationship in a transaction
    await prisma.$transaction([
      // User 1 -> User 2
      prisma.contacts.create({
        data: {
          userId: USER_1_UID,
          contactId: USER_2_UID,
          status: 'accepted'
        }
      }),
      // User 2 -> User 1
      prisma.contacts.create({
        data: {
          userId: USER_2_UID,
          contactId: USER_1_UID,
          status: 'accepted'
        }
      })
    ]);

    console.log('✅ Contact relationship created successfully!');
    console.log(`   ${user1.name || user1.email} <-> ${user2.name || user2.email}`);

  } catch (error) {
    console.error('❌ Error adding contact:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addContact();
