import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixBidirectionalContacts() {
  try {
    console.log('=== FIXING BIDIRECTIONAL CONTACT RELATIONSHIPS ===\n');
    
    // Get all personal workspaces
    const personalWorkspaces = await prisma.workspaces.findMany({
      where: {
        type: 'personal'
      },
      include: {
        workspaceMembers: {
          select: {
            userId: true
          }
        }
      }
    });
    
    console.log(`Found ${personalWorkspaces.length} personal workspaces\n`);
    
    let fixedRelationships = 0;
    let skippedExisting = 0;
    
    // For each personal workspace, ensure bidirectional relationships
    for (const workspace of personalWorkspaces) {
      const ownerId = workspace.ownerId;
      const memberIds = workspace.workspaceMembers.map(m => m.userId).filter(id => id !== ownerId);
      
      console.log(`\nChecking workspace: ${workspace.id} (Owner: ${ownerId})`);
      console.log(`  Has ${memberIds.length} members (excluding owner)`);
      
      // For each member in this workspace, ensure owner is in their workspace
      for (const memberId of memberIds) {
        // Find the member's personal workspace
        const memberWorkspace = await prisma.workspaces.findFirst({
          where: {
            ownerId: memberId,
            type: 'personal'
          }
        });
        
        if (!memberWorkspace) {
          console.log(`  ⚠️  Member ${memberId} has no personal workspace - skipping`);
          continue;
        }
        
        // Check if owner is a member in member's workspace
        const reciprocalMembership = await prisma.workspaceMembers.findFirst({
          where: {
            workspaceId: memberWorkspace.id,
            userId: ownerId
          }
        });
        
        if (!reciprocalMembership) {
          // Add owner to member's workspace
          await prisma.workspaceMembers.create({
            data: {
              workspaceId: memberWorkspace.id,
              userId: ownerId,
              role: 'member',
              invitedBy: memberId
            }
          });
          console.log(`  ✅ Added ${ownerId} to ${memberId}'s workspace (${memberWorkspace.id})`);
          fixedRelationships++;
        } else {
          skippedExisting++;
        }
      }
    }
    
    console.log('\n=== FIX COMPLETE ===');
    console.log(`Fixed relationships: ${fixedRelationships}`);
    console.log(`Already existed: ${skippedExisting}`);
    
    // Verify the fix for the specific users mentioned
    console.log('\n=== VERIFICATION ===');
    const userJ = 'Jn9iyvPRhmbsz2C3D63k1FyMYdV2';
    const user7 = '7IdoSSpKpyQBrsHmRi5qEHJL1Zp1';
    
    const workspaceJ = await prisma.workspaces.findFirst({
      where: { ownerId: userJ, type: 'personal' },
      include: {
        workspaceMembers: {
          select: { userId: true }
        }
      }
    });
    
    const workspace7 = await prisma.workspaces.findFirst({
      where: { ownerId: user7, type: 'personal' },
      include: {
        workspaceMembers: {
          select: { userId: true }
        }
      }
    });
    
    console.log(`\nUser J's workspace (${workspaceJ?.id}):`);
    console.log(`  Members: ${workspaceJ?.workspaceMembers.map(m => m.userId).join(', ')}`);
    console.log(`  Has user 7? ${workspaceJ?.workspaceMembers.some(m => m.userId === user7) ? '✅' : '❌'}`);
    
    console.log(`\nUser 7's workspace (${workspace7?.id}):`);
    console.log(`  Members: ${workspace7?.workspaceMembers.map(m => m.userId).join(', ')}`);
    console.log(`  Has user J? ${workspace7?.workspaceMembers.some(m => m.userId === userJ) ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBidirectionalContacts();
