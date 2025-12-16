import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testApiResponse() {
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: 'ws_7IdoSSpKpyQBrsHmRi5qEHJL1Zp1',
        workspaceMembers: {
          some: {
            userId: '7IdoSSpKpyQBrsHmRi5qEHJL1Zp1'
          }
        }
      },
      include: {
        owner: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        },
        workspaceMembers: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                email: true,
                avatar: true,
                phoneNumber: true,
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        _count: {
          select: {
            chats: true,
          }
        }
      }
    });

    console.log('=== API RESPONSE SIMULATION ===\n');
    console.log(JSON.stringify({
      success: true,
      workspace: {
        id: workspace?.id,
        name: workspace?.name,
        type: workspace?.type,
        memberCount: workspace?.workspaceMembers.length,
        chatCount: workspace?._count.chats,
        owner: workspace?.owner,
        tenant: workspace?.tenant
      }
    }, null, 2));
    
    console.log('\n=== WORKSPACE MEMBERS ===');
    console.log(`Total: ${workspace?.workspaceMembers.length}`);
    workspace?.workspaceMembers.forEach((member, idx) => {
      console.log(`${idx + 1}. ${member.user.email} (${member.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse();
