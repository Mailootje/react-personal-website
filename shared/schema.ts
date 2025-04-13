import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Shortened links table
export const shortenedLinks = pgTable("shortened_links", {
  id: serial("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  clicks: integer("clicks").notNull().default(0),
});

export const insertShortenedLinkSchema = createInsertSchema(shortenedLinks).pick({
  originalUrl: true,
  shortCode: true,
  expiresAt: true,
});

export type InsertShortenedLink = z.infer<typeof insertShortenedLinkSchema>;
export type ShortenedLink = typeof shortenedLinks.$inferSelect;

// Conversion counters table
export const conversionCounters = pgTable("conversion_counters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  count: integer("count").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertConversionCounterSchema = createInsertSchema(conversionCounters).pick({
  name: true,
  count: true,
});

export type InsertConversionCounter = z.infer<typeof insertConversionCounterSchema>;
export type ConversionCounter = typeof conversionCounters.$inferSelect;
