'use server'

import { prisma } from '@/lib/prisma';
import type { DatabaseUserInput, SearchResult, WorkspaceCreateInput } from './types';


export async function getUser(uid: string) {
  console.log("1. getUser called with id:", uid)
  try {
    console.log("2. Attempting prisma.user.findUnique")
    const dbUser = await prisma.users.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        emailVerified: true,
      }
    })
    console.log("3. prisma query result:", dbUser)

    if (!dbUser) {
      console.log("4. No user found in database")
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
      }
    }
    console.log("5. User found, returning success")
    return {
      success: true,
      user: dbUser
    }
  } catch (error) {
    console.error('6. Error in getUser:', error)
    console.error('6a. Full error details:', {
      name: error,
      message: error,
      stack: error,
      ...(error || {})
    })
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user from database'
      }
    }
  }
}

export async function searchUsers(query: string, limit: number = 10): Promise<SearchResult> {
  try {
    const dbUser = await prisma.users.findMany({
      where: {
        deleted: false,  // Exclude deleted users
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive', // Case-insensitive search
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        uid: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: limit,
    });

    return {
      success: true,
      users: dbUser.map((user: { uid: string; name: string | null; email: string; avatar: string | null }) => ({
        uid: user.uid,
        name: user.name || user.email?.split('@')[0],
        email: user.email,
        avatar: user.avatar ?? undefined,
      })),
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search users',
      },
    };
  }
}

export async function getAllUsers(maxResults?: number, nextPage?: number) {
  try {
    const limit = maxResults || 1000;
    const page = nextPage || 1;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.users.findMany({
        where: {
          deleted: false  // Exclude deleted users
        },
        select: {
          uid: true,
          email: true,
          phoneNumber: true,
          tenantId: true,
          disabled: true,
          createdAt: true,
          lastSignInAt: true,
          isAdmin: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.users.count({
        where: {
          deleted: false  // Exclude deleted users from count
        }
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      users,
      totalCount,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_USERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch users',
      },
    };
  }
}



export async function createUser(data: DatabaseUserInput | null, workspaceId?: string) {
  if (!data) {
    console.error("user: Input is null in createUser");
    throw new Error("User input data is required")
  }

  try {
    const result = await prisma.$transaction(async (tx) => {

      const sanitizedData = {
        uid: data.uid,
        email: data.email.toLowerCase(),
        name: data.name,
        avatar: data.avatar,
        tenantId: data.tenantId,
        isAdmin: data.isAdmin,
        phoneNumber: data.phoneNumber,
        emailVerified: data.emailVerified,
        createdAt: data.createdAt,
        lastSignInAt: data.lastSignInAt,
        updatedAt: new Date(),
        disabled: false
      }

      const user = await tx.users.create({
        data: sanitizedData,
        select: {
          uid: true,
          email: true,
          name: true,
          avatar: true,
          tenantId: true,
          isAdmin: true,
          phoneNumber: true,
          emailVerified: true,
          disabled: true,
          updatedAt: true,
          createdAt: true,
          lastSignInAt: true,
        },
      });

      if (!user) {
        throw new Error("Failed to create user: No user returned from database")
      }

      const workspaceName = user.name
        ? `${user.name}'s Workspace`
        : `${user.email.split('@')[0]}'s Workspace`

      const workspaceData: WorkspaceCreateInput = {
        name: workspaceName,
        description: 'Personal workspace',
        ownerId: user.uid,
        tenantId: user.tenantId,
        type: 'personal',
        disabled: false
      }

      if (workspaceId) {
        workspaceData.id = workspaceId
      }

      const workspace = await tx.workspaces.create({
        data: workspaceData,
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true
        }
      })

      await tx.workspaceMembers.create({
        data: {
          workspaceId: workspace.id,
          userId: user.uid,
          role: 'owner'
        }
      })

      return {
        user,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          type: workspace.type
        }
      }
    })

    return result;
  } catch (error) {
    console.error('Failed to create user in database:', error);
    throw error;
  }
}


export async function getUserChats(uid: string, workspaceId: string) {
  try {
    const userChats = await prisma.chats.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: uid },
              { recipientId: uid }
            ]
          },
          { workspaceId: workspaceId } // Ensure workspace isolation
        ]
      },
      orderBy: {
        lastMessage: 'desc'
      },
      include: {
        sender: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        recipient: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            read: true,
            senderId: true,
          }
        }
      }
    });

    return { success: true, chats: userChats };
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_CHATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch chats'
      }
    };
  }
}


