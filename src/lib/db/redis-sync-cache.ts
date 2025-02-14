import { createClient, type RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import type { User, ChatData, MessageDataRedis } from '@/app/types/chat';

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  USER: 3600,        // 1 hour
  CHAT: 1800,        // 30 minutes
  MESSAGES: 900,     // 15 minutes
  PRESENCE: 300      // 5 minutes
};

// Cache keys structure
export const CacheKeys = {
  USER_DATA: (tenantId: string, userId: string) => `cache:tenant:${tenantId}:user:${userId}`,
  CHAT_DATA: (tenantId: string, chatId: string) => `cache:tenant:${tenantId}:chat:${chatId}`,
  CHAT_MESSAGES: (tenantId: string, chatId: string) => `cache:tenant:${tenantId}:chat:${chatId}:messages`,
  USER_PRESENCE: (tenantId: string, userId: string) => `cache:tenant:${tenantId}:presence:${userId}`,
  USER_TYPING: (tenantId: string, chatId: string, userId: string) => 
    `cache:tenant:${tenantId}:typing:${chatId}:${userId}`
};

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Cache Error:', err);
      redisClient = null;
    });

    await redisClient.connect();
  }
  return redisClient;
}

// User Cache Operations
export async function cacheUserData(user: User) {
  try {
    const client = await getRedisClient();
    const key = CacheKeys.USER_DATA(user.tenantId, user.uid);
    
    await client.hSet(key, {
        uid: user.uid,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        lastActive: Date.now().toString() || Date.now().toString(),
        status: user.status || 'offline',
        isAdmin: user.isAdmin.toString(),
        disabled: user.disabled.toString() 
    });
    await client.expire(key, CACHE_TTL.USER);
    
  } catch (error) {
    console.error('Error caching user data:', error);
    // Don't throw - cache errors shouldn't break the app
  }
}

// Presence Management
export async function updateUserPresence(tenantId: string, userId: string, status: 'online' | 'offline') {
  try {
    const client = await getRedisClient();
    const key = CacheKeys.USER_PRESENCE(tenantId, userId);
    
    await client.set(key, status);
    await client.expire(key, CACHE_TTL.PRESENCE);
    
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
}

// Chat Cache Operations
export async function cacheRecentMessages(tenantId: string, chatId: string, messages: MessageDataRedis[]) {
  try {
    const client = await getRedisClient();
    const key = CacheKeys.CHAT_MESSAGES(tenantId, chatId);
    
    // Store only last 50 messages in cache
    const messagesToCache = messages.slice(-50);
    
    await client.del(key); // Clear existing cache
    
    // Add messages to sorted set with timestamp as score
    for (const msg of messagesToCache) {
      await client.zAdd(key, [{
        score: Number(msg.timestamp),
        value: JSON.stringify(msg)
      }]);
    }
    
    await client.expire(key, CACHE_TTL.MESSAGES);
    
  } catch (error) {
    console.error('Error caching recent messages:', error);
  }
}

export async function getCachedMessages(tenantId: string, chatId: string): Promise<MessageDataRedis[]> {
  try {
    const client = await getRedisClient();
    const key = CacheKeys.CHAT_MESSAGES(tenantId, chatId);
    
    const messages = await client.zRange(key, 0, -1);
    return messages.map(msg => JSON.parse(msg));
    
  } catch (error) {
    console.error('Error getting cached messages:', error);
    return []; // Return empty array on cache miss
  }
}

// Typing Indicator
export async function setUserTyping(tenantId: string, chatId: string, userId: string) {
  try {
    const client = await getRedisClient();
    const key = CacheKeys.USER_TYPING(tenantId, chatId, userId);
    
    await client.set(key, 'typing');
    await client.expire(key, 10); // Expire after 10 seconds
    
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
}

// Cache Cleanup
export async function invalidateUserCache(tenantId: string, userId: string) {
  try {
    const client = await getRedisClient();
    await client.del(CacheKeys.USER_DATA(tenantId, userId));
  } catch (error) {
    console.error('Error invalidating user cache:', error);
  }
}

export async function invalidateChatCache(tenantId: string, chatId: string) {
  try {
    const client = await getRedisClient();
    await client.del(CacheKeys.CHAT_DATA(tenantId, chatId));
    await client.del(CacheKeys.CHAT_MESSAGES(tenantId, chatId));
  } catch (error) {
    console.error('Error invalidating chat cache:', error);
  }
}

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
});

export default {
  cacheUserData,
  updateUserPresence,
  cacheRecentMessages,
  getCachedMessages,
  setUserTyping,
  invalidateUserCache,
  invalidateChatCache,
  CacheKeys
};