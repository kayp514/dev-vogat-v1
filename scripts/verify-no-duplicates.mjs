/**
 * Verify no duplicate conversations exist
 * Check that each user pair has only ONE chat room
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNoDuplicates() {
  console.log('🔍 Verifying no duplicate conversations exist...\n');
  console.log('═'.repeat(70));

  try {
    // Get all chats
    const allChats = await prisma.chats.findMany({
      include: {
        sender: {
          select: { uid: true, email: true, name: true }
        },
        recipient: {
          select: { uid: true, email: true, name: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log(`\n📊 Total chats: ${allChats.length}\n`);

    // Group by user pairs
    const userPairs = new Map();

    for (const chat of allChats) {
      // Create normalized pair key (sorted UIDs)
      const uids = [chat.sender.uid, chat.recipient.uid].sort();
      const pairKey = `${uids[0]}_${uids[1]}`;
      
      if (!userPairs.has(pairKey)) {
        userPairs.set(pairKey, {
          users: {
            user1: chat.sender,
            user2: chat.recipient
          },
          chats: []
        });
      }
      
      userPairs.get(pairKey).chats.push(chat);
    }

    console.log(`🔢 Unique user pairs: ${userPairs.size}\n`);

    // Check for duplicates
    let duplicatesFound = 0;
    const duplicatePairs = [];

    for (const [pairKey, data] of userPairs.entries()) {
      if (data.chats.length > 1) {
        duplicatesFound++;
        duplicatePairs.push({ pairKey, ...data });
      }
    }

    if (duplicatesFound === 0) {
      console.log('✅ SUCCESS: No duplicate conversations found!');
      console.log('✅ Each user pair has exactly ONE chat room.\n');
      
      // Show some examples
      console.log('📋 Sample conversations (showing first 5):');
      console.log('─'.repeat(70));
      
      let count = 0;
      for (const [pairKey, data] of userPairs.entries()) {
        if (count >= 5) break;
        
        const chat = data.chats[0];
        const user1Name = data.users.user1.name || data.users.user1.email;
        const user2Name = data.users.user2.name || data.users.user2.email;
        
        console.log(`\n${count + 1}. ${user1Name} ↔ ${user2Name}`);
        console.log(`   Room ID: ${chat.roomId}`);
        console.log(`   Chat ID: ${chat.id}`);
        console.log(`   Messages: ${chat._count.messages}`);
        console.log(`   Created: ${chat.createdAt.toLocaleString()}`);
        
        count++;
      }
      
    } else {
      console.log(`❌ DUPLICATES FOUND: ${duplicatesFound} user pair(s) have multiple chats\n`);
      console.log('🔍 Duplicate conversations:');
      console.log('─'.repeat(70));
      
      for (const pair of duplicatePairs) {
        const user1Name = pair.users.user1.name || pair.users.user1.email;
        const user2Name = pair.users.user2.name || pair.users.user2.email;
        
        console.log(`\n⚠️  ${user1Name} ↔ ${user2Name}`);
        console.log(`   ${pair.chats.length} chat records found:`);
        
        for (const chat of pair.chats) {
          console.log(`   • Chat ${chat.id}`);
          console.log(`     Room ID: ${chat.roomId || 'NULL'}`);
          console.log(`     Type: ${chat.type}`);
          console.log(`     Messages: ${chat._count.messages}`);
          console.log(`     Workspace: ${chat.workspaceId || 'NULL'}`);
        }
      }
      
      console.log('\n⚠️  Run the migration script to merge duplicates:');
      console.log('   node scripts/migrate-existing-chats-to-rooms.mjs');
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n📈 Summary:');
    console.log(`   • Total chats: ${allChats.length}`);
    console.log(`   • Unique conversations: ${userPairs.size}`);
    console.log(`   • Duplicate conversations: ${duplicatesFound}`);
    console.log(`   • Status: ${duplicatesFound === 0 ? '✅ PERFECT' : '⚠️  NEEDS FIXING'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNoDuplicates();