export async function getChatMessages(chatId: string, workspaceId: string) {
  try {
    const messages = await prisma.messages.findMany({
      where: {
        chatId: chatId,
        chat: {
          workspaceId: workspaceId // Ensure workspace isolation
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return { success: true, messages };
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_MESSAGES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    };
  }
}


export async function createNewChat(currentUserId: string, otherUserId: string, workspaceId: string, initialMessage: string) {
  try {

    const currentUser = await prisma.users.findUnique({
      where: { uid: currentUserId },
      select: { tenantId: true }
    });

    if (currentUser?.tenantId === 'default') {
      const isContact = await areContacts(currentUserId, otherUserId);

      if (!isContact) {
        return {
          success: false,
          error: {
            code: 'NOT_CONTACT',
            message: 'Cannot chat with non-contact. Add them to your contacts first.'
          }
        };
      }
    }

    const existingChat = await prisma.chats.findFirst({
      where: {
        AND: [
          {
            OR: [
              { AND: [{ senderId: currentUserId }, { recipientId: otherUserId }] },
              { AND: [{ senderId: otherUserId }, { recipientId: currentUserId }] }
            ]
          },
          { workspaceId: workspaceId }
        ]
      }
    });

    if (existingChat) {
      const newMessage = await prisma.messages.create({
        data: {
          content: initialMessage,
          senderId: currentUserId,
          chatId: existingChat.id
        }
      });

      await prisma.chats.update({
        where: { id: existingChat.id },
        data: { lastMessage: new Date() }
      });

      const updatedChat = await prisma.chats.findUnique({
        where: { id: existingChat.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return {
        success: true,
        chat: updatedChat,
        isExisting: true
      };
    }

    const chat = await prisma.chats.create({
      data: {
        senderId: currentUserId,
        recipientId: otherUserId,
        workspaceId: workspaceId,
        lastMessage: new Date(),
        messages: {
          create: {
            content: initialMessage,
            senderId: currentUserId,
          }
        }
      },
      include: {
        messages: true
      }
    });

    return { success: true, chat };
  } catch (error) {
    console.error('Error creating new chat:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_CHAT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create chat'
      }
    };
  }
}


export async function markMessagesAsRead(chatId: string, currentUserId: string, workspaceId: string) {
  try {

    const chat = await prisma.chats.findFirst({
      where: {
        id: chatId,
        workspaceId: workspaceId,
        OR: [
          { senderId: currentUserId },
          { recipientId: currentUserId }
        ]
      }
    });

    if (!chat) {
      return {
        success: false,
        error: {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat not found or access denied'
        }
      };
    }

    const markAsRead = await prisma.messages.updateMany({
      where: {
        chatId: chatId,
        senderId: {
          not: currentUserId
        },
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return { success: true, updatedCount: markAsRead.count };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_READ_STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      }
    };
  }
}


export async function getAllWorkspaces(maxResults?: number, nextPage?: number) {
  try {
    const limit = maxResults || 1000;
    const page = nextPage || 1;
    const skip = (page - 1) * limit;

    const [workspaces, totalCount] = await Promise.all([
      prisma.workspaces.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          tenantId: true,
          type: true,
          disabled: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              workspaceMembers: true,
              chats: true,
            }
          },
          owner: {
            select: {
              uid: true,
              name: true,
              email: true,
              avatar: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.workspaces.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      workspaces,
      totalCount,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error('Error fetching all workspaces:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_WORKSPACES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch workspaces',
      },
    };
  }
}


export async function getUserWorkspaces(userId: string) {
  try {
    const workspaces = await prisma.workspaces.findMany({
      where: {
        workspaceMembers: {
          some: {
            userId: userId
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
        workspaceMembers: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            workspaceMembers: true,
            chats: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, workspaces };
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_WORKSPACES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch workspaces'
      }
    };
  }
}

export async function getWorkspace(workspaceId: string, userId: string) {
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: workspaceId,
        workspaceMembers: {
          some: {
            userId: userId
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

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found or access denied'
        }
      };
    }

    return { success: true, workspace };
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch workspace'
      }
    };
  }
}


export async function createWorkspace(
  ownerId: string,
  tenantId: string,
  name: string,
  description?: string,
  type: 'personal' | 'business' = 'personal'
) {
  try {
    const workspace = await prisma.workspaces.create({
      data: {
        name,
        description,
        ownerId,
        tenantId,
        type,
        workspaceMembers: {
          create: {
            userId: ownerId,
            role: 'owner'
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
        workspaceMembers: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    return { success: true, workspace };
  } catch (error) {
    console.error('Error creating workspace:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create workspace'
      }
    };
  }
}


export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: { name?: string; description?: string; disabled?: boolean; settings?: any }
) {
  try {
    // Verify user is owner or admin
    const membership = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId,
        userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!membership) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only workspace owners or admins can update workspace'
        }
      };
    }

    const workspace = await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            uid: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return { success: true, workspace };
  } catch (error) {
    console.error('Error updating workspace:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update workspace'
      }
    };
  }
}


export async function deleteWorkspace(workspaceId: string, userId: string) {
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: workspaceId,
        ownerId: userId
      }
    });

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only workspace owner can delete workspace'
        }
      };
    }

    await prisma.workspaces.delete({
      where: { id: workspaceId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return {
      success: false,
      error: {
        code: 'DELETE_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete workspace'
      }
    };
  }
}


export async function getWorkspaceMembers(workspaceId: string, userId: string) {
  try {
    // Verify user is member of workspace
    const isMember = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId,
        userId
      }
    });

    if (!isMember) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied to workspace'
        }
      };
    }

    const members = await prisma.workspaceMembers.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            disabled: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owner first, then admin, then member
        { joinedAt: 'asc' }
      ]
    });

    return { success: true, members };
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_MEMBERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch members'
      }
    };
  }
}

