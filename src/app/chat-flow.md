const firestoreData = {
  tenants: {
    'tenant123': {
      users: {
        'user123': {
          displayName: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://...',
          lastActive: { seconds: 1234567890, nanoseconds: 0 }
        }
      },
      chats: {
        'chat123': {
          participants: ['user123', 'user456'],
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
          lastMessage: {
            text: 'Hello!',
            timestamp: { seconds: 1234567890, nanoseconds: 0 },
            senderId: 'user123'
          },
          messages: {
            'msg123': {
              senderId: 'user123',
              timestamp: { seconds: 1234567890, nanoseconds: 0 },
              text: 'Hello!',
              status: 'delivered',
              type: 'text'
            }
          }
        }
      }
    }
  }
};





// Base Types
interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

// User Collection Types
interface UserData {
  displayName: string;
  email: string;
  avatar?: string;
  lastActive?: Timestamp;
  status?: 'online' | 'offline';
}

// Chat Types
interface ChatData {
  participants: string[];  // Array of userIds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
}

// Message Types
interface MessageData {
  senderId: string;
  timestamp: Timestamp;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  };
}

// Firestore Path Types
type FirestorePaths = {
  // Collection paths
  TENANTS: 'tenants',
  USERS: (tenantId: string) => `tenants/${tenantId}/users`,
  CHATS: (tenantId: string) => `tenants/${tenantId}/chats`,
  MESSAGES: (tenantId: string, chatId: string) => `tenants/${tenantId}/chats/${chatId}/messages`,

  // Document paths
  USER: (tenantId: string, userId: string) => `tenants/${tenantId}/users/${userId}`,
  CHAT: (tenantId: string, chatId: string) => `tenants/${tenantId}/chats/${chatId}`,
  MESSAGE: (tenantId: string, chatId: string, messageId: string) => 
    `tenants/${tenantId}/chats/${chatId}/messages/${messageId}`,
}

// Firestore Document References
interface FirestoreDocuments {
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

// Query Types
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

// Example usage:
type ChatDocument = {
  id: string;
  data: ChatData;
  messages: Collection<MessageData>;
}

type MessageDocument = {
  id: string;
  data: MessageData;
}

// Helper type for Firestore collections
type Collection<T> = {
  [id: string]: T;
}