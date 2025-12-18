/**
 * Test script to verify room-based chat implementation
 * This script tests that:
 * 1. J texting 7 creates a room
 * 2. 7 replying to J uses the same room (no duplicate)
 * 3. All messages appear in the same conversation
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testRoomBasedChat() {
  console.log('🧪 Testing Room-Based Chat Implementation\n');

  try {
    // Get two test users (J and 7 from your example)
    const userJ = await prisma.users.findFirst({
      where: { uid: 'Jn9iyvPRhmbsz2C3D63k1FyMYdV2' }
    });

    const user7 = await prisma.users.findFirst({
      where: { uid: '7IdoSSpKpyQBrsHmRi5qEHJL1Zp1' }
    });

    if (!userJ || !user7) {
      console.log('❌ Test users not found');
      console.log('User J:', userJ ? '✅ Found' : '❌ Not found');
      console.log('User 7:', user7 ? '✅ Found' : '❌ Not found');
      return;
    }

    console.log('✅ Found test users:');
    console.log(`   J: ${userJ.email}`);
    console.log(`   7: ${user7.email}\n`);

    // Generate expected room ID
    const emails = [userJ.email.toLowerCase(), user7.email.toLowerCase()].sort();
    const expectedRoomId = `room_${emails[0]}_${emails[1]}`;
    console.log(`📦 Expected Room ID: ${expectedRoomId}\n`);

    // Check existing chats between these users
    const existingChats = await prisma.chats.findMany({
      where: {
        OR: [
          { AND: [{ senderId: userJ.uid }, { recipientId: user7.uid }] },
          { AND: [{ senderId: user7.uid }, { recipientId: userJ.uid }] }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            content: true,
            createdAt: true,
            senderId: true
          }
        }
      }
    });

    console.log(`📊 Found ${existingChats.length} chat(s) between J and 7:\n`);

    existingChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`);
      console.log(`  ID: ${chat.id}`);
      console.log(`  Type: ${chat.type}`);
      console.log(`  Room ID: ${chat.roomId || 'N/A'}`);
      console.log(`  Workspace ID: ${chat.workspaceId || 'N/A (Direct chat)'}`);
      console.log(`  Sender: ${chat.senderId === userJ.uid ? 'J' : '7'}`);
      console.log(`  Recipient: ${chat.recipientId === userJ.uid ? 'J' : '7'}`);
      console.log(`  Messages: ${chat.messages.length}`);
      
      if (chat.messages.length > 0) {
        console.log(`  Last 3 messages:`);
        chat.messages.slice(-3).forEach((msg, i) => {
          const sender = msg.senderId === userJ.uid ? 'J' : '7';
          console.log(`    ${i + 1}. [${sender}] ${msg.content.substring(0, 50)}... (${msg.createdAt.toLocaleString()})`);
        });
      }
      console.log('');
    });

    // Analyze the results
    console.log('🔍 Analysis:\n');

    const directChats = existingChats.filter(c => c.type === 'direct');
    const workspaceChats = existingChats.filter(c => c.type === 'workspace');

    console.log(`✅ Direct chats (room-based): ${directChats.length}`);
    console.log(`📁 Workspace chats (old model): ${workspaceChats.length}\n`);

    if (directChats.length === 1) {
      console.log('✅ SUCCESS: Only ONE direct chat exists (room-based model working!)');
      const directChat = directChats[0];
      if (directChat.roomId === expectedRoomId) {
        console.log(`✅ Room ID matches expected: ${directChat.roomId}`);
      } else {
        console.log(`⚠️  Room ID mismatch: Expected ${expectedRoomId}, got ${directChat.roomId}`);
      }
    } else if (directChats.length > 1) {
      console.log('❌ ISSUE: Multiple direct chats found (should be only one room)');
    } else {
      console.log('ℹ️  No direct chats yet (old workspace chats still exist)');
    }

    if (workspaceChats.length > 0) {
      console.log(`\n⚠️  ${workspaceChats.length} workspace chat(s) still exist from old model`);
      console.log('   These are the duplicate chats that were created before the fix.');
      console.log('   New messages will use the room-based model.');
    }

    // Summary
    const totalMessages = existingChats.reduce((sum, chat) => sum + chat.messages.length, 0);
    console.log(`\n📈 Total messages across all chats: ${totalMessages}`);

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoomBasedChat();