export async function inviteToWorkspace(
  workspaceId: string,
  inviterId: string,
  inviteeId: string,
  role: 'member' | 'admin' = 'member'
) {
  try {
    // Verify inviter has permission (owner or admin)
    const inviterMembership = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId,
        userId: inviterId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!inviterMembership) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only workspace owners or admins can invite members'
        }
      };
    }

    // Check if user already member
    const existingMember = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId,
        userId: inviteeId
      }
    });

    if (existingMember) {
      return {
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'User is already a member of this workspace'
        }
      };
    }

    // Verify invitee exists and is in same tenant
    const [invitee, workspace] = await Promise.all([
      prisma.users.findUnique({ where: { uid: inviteeId } }),
      prisma.workspaces.findUnique({ where: { id: workspaceId } })
    ]);

    if (!invitee || !workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User or workspace not found'
        }
      };
    }

    if (invitee.tenantId !== workspace.tenantId) {
      return {
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          message: 'User must be in the same tenant as workspace'
        }
      };
    }

    const member = await prisma.workspaceMembers.create({
      data: {
        workspaceId,
        userId: inviteeId,
        role,
        invitedBy: inviterId
      },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return { success: true, member };
  } catch (error) {
    console.error('Error inviting to workspace:', error);
    return {
      success: false,
      error: {
        code: 'INVITE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invite user'
      }
    };
  }
}


export async function removeMemberFromWorkspace(
  workspaceId: string,
  requesterId: string,
  memberId: string
) {
  try {
    // Get requester and member info
    const [requesterMembership, memberToRemove, workspace] = await Promise.all([
      prisma.workspaceMembers.findFirst({
        where: { workspaceId, userId: requesterId }
      }),
      prisma.workspaceMembers.findFirst({
        where: { workspaceId, userId: memberId }
      }),
      prisma.workspaces.findUnique({
        where: { id: workspaceId }
      })
    ]);

    if (!workspace || !requesterMembership || !memberToRemove) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace or member not found'
        }
      };
    }

    // Can't remove the owner
    if (memberId === workspace.ownerId) {
      return {
        success: false,
        error: {
          code: 'CANNOT_REMOVE_OWNER',
          message: 'Cannot remove workspace owner'
        }
      };
    }

    // Check permissions: owner can remove anyone, admin can remove members, members can remove themselves
    const canRemove =
      requesterMembership.role === 'owner' ||
      (requesterMembership.role === 'admin' && memberToRemove.role === 'member') ||
      requesterId === memberId;

    if (!canRemove) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Insufficient permissions to remove member'
        }
      };
    }

    await prisma.workspaceMembers.delete({
      where: { id: memberToRemove.id }
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing member from workspace:', error);
    return {
      success: false,
      error: {
        code: 'REMOVE_MEMBER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove member'
      }
    };
  }
}


