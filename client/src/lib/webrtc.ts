import { webSocketService } from './websocket';

export interface AudioCallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isCalling: boolean;
  isConnected: boolean;
  remoteNickname?: string;
  callId?: string;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callStateHandlers: Map<string, (state: AudioCallState) => void> = new Map();
  private currentCallState: AudioCallState = {
    isCallActive: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    isCalling: false,
    isConnected: false,
  };

  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  constructor() {
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    webSocketService.on('call_offer', (data) => this.handleCallOffer(data));
    webSocketService.on('call_answer', (data) => this.handleCallAnswer(data));
    webSocketService.on('call_ice_candidate', (data) => this.handleIceCandidate(data));
    webSocketService.on('call_rejected', (data) => this.handleCallRejected(data));
    webSocketService.on('call_ended', (data) => this.handleCallEnded(data));
  }

  onCallStateChange(handler: (state: AudioCallState) => void): () => void {
    const id = Math.random().toString(36);
    this.callStateHandlers.set(id, handler);
    return () => this.callStateHandlers.delete(id);
  }

  private updateCallState(updates: Partial<AudioCallState>) {
    this.currentCallState = { ...this.currentCallState, ...updates };
    this.callStateHandlers.forEach(handler => handler(this.currentCallState));
  }

  async startCall(remoteNickname: string): Promise<void> {
    try {
      this.updateCallState({
        isOutgoingCall: true,
        isCalling: true,
        remoteNickname,
        callId: Math.random().toString(36),
      });

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Create peer connection
      await this.createPeerConnection();

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send offer through WebSocket
      webSocketService.send({
        type: 'call_offer',
        callId: this.currentCallState.callId,
        offer: offer,
        targetNickname: remoteNickname,
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      this.endCall();
      throw error;
    }
  }

  async acceptCall(callId: string): Promise<void> {
    try {
      this.updateCallState({
        isIncomingCall: false,
        isCallActive: true,
        callId,
      });

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Add local stream to existing peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });

        // Create answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send answer
        webSocketService.send({
          type: 'call_answer',
          callId,
          answer: answer,
        });
      }

    } catch (error) {
      console.error('Failed to accept call:', error);
      this.rejectCall(callId);
      throw error;
    }
  }

  rejectCall(callId: string): void {
    webSocketService.send({
      type: 'call_rejected',
      callId,
    });
    this.endCall();
  }

  endCall(): void {
    if (this.currentCallState.callId) {
      webSocketService.send({
        type: 'call_ended',
        callId: this.currentCallState.callId,
      });
    }

    // Clean up streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.updateCallState({
      isCallActive: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      isCalling: false,
      isConnected: false,
      remoteNickname: undefined,
      callId: undefined,
    });
  }

  private async createPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallState.callId) {
        webSocketService.send({
          type: 'call_ice_candidate',
          callId: this.currentCallState.callId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.updateCallState({ isConnected: true });
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          this.endCall();
        }
      }
    };
  }

  private async handleCallOffer(data: any): Promise<void> {
    try {
      this.updateCallState({
        isIncomingCall: true,
        remoteNickname: data.fromNickname,
        callId: data.callId,
      });

      // Create peer connection
      await this.createPeerConnection();

      // Set remote description
      await this.peerConnection!.setRemoteDescription(data.offer);

    } catch (error) {
      console.error('Failed to handle call offer:', error);
      this.rejectCall(data.callId);
    }
  }

  private async handleCallAnswer(data: any): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.answer);
        this.updateCallState({
          isOutgoingCall: false,
          isCalling: false,
          isCallActive: true,
        });
      }
    } catch (error) {
      console.error('Failed to handle call answer:', error);
      this.endCall();
    }
  }

  private async handleIceCandidate(data: any): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }

  private handleCallRejected(data: any): void {
    this.endCall();
  }

  private handleCallEnded(data: any): void {
    this.endCall();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getCurrentCallState(): AudioCallState {
    return this.currentCallState;
  }
}

export const webRTCService = new WebRTCService();