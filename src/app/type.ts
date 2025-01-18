import { CallState, CallType } from '@/lib/type'

export type UserStatus = 'online' | 'busy' | 'offline' | 'unknown';
export type Role = 'caller' | 'callee' | 'participant';



  export interface UserData {
    id: string;
    name: string;
    email: string;
    uid: string;
    avatar: string;
    phoneNumber: string;
    status: UserStatus;
  }


  export interface Participant extends UserData {
    isVideoOn: boolean
    isMuted: boolean
    isHost?: boolean
    role: Role
  }

export interface CallerInfo extends UserData {
  isVideoOn?: boolean;
  isMuted?: boolean;
  isHost?: boolean;
}

export interface CallSession {
    id: string
    isActive: boolean
    isMaximized: boolean
    callState: CallState
    callType: CallType
    caller: UserData // The user who initiated the call
    callee: UserData // The user who received the call
    participants: Participant[] // All participants including caller and callee
    startTime?: Date
    endTime?: Date
  }

export function createParticipant(
    userInfo: UserData,
    role: Participant['role'],
    isHost: boolean = false
  ): Participant {
    return {
      ...userInfo,
      role,
      isHost,
      isVideoOn: false,
      isMuted: false,
    }
  }


  export function initializeCallSession(
    sessionId: string,
    caller: UserData,
    callee: UserData,
    type: CallType
  ): CallSession {
    const callerParticipant = createParticipant(caller, 'caller', true)
    const calleeParticipant = createParticipant(callee, 'callee', false)
  
    return {
      id: sessionId,
      isActive: true,
      isMaximized: false,
      callState: 'initial',
      callType: type,
      caller,
      callee,
      participants: [callerParticipant, calleeParticipant],
    }
  }

  export interface Chat {
    id: string;
    name: string;
    avatar: string;
    lastMessage?: string;
    content?: string;
    timestamp?: string;
    status?: UserStatus;
  }
  
  export interface Message {
    id: number;
    content: string;
    sender: string;
    timestamp: string;
    avatar?: string;
  }

