{/*import { createClient } from 'redis'
import { Tenant, User } from '@prisma/client'

const REDIS_URL = process.env.REDIS_URL

export async function syncTenantToRedis(tenant: Tenant) {
  const client = createClient({
    url: REDIS_URL,
  })

  try {
    await client.connect()
    await client.select(0) // Tenant DB

    // Store tenant data
    await client.hSet(`tenant:${tenant.id}`, {
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan,
      maxUsers: tenant.maxUsers.toString(),
      features: JSON.stringify(tenant.features),
    })

    // Store domain lookup
    await client.set(`domain:${tenant.domain}`, `tenant:${tenant.id}`)

  } finally {
    await client.quit()
  }
}

export async function syncUserToRedis(user: User) {
  const client = createClient({
    url: REDIS_URL,
  })

  try {
    await client.connect()
    await client.select(1) // User DB

    // Store user data
    await client.hSet(`user:${user.id}`, {
      email: user.email,
      name: user.name || '',
      tenantId: user.tenantId,
      role: user.isAdmin ? 'admin' : 'user',
      created: user.createdAt.toString(),
    })

    // Add to tenant's user set
    await client.sAdd(`tenant:${user.tenantId}:users`, `user:${user.id}`)

    // Store email lookup
    await client.set(`email:${user.email}`, `user:${user.id}`)

  } finally {
    await client.quit()
  }
}

*/}