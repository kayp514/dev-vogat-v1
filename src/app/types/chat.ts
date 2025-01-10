export type ChatStatus = 'online' | 'busy' | 'offline';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  content?: string;
  timestamp?: string;
  status?: ChatStatus;
}

export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
  avatar?: string;
}

export interface UserData {
    displayName: string;
    email: string;
    uid: string;
    photoURL: string;
    status: ChatStatus;
  }
