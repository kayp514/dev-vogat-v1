import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

async function checkRediSearchAvailable(client) {
  try {
    // Try to execute a RediSearch command
    await client.sendCommand(['FT._LIST']);
    return true;
  } catch (error) {
    console.log('RediSearch module is not available, using standard Redis indexing');
    return false;
  }
}

async function createStandardIndexes(client) {
  // DB 0: Create standard indexes for users
  await client.select(0);
  
  // Create sorted set for email lookups
  const users = await client.keys('user:*');
  for (const userKey of users) {
    const userData = await client.hGetAll(userKey);
    if (userData.email) {
      await client.zAdd('users:by:email', [{
        score: Date.now(),
        value: `${userData.email}:${userKey}`
      }]);
    }
    if (userData.tenantId) {
      await client.sAdd(`tenant:${userData.tenantId}:users`, userKey);
    }
  }

  // DB 2: Create standard indexes for messages
  await client.select(2);
  
  // Create sorted sets for message search
  const threads = await client.keys('tenant:*:thread:*:messages');
  for (const threadKey of threads) {
    const messages = await client.zRange(threadKey, 0, -1);
    for (const message of messages) {
      const messageData = JSON.parse(message);
      // Index by sender
      await client.zAdd(`messages:by:sender:${messageData.senderId}`, [{
        score: parseInt(messageData.timestamp),
        value: message
      }]);
      // Index by tenant
      if (messageData.tenantId) {
        await client.zAdd(`tenant:${messageData.tenantId}:messages`, [{
          score: parseInt(messageData.timestamp),
          value: message
        }]);
      }
    }
  }
}

async function createSearchIndexes(client) {
  const hasRediSearch = await checkRediSearchAvailable(client);

  if (hasRediSearch) {
    // Create RediSearch indexes if available
    try {
      // DB 0: Create index for users
      await client.select(0);
      await client.ft.create('idx:users', {
        'email': {
          type: 'TEXT',
          SORTABLE: true
        },
        'tenantId': {
          type: 'TAG',
          SORTABLE: true
        }
      }, 'PREFIX', 1, 'user:');
      console.log('RediSearch user index created');

      // DB 2: Create index for messages
      await client.select(2);
      await client.ft.create('idx:messages', {
        'senderId': {
          type: 'TAG',
          SORTABLE: true
        },
        'timestamp': {
          type: 'NUMERIC',
          SORTABLE: true
        }
      }, 'PREFIX', 1, 'tenant:*:thread:*:messages:');
      console.log('RediSearch message index created');
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log('RediSearch indexes already exist');
      } else {
        throw e;
      }
    }
  } else {
    // Create standard Redis indexes as fallback
    await createStandardIndexes(client);
    console.log('Standard Redis indexes created');
  }
}

async function setupRedisDatabase() {
  const client = createClient({
    url: REDIS_URL
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await client.connect();
    console.log('Connected to Redis');

    // Database Indexes:
    // DB 0: Tenant/Organization data
    // DB 1: User data and mappings
    // DB 2: Real-time presence and status
    // DB 3: Chat messages and threads
    // DB 4: SMS messages
    
    // DB 0: Tenant Data
    await client.select(0);
    
    // Tenant hash
    await client.hSet('tenant:1', {
      name: 'Acme Corp',
      domain: 'acme.com',
      plan: 'enterprise',
      maxUsers: '100',
      features: JSON.stringify(['chat', 'sms', 'voice'])
    });

    // Global tenant lookup by domain
    await client.set('domain:acme.com', 'tenant:1');
    
    // DB 1: User Data
    await client.select(1);
    
    // User profile hash with tenant mapping
    await client.hSet('user:1', {
      email: 'john@acme.com',
      name: 'John Doe',
      tenantId: '1',
      role: 'admin',
      created: Date.now().toString()
    });

    // Tenant-User mapping (Set)
    await client.sAdd('tenant:1:users', 'user:1', 'user:2');
    
    // Email to user ID lookup (for login)
    await client.set('email:john@acme.com', 'user:1');

    // DB 2: Presence & Status
    await client.select(2);
    
    // User status hash with tenant context (expires in 24h)
    await client.hSet('status:tenant:1:user:1', {
      status: 'online',
      lastSeen: Date.now().toString(),
      device: 'web',
      tenantId: '1'
    });
    await client.expire('status:tenant:1:user:1', 24 * 60 * 60);

    // Tenant's online users set
    await client.sAdd('tenant:1:online', 'user:1');
    await client.expire('tenant:1:online', 24 * 60 * 60);

    // DB 3: Chat Messages
    await client.select(3);
    
    // Chat thread sorted set with tenant context
    const messageData = {
      id: 'msg:1',
      senderId: 'user:1',
      content: 'Hello!',
      timestamp: Date.now().toString(),
      tenantId: '1'
    };

    await client.zAdd('tenant:1:thread:1:messages', [{
      score: Date.now(),
      value: JSON.stringify(messageData)
    }]);

    // Thread metadata hash with tenant context
    await client.hSet('tenant:1:thread:1', {
      participants: JSON.stringify(['user:1', 'user:2']),
      tenantId: '1',
      created: Date.now().toString(),
      lastActivity: Date.now().toString()
    });

    // User's threads set within tenant context
    await client.sAdd('tenant:1:user:1:threads', 'thread:1');

    // DB 4: SMS Messages
    await client.select(4);
    
    // SMS message hash with tenant context
    await client.hSet('tenant:1:sms:1', {
      from: 'user:1',
      to: '+1234567890',
      content: 'External SMS',
      status: 'delivered',
      timestamp: Date.now().toString(),
      operatorId: 'sip:1',
      tenantId: '1'
    });

    // Tenant's SMS history sorted set
    await client.zAdd('tenant:1:user:1:sms', [{
      score: Date.now(),
      value: 'sms:1'
    }]);

    // Create secondary indexes using standard Redis commands
    
    // User search by email within tenant
    await client.select(1);
    await client.sAdd('tenant:1:emails', 'john@acme.com');
    
    // Thread search by participant within tenant
    await client.select(3);
    await client.sAdd('tenant:1:user:1:participated', 'thread:1');

    // Create indexes with fallback
    await createSearchIndexes(client);

    console.log('Redis database structure created successfully');
  } catch (error) {
    console.error('Error setting up Redis database:', error);
    throw error;
  } finally {
    await client.quit();
    console.log('Setup complete');
  }
}

// Run setup
setupRedisDatabase().catch(console.error);