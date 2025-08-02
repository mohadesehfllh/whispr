import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, MoreVertical, Image, Send, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { webSocketService, type ChatMessage as WSChatMessage, type ChatParticipant } from "@/lib/websocket";
import { webRTCService, type AudioCallState } from "@/lib/webrtc";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { AudioCallModal } from "@/components/chat/AudioCallModal";
import { SpywareDetection } from "@/components/chat/SpywareDetection";

interface ChatProps {
  roomId: string;
}

export default function Chat({ roomId }: ChatProps) {
  const [, setLocation] = useLocation();
  const [nickname, setNickname] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(true);
  const [messages, setMessages] = useState<WSChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<ChatParticipant | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showSpywareDetection, setShowSpywareDetection] = useState(false);
  const [callState, setCallState] = useState<AudioCallState>(webRTCService.getCurrentCallState());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: roomData, isLoading } = useQuery({
    queryKey: ['/api/chat', roomId],
    enabled: !!roomId,
  });
  
  const joinRoomMutation = useMutation({
    mutationFn: async (nickname: string) => {
      if (!nickname.trim()) {
        throw new Error("Nickname is required");
      }
      
      await webSocketService.connect();
      await webSocketService.joinRoom(roomId, nickname.trim());
      return { nickname: nickname.trim() };
    },
    onSuccess: (data) => {
      setNickname(data.nickname);
      setShowNicknameModal(false);
      setIsConnected(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join chat",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
  
  const markMessageViewedMutation = useMutation({
    mutationFn: (messageId: string) => 
      apiRequest('POST', `/api/chat/message/${messageId}/view`),
  });
  
  useEffect(() => {
    // Setup WebRTC call state handler
    const unsubscribeCallState = webRTCService.onCallStateChange(setCallState);
    
    // Setup WebSocket event handlers
    webSocketService.on('room_joined', (data) => {
      setParticipants(data.participants);
      setCurrentParticipant(data.participant);
    });
    
    webSocketService.on('user_joined', (data) => {
      setParticipants(prev => [...prev, data.participant]);
      toast({
        title: "User joined",
        description: `${data.participant.nickname} joined the chat`,
      });
    });
    
    webSocketService.on('user_left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
      toast({
        title: "User left",
        description: `${data.nickname} left the chat`,
      });
    });
    
    webSocketService.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });
    
    webSocketService.on('typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => prev.includes(data.nickname) ? prev : [...prev, data.nickname]);
      } else {
        setTypingUsers(prev => prev.filter(user => user !== data.nickname));
      }
    });
    
    webSocketService.on('error', (data) => {
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive",
      });
      
      if (data.error.includes('not found') || data.error.includes('expired')) {
        setLocation('/');
      }
    });
    
    return () => {
      unsubscribeCallState();
      webSocketService.off('room_joined');
      webSocketService.off('user_joined');
      webSocketService.off('user_left');
      webSocketService.off('new_message');
      webSocketService.off('typing');
      webSocketService.off('error');
      webSocketService.disconnect();
    };
  }, [toast, setLocation]);

  // Handle call state changes
  useEffect(() => {
    if (callState.isIncomingCall || callState.isOutgoingCall || callState.isCallActive) {
      setShowAudioCall(true);
    } else {
      setShowAudioCall(false);
    }
  }, [callState]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected) return;
    
    webSocketService.sendMessage(messageInput.trim());
    setMessageInput("");
    handleStopTyping();
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleTyping = () => {
    if (!isTyping && isConnected) {
      setIsTyping(true);
      webSocketService.sendTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };
  
  const handleStopTyping = () => {
    if (isTyping && isConnected) {
      setIsTyping(false);
      webSocketService.sendTyping(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  
  const handleImageView = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.messageType === 'image') {
      setViewingImageUrl(message.content);
      setShowImageViewer(true);
      markMessageViewedMutation.mutate(messageId);
    }
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      webSocketService.sendMessage(dataUrl, 'image', true); // Send as view-once
    };
    reader.readAsDataURL(file);
  };

  const handleStartAudioCall = () => {
    if (!otherParticipant) {
      toast({
        title: "No participant",
        description: "Wait for someone to join the chat before calling",
        variant: "destructive",
      });
      return;
    }

    // Start spyware detection before the call
    setShowSpywareDetection(true);
  };

  const handleSpywareDetectionComplete = async (isSecure: boolean | null) => {
    setShowSpywareDetection(false);
    
    // If user cancelled, don't proceed
    if (isSecure === null) {
      toast({
        title: "Call cancelled",
        description: "Security check was cancelled",
        variant: "destructive",
      });
      return;
    }

    if (!otherParticipant) {
      toast({
        title: "No participant",
        description: "The other participant has left the chat",
        variant: "destructive",
      });
      return;
    }

    // Proceed with call regardless of security check result
    try {
      await webRTCService.startCall(otherParticipant.nickname);
      if (!isSecure) {
        toast({
          title: "Call initiated with warnings",
          description: `Calling ${otherParticipant.nickname}... Security issues detected but proceeding.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Call initiated",
          description: `Calling ${otherParticipant.nickname}...`,
        });
      }
    } catch (error) {
      toast({
        title: "Call failed",
        description: "Unable to start the call. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Chat room not found</h2>
          <p className="text-muted-foreground">
            This chat room may have expired or doesn't exist.
          </p>
          <Button onClick={() => setLocation('/')}>
            Create New Chat
          </Button>
        </div>
      </div>
    );
  }
  
  const otherParticipant = participants.find(p => p.id !== currentParticipant?.id);

  if (roomData && participants.length >= 2 && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Chat room is full</h2>
          <p className="text-muted-foreground">
            This chat room already has the maximum number of participants.
          </p>
          <Button onClick={() => setLocation('/')}>
            Create New Chat
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nickname Modal */}
      <Dialog open={showNicknameModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Your Nickname</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Your nickname..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    joinRoomMutation.mutate(nickname);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Max 20 characters</p>
            </div>
            <Button 
              onClick={() => joinRoomMutation.mutate(nickname)}
              disabled={joinRoomMutation.isPending || !nickname.trim()}
              className="w-full"
            >
              {joinRoomMutation.isPending ? "Joining..." : "Enter Secure Chat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Chat Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {otherParticipant ? (
              <>
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-success">
                    {otherParticipant.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">{otherParticipant.nickname}</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online • Encrypted</span>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h3 className="font-medium text-sm">Waiting for participant...</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Ready • Encrypted</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleStartAudioCall}
              disabled={!otherParticipant || callState.isCallActive || callState.isIncomingCall || callState.isOutgoingCall}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" disabled>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Encryption Status Bar */}
        <div className="px-4 py-2 bg-success/10 border-t border-success/20">
          <div className="flex items-center justify-center space-x-2 text-xs">
            <Lock className="text-success w-3 h-3" />
            <span className="text-success">End-to-end encrypted</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Messages auto-delete after viewing</span>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* System Message */}
        <div className="text-center py-4 px-4">
          <Badge variant="secondary" className="space-x-1">
            <Shield className="w-3 h-3 text-success" />
            <span className="text-xs sm:text-sm">Secure chat initiated • Messages are encrypted</span>
          </Badge>
        </div>

        {/* Messages */}
        <div className="pb-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.senderNickname === nickname}
              onImageView={handleImageView}
            />
          ))}
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex w-full mb-4 px-4 sm:px-6 justify-start">
            <div className="flex max-w-[85%] sm:max-w-[70%] items-end space-x-2">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <span className="text-xs font-medium">
                  {typingUsers[0].charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex space-x-3">
          <div>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={!isConnected}
              className="h-10 w-10 sm:h-9 sm:w-9"
            >
              <Image className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Type a secure message..."
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              className="pr-12 h-10 text-base sm:text-sm sm:h-9"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Security Footer */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            <Lock className="w-3 h-3 text-success inline mr-1" />
            All messages are encrypted • Auto-delete enabled
          </p>
        </div>
      </footer>
      
      {/* Image Viewer */}
      <ImageViewer
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={viewingImageUrl}
        duration={20}
      />
      
      {/* Audio Call Modal */}
      <AudioCallModal
        isOpen={showAudioCall}
        onClose={() => setShowAudioCall(false)}
      />
      
      {/* Spyware Detection */}
      <SpywareDetection
        isActive={showSpywareDetection}
        onDetectionComplete={handleSpywareDetectionComplete}
      />
    </div>
  );
}
