export type ChatStatus = 'online' | 'busy' | 'offline';

export interface Chat {
  id: string | number;
  name: string;
  avatar: string;
  lastMessage?: string;
  content?: string;
  timestamp?: string;
  date?: string;
  dateTime?: string;
  status?: ChatStatus;
}

export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
  avatar?: string;
}
