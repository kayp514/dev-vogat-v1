import { createClient, type RedisClientType } from 'redis';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import type { User, ChatDataRedis, MessageDataRedis } from '../../app/types/chat';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env.local');

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.log('Error loading .env:', result.error);
}



const REDIS_URL = process.env.REDIS_URL;


if (!REDIS_URL) {
    console.error('Redis environment variables are missing!');
    process.exit(1);  
}

export const RedisKeys = {
  USER_DATA: (tenantId: string, userId: string) => `tenant:${tenantId}:user:${userId}`,
  CHAT_DATA: (tenantId: string, chatId: string) => `tenant:${tenantId}:chat:${chatId}`,
  CHAT_MESSAGES: (tenantId: string, chatId: string) => `tenant:${tenantId}:chat:${chatId}:messages`,
  USER_CHATS: (tenantId: string, userId: string) => `tenant:${tenantId}:user:${userId}:chats`
};

let redisClient: RedisClientType | null = null;

// Redis client singleton

async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
      redisClient = createClient({
          url: REDIS_URL,
          //password: REDIS_PASSWORD
      });

      redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
          redisClient = null;
      });

      await redisClient.connect();
  }

  if (!redisClient.isOpen) {
      await redisClient.connect();
  }

  return redisClient;
}

// User Operations

export async function syncUserToRedis(user: User) {
  try {
      const client = await getRedisClient();
      const redisUserData = {
          uid: user.uid,
          tenantId: user.tenantId,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          lastActive: Date.now().toString() || Date.now().toString(),
          status: user.status || 'offline',
          isAdmin: user.isAdmin.toString(),
          disabled: user.disabled.toString()  
      };

      await client.hSet(
          RedisKeys.USER_DATA(user.tenantId, user.uid),
          redisUserData
      );

      console.log('User synced to Redis:', user.uid);
  } catch (error) {
      console.error('Error syncing user to Redis:', error);
  }
}

// Chat Operations
export async function createChat(tenantId: string, chatData: ChatDataRedis) {
  try {
      const client = await getRedisClient();
      const chatId = `chat:${uuidv4()}`;

      const redisChatData = {
          participants: JSON.stringify(chatData.participants),
          createdAt: chatData.createdAt.toString(),
          updatedAt: chatData.updatedAt.toString(),
          lastMessage: chatData.lastMessage ? JSON.stringify(chatData.lastMessage) : ''
      };

      await client.hSet(
          RedisKeys.CHAT_DATA(tenantId, chatId),
          redisChatData
      );

      // Add chat to participants' chat lists
      for (const userId of chatData.participants) {
          await client.zAdd(
              RedisKeys.USER_CHATS(tenantId, userId),
              [{
                  score: Date.now(),
                  value: chatId
              }]
          );
      }

      return chatId;
  } catch (error) {
      console.error('Error creating chat in Redis:', error);
      throw error;
  }
}

// Message Operations

export async function addMessage(tenantId: string, chatId: string, messageData: MessageDataRedis) {
  try {
      const client = await getRedisClient();
      
      await client.zAdd(
          RedisKeys.CHAT_MESSAGES(tenantId, chatId),
          [{
              score: messageData.timestamp,
              value: JSON.stringify(messageData)
          }]
      );

      // Update chat's last message
      const chatKey = RedisKeys.CHAT_DATA(tenantId, chatId);
      await client.hSet(chatKey, {
          lastMessage: JSON.stringify({
              text: messageData.text,
              timestamp: messageData.timestamp,
              senderId: messageData.senderId
          }),
          updatedAt: messageData.timestamp.toString()
      });

  } catch (error) {
      console.error('Error adding message to Redis:', error);
      throw error;
  }
}

//query operations
export async function getUserChats(tenantId: string, userId: string, limit = 20) {
  try {
      const client = await getRedisClient();
      
      const chatIds = await client.zRange(
        RedisKeys.USER_CHATS(tenantId, userId),
        0,
        limit - 1,
        {
            REV: true // This makes it reverse order
        }
    );

      const chats = await Promise.all(
          chatIds.map(async (chatId) => {
              const chatData = await client.hGetAll(
                  RedisKeys.CHAT_DATA(tenantId, chatId)
              );
              return { id: chatId, ...chatData };
          })
      );

      return chats;
  } catch (error) {
      console.error('Error getting user chats from Redis:', error);
      throw error;
  }
}

export async function getChatMessages(
  tenantId: string,
  chatId: string,
  limit = 50,
  beforeTimestamp?: number
) {
  try {
      const client = await getRedisClient();
      
      const messages = await client.zRange(
          RedisKeys.CHAT_MESSAGES(tenantId, chatId),
          beforeTimestamp ? beforeTimestamp.toString() : '-inf',
          beforeTimestamp ? '-inf' : '+inf',
          {
            LIMIT: {
                count: limit,
                offset: 0
            }
        }
    );

      return messages.map(msg => JSON.parse(msg));
  } catch (error) {
      console.error('Error getting chat messages from Redis:', error);
      throw error;
  }
}

// Cleanup
process.on('SIGTERM', async () => {
  if (redisClient) {
      await redisClient.quit();
      redisClient = null;
  }
});

export default {
  syncUserToRedis,
  createChat,
  addMessage,
  getUserChats,
  getChatMessages,
  RedisKeys
};
