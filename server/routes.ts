import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatRoomSchema, insertChatMessageSchema, insertChatParticipantSchema } from "@shared/schema";
import { randomUUID } from "crypto";

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  participantId?: string;
  nickname?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      // Allow all connections for now - can add authentication later
      return true;
    }
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  console.log('WebSocket server initialized on path /ws');
  
  // Store active connections
  const connections = new Map<string, ExtendedWebSocket>();
  
  // API Routes
  
  // Create a new chat room
  app.post('/api/chat/create', async (req, res) => {
    try {
      const roomId = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const room = await storage.createChatRoom({
        id: roomId,
        expiresAt,
      });
      
      res.json({ 
        roomId: room.id,
        link: `${req.protocol}://${req.get('host')}/chat/${room.id}`,
        expiresAt: room.expiresAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create chat room' });
    }
  });
  
  // Get chat room info
  app.get('/api/chat/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getChatRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
      }
      
      if (room.expiresAt && room.expiresAt < new Date()) {
        await storage.deleteChatRoom(roomId);
        return res.status(410).json({ error: 'Chat room has expired' });
      }
      
      const participants = await storage.getParticipants(roomId);
      
      res.json({
        room,
        participantCount: participants.length,
        canJoin: participants.length < 2
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get chat room' });
    }
  });
  
  // Get chat messages
  app.get('/api/chat/:roomId/messages', async (req, res) => {
    try {
      const { roomId } = req.params;
      const messages = await storage.getMessages(roomId);
      
      // Filter out expired or viewed view-once messages
      const validMessages = messages.filter(message => {
        if (message.expiresAt && message.expiresAt < new Date()) return false;
        if (message.isViewOnce && message.hasBeenViewed) return false;
        return true;
      });
      
      res.json(validMessages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });
  
  // Mark message as viewed
  app.post('/api/chat/message/:messageId/view', async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageViewed(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark message as viewed' });
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: ExtendedWebSocket, request) => {
    console.log('New WebSocket connection established');
    const connectionId = randomUUID();
    connections.set(connectionId, ws);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room':
            await handleJoinRoom(ws, message, connectionId);
            break;
            
          case 'send_message':
            await handleSendMessage(ws, message);
            break;
            
          case 'typing':
            await handleTyping(ws, message);
            break;
            
          case 'call_offer':
            await handleCallOffer(ws, message);
            break;
            
          case 'call_answer':
            await handleCallAnswer(ws, message);
            break;
            
          case 'call_ice_candidate':
            await handleCallIceCandidate(ws, message);
            break;
            
          case 'call_rejected':
            await handleCallRejected(ws, message);
            break;
            
          case 'call_ended':
            await handleCallEnded(ws, message);
            break;
            
          case 'leave_room':
            await handleLeaveRoom(ws, connectionId);
            break;
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      handleLeaveRoom(ws, connectionId);
      connections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(connectionId);
    });
  });
  
  async function handleJoinRoom(ws: ExtendedWebSocket, message: any, connectionId: string) {
    const { roomId, nickname, publicKey } = message;
    
    try {
      const room = await storage.getChatRoom(roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room not found' }));
        return;
      }
      
      if (room.expiresAt && room.expiresAt < new Date()) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room has expired' }));
        return;
      }
      
      const participants = await storage.getParticipants(roomId);
      if (participants.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room is full' }));
        return;
      }
      
      // Add participant
      const participant = await storage.addParticipant({
        roomId,
        nickname,
        publicKey,
      });
      
      ws.roomId = roomId;
      ws.participantId = participant.id;
      ws.nickname = nickname;
      
      // Activate room if this is the second participant
      if (participants.length === 1) {
        await storage.updateChatRoom(roomId, { isActive: true });
      }
      
      // Notify all participants in the room
      broadcastToRoom(roomId, {
        type: 'user_joined',
        participant: {
          id: participant.id,
          nickname: participant.nickname,
          publicKey: participant.publicKey
        },
        participantCount: participants.length + 1
      });
      
      // Send current participants to new user
      const allParticipants = await storage.getParticipants(roomId);
      ws.send(JSON.stringify({
        type: 'room_joined',
        roomId,
        participants: allParticipants,
        participant: participant
      }));
      
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', error: 'Failed to join room' }));
    }
  }
  
  async function handleSendMessage(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId || !ws.participantId) {
      ws.send(JSON.stringify({ type: 'error', error: 'Not in a room' }));
      return;
    }
    
    try {
      const { content, messageType, encryptedData, isViewOnce } = message;
      
      let expiresAt;
      if (isViewOnce) {
        expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute for view-once messages
      } else {
        expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for regular messages
      }
      
      const chatMessage = await storage.createMessage({
        roomId: ws.roomId,
        senderNickname: ws.nickname!,
        content,
        messageType: messageType || 'text',
        encryptedData,
        isViewOnce: isViewOnce || false,
        expiresAt,
      });
      
      // Broadcast message to all participants in the room
      broadcastToRoom(ws.roomId, {
        type: 'new_message',
        message: chatMessage
      });
      
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', error: 'Failed to send message' }));
    }
  }
  
  async function handleTyping(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    broadcastToRoom(ws.roomId, {
      type: 'typing',
      participantId: ws.participantId,
      nickname: ws.nickname,
      isTyping: message.isTyping
    }, ws.participantId);
  }
  
  async function handleLeaveRoom(ws: ExtendedWebSocket, connectionId: string) {
    if (!ws.roomId || !ws.participantId) return;
    
    try {
      await storage.removeParticipant(ws.participantId);
      
      broadcastToRoom(ws.roomId, {
        type: 'user_left',
        participantId: ws.participantId,
        nickname: ws.nickname
      });
      
      // Check if room should be deactivated or deleted
      const participants = await storage.getParticipants(ws.roomId);
      if (participants.length === 0) {
        await storage.deleteChatRoom(ws.roomId);
      } else if (participants.length === 1) {
        await storage.updateChatRoom(ws.roomId, { isActive: false });
      }
      
    } catch (error) {
      console.error('Error handling leave room:', error);
    }
  }
  
  async function handleCallOffer(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    // Add sender nickname to the offer
    const callOfferMessage = {
      ...message,
      fromNickname: ws.nickname
    };
    
    // Send offer to the target participant
    broadcastToRoom(ws.roomId, callOfferMessage, ws.participantId);
  }
  
  async function handleCallAnswer(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    // Forward the answer to the caller
    broadcastToRoom(ws.roomId, message, ws.participantId);
  }
  
  async function handleCallIceCandidate(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    // Forward ICE candidate to the other participant
    broadcastToRoom(ws.roomId, message, ws.participantId);
  }
  
  async function handleCallRejected(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    // Forward rejection to the caller
    broadcastToRoom(ws.roomId, message, ws.participantId);
  }
  
  async function handleCallEnded(ws: ExtendedWebSocket, message: any) {
    if (!ws.roomId) return;
    
    // Forward call end to the other participant
    broadcastToRoom(ws.roomId, message, ws.participantId);
  }

  function broadcastToRoom(roomId: string, message: any, excludeParticipantId?: string) {
    connections.forEach((ws: ExtendedWebSocket) => {
      if (ws.roomId === roomId && 
          ws.readyState === WebSocket.OPEN && 
          ws.participantId !== excludeParticipantId) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
