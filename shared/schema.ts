import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  // Removed profilePicture field since we now use profileImageData
  profileImageData: text("profile_image_data"), // Store base64 encoded profile image
  profileImageType: text("profile_image_type"), // Store profile image MIME type
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  // Removed profilePicture from schema
  profileImageData: true,
  profileImageType: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"), // Keep for backward compatibility
  imageData: text("image_data"), // Store base64 encoded image data
  imageType: text("image_type"), // Store the MIME type of the image
  published: boolean("published").default(true).notNull(),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  imageUrl: true,
  imageData: true,
  imageType: true,
  published: true,
  authorId: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

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

// One-time use tokens for secure counter increments
export const counterTokens = pgTable("counter_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertCounterTokenSchema = createInsertSchema(counterTokens).pick({
  token: true,
  expiresAt: true,
});

export type InsertCounterToken = z.infer<typeof insertCounterTokenSchema>;
export type CounterToken = typeof counterTokens.$inferSelect;

// Blog comments table
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  blogPostId: integer("blog_post_id").notNull().references(() => blogPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).pick({
  content: true,
  blogPostId: true,
  userId: true,
});

export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;

// Set up relations

export const usersRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  comments: many(blogComments),
}));

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.blogPostId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
}));
