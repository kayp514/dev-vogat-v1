import { prisma }from "../prisma"
import type { DatabaseUserInput } from "@/lib/db/types"
import { syncUserToRedis } from "./redis-sync"

export async function createUser(input: DatabaseUserInput | null) {
    console.log("user: createUser received input:", input); 
  if (!input) {
    console.error("user: Input is null in createUser");
    throw new Error("User input data is required")
  }


  try {
    // Create a sanitized version of the input data
    const sanitizedData = {
        uid: input.uid,
        email: input.email.toLowerCase(),
        name: input.name,
        avatar: input.avatar,
        tenantId: input.tenantId,
        isAdmin: input.isAdmin,
        phoneNumber: input.phoneNumber,
        emailVerified: input.emailVerified,
        CreatedAt: input.CreatedAt,
        LastSignInAt: input.LastSignInAt,
        updatedAt: new Date(),
        active: true,
      }

    console.log("user: Cleaned user data:", sanitizedData)


    const user = await prisma.users.create({
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
        active: true,
        updatedAt: true,
        CreatedAt: true,
        LastSignInAt: true,
      },
    })

    if (!user) {
      throw new Error("Failed to create user: No user returned from database")
    }

    console.log("Prisma create operation returned:", user); 

    // Sync user data to Redis
    await syncUserToRedis({
        uid: user.uid,
        tenantId: user.tenantId,
        name: user.name || '',
        email: user.email,
        avatar: user.avatar || '',
        lastActive: user.updatedAt.getTime(),
        status: 'online',
        isAdmin: user.isAdmin,
        disabled: user.active
    });

    return user
  } catch (error) {
    console.error("Detailed error in createUser:", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        throw new Error("User with this email or uid already exists")
      }
      if (error.message.includes("Foreign key constraint")) {
        throw new Error("Invalid tenant ID")
      }
      throw new Error(`Failed to create user: ${error.message}`)
    }
    throw new Error("Failed to create user: Unknown error")
  }
}


export async function verifyDatabaseUser(uid: string): Promise<{
  success: boolean;
  user?: {
    uid: string;
    email: string;
    name: string | null;
    tenantId: string;
    isAdmin: boolean;
    emailVerified: boolean;
    active: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  try {
    const dbUser = await prisma.users.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        name: true,
        tenantId: true,
        isAdmin: true,
        emailVerified: true,
        active: true,
      }
    })

    if (!dbUser) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      }
    }

    if (!dbUser.active) {
      return {
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      }
    }

    return {
      success: true,
      user: dbUser
    }
  } catch (error) {
    console.error('Error verifying database user:', error)
    return {
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify user'
      }
    }
  }
}