export async function updateMemberRole(
  workspaceId: string,
  requesterId: string,
  memberId: string,
  newRole: 'admin' | 'member'
) {
  try {
    // Verify requester is owner or admin
    const [requesterMembership, memberToUpdate, workspace] = await Promise.all([
      prisma.workspaceMembers.findFirst({
        where: { workspaceId, userId: requesterId }
      }),
      prisma.workspaceMembers.findFirst({
        where: { workspaceId, userId: memberId }
      }),
      prisma.workspaces.findUnique({
        where: { id: workspaceId }
      })
    ]);

    if (!workspace || !requesterMembership || !memberToUpdate) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace or member not found'
        }
      };
    }

    // Only owner can change roles
    if (requesterMembership.role !== 'owner') {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only workspace owner can change member roles'
        }
      };
    }

    // Can't change owner's role
    if (memberId === workspace.ownerId) {
      return {
        success: false,
        error: {
          code: 'CANNOT_CHANGE_OWNER_ROLE',
          message: 'Cannot change workspace owner role'
        }
      };
    }

    const updatedMember = await prisma.workspaceMembers.update({
      where: { id: memberToUpdate.id },
      data: { role: newRole },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return { success: true, member: updatedMember };
  } catch (error) {
    console.error('Error updating member role:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ROLE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update role'
      }
    };
  }
}


/**
 * Get user's personal contacts (from their personal workspace)
*/
export async function getMyContacts(userId: string) {
  try {
    const myWorkspace = await prisma.workspaces.findFirst({
      where: {
        ownerId: userId,
        type: 'personal'
      }
    });

    if (!myWorkspace) {
      return {
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Personal workspace not found'
        }
      };
    }

    const contacts = await prisma.workspaceMembers.findMany({
      where: {
        workspaceId: myWorkspace.id,
        userId: { not: userId }
      },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true,
            tenantId: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    return {
      success: true,
      contacts: contacts.map(c => ({
        ...c.user,
        addedAt: c.joinedAt
      }))
    };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_CONTACTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch contacts'
      }
    };
  }
}


export async function searchMyContacts(userId: string, query: string, limit: number = 20) {
  try {
    const myWorkspace = await prisma.workspaces.findFirst({
      where: {
        ownerId: userId,
        type: 'personal'
      }
    });

    if (!myWorkspace) {
      return {
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Personal workspace not found'
        }
      };
    }

    const contacts = await prisma.workspaceMembers.findMany({
      where: {
        workspaceId: myWorkspace.id,
        userId: { not: userId },
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phoneNumber: { contains: query, mode: 'insensitive' } }
          ]
        }
      },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
            phoneNumber: true
          }
        }
      },
      take: limit
    });

    return {
      success: true,
      contacts: contacts.map(c => c.user)
    };
  } catch (error) {
    console.error('Error searching contacts:', error);
    return {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search contacts'
      }
    };
  }
}

