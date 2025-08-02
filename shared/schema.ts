import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey(),
  createdAt: timestamp("created_at").default(sql`now()`),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(false),
  participantCount: integer("participant_count").default(0),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  senderNickname: text("sender_nickname").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").$type<'text' | 'image'>().default('text'),
  encryptedData: text("encrypted_data"),
  isViewOnce: boolean("is_view_once").default(false),
  hasBeenViewed: boolean("has_been_viewed").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  expiresAt: timestamp("expires_at"),
});

export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  nickname: text("nickname").notNull(),
  publicKey: text("public_key"),
  isOnline: boolean("is_online").default(true),
  joinedAt: timestamp("joined_at").default(sql`now()`),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
