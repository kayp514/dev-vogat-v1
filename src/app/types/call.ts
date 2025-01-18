import { CallState, CallType } from '@/lib/type'

export interface UserInfo {
    id: string
    name: string
    avatar?: string
    phoneNumber: string
    status?: 'online' | 'offline' | 'busy'
  }

  export interface Participant extends UserInfo {
    isVideoOn: boolean
    isMuted: boolean
    isHost?: boolean
    role: 'caller' | 'callee' | 'participant'
  }

export interface CallerInfo {
  id: string;
  name: string;
  avatar?: string;
  phoneNumber: string;
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
    caller: UserInfo // The user who initiated the call
    callee: UserInfo // The user who received the call
    participants: Participant[] // All participants including caller and callee
    startTime?: Date
    endTime?: Date
  }

export function createParticipant(
    userInfo: UserInfo,
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
    caller: UserInfo,
    callee: UserInfo,
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
