import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function migrateChatParticipantsToWorkspaceMembers() {
  try {
    console.log('=== MIGRATING CHAT PARTICIPANTS TO WORKSPACE MEMBERS ===\n');
    
    // Get all chats
    const allChats = await prisma.chats.findMany({
      select: {
        senderId: true,
        recipientId: true,
        workspaceId: true
      }
    });
    
    console.log(`Found ${allChats.length} total chats\n`);
    
    // Track statistics
    let addedMembers = 0;
    let skippedExisting = 0;
    const workspaceUpdates = new Map();
    
    // For each chat, ensure both sender and recipient are workspace members
    for (const chat of allChats) {
      const { senderId, recipientId, workspaceId } = chat;
      
      // Check if sender is a member
      const senderMembership = await prisma.workspaceMembers.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: senderId
        }
      });
      
      if (!senderMembership) {
        await prisma.workspaceMembers.create({
          data: {
            workspaceId: workspaceId,
            userId: senderId,
            role: 'member'
          }
        });
        addedMembers++;
        
        // Track workspace updates
        if (!workspaceUpdates.has(workspaceId)) {
          workspaceUpdates.set(workspaceId, []);
        }
        workspaceUpdates.get(workspaceId).push(senderId);
      } else {
        skippedExisting++;
      }
      
      // Check if recipient is a member
      const recipientMembership = await prisma.workspaceMembers.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: recipientId
        }
      });
      
      if (!recipientMembership) {
        await prisma.workspaceMembers.create({
          data: {
            workspaceId: workspaceId,
            userId: recipientId,
            role: 'member'
          }
        });
        addedMembers++;
        
        // Track workspace updates
        if (!workspaceUpdates.has(workspaceId)) {
          workspaceUpdates.set(workspaceId, []);
        }
        workspaceUpdates.get(workspaceId).push(recipientId);
      } else {
        skippedExisting++;
      }
    }
    
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`Added members: ${addedMembers}`);
    console.log(`Skipped existing: ${skippedExisting}`);
    console.log(`Workspaces updated: ${workspaceUpdates.size}`);
    
    // Show details per workspace
    console.log('\n=== WORKSPACE DETAILS ===');
    for (const [workspaceId, userIds] of workspaceUpdates) {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          name: true,
          ownerId: true
        }
      });
      
      console.log(`\nWorkspace: ${workspace?.name} (${workspaceId})`);
      console.log(`  Owner: ${workspace?.ownerId}`);
      console.log(`  Added ${userIds.length} members`);
    }
    
    // Verify the specific workspace from the issue
    console.log('\n=== VERIFICATION: ws_7IdoSSpKpyQBrsHmRi5qEHJL1Zp1 ===');
    const verifyWorkspace = await prisma.workspaces.findUnique({
      where: { id: 'ws_7IdoSSpKpyQBrsHmRi5qEHJL1Zp1' },
      include: {
        workspaceMembers: {
          select: {
            userId: true,
            role: true
          }
        },
        _count: {
          select: {
            chats: true
          }
        }
      }
    });
    
    if (verifyWorkspace) {
      console.log(`Total members: ${verifyWorkspace.workspaceMembers.length}`);
      console.log(`Total chats: ${verifyWorkspace._count.chats}`);
      console.log('Members:', verifyWorkspace.workspaceMembers.map(m => `${m.userId} (${m.role})`));
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateChatParticipantsToWorkspaceMembers();
