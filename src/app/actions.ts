"use server"

import { createUser } from "@/lib/db/user"
import { prisma } from "@/lib/prisma"
import type { FirebaseAuthUser, DatabaseUserInput, SignUpResult } from "@/lib/db/types"

const DEFAULT_TENANT_ID = 'default'


export async function createDatabaseUser(firebaseUser: FirebaseAuthUser): Promise<SignUpResult> {
    //console.log("1. createDatabaseUser received:", JSON.stringify(firebaseUser, null, 2))

  if (!firebaseUser || typeof firebaseUser !== "object") {
    //console.error("2. Invalid input:", firebaseUser)
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid or missing Firebase user data",
      },
    }
  }

  try {
    const existingTenant = await prisma.tenants.findUnique({
        where: { id: DEFAULT_TENANT_ID },
      })
  
      if (!existingTenant) {
        console.log("Creating default tenant...")
        await prisma.tenants.create({
          data: {
            id: DEFAULT_TENANT_ID,
            name: 'LifeSprint',
            domain: 'lifesprintcare.ca',
            description: 'Default organization for new users',
            plan: 'basic',
            maxUsers: 300,
            active: true,
          },
        })
      }

    const userInput: DatabaseUserInput = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName ?? null,
      avatar: firebaseUser.photoURL ?? null,
      tenantId: firebaseUser.tenantId || 'default',
      isAdmin: true,
      phoneNumber: firebaseUser.phoneNumber ?? null,
      emailVerified: firebaseUser.emailVerified ?? false,
      CreatedAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      LastSignInAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime)
        : new Date(),
    }
    //console.log("3. Transformed to DatabaseUserInput:", JSON.stringify(userInput, null, 2))

    const user = await createUser(userInput)
   // console.log("4. Database user created:", JSON.stringify(user, null, 2))

    if (!user) {
        throw new Error("No user returned from database creation")
      }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        tenantId: user.tenantId,
        emailVerified: user.emailVerified,
      },
    }
  } catch (error) {
    console.error("5. Error in createDatabaseUser:", error)
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Failed to create user in database",
      },
    }
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

