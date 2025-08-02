import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Share, Mail, Users, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ChatLinkProps {
  roomId: string;
}

export default function ChatLink({ roomId }: ChatLinkProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const { data: roomData, isLoading } = useQuery({
    queryKey: ['/api/chat', roomId],
    enabled: !!roomId,
  });
  
  const chatLink = `${window.location.origin}/chat/${roomId}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(chatLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The secure chat link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please copy it manually.",
        variant: "destructive",
      });
    }
  };
  
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Join me for a secure, encrypted chat: ${chatLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  const shareViaEmail = () => {
    const subject = encodeURIComponent('Secure Chat Invitation');
    const body = encodeURIComponent(`You've been invited to join a secure, encrypted chat.\n\nClick this link to join: ${chatLink}\n\nThis link is encrypted and will expire after the conversation ends.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!roomData || !roomData.room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Chat room not found</h2>
            <p className="text-muted-foreground mb-4">
              This chat room may have expired or doesn't exist.
            </p>
            <Button onClick={() => setLocation('/')}>
              Create New Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold gradient-text-primary">Secure Chat Link</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="text-success w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold gradient-text-success">Chat Link Created</h2>
            <p className="text-muted-foreground text-sm">
              Share this secure link with the person you want to chat with. 
              The link expires after the first conversation ends.
            </p>
          </div>

          {/* Generated Link */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-link">Secure Chat Link</Label>
              <div className="flex space-x-2">
                <Input 
                  id="chat-link"
                  type="text" 
                  readOnly 
                  value={chatLink}
                  className="font-mono text-sm"
                />
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Security Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="text-success w-4 h-4" />
                <span>Link is encrypted and secure</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="text-warning w-4 h-4" />
                <span>Expires after chat session ends</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Users className="text-primary w-4 h-4" />
                <span>Maximum 2 participants</span>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={shareViaWhatsApp}
                className="flex items-center space-x-2"
              >
                <Share className="w-4 h-4 text-green-600" />
                <span>WhatsApp</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={shareViaEmail}
                className="flex items-center space-x-2"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email</span>
              </Button>
            </div>

            {/* Join Chat Button */}
            <Button 
              onClick={() => setLocation(`/chat/${roomId}`)}
              className="w-full"
              size="lg"
            >
              Join Chat Room
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
