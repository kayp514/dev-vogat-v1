import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function investigateWorkspaceOwnership() {
  try {
    console.log('\n=== Investigating Workspace Ownership Issue ===\n');

    // Find the problematic workspace
    const workspaceId = 'ws_X85SqamNtrVvNBCsWdRGnJ2jMAD3';
    
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { uid: true, name: true, email: true }
        },
        workspaceMembers: {
          include: {
            user: {
              select: { uid: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (workspace) {
      console.log('📁 Workspace Details:');
      console.log('   ID:', workspace.id);
      console.log('   Name:', workspace.name);
      console.log('   Type:', workspace.type);
      console.log('   Owner:', workspace.owner.name, `(${workspace.owner.uid})`);
      console.log('\n   Members:');
      workspace.workspaceMembers.forEach(m => {
        console.log(`     - ${m.user.name} (${m.user.uid}) - Role: ${m.role}`);
      });
    } else {
      console.log('❌ Workspace NOT FOUND');
    }

    // Get User J and User 7 details
    console.log('\n=== User Personal Workspaces ===\n');
    
    const userJId = 'Jn9iyvPRhmbsz2C3D63k1FyMYdV2';
    const user7Id = '7IdoSSpKpyQBrsHmRi5qEHJL1Zp1';

    const userJ = await prisma.users.findUnique({
      where: { uid: userJId },
      select: { uid: true, name: true, email: true }
    });

    const user7 = await prisma.users.findUnique({
      where: { uid: user7Id },
      select: { uid: true, name: true, email: true }
    });

    console.log('👤 User J:', userJ?.name, `(${userJ?.uid})`);
    console.log('👤 User 7:', user7?.name, `(${user7?.uid})`);

    // Find their personal workspaces
    const jWorkspace = await prisma.workspaces.findFirst({
      where: {
        ownerId: userJId,
        type: 'personal'
      }
    });

    const user7Workspace = await prisma.workspaces.findFirst({
      where: {
        ownerId: user7Id,
        type: 'personal'
      }
    });

    console.log('\n📦 User J Personal Workspace:', jWorkspace?.id || '❌ NOT FOUND');
    console.log('📦 User 7 Personal Workspace:', user7Workspace?.id || '❌ NOT FOUND');

    // Check all chats between J and 7
    console.log('\n=== All Chats Between J and 7 ===\n');
    
    const chats = await prisma.chats.findMany({
      where: {
        OR: [
          { senderId: userJId, recipientId: user7Id },
          { senderId: user7Id, recipientId: userJId }
        ]
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
            ownerId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${chats.length} chat(s) between J and 7:\n`);
    
    chats.forEach((chat, idx) => {
      console.log(`Chat ${idx + 1}:`);
      console.log(`  ID: ${chat.id}`);
      console.log(`  Sender: ${chat.senderId}`);
      console.log(`  Recipient: ${chat.recipientId}`);
      console.log(`  Workspace: ${chat.workspaceId}`);
      console.log(`    - Name: ${chat.workspace.name}`);
      console.log(`    - Type: ${chat.workspace.type}`);
      console.log(`    - Owner: ${chat.workspace.ownerId}`);
      console.log(`    - ❌ Issue: Owner is neither J nor 7!`);
      console.log('');
    });

    // Check workspace membership for both users
    console.log('=== Workspace Memberships ===\n');
    
    const jMemberships = await prisma.workspaceMembers.findMany({
      where: { userId: userJId },
      include: {
        workspace: {
          select: { id: true, name: true, type: true, ownerId: true }
        }
      }
    });

    const user7Memberships = await prisma.workspaceMembers.findMany({
      where: { userId: user7Id },
      include: {
        workspace: {
          select: { id: true, name: true, type: true, ownerId: true }
        }
      }
    });

    console.log(`User J is member of ${jMemberships.length} workspace(s):`);
    jMemberships.forEach(m => {
      const isPersonal = m.workspace.ownerId === userJId;
      console.log(`  - ${m.workspace.name} (${m.workspace.id}) ${isPersonal ? '✅ PERSONAL' : ''}`);
    });

    console.log(`\nUser 7 is member of ${user7Memberships.length} workspace(s):`);
    user7Memberships.forEach(m => {
      const isPersonal = m.workspace.ownerId === user7Id;
      console.log(`  - ${m.workspace.name} (${m.workspace.id}) ${isPersonal ? '✅ PERSONAL' : ''}`);
    });

    // Check if the problematic workspace is shared
    const isJMember = jMemberships.some(m => m.workspaceId === workspaceId);
    const is7Member = user7Memberships.some(m => m.workspaceId === workspaceId);

    console.log('\n=== Analysis ===\n');
    console.log(`Chat is in workspace: ${workspaceId}`);
    console.log(`User J has access to this workspace: ${isJMember ? '✅ YES' : '❌ NO'}`);
    console.log(`User 7 has access to this workspace: ${is7Member ? '✅ YES' : '❌ NO'}`);

    if (!isJMember || !is7Member) {
      console.log('\n⚠️  PROBLEM: One or both users cannot access the workspace where their chat is stored!');
      console.log('\n💡 RECOMMENDATION:');
      console.log(`   Chats should be created in the sender's personal workspace.`);
      console.log(`   When User J sends to User 7: use workspace ${jWorkspace?.id || 'J_PERSONAL_WS'}`);
      console.log(`   When User 7 sends to User J: use workspace ${user7Workspace?.id || '7_PERSONAL_WS'}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

investigateWorkspaceOwnership();
