import type { UserStatus, ChatStatus, MessageType } from '@/app/type'


export interface UserData {
    displayName: string;
    email: string;
    uid: string;
    photoURL: string;
    status: UserStatus;
}

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}


export interface ChatData {
  participants: string[];  // Array of userIds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
}


export interface MessageData {
  senderId: string;
  timestamp: Timestamp;
  text: string;
  status: ChatStatus;
  type: MessageType;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  };
}

export interface FirestoreDocuments {
  tenant: {
    id: string;
    users: Collection<UserData>;
    chats: Collection<ChatData>;
  };
  chat: {
    id: string;
    messages: Collection<MessageData>;
  };
}

export type Collection<T> = {
  [id: string]: T;
}

export type MessageDocument = {
  id: string;
  data: MessageData;
}


export type ChatDocument = {
  id: string;
  data: ChatData;
  messages: Collection<MessageData>;
}



interface ChatQuery {
  tenantId: string;
  userId: string;
  limit?: number;
  lastChatId?: string;
}

interface MessageQuery {
  tenantId: string;
  chatId: string;
  limit?: number;
  lastMessageId?: string;
}

//Redis: type: The data types remain similar but need to be serializable for Redis
export interface User {
  uid: string;
  tenantId: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive?: number;
  status?: UserStatus;
  isAdmin: boolean;
  disabled: boolean;
}

export interface ChatDataRedis {
  participants: string[];
  createdAt: number;
  updatedAt: number;
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
}

export interface MessageDataRedis {
  senderId: string;
  timestamp: number;
  text: string;
  status: ChatStatus;
  type: MessageType;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  };
}

// Example of Redis data structure:
const redisData = {
  // User data (Hash)
  'tenant:tenant123:user:user123': {
    displayName: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://...',
    lastActive: '1234567890'
  },

  // Chat data (Hash)
  'tenant:tenant123:chat:chat123': {
    participants: JSON.stringify(['user123', 'user456']),
    createdAt: '1234567890',
    updatedAt: '1234567890',
    lastMessage: JSON.stringify({
      text: 'Hello!',
      timestamp: '1234567890',
      senderId: 'user123'
    })
  },

  // Chat messages (Sorted Set with timestamp as score)
  'tenant:tenant123:chat:chat123:messages': {
    // score: timestamp, member: JSON string of message data
    '1234567890': JSON.stringify({
      senderId: 'user123',
      timestamp: '1234567890',
      text: 'Hello!',
      status: 'delivered',
      type: 'text'
    })
  },

  // User's chats (Sorted Set with last message timestamp as score)
  'tenant:tenant123:user:user123:chats': {
    // score: last message timestamp, member: chatId
    '1234567890': 'chat123'
  }
};

// Redis Commands Helper Types
interface RedisCommands {
  // Hash operations
  HSET(key: string, field: string, value: string): Promise<number>;
  HGET(key: string, field: string): Promise<string | null>;
  HGETALL(key: string): Promise<Record<string, string>>;

  // Sorted Set operations
  ZADD(key: string, score: number, member: string): Promise<number>;
  ZRANGE(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]>;
  ZREVRANGE(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]>;
}
