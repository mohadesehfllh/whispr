import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Shield, MessageCircle, Key, Clock, KeyRound, Plus, Eye, Phone, Zap, UserX, Image, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/create');
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/chat-link/${data.roomId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chat room. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/20 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="text-primary-foreground w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold gradient-text-loading">
              Whispr
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="text-success w-4 h-4" />
            <span className="hidden sm:inline">Privacy First</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full space-y-12 animate-in fade-in duration-700">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <MessageCircle className="text-primary w-10 h-10" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text-loading leading-tight">
                Whispr
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A minimalist, privacy-first chat application designed for secure, end-to-end encrypted communication 
                — with zero user accounts, no data storage, and disappearing media.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="text-center space-y-4 bg-card/30 rounded-2xl p-8 border border-border/30">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">How It Works</h3>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Users simply visit the site, click "Create Chat Link", and share it with someone they want to talk to. 
              Both users choose a nickname, and a private chat session begins. All communication is encrypted, anonymous, 
              and completely ephemeral — nothing is ever stored on a server.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <Key className="text-success w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">End-to-End Encryption</div>
                  <div className="text-xs text-muted-foreground">RSA-OAEP with Web Crypto API</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <Clock className="text-warning w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Vanishing Messages</div>
                  <div className="text-xs text-muted-foreground">Auto-delete with timers</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <UserX className="text-primary w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">No Accounts</div>
                  <div className="text-xs text-muted-foreground">Anonymous by design</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <Image className="text-purple-400 w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Self-Destructing Images</div>
                  <div className="text-xs text-muted-foreground">View-once media sharing</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <Phone className="text-blue-400 w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Real-Time Audio Calls</div>
                  <div className="text-xs text-muted-foreground">WebRTC P2P communication</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/30 hover:bg-card/70 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <Eye className="text-red-400 w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Spyware Detection</div>
                  <div className="text-xs text-muted-foreground">Screen recording prevention</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6">
            <Button 
              onClick={() => createChatMutation.mutate()}
              disabled={createChatMutation.isPending}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {createChatMutation.isPending ? "Creating..." : "Create Chat Link"}
            </Button>

            <p className="text-sm text-muted-foreground">
              No sign-up required • Start chatting in seconds
            </p>
          </div>

          {/* Security Footer */}
          <div className="text-center space-y-2 pt-8 border-t border-border/30">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-success" />
                <span>Zero Data Storage</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-warning" />
                <span>Ephemeral Sessions</span>
              </div>
              <div className="flex items-center space-x-1">
                <Key className="w-3 h-3 text-primary" />
                <span>Client-Side Encryption</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Whispr proactively detects spyware and screen recording tools to preserve the integrity of private conversations
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
