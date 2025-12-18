/**
 * Check current state of chats in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChatsState() {
  console.log('🔍 Checking current state of chats table...\n');
  console.log('═'.repeat(70));

  try {
    // Count chats by type
    const totalChats = await prisma.chats.count();
    const directChats = await prisma.chats.count({ where: { type: 'direct' } });
    const workspaceChats = await prisma.chats.count({ where: { type: 'workspace' } });
    const chatsWithRoom = await prisma.chats.count({ where: { roomId: { not: null } } });
    const chatsWithoutRoom = await prisma.chats.count({ where: { roomId: null } });

    console.log('\n📊 Overview:');
    console.log(`   Total chats: ${totalChats}`);
    console.log(`   • Direct chats: ${directChats}`);
    console.log(`   • Workspace chats: ${workspaceChats}`);
    console.log(`   • With roomId: ${chatsWithRoom}`);
    console.log(`   • Without roomId: ${chatsWithoutRoom}`);

    // Get sample chats
    console.log('\n📋 Sample chats (first 10):');
    console.log('─'.repeat(70));

    const sampleChats = await prisma.chats.findMany({
      take: 10,
      include: {
        sender: {
          select: { email: true, name: true }
        },
        recipient: {
          select: { email: true, name: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (const chat of sampleChats) {
      console.log(`\nChat ID: ${chat.id}`);
      console.log(`  Type: ${chat.type}`);
      console.log(`  Room ID: ${chat.roomId || 'NULL'}`);
      console.log(`  Workspace ID: ${chat.workspaceId || 'NULL'}`);
      console.log(`  Sender: ${chat.sender.name || chat.sender.email}`);
      console.log(`  Recipient: ${chat.recipient.name || chat.recipient.email}`);
      console.log(`  Messages: ${chat._count.messages}`);
      console.log(`  Created: ${chat.createdAt.toLocaleString()}`);
    }

    // Check for chats that should be migrated
    console.log('\n\n🔍 Chats that need migration (type=workspace, roomId=null):');
    console.log('─'.repeat(70));

    const needsMigration = await prisma.chats.findMany({
      where: {
        type: 'workspace',
        roomId: null
      },
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
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\nFound ${needsMigration.length} chats to migrate:\n`);

    if (needsMigration.length > 0) {
      const userPairs = new Map();

      for (const chat of needsMigration) {
        const emails = [chat.sender.email, chat.recipient.email].sort();
        const pairKey = `${emails[0]} ↔ ${emails[1]}`;
        
        if (!userPairs.has(pairKey)) {
          userPairs.set(pairKey, []);
        }
        userPairs.get(pairKey).push(chat);
      }

      console.log(`Identified ${userPairs.size} unique user pairs:\n`);

      for (const [pair, chats] of userPairs.entries()) {
        const totalMessages = chats.reduce((sum, c) => sum + c._count.messages, 0);
        console.log(`  ${pair}`);
        console.log(`    • ${chats.length} chat record(s)`);
        console.log(`    • ${totalMessages} total messages`);
        
        if (chats.length > 1) {
          console.log(`    ⚠️  DUPLICATE: Will be merged into 1 room`);
        }
      }
    } else {
      console.log('✅ No chats need migration');
    }

    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChatsState();
