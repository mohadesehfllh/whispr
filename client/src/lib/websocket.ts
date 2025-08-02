import { encryptionService } from './encryption';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderNickname: string;
  content: string;
  messageType: 'text' | 'image';
  encryptedData?: string;
  isViewOnce: boolean;
  hasBeenViewed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ChatParticipant {
  id: string;
  roomId: string;
  nickname: string;
  publicKey?: string;
  isOnline: boolean;
  joinedAt: Date;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket state:', this.ws?.readyState);
        console.error('WebSocket URL:', wsUrl);
        reject(error);
      };
    });
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
  
  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn('No handler for message type:', message.type);
    }
  }
  
  on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }
  
  off(messageType: string) {
    this.messageHandlers.delete(messageType);
  }
  
  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
  
  async joinRoom(roomId: string, nickname: string): Promise<void> {
    await encryptionService.generateKeyPair();
    const publicKey = await encryptionService.exportPublicKey();
    
    this.send({
      type: 'join_room',
      roomId,
      nickname,
      publicKey
    });
  }
  
  async sendMessage(content: string, messageType: 'text' | 'image' = 'text', isViewOnce = false) {
    // For now, send unencrypted content
    // In a full implementation, you would encrypt the content here
    this.send({
      type: 'send_message',
      content,
      messageType,
      isViewOnce
    });
  }
  
  sendTyping(isTyping: boolean) {
    this.send({
      type: 'typing',
      isTyping
    });
  }
  
  leaveRoom() {
    this.send({
      type: 'leave_room'
    });
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const webSocketService = new WebSocketService();
