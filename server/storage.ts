import { type ChatRoom, type ChatMessage, type ChatParticipant, type InsertChatRoom, type InsertChatMessage, type InsertChatParticipant } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Chat Room operations
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined>;
  deleteChatRoom(id: string): Promise<void>;
  
  // Chat Message operations
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessages(roomId: string): Promise<ChatMessage[]>;
  markMessageViewed(messageId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Chat Participant operations
  addParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  getParticipants(roomId: string): Promise<ChatParticipant[]>;
  updateParticipantStatus(participantId: string, isOnline: boolean): Promise<void>;
  removeParticipant(participantId: string): Promise<void>;
  
  // Cleanup operations
  cleanupExpiredRooms(): Promise<void>;
  cleanupExpiredMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private chatRooms: Map<string, ChatRoom>;
  private chatMessages: Map<string, ChatMessage>;
  private chatParticipants: Map<string, ChatParticipant>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.chatParticipants = new Map();
    
    // Start cleanup interval - check every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRooms();
      this.cleanupExpiredMessages();
    }, 30000);
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: insertRoom.id,
      createdAt: new Date(),
      expiresAt: insertRoom.expiresAt,
      isActive: insertRoom.isActive || false,
      participantCount: 0,
    };
    this.chatRooms.set(room.id, room);
    return room;
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const room = this.chatRooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.chatRooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteChatRoom(id: string): Promise<void> {
    this.chatRooms.delete(id);
    // Clean up associated messages and participants
    Array.from(this.chatMessages.entries()).forEach(([messageId, message]) => {
      if (message.roomId === id) {
        this.chatMessages.delete(messageId);
      }
    });
    Array.from(this.chatParticipants.entries()).forEach(([participantId, participant]) => {
      if (participant.roomId === id) {
        this.chatParticipants.delete(participantId);
      }
    });
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      roomId: insertMessage.roomId,
      senderNickname: insertMessage.senderNickname,
      content: insertMessage.content,
      messageType: insertMessage.messageType || 'text',
      encryptedData: insertMessage.encryptedData || null,
      isViewOnce: insertMessage.isViewOnce || false,
      hasBeenViewed: false,
      createdAt: new Date(),
      expiresAt: insertMessage.expiresAt || null,
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async markMessageViewed(messageId: string): Promise<void> {
    const message = this.chatMessages.get(messageId);
    if (message) {
      const updatedMessage = { ...message, hasBeenViewed: true };
      this.chatMessages.set(messageId, updatedMessage);
      
      // If it's a view-once message, schedule deletion
      if (message.isViewOnce) {
        setTimeout(() => {
          this.chatMessages.delete(messageId);
        }, 1000);
      }
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    this.chatMessages.delete(messageId);
  }

  async addParticipant(insertParticipant: InsertChatParticipant): Promise<ChatParticipant> {
    const id = randomUUID();
    const participant: ChatParticipant = {
      id,
      roomId: insertParticipant.roomId,
      nickname: insertParticipant.nickname,
      publicKey: insertParticipant.publicKey || null,
      isOnline: true,
      joinedAt: new Date(),
    };
    this.chatParticipants.set(id, participant);
    
    // Update room participant count
    const room = this.chatRooms.get(participant.roomId);
    if (room) {
      const updatedRoom = { ...room, participantCount: (room.participantCount || 0) + 1 };
      this.chatRooms.set(participant.roomId, updatedRoom);
    }
    
    return participant;
  }

  async getParticipants(roomId: string): Promise<ChatParticipant[]> {
    return Array.from(this.chatParticipants.values())
      .filter(participant => participant.roomId === roomId);
  }

  async updateParticipantStatus(participantId: string, isOnline: boolean): Promise<void> {
    const participant = this.chatParticipants.get(participantId);
    if (participant) {
      const updatedParticipant = { ...participant, isOnline };
      this.chatParticipants.set(participantId, updatedParticipant);
    }
  }

  async removeParticipant(participantId: string): Promise<void> {
    const participant = this.chatParticipants.get(participantId);
    if (participant) {
      this.chatParticipants.delete(participantId);
      
      // Update room participant count
      const room = this.chatRooms.get(participant.roomId);
      if (room) {
        const updatedRoom = { ...room, participantCount: Math.max(0, (room.participantCount || 1) - 1) };
        this.chatRooms.set(participant.roomId, updatedRoom);
      }
    }
  }

  async cleanupExpiredRooms(): Promise<void> {
    const now = new Date();
    Array.from(this.chatRooms.entries()).forEach(([roomId, room]) => {
      if (room.expiresAt && room.expiresAt < now) {
        this.deleteChatRoom(roomId);
      }
    });
  }

  async cleanupExpiredMessages(): Promise<void> {
    const now = new Date();
    Array.from(this.chatMessages.entries()).forEach(([messageId, message]) => {
      if (message.expiresAt && message.expiresAt < now) {
        this.chatMessages.delete(messageId);
      }
    });
  }
}

export const storage = new MemStorage();
