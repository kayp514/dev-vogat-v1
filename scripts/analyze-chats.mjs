import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function analyzeChatsAndMembers() {
  try {
    // Get the specific workspace with chats
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: 'ws_Jn9iyvPRhmbsz2C3D63k1FyMYdV2'
      },
      include: {
        workspaceMembers: {
          select: {
            userId: true
          }
        },
        chats: {
          select: {
            id: true,
            senderId: true,
            recipientId: true
          }
        }
      }
    });

    if (!workspace) {
      console.log('Workspace not found');
      return;
    }

    console.log('=== WORKSPACE ANALYSIS ===');
    console.log('Workspace ID:', workspace.id);
    console.log('Total workspace members:', workspace.workspaceMembers.length);
    console.log('Member IDs:', workspace.workspaceMembers.map(m => m.userId));
    console.log('\nTotal chats:', workspace.chats.length);
    
    // Get unique participants from chats
    const chatParticipants = new Set();
    workspace.chats.forEach(chat => {
      chatParticipants.add(chat.senderId);
      chatParticipants.add(chat.recipientId);
    });
    
    console.log('\nUnique chat participants:', chatParticipants.size);
    console.log('Participants:', Array.from(chatParticipants));
    
    // Check if chat participants are members
    const memberIds = new Set(workspace.workspaceMembers.map(m => m.userId));
    const participantsNotInMembers = Array.from(chatParticipants).filter(p => !memberIds.has(p));
    
    console.log('\n=== MISSING WORKSPACE MEMBERS ===');
    console.log('Participants NOT in workspaceMembers:', participantsNotInMembers.length);
    if (participantsNotInMembers.length > 0) {
      console.log('Missing user IDs:', participantsNotInMembers);
      
      // Get details of missing users
      const missingUsers = await prisma.users.findMany({
        where: {
          uid: {
            in: participantsNotInMembers
          }
        },
        select: {
          uid: true,
          email: true,
          name: true
        }
      });
      
      console.log('\nMissing users details:');
      missingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.uid})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeChatsAndMembers();