/**
 *  Add contact (bidirectional) - Personal users only
*/
export async function addContact(inviterId: string, inviteeIdentifier: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const invitee = await tx.users.findFirst({
        where: {
          OR: [
            { email: inviteeIdentifier.toLowerCase() },
            { phoneNumber: inviteeIdentifier },
            { uid: inviteeIdentifier }
          ]
        }
      });

      if (!invitee) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        };
      }

      if (invitee.uid === inviterId) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Cannot add yourself as contact'
          }
        };
      }

      const [inviterWorkspace, inviteeWorkspace] = await Promise.all([
        tx.workspaces.findFirst({
          where: { ownerId: inviterId, type: 'personal' }
        }),
        tx.workspaces.findFirst({
          where: { ownerId: invitee.uid, type: 'personal' }
        })
      ]);

      if (!inviterWorkspace || !inviteeWorkspace) {
        return {
          success: false,
          error: {
            code: 'WORKSPACE_NOT_FOUND',
            message: 'Personal workspace not found'
          }
        };
      }

      const existingContact = await tx.workspaceMembers.findFirst({
        where: {
          workspaceId: inviterWorkspace.id,
          userId: invitee.uid
        }
      });

      if (existingContact) {
        return {
          success: false,
          error: {
            code: 'ALREADY_CONTACT',
            message: 'User is already in your contacts'
          }
        };
      }

      await tx.workspaceMembers.create({
        data: {
          workspaceId: inviterWorkspace.id,
          userId: invitee.uid,
          role: 'member',
          invitedBy: inviterId
        }
      });

      await tx.workspaceMembers.create({
        data: {
          workspaceId: inviteeWorkspace.id,
          userId: inviterId,
          role: 'member',
          invitedBy: invitee.uid
        }
      }).catch(() => {
        // Ignore if already exists
      });

      return {
        success: true,
        contact: {
          uid: invitee.uid,
          name: invitee.name,
          email: invitee.email,
          avatar: invitee.avatar,
          phoneNumber: invitee.phoneNumber
        }
      };
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    return {
      success: false,
      error: {
        code: 'ADD_CONTACT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add contact'
      }
    };
  }
}

/**
 * 
 * Remove contact (bidirectional)
*/
export async function removeContact(userId: string, contactId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const [userWorkspace, contactWorkspace] = await Promise.all([
        tx.workspaces.findFirst({
          where: { ownerId: userId, type: 'personal' }
        }),
        tx.workspaces.findFirst({
          where: { ownerId: contactId, type: 'personal' }
        })
      ]);

      if (!userWorkspace || !contactWorkspace) {
        return {
          success: false,
          error: {
            code: 'WORKSPACE_NOT_FOUND',
            message: 'Personal workspace not found'
          }
        };
      }
      await Promise.all([
        tx.workspaceMembers.deleteMany({
          where: {
            workspaceId: userWorkspace.id,
            userId: contactId
          }
        }),
        tx.workspaceMembers.deleteMany({
          where: {
            workspaceId: contactWorkspace.id,
            userId: userId
          }
        })
      ]);

      return { success: true };
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    return {
      success: false,
      error: {
        code: 'REMOVE_CONTACT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove contact'
      }
    };
  }
}

/**
 * 
 * Check if two users are contacts
*/
export async function areContacts(userId1: string, userId2: string): Promise<boolean> {
  const workspace = await prisma.workspaces.findFirst({
    where: { ownerId: userId1, type: 'personal' }
  });

  if (!workspace) return false;

  const contact = await prisma.workspaceMembers.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: userId2
    }
  });

  return !!contact;
}


/** * Search users within a workspace */
export async function searchWorkspaceUsers(workspaceId: string, currentUserId: string, query: string, limit: number = 10) {
  try {
    const isMember = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId,
        userId: currentUserId
      }
    });

    if (!isMember) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied to workspace'
        }
      };
    }

    const members = await prisma.workspaceMembers.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        }
      },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      take: limit
    });

    return {
      success: true,
      users: members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    };
  } catch (error) {
    console.error('Error searching workspace users:', error);
    return {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search users'
      }
    };
  }
}

// Soft delete user (anonymize email to release it for reuse)
export async function softDeleteUser(uid: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { uid },
      select: { email: true, deleted: true }
    });

    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      };
    }

    if (user.deleted) {
      return {
        success: true,
        message: 'User already deleted'
      };
    }

    // Anonymize email to release it for reuse with new Firebase UID
    const anonymizedEmail = `deleted_${uid}@deleted.local`;

    await prisma.users.update({
      where: { uid },
      data: {
        deleted: true,
        deletedAt: new Date(),
        disabled: true,
        originalEmail: user.email,  // Preserve original email
        email: anonymizedEmail,      // Release email for reuse
      }
    });

    return {
      success: true,
      message: 'User soft deleted successfully'
    };
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete user'
      }
    };
  }
}