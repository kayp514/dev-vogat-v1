/**
 * Migration Script: Convert Existing Workspace Chats to Room-Based Model
 * 
 * This script:
 * 1. Finds all existing chats with null roomId
 * 2. Fetches user emails for sender and recipient
 * 3. Generates room IDs based on sorted emails
 * 4. Updates chats to use room-based model
 * 5. Merges duplicate conversations into single rooms
 * 6. Updates chat type from 'workspace' to 'direct' for 1-on-1 chats
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate consistent room ID based on user emails
 */
function generateRoomId(email1, email2) {
  const emails = [email1.toLowerCase(), email2.toLowerCase()].sort();
  return `room_${emails[0]}_${emails[1]}`;
}

async function migrateChatsToRooms() {
  console.log('🔄 Starting migration of existing chats to room-based model\n');
  console.log('═'.repeat(70));

  try {
    // Step 1: Find all chats with null roomId
    console.log('\n📊 Step 1: Analyzing existing chats...\n');
    
    const chatsWithoutRoom = await prisma.chats.findMany({
      where: {
        roomId: null
      },
      include: {
        sender: {
          select: {
            uid: true,
            email: true,
            name: true
          }
        },
        recipient: {
          select: {
            uid: true,
            email: true,
            name: true
          }
        },
        messages: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${chatsWithoutRoom.length} chats without roomId`);

    if (chatsWithoutRoom.length === 0) {
      console.log('✅ No chats to migrate. All chats already have roomId assigned.');
      return;
    }

    // Step 2: Group chats by user pairs
    console.log('\n📦 Step 2: Grouping chats by user pairs...\n');
    
    const roomGroups = new Map();

    for (const chat of chatsWithoutRoom) {
      const roomId = generateRoomId(chat.sender.email, chat.recipient.email);
      
      if (!roomGroups.has(roomId)) {
        roomGroups.set(roomId, []);
      }
      
      roomGroups.get(roomId).push(chat);
    }

    console.log(`Identified ${roomGroups.size} unique conversation rooms\n`);

    // Step 3: Process each room
    let migratedRooms = 0;
    let mergedChats = 0;
    let totalMessages = 0;

    console.log('🔧 Step 3: Migrating chats to rooms...\n');
    console.log('─'.repeat(70));

    for (const [roomId, chats] of roomGroups.entries()) {
      const firstChat = chats[0];
      const users = [
        { uid: firstChat.sender.uid, email: firstChat.sender.email, name: firstChat.sender.name },
        { uid: firstChat.recipient.uid, email: firstChat.recipient.email, name: firstChat.recipient.name }
      ];

      console.log(`\n🏠 Room: ${roomId}`);
      console.log(`   Users: ${users[0].name || users[0].email} ↔ ${users[1].name || users[1].email}`);
      console.log(`   Found ${chats.length} chat(s) for this pair`);

      if (chats.length === 1) {
        // Single chat - just update with roomId
        const chat = chats[0];
        const messageCount = chat.messages.length;

        await prisma.chats.update({
          where: { id: chat.id },
          data: {
            roomId: roomId,
            type: 'direct',
            workspaceId: null // Remove workspace association for direct chats
          }
        });

        console.log(`   ✅ Updated chat ${chat.id} with roomId`);
        console.log(`   📨 Messages: ${messageCount}`);
        
        migratedRooms++;
        totalMessages += messageCount;

      } else {
        // Multiple chats - need to merge
        console.log(`   ⚠️  Multiple chats detected - merging...`);

        // Sort by creation date to keep the oldest chat as primary
        chats.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const primaryChat = chats[0];
        const duplicateChats = chats.slice(1);

        console.log(`   📌 Primary chat: ${primaryChat.id} (${primaryChat.messages.length} messages)`);

        // Update primary chat with roomId
        await prisma.chats.update({
          where: { id: primaryChat.id },
          data: {
            roomId: roomId,
            type: 'direct',
            workspaceId: null
          }
        });

        let movedMessages = 0;

        // Move messages from duplicate chats to primary chat
        for (const duplicateChat of duplicateChats) {
          const msgCount = duplicateChat.messages.length;
          console.log(`   🔄 Moving ${msgCount} messages from ${duplicateChat.id} to primary chat`);

          if (msgCount > 0) {
            await prisma.messages.updateMany({
              where: { chatId: duplicateChat.id },
              data: { chatId: primaryChat.id }
            });
            movedMessages += msgCount;
          }

          // Delete duplicate chat
          await prisma.chats.delete({
            where: { id: duplicateChat.id }
          });

          console.log(`   🗑️  Deleted duplicate chat ${duplicateChat.id}`);
        }

        // Update lastMessage timestamp on primary chat
        const lastMessage = await prisma.messages.findFirst({
          where: { chatId: primaryChat.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        if (lastMessage) {
          await prisma.chats.update({
            where: { id: primaryChat.id },
            data: { lastMessage: lastMessage.createdAt }
          });
        }

        const totalChatMessages = primaryChat.messages.length + movedMessages;
        console.log(`   ✅ Merged into room with ${totalChatMessages} total messages`);

        migratedRooms++;
        mergedChats += duplicateChats.length;
        totalMessages += totalChatMessages;
      }
    }

    // Step 4: Summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Unique conversation rooms created: ${migratedRooms}`);
    console.log(`   • Duplicate chats merged: ${mergedChats}`);
    console.log(`   • Total messages migrated: ${totalMessages}`);
    console.log(`   • Original chats processed: ${chatsWithoutRoom.length}`);
    console.log(`   • Net chats after migration: ${migratedRooms} (reduced by ${chatsWithoutRoom.length - migratedRooms})`);

    // Verification
    console.log('\n🔍 Verification:');
    const remainingNullRoomId = await prisma.chats.count({
      where: { roomId: null }
    });
    
    const directChatsCount = await prisma.chats.count({
      where: { type: 'direct' }
    });

    console.log(`   • Chats still without roomId: ${remainingNullRoomId}`);
    console.log(`   • Direct chats (room-based): ${directChatsCount}`);

    if (remainingNullRoomId === 0) {
      console.log('\n✅ All chats successfully migrated to room-based model!');
    } else {
      console.log(`\n⚠️  Warning: ${remainingNullRoomId} chats still need migration`);
    }

    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateChatsToRooms()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
