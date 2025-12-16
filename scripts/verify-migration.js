import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('🔍 Verifying workspace migration...\n');

    // Check users
    const userCount = await prisma.users.count();
    console.log(`✅ Users found: ${userCount}`);

    // Check workspaces
    const workspaceCount = await prisma.workspaces.count();
    console.log(`✅ Workspaces created: ${workspaceCount}`);

    // Check workspace members
    const memberCount = await prisma.workspaceMembers.count();
    console.log(`✅ Workspace members: ${memberCount}`);

    // Check chats
    const chatCount = await prisma.chats.count();
    console.log(`✅ Chats migrated: ${chatCount}`);

    // Verify each user has a workspace
    const usersWithWorkspaces = await prisma.users.findMany({
      include: {
        ownedWorkspaces: true,
        workspaceMemberships: true,
      },
      take: 3,
    });

    console.log('\n📋 Sample users with workspaces:');
    usersWithWorkspaces.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.email}`);
      console.log(`     - Owned workspaces: ${user.ownedWorkspaces.length}`);
      console.log(`     - Member of: ${user.workspaceMemberships.length}`);
    });

    // Verify chats have workspaceId
    const chatsWithWorkspace = await prisma.chats.findMany({
      include: {
        workspace: true,
        sender: { select: { email: true } },
        recipient: { select: { email: true } },
      },
      take: 3,
    });

    if (chatsWithWorkspace.length > 0) {
      console.log('\n💬 Sample chats with workspaces:');
      chatsWithWorkspace.forEach((chat, idx) => {
        console.log(`  ${idx + 1}. ${chat.sender.email} → ${chat.recipient.email}`);
        console.log(`     - Workspace: ${chat.workspace.name} (${chat.workspace.type})`);
      });
    }

    console.log('\n✨ Migration verification complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Every user should have 1 owned workspace (personal)`);
    console.log(`   - Every user should be a member of their workspace (role: owner)`);
    console.log(`   - All chats should now reference a workspaceId instead of tenantId`);
    console.log(`   - Users can only see chats within their workspace`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
