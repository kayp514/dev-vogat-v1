import { PrismaClient, Tenant, User } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateTenantInput {
  name: string
  domain: string
  description?: string
  logo?: string
  plan?: string
  maxUsers?: number
  features?: string[]
}

export interface CreateAdminInput {
  email: string
  name: string
  password: string // Should be pre-hashed
}

export async function createTenantWithAdmin(
  tenantData: CreateTenantInput,
  adminData: CreateAdminInput
): Promise<{ tenant: Tenant; admin: User }> {
  return await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: tenantData.name,
        domain: tenantData.domain,
        description: tenantData.description,
        logo: tenantData.logo,
        plan: tenantData.plan || 'basic',
        maxUsers: tenantData.maxUsers || 5,
        features: tenantData.features || [],
      },
    })

    // Create admin user
    const admin = await tx.user.create({
      data: {
        email: adminData.email,
        name: adminData.name,
        password: adminData.password,
        isAdmin: true,
        tenantId: tenant.id,
      },
    })

    return { tenant, admin }
  })
}

export async function addUserToTenant(
  tenantId: string,
  userData: {
    email: string
    name: string
    password: string // Should be pre-hashed
  }
): Promise<User> {
  return await prisma.$transaction(async (tx) => {
    // Get current user count
    const userCount = await tx.user.count({
      where: { tenantId },
    })

    // Get tenant to check maxUsers
    const tenant = await tx.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    })

    if (userCount >= tenant.maxUsers) {
      throw new Error(`Tenant has reached maximum user limit of ${tenant.maxUsers}`)
    }

    // Create new user
    return await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password,
        tenantId,
      },
    })
  })
}

export async function getTenantWithUsers(tenantId: string) {
  return await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          active: true,
          lastLogin: true,
        },
      },
    },
  })
}

export async function updateTenantMaxUsers(tenantId: string, newMaxUsers: number) {
  return await prisma.$transaction(async (tx) => {
    // Get current user count
    const userCount = await tx.user.count({
      where: { tenantId },
    })

    if (newMaxUsers < userCount) {
      throw new Error(
        `Cannot reduce maxUsers below current user count of ${userCount}`
      )
    }

    return await tx.tenant.update({
      where: { id: tenantId },
      data: { maxUsers: newMaxUsers },
    })
  })
}