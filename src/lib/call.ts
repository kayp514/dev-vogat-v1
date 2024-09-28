import {
  UserAgent,
  UserAgentOptions,
  Inviter,
  SessionState,
  Registerer,
  Session,
  URI,
  InvitationAcceptOptions,
  RegistererOptions,
  Invitation,
  InviterOptions,
  InviterInviteOptions,
  Web,
  RegistererState,
  SessionDescriptionHandlerOptions,
  SessionDescriptionHandler,
} from 'sip.js';

import { Transport, TransportOptions } from 'sip.js/lib/platform/web/transport';


let userAgent: UserAgent | null = null;
let registerer: Registerer | null = null;
let currentSession: Session | null = null;

export type SIPResponse = {
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export type SIPConfig = {
  username: string;
  password: string;
  server: string;
  port: number;
  protocol: 'udp' | 'tcp' | 'tls';
  socket: string;
}

interface CustomSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
  hold?: boolean;
}


class CustomTransport extends Transport {
  constructor(logger: any, options: any) {
    super(logger, options);
  }

  public send(message: string): Promise<void> {
    console.log('Sending message:', message);
    return super.send(message);
  }

  public async connect(): Promise<void> {
    console.log('Connecting transport');
    await super.connect();
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting transport');
    await super.disconnect();
  }

}

function isInviterOrInvitation(session: Session): session is Inviter | Invitation {
  return 'terminate' in session && typeof session.terminate === 'function';
}

export async function initializeSIP(): Promise<SIPResponse> {
  if (userAgent) {
    console.log('UserAgent already initialized');
    return { status: 'warning', message: 'UserAgent already initialized' };
  }

  const sipConfig = getSavedSIPConfig();
  if (!sipConfig) {
    return { status: 'error', message: 'SIP configuration not found' };
  }

  try {
    const uri = UserAgent.makeURI(`sip:${sipConfig.username}@${sipConfig.server}`);
    if (!uri) {
      throw new Error('Failed to create SIP URI');
      return { status: 'error', message: 'Failed to create SIP URI' };
    }

    
    const transportOptions = {
      server: `${sipConfig.socket}://${sipConfig.server}:${sipConfig.port}/${sipConfig.socket}`,
      connectionTimeout: 10000,
    };

    const userAgentOptions: UserAgentOptions = {
      uri,
      transportConstructor: CustomTransport,
      transportOptions,
      authorizationUsername: sipConfig.username,
      authorizationPassword: sipConfig.password,
      userAgentString: 'Vogat/1.0',
    };

    userAgent = new UserAgent(userAgentOptions);

    await userAgent.start();

    const registerOptions: RegistererOptions = {
      registrar: uri,
    };

    registerer = new Registerer(userAgent, registerOptions);
    registerer.stateChange.addListener(handleRegistrationStateChange);

    await registerUserAgent();

    userAgent.delegate = {
      onInvite: (invitation: Invitation) => {
        console.log('Incoming call received');
        handleIncomingCall(invitation);
      }
    };

    return { status: 'success', message: 'UserAgent initiated and registered' };
  } catch (error) {
    console.error("SIP initialization failed:", error);
    return { status: 'error', message: `SIP initialization failed` };
  }
}

function getSavedSIPConfig(): SIPConfig | null {
  const username = localStorage.getItem('sipUsername');
  const password = localStorage.getItem('sipPassword');
  const securityInfo = JSON.parse(localStorage.getItem('sipSecurityInfo') || '{}');

  if (!username || !password || !securityInfo.server || !securityInfo.port || !securityInfo.protocol || !securityInfo.socket) {
    return null;
  }

  return {
    username: username.split('@')[0],
    password,
    server: securityInfo.server,
    port: parseInt(securityInfo.port, 10),
    protocol: securityInfo.protocol as 'udp' | 'tcp' | 'tls',
    socket: securityInfo.socket,
  };
}

export function isUserAgentRegistered(): boolean {
  return registerer !== null && registerer.state === RegistererState.Registered;
}

export async function registerUserAgent(): Promise<SIPResponse> {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  if (isUserAgentRegistered()) {
    return { status: 'warning', message: 'UserAgent is already registered' };
  }

  try {
    if (!registerer) {
      const registerOptions: RegistererOptions = {
      };
      registerer = new Registerer(userAgent, registerOptions);
    }

    await registerer.register();
    return { status: 'success', message: 'UserAgent registered successfully' };
  } catch (error) {
    console.error('Error registering UserAgent:', error);
    return { status: 'error', message: 'Failed to register UserAgent' };
  }
}

export async function unregisterUserAgent(): Promise<SIPResponse> {
  if (!registerer) {
    return { status: 'warning', message: 'UserAgent is not registered' };
  }

  try {
    await registerer.unregister();
    registerer = null;
    return { status: 'success', message: 'UserAgent unregistered successfully' };
  } catch (error) {
    console.error('Error unregistering UserAgent:', error);
    return { status: 'error', message: 'Failed to unregister UserAgent' };
  }
}

export function getRegistrationState(): RegistererState | null {
  return registerer ? registerer.state : null;
}

export function handleRegistrationStateChange(newState: RegistererState): void {
  console.log(`Registration state changed to: ${newState}`);
}

export async function ensureUserAgentRegistered(): Promise<SIPResponse> {
  if (isUserAgentRegistered()) {
    return { status: 'success', message: 'UserAgent is already registered' };
  }

  return await registerUserAgent();
}

function handleIncomingCall(invitation: Invitation): void {
  if (!isUserAgentRegistered()) {
    console.warn('Received incoming call while not registered. Rejecting.');
    invitation.reject();
    return;
  }

  console.log('Handling incoming call');
  
  const acceptOptions: InvitationAcceptOptions = {
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false }
    }
  };

  invitation.accept(acceptOptions)
    .then(() => {
      console.log('Call accepted');
      currentSession = invitation;
      handleSession(invitation);
    })
    .catch((error: Error) => {
      console.error('Error accepting call:', error);
    });

  invitation.stateChange.addListener((newState: SessionState) => {
    console.log(`Incoming call session state changed to: ${newState}`);
    switch (newState) {
      case SessionState.Establishing:
        console.log('Incoming call is being established...');
        // Add any specific logic for the establishing state
        break;
      case SessionState.Established:
        console.log('Incoming call has been established');
        // Add any specific logic for the established state
        break;
      case SessionState.Terminating:
        console.log('Incoming call is terminating...');
        // Add any cleanup logic for the terminating state
        break;
      case SessionState.Terminated:
        console.log('Incoming call has been terminated');
        currentSession = null;
        // Add any final cleanup logic
        break;
      default:
        console.log(`Unhandled session state: ${newState}`);
    }
  });
}

export async function makeOutgoingCall(phoneNumber: string): Promise<SIPResponse> {
  const registrationStatus = await ensureUserAgentRegistered();
  if (registrationStatus.status !== 'success') {
    return registrationStatus;
  }

  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    const target = UserAgent.makeURI(`sip:${phoneNumber}@${getSavedSIPConfig()?.server}`);
    if (!target) {
      throw new Error('Failed to create target URI');
    }

    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    };

    const inviter = new Inviter(userAgent, target, inviterOptions);

    inviter.stateChange.addListener((state: SessionState) => {
      console.log(`Outgoing call state changed to ${state}`);
      switch (state) {
        case SessionState.Establishing:
          console.log('Outgoing call is being established...');
          break;
        case SessionState.Established:
          console.log('Outgoing call has been established');
          currentSession = inviter;
          handleSession(inviter);
          break;
        case SessionState.Terminating:
          console.log('Outgoing call is terminating...');
          break;
        case SessionState.Terminated:
          console.log('Outgoing call has been terminated');
          currentSession = null;
          break;
        default:
          console.log(`Unhandled session state: ${state}`);
      }
    });

    await inviter.invite();
    return { status: 'success', message: 'Outgoing call initiated' };
  } catch (error) {
    console.error('Error making outgoing call:', error);
    return { status: 'error', message: 'Failed to make outgoing call' };
  }
}

function handleSession(session: Session): void {

  const remoteStream = new MediaStream();
  const remoteAudio = new Audio();
  remoteAudio.autoplay = true;
  remoteAudio.srcObject = remoteStream;

  if (session.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    session.sessionDescriptionHandler.peerConnectionDelegate = {
      ontrack: (event: RTCTrackEvent) => {
        const track = event.track;
        if (track.kind === 'audio') {
          remoteStream.addTrack(track);
        }
      }
    };

    session.delegate = {
      onSessionDescriptionHandler: (sessionDescriptionHandler: Web.SessionDescriptionHandler, provisional: boolean) => {
        console.log(`session description handler created: ${provisional} ? 'provisionally' : ''`);

        const peerConnection = sessionDescriptionHandler.peerConnection;

        peerConnection?.getReceivers().forEach((receiver) => {
          if (receiver.track) {
            remoteStream.addTrack(receiver.track);
          }
        });

        peerConnection?.addEventListener('track', (event: RTCTrackEvent) => {
          const track = event.track;
          if (track.kind === 'audio') {
            remoteStream.addTrack(track);
          }
        });
      }
    };
  } else {
    console.error('Unsupported session description handler');
  }

  session.stateChange.addListener((state: SessionState) => {
    console.log(`Session state changed to ${state}`);
    switch (state) {
      case SessionState.Terminating:
        console.log('Session is terminating...');
        break;
      case SessionState.Terminated:
        console.log('Session has been terminated');
        if (remoteAudio) {
          remoteAudio.srcObject = null;
        }
        currentSession = null;
        break;
    }
  });
}

export function terminateCall(): SIPResponse {
  if (currentSession) {
    if (currentSession.state === SessionState.Established) {
      currentSession.bye()
        .then(() => {
          console.log('Call terminated successfully');
        })
        .catch((error: Error) => {
          console.error('Error terminating call:', error);
        });
    } else if (isInviterOrInvitation(currentSession)) {
      currentSession.dispose();
    } else {
      console.warn('Unable to terminate the current session');
      return { status: 'error', message: 'Unable to terminate the current session' };
    }
    return { status: 'success', message: 'Call termination initiated' };
  } else {
    console.log('No active call to terminate');
    return { status: 'warning', message: 'No active call to terminate' };
  }
}

export function mute(): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    peerConnection?.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === 'audio') {
        sender.track.enabled = false;
      }
    });
    return { status: 'success', message: 'Call muted' };
  }
  return { status: 'warning', message: 'No active call to mute' };
}

export function unmute(): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    peerConnection?.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === 'audio') {
        sender.track.enabled = true;
      }
    });
    return { status: 'success', message: 'Call unmuted' };
  }
  return { status: 'warning', message: 'No active call to unmute' };
}

export function sendDTMF(tone: string): SIPResponse {
  if (currentSession && currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
    const options = {
      requestOptions: {
        body: {
          contentDisposition: 'render',
          contentType: 'application/dtmf-relay',
          content: `Signal=${tone}\r\nDuration=100`
        }
      }
    };
    
    currentSession.info(options)
      .then(() => console.log('DTMF sent successfully'))
      .catch((error: Error) => console.error('Error sending DTMF:', error));

    return { status: 'success', message: `DTMF tone ${tone} sent` };
  }
  return { status: 'warning', message: 'No active call to send DTMF' };
}

export async function cleanup(): Promise<void> {
  if (currentSession) {
    try {
      if (currentSession.state === SessionState.Established) {
        await currentSession.bye();
      } else if ('dispose' in currentSession && typeof currentSession.dispose === 'function') {
        currentSession.dispose();
      } else {
        console.warn('Unable to terminate the current session');
      }
      console.log('Active call terminated during cleanup');
    } catch (error) {
      console.error('Error terminating active call during cleanup:', error);
    }
    currentSession = null;
  }

  if (registerer) {
    try {
      await unregisterUserAgent();
    } catch (error) {
      console.error('Error unregistering UserAgent:', error);
    }
  }

  if (userAgent) {
    try {
      await userAgent.stop();
      console.log('UserAgent stopped');
    } catch (error) {
      console.error('Error stopping UserAgent:', error);
    }
    userAgent = null;
  }

  console.log('SIP resources cleaned up');
}

export function getCallStatus(): SIPResponse {
  if (!currentSession) {
    return { status: 'warning', message: 'No active call' };
  }
  return { status: 'success', message: currentSession.state };
}

export async function holdCall(): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to hold' };
  }

  try {
    const options: InviterInviteOptions = {
      sessionDescriptionHandlerOptions: {
        hold: true
      } as CustomSessionDescriptionHandlerOptions
    };
    await currentSession.invite(options);
    return { status: 'success', message: 'Call placed on hold' };
  } catch (error) {
    console.error('Error placing call on hold:', error);
    return { status: 'error', message: 'Failed to place call on hold' };
  }
}

export async function resumeCall(): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to resume' };
  }

  try {
    const options: InviterInviteOptions = {
      sessionDescriptionHandlerOptions: {
        hold: false
      } as CustomSessionDescriptionHandlerOptions
    };
    await currentSession.invite(options);
    return { status: 'success', message: 'Call resumed' };
  } catch (error) {
    console.error('Error resuming call:', error);
    return { status: 'error', message: 'Failed to resume call' };
  }
}

export async function transferCall(targetUri: string): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call to transfer' };
  }

  try {
    const target = UserAgent.makeURI(targetUri);
    if (!target) {
      throw new Error('Failed to create target URI for transfer');
    }

    await currentSession.refer(target);
    return { status: 'success', message: 'Call transfer initiated' };
  } catch (error) {
    console.error('Error transferring call:', error);
    return { status: 'error', message: 'Failed to transfer call' };
  }
}

export async function setAudioDevice(deviceId: string): Promise<SIPResponse> {
  if (!currentSession) {
    return { status: 'error', message: 'No active call' };
  }

  try {
    const constraints: MediaStreamConstraints = {
      audio: { deviceId: { exact: deviceId } }
    };

    // Create new stream with the specified audio device
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Get the audio track from the new stream
    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) {
      throw new Error('No audio track found in the new stream');
    }

    // Create new constraints for the reinvite
    const newConstraints: MediaStreamConstraints = {
      audio: true,
      video: false
    };

    // Send reinvite with new constraints
    await currentSession.invite({
      sessionDescriptionHandlerOptions: {
        constraints: newConstraints
      }
    });

    // After successful reinvite, replace the audio track
    if (currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler) {
      const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
      if (peerConnection) {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(audioTrack);
        } else {
          throw new Error('No audio sender found in the peer connection');
        }
      } else {
        throw new Error('Peer connection is not available');
      }
    } else {
      throw new Error('Session description handler is not an instance of Web.SessionDescriptionHandler');
    }

    return { status: 'success', message: 'Audio device set successfully' };
  } catch (error) {
    console.error('Error setting audio device:', error);
    return { status: 'error', message: `Failed to set audio device: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export function getCallDuration(): SIPResponse {
  if (!currentSession || currentSession.state !== SessionState.Established) {
    return { status: 'error', message: 'No active call' };
  }

  const startTime = (currentSession as Session & { startTime?: number }).startTime;
  if (!startTime) {
    return { status: 'error', message: 'Call start time not available' };
  }

  const duration = Math.floor((Date.now() - startTime) / 1000); // Duration in seconds
  return { status: 'success', message: `Call duration: ${duration} seconds` };
}

export async function reconnect(): Promise<SIPResponse> {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    await userAgent.reconnect();
    return { status: 'success', message: 'Reconnected successfully' };
  } catch (error) {
    console.error('Error reconnecting:', error);
    return { status: 'error', message: 'Failed to reconnect' };
  }
}

export function rejectIncomingCall(invitation: Invitation): SIPResponse {
  try {
    invitation.reject();
    return { status: 'success', message: 'Incoming call rejected' };
  } catch (error) {
    console.error('Error rejecting incoming call:', error);
    return { status: 'error', message: 'Failed to reject incoming call' };
  }
}

export function muteAudio(): SIPResponse {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = false;
        }
      });
      return { status: 'success', message: 'Audio muted' };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error muting audio:', error);
    return { status: 'error', message: 'Failed to mute audio' };
  }
}

export function unmuteAudio(): SIPResponse {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = true;
        }
      });
      return { status: 'success', message: 'Audio unmuted' };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error unmuting audio:', error);
    return { status: 'error', message: 'Failed to unmute audio' };
  }
}

export async function getCallStats(): Promise<SIPResponse> {
  if (!currentSession || !(currentSession.sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)) {
    return { status: 'error', message: 'No active call or invalid session description handler' };
  }

  try {
    const peerConnection = currentSession.sessionDescriptionHandler.peerConnection;
    if (peerConnection) {
      const stats = await peerConnection.getStats();
      const statsObj: Record<string, any> = {};
      stats.forEach(report => {
        statsObj[report.type] = report;
      });
      return { status: 'success', message: 'Call stats retrieved', data: statsObj };
    } else {
      return { status: 'error', message: 'Peer connection not available' };
    }
  } catch (error) {
    console.error('Error getting call stats:', error);
    return { status: 'error', message: 'Failed to get call stats' };
  }
}

export function getNetworkType(): SIPResponse {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.type) {
      return { status: 'success', message: 'Network type retrieved', data: connection.type };
    }
  }
  return { status: 'error', message: 'Network information not available' };
}

export function setDisplayName(displayName: string): SIPResponse {
  if (!userAgent) {
    return { status: 'error', message: 'UserAgent not initialized' };
  }

  try {
    userAgent.configuration.displayName = displayName;
    return { status: 'success', message: 'Display name set successfully' };
  } catch (error) {
    console.error('Error setting display name:', error);
    return { status: 'error', message: 'Failed to set display name' };
  }
}

export function monitorSIPStatus(): SIPResponse {
  if (!userAgent) {
    return { status: 'error', message: 'SIP is no longer initialized' };
  } else if (!isUserAgentRegistered()) {
    return { status: 'error', message: 'SIP is no longer registered' };
  }
  return { status: 'success', message: 'SIP is still initialized and registered' };
}