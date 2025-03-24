import { createClient } from 'redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env.local');


const result = dotenv.config({ path: envPath });
if (result.error) {
    console.log('Error loading .env.local:', result.error);
}

const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

console.log("Redis URL:", REDIS_URL);
console.log("Redis Password:", REDIS_PASSWORD);

if (!REDIS_URL || !REDIS_PASSWORD) {
    console.error('Redis environment variables are missing!');
    process.exit(1);  
}


const RedisKeys = {
  USER_DATA: (tenantId, userId) => `tenant:${tenantId}:user:${userId}`,
  CHAT_DATA: (tenantId, chatId) => `tenant:${tenantId}:chat:${chatId}`,
  CHAT_MESSAGES: (tenantId, chatId) => `tenant:${tenantId}:chat:${chatId}:messages`,
  USER_CHATS: (tenantId, userId) => `tenant:${tenantId}:user:${userId}:chats`
};

async function setupRedisDatabase() {
  const client = createClient({
    url: REDIS_URL,
    password: REDIS_PASSWORD
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await client.connect();
    console.log('Connected to Redis');

    // Sample Data Setup
    const tenantId = 'tenant1';
    const timestamp = Date.now();

    // Setup User Data
    const user1Data = {
      displayName: 'John Doe',
      email: 'john@acme.com',
      avatar: 'https://example.com/avatar1.jpg',
      lastActive: timestamp,
      status: 'online'
    };

    const user2Data = {
      displayName: 'Jane Smith',
      email: 'jane@acme.com',
      avatar: 'https://example.com/avatar2.jpg',
      lastActive: timestamp,
      status: 'offline'
    };

    // Store User Data
    await client.hSet(
      RedisKeys.USER_DATA(tenantId, 'user1'),
      user1Data
    );

    await client.hSet(
      RedisKeys.USER_DATA(tenantId, 'user2'),
      user2Data
    );

    // Setup Chat Data
    const chatData = {
      participants: JSON.stringify(['user1', 'user2']),
      createdAt: timestamp.toString(),
      updatedAt: timestamp.toString(),
      lastMessage: JSON.stringify({
        text: 'Hello!',
        timestamp: timestamp.toString(),
        senderId: 'user1'
      })
    };

    await client.hSet(
      RedisKeys.CHAT_DATA(tenantId, 'chat1'),
      chatData
    );

    // Setup Chat Messages
    const message1 = {
      senderId: 'user1',
      timestamp: timestamp,
      text: 'Hello!',
      status: 'delivered',
      type: 'text'
    };

    const message2 = {
      senderId: 'user2',
      timestamp: timestamp + 1000,
      text: 'Hi there!',
      status: 'delivered',
      type: 'text'
    };

    // Store messages in a sorted set with timestamp as score
    await client.zAdd(
      RedisKeys.CHAT_MESSAGES(tenantId, 'chat1'),
      [
        {
          score: message1.timestamp,
          value: JSON.stringify(message1)
        },
        {
          score: message2.timestamp,
          value: JSON.stringify(message2)
        }
      ]
    );

    // Setup User's Chat Lists
    await client.zAdd(
      RedisKeys.USER_CHATS(tenantId, 'user1'),
      [{
        score: timestamp,
        value: 'chat1'
      }]
    );

    await client.zAdd(
      RedisKeys.USER_CHATS(tenantId, 'user2'),
      [{
        score: timestamp,
        value: 'chat1'
      }]
    );

    // Create indexes if RediSearch is available
    const hasRediSearch = await checkRediSearchAvailable(client);
    if (hasRediSearch) {
      await createSearchIndexes(client);
    }

    console.log('Redis database structure created successfully');
  } catch (error) {
    console.error('Error setting up Redis database:', error);
    throw error;
  } finally {
    await client.quit();
    console.log('Setup complete');
  }
}

async function checkRediSearchAvailable(client) {
  try {
    await client.sendCommand(['FT._LIST']);
    return true;
  } catch (error) {
    console.log('RediSearch module is not available');
    return false;
  }
}

async function createSearchIndexes(client) {
  try {
    // Create index for users
    await client.ft.create('idx:users', {
      'displayName': {
        type: 'TEXT',
        SORTABLE: true
      },
      'email': {
        type: 'TEXT',
        SORTABLE: true
      },
      'status': {
        type: 'TAG',
        SORTABLE: true
      }
    }, {
      ON: 'HASH',
      PREFIX: 'tenant:*:user:'
    });

    // Create index for chat messages
    await client.ft.create('idx:messages', {
      'text': {
        type: 'TEXT'
      },
      'senderId': {
        type: 'TAG',
        SORTABLE: true
      },
      'timestamp': {
        type: 'NUMERIC',
        SORTABLE: true
      }
    }, {
      ON: 'JSON',
      PREFIX: 'tenant:*:chat:*:messages'
    });

    console.log('RediSearch indexes created successfully');
  } catch (e) {
    if (e.message === 'Index already exists') {
      console.log('RediSearch indexes already exist');
    } else {
      throw e;
    }
  }
}

// Run setup
setupRedisDatabase().catch(console.error);