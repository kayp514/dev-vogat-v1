export type ChatStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'file';


export interface UserData {
    displayName: string;
    email: string;
    uid: string;
    photoURL: string;
    status: ChatStatus;
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