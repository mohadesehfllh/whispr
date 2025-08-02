import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { webRTCService, type AudioCallState } from "@/lib/webrtc";

interface AudioCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioCallModal({ isOpen, onClose }: AudioCallModalProps) {
  const [callState, setCallState] = useState<AudioCallState>(webRTCService.getCurrentCallState());
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = webRTCService.onCallStateChange(setCallState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (callState.isConnected && callStartTimeRef.current === 0) {
      callStartTimeRef.current = Date.now();
    }

    if (!callState.isCallActive && !callState.isIncomingCall) {
      callStartTimeRef.current = 0;
      setCallDuration(0);
    }
  }, [callState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState.isConnected && callStartTimeRef.current > 0) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.isConnected]);

  useEffect(() => {
    // Setup local audio stream
    const localStream = webRTCService.getLocalStream();
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true; // Always mute local audio to prevent feedback
    }

    // Setup remote audio stream
    const remoteStream = webRTCService.getRemoteStream();
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(console.error);
    }
  }, [callState]);

  const handleAcceptCall = async () => {
    if (callState.callId) {
      try {
        await webRTCService.acceptCall(callState.callId);
      } catch (error) {
        console.error('Failed to accept call:', error);
      }
    }
  };

  const handleRejectCall = () => {
    if (callState.callId) {
      webRTCService.rejectCall(callState.callId);
    }
    onClose();
  };

  const handleEndCall = () => {
    webRTCService.endCall();
    onClose();
  };

  const toggleMute = () => {
    const localStream = webRTCService.getLocalStream();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusText = (): string => {
    if (callState.isIncomingCall) return 'Incoming call';
    if (callState.isCalling) return 'Calling...';
    if (callState.isConnected) return 'Connected';
    if (callState.isCallActive) return 'Connecting...';
    return 'Call ended';
  };

  const getCallStatusBadgeVariant = () => {
    if (callState.isIncomingCall) return 'secondary';
    if (callState.isCalling) return 'outline';
    if (callState.isConnected) return 'default';
    return 'destructive';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm w-full p-0">
        <div className="bg-gradient-to-b from-card to-card/80 rounded-lg overflow-hidden">
          {/* Call Header */}
          <div className="text-center py-8 px-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-12 bg-primary/40 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {callState.remoteNickname?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">
              {callState.remoteNickname || 'Unknown'}
            </h3>
            
            <Badge variant={getCallStatusBadgeVariant()} className="mb-2">
              {getCallStatusText()}
            </Badge>
            
            {callState.isConnected && (
              <p className="text-sm text-muted-foreground">
                {formatDuration(callDuration)}
              </p>
            )}
          </div>

          {/* Call Controls */}
          <div className="px-6 pb-6">
            {callState.isIncomingCall ? (
              <div className="flex justify-center space-x-4">
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={handleRejectCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                  onClick={handleAcceptCall}
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center space-x-4">
                {(callState.isCallActive || callState.isConnected) && (
                  <>
                    <Button
                      variant={isMuted ? "destructive" : "secondary"}
                      size="lg"
                      className="rounded-full w-14 h-14"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant={!isSpeakerOn ? "destructive" : "secondary"}
                      size="lg"
                      className="rounded-full w-14 h-14"
                      onClick={toggleSpeaker}
                    >
                      {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </>
                )}
                
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-success/10 border-t border-success/20 px-4 py-3 text-center">
            <p className="text-xs text-success">
              🔒 End-to-end encrypted audio call
            </p>
          </div>
        </div>

        {/* Hidden audio elements */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </DialogContent>
    </Dialog>
  );
}