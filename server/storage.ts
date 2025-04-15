import { 
  users, 
  type User, 
  type InsertUser, 
  shortenedLinks, 
  type ShortenedLink, 
  type InsertShortenedLink,
  conversionCounters,
  type ConversionCounter,
  type InsertConversionCounter,
  counterTokens,
  type CounterToken,
  type InsertCounterToken,
  blogPosts,
  type BlogPost,
  type InsertBlogPost
} from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, lt, desc, and, isNull, asc, count } from 'drizzle-orm';
import postgres from 'postgres';
import { log } from './vite';
import crypto from 'crypto';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(limit?: number, offset?: number, adminOnly?: boolean): Promise<User[]>;
  
  // Blog post methods
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  listBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  listPublishedBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  countBlogPosts(): Promise<number>;
  
  // Link shortener methods
  createShortenedLink(link: InsertShortenedLink): Promise<ShortenedLink>;
  getShortenedLinkByCode(shortCode: string): Promise<ShortenedLink | undefined>;
  updateShortenedLink(shortCode: string, data: Partial<InsertShortenedLink>): Promise<ShortenedLink | undefined>;
  incrementLinkClicks(shortCode: string): Promise<void>;
  cleanupExpiredLinks(): Promise<void>;
  getRecentLinks(limit: number): Promise<ShortenedLink[]>;
  
  // Conversion counter methods
  getConversionCounter(name: string): Promise<ConversionCounter | undefined>;
  incrementConversionCounter(name: string, incrementBy?: number): Promise<ConversionCounter>;
  getAllConversionCounters(): Promise<ConversionCounter[]>;
  
  // Counter token methods
  createCounterToken(): Promise<CounterToken>;
  getCounterToken(token: string): Promise<CounterToken | undefined>;
  useCounterToken(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
}

// Database storage implementation using PostgreSQL
export class DbStorage implements IStorage {
  private db: any;
  private client: any;
  
  constructor() {
    const connectionString = process.env.DATABASE_URL as string;
    this.client = postgres(connectionString);
    this.db = drizzle(this.client);
    
    // Schedule cleanup of expired links every hour
    setInterval(() => {
      this.cleanupExpiredLinks().catch(error => {
        log(`Error cleaning up expired links: ${error}`, "storage");
      });
    }, 60 * 60 * 1000); // 1 hour
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting user: ${error}`, "storage");
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      log(`Error getting user by username: ${error}`, "storage");
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await this.db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      log(`Error creating user: ${error}`, "storage");
      throw error;
    }
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const result = await this.db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating user: ${error}`, "storage");
      return undefined;
    }
  }
  
  async listUsers(limit: number = 50, offset: number = 0, adminOnly: boolean = false): Promise<User[]> {
    try {
      let query = this.db.select().from(users);
      
      if (adminOnly) {
        query = query.where(eq(users.isAdmin, true));
      }
      
      const result = await query
        .orderBy(asc(users.username))
        .limit(limit)
        .offset(offset);
      
      return result;
    } catch (error) {
      log(`Error listing users: ${error}`, "storage");
      return [];
    }
  }
  
  // Blog post methods
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      const now = new Date();
      const result = await this.db.insert(blogPosts)
        .values({
          ...post,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return result[0];
    } catch (error) {
      log(`Error creating blog post: ${error}`, "storage");
      throw error;
    }
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      const result = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
      return result[0];
    } catch (error) {
      log(`Error getting blog post: ${error}`, "storage");
      return undefined;
    }
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      const result = await this.db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
      return result[0];
    } catch (error) {
      log(`Error getting blog post by slug: ${error}`, "storage");
      return undefined;
    }
  }
  
  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    try {
      const result = await this.db.update(blogPosts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`Error updating blog post: ${error}`, "storage");
      return undefined;
    }
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
      return true;
    } catch (error) {
      log(`Error deleting blog post: ${error}`, "storage");
      return false;
    }
  }
  
  async listBlogPosts(limit: number = 50, offset: number = 0): Promise<BlogPost[]> {
    try {
      const result = await this.db.select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset);
      return result;
    } catch (error) {
      log(`Error listing blog posts: ${error}`, "storage");
      return [];
    }
  }
  
  async listPublishedBlogPosts(limit: number = 50, offset: number = 0): Promise<BlogPost[]> {
    try {
      const result = await this.db.select()
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset);
      return result;
    } catch (error) {
      log(`Error listing published blog posts: ${error}`, "storage");
      return [];
    }
  }
  
  async countBlogPosts(): Promise<number> {
    try {
      const result = await this.db.select({ count: count() }).from(blogPosts);
      return result[0]?.count || 0;
    } catch (error) {
      log(`Error counting blog posts: ${error}`, "storage");
      return 0;
    }
  }
  
  async createShortenedLink(link: InsertShortenedLink): Promise<ShortenedLink> {
    try {
      const result = await this.db.insert(shortenedLinks).values(link).returning();
      return result[0];
    } catch (error) {
      log(`Error creating shortened link: ${error}`, "storage");
      throw error;
    }
  }
  
  async getShortenedLinkByCode(shortCode: string): Promise<ShortenedLink | undefined> {
    try {
      const result = await this.db.select().from(shortenedLinks).where(eq(shortenedLinks.shortCode, shortCode));
      return result[0];
    } catch (error) {
      log(`Error getting shortened link: ${error}`, "storage");
      return undefined;
    }
  }
  
  async incrementLinkClicks(shortCode: string): Promise<void> {
    try {
      const link = await this.getShortenedLinkByCode(shortCode);
      if (link) {
        await this.db.update(shortenedLinks)
          .set({ clicks: link.clicks + 1 })
          .where(eq(shortenedLinks.shortCode, shortCode));
      }
    } catch (error) {
      log(`Error incrementing link clicks: ${error}`, "storage");
    }
  }
  
  async updateShortenedLink(shortCode: string, data: Partial<InsertShortenedLink>): Promise<ShortenedLink | undefined> {
    try {
      const link = await this.getShortenedLinkByCode(shortCode);
      if (!link) return undefined;
      
      const result = await this.db.update(shortenedLinks)
        .set(data)
        .where(eq(shortenedLinks.shortCode, shortCode))
        .returning();
        
      return result[0];
    } catch (error) {
      log(`Error updating shortened link: ${error}`, "storage");
      return undefined;
    }
  }
  
  async cleanupExpiredLinks(): Promise<void> {
    try {
      const now = new Date();
      await this.db.delete(shortenedLinks).where(lt(shortenedLinks.expiresAt, now));
      log("Expired links cleaned up", "storage");
    } catch (error) {
      log(`Error cleaning up expired links: ${error}`, "storage");
    }
  }
  
  async getRecentLinks(limit: number): Promise<ShortenedLink[]> {
    try {
      const result = await this.db.select().from(shortenedLinks).orderBy(desc(shortenedLinks.createdAt)).limit(limit);
      return result;
    } catch (error) {
      log(`Error getting recent links: ${error}`, "storage");
      return [];
    }
  }

  async getConversionCounter(name: string): Promise<ConversionCounter | undefined> {
    try {
      const result = await this.db.select().from(conversionCounters).where(eq(conversionCounters.name, name));
      return result[0];
    } catch (error) {
      log(`Error getting conversion counter: ${error}`, "storage");
      return undefined;
    }
  }

  async incrementConversionCounter(name: string, incrementBy: number = 1): Promise<ConversionCounter> {
    try {
      // Ensure the increment is capped at 100
      const cappedIncrement = Math.min(100, Math.max(1, incrementBy));
      
      // First check if counter exists
      const counter = await this.getConversionCounter(name);
      
      if (counter) {
        // Counter exists, update it
        const newCount = counter.count + cappedIncrement;
        const result = await this.db.update(conversionCounters)
          .set({ 
            count: newCount,
            lastUpdated: new Date()
          })
          .where(eq(conversionCounters.name, name))
          .returning();
        return result[0];
      } else {
        // Counter doesn't exist, create it
        const result = await this.db.insert(conversionCounters)
          .values({
            name,
            count: cappedIncrement,
            lastUpdated: new Date()
          })
          .returning();
        return result[0];
      }
    } catch (error) {
      log(`Error incrementing conversion counter: ${error}`, "storage");
      throw error;
    }
  }

  async getAllConversionCounters(): Promise<ConversionCounter[]> {
    try {
      const result = await this.db.select().from(conversionCounters).orderBy(desc(conversionCounters.count));
      return result;
    } catch (error) {
      log(`Error getting all conversion counters: ${error}`, "storage");
      return [];
    }
  }
  
  async createCounterToken(): Promise<CounterToken> {
    try {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration time to 5 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      // Insert the token into the database
      const result = await this.db.insert(counterTokens)
        .values({
          token,
          expiresAt,
          used: false
        })
        .returning();
      
      return result[0];
    } catch (error) {
      log(`Error creating counter token: ${error}`, "storage");
      throw error;
    }
  }
  
  async getCounterToken(token: string): Promise<CounterToken | undefined> {
    try {
      const result = await this.db.select()
        .from(counterTokens)
        .where(eq(counterTokens.token, token));
      
      return result[0];
    } catch (error) {
      log(`Error getting counter token: ${error}`, "storage");
      return undefined;
    }
  }
  
  async useCounterToken(token: string): Promise<boolean> {
    try {
      // Get the token and check if it's valid
      const tokenObj = await this.getCounterToken(token);
      
      if (!tokenObj) {
        return false; // Token doesn't exist
      }
      
      if (tokenObj.used) {
        return false; // Token already used
      }
      
      if (tokenObj.expiresAt < new Date()) {
        return false; // Token expired
      }
      
      // Mark the token as used
      await this.db.update(counterTokens)
        .set({ used: true })
        .where(eq(counterTokens.token, token));
      
      return true;
    } catch (error) {
      log(`Error using counter token: ${error}`, "storage");
      return false;
    }
  }
  
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      await this.db.delete(counterTokens)
        .where(lt(counterTokens.expiresAt, now));
      
      log("Expired counter tokens cleaned up", "storage");
    } catch (error) {
      log(`Error cleaning up expired tokens: ${error}`, "storage");
    }
  }
}

// Memory storage implementation for backward compatibility
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private shortenedLinks: Map<string, ShortenedLink>;
  private conversionCounters: Map<string, ConversionCounter>;
  private counterTokens: Map<string, CounterToken>;
  private blogPosts: Map<number, BlogPost>;
  private blogPostsBySlug: Map<string, number>;
  private currentUserId: number;
  private currentLinkId: number;
  private currentCounterId: number;
  private currentTokenId: number;
  private currentBlogPostId: number;

  constructor() {
    this.users = new Map();
    this.shortenedLinks = new Map();
    this.conversionCounters = new Map();
    this.counterTokens = new Map();
    this.blogPosts = new Map();
    this.blogPostsBySlug = new Map();
    this.currentUserId = 1;
    this.currentLinkId = 1;
    this.currentCounterId = 1;
    this.currentTokenId = 1;
    this.currentBlogPostId = 1;
    
    // Schedule cleanup of expired items every hour
    setInterval(() => {
      this.cleanupExpiredLinks().catch((error: any) => {
        log(`Error cleaning up expired links: ${error}`, "storage");
      });
    }, 60 * 60 * 1000); // 1 hour
    
    // Also cleanup expired tokens every hour on a different schedule
    setInterval(() => {
      this.cleanupExpiredTokens().catch((error: any) => {
        log(`Error cleaning up expired tokens: ${error}`, "storage");
      });
    }, 60 * 60 * 1000); // 1 hour
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      email: insertUser.email || null,
      isAdmin: insertUser.isAdmin || false
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(limit: number = 50, offset: number = 0, adminOnly: boolean = false): Promise<User[]> {
    const users = Array.from(this.users.values());
    
    const filteredUsers = adminOnly 
      ? users.filter(user => user.isAdmin)
      : users;
      
    return filteredUsers
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(offset, offset + limit);
  }
  
  // Blog post methods
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const now = new Date();
    
    const blogPost: BlogPost = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now,
      excerpt: post.excerpt || null,
      imageUrl: post.imageUrl || null,
      published: post.published !== undefined ? post.published : true,
      authorId: post.authorId || null
    };
    
    this.blogPosts.set(id, blogPost);
    this.blogPostsBySlug.set(post.slug, id);
    
    return blogPost;
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const id = this.blogPostsBySlug.get(slug);
    if (!id) return undefined;
    return this.blogPosts.get(id);
  }
  
  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    if (!post) return undefined;
    
    // If slug is being updated, update the slug mapping
    if (data.slug && data.slug !== post.slug) {
      this.blogPostsBySlug.delete(post.slug);
      this.blogPostsBySlug.set(data.slug, id);
    }
    
    const updatedPost: BlogPost = {
      ...post,
      ...data,
      updatedAt: new Date()
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    const post = this.blogPosts.get(id);
    if (!post) return false;
    
    this.blogPostsBySlug.delete(post.slug);
    this.blogPosts.delete(id);
    
    return true;
  }
  
  async listBlogPosts(limit: number = 50, offset: number = 0): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async listPublishedBlogPosts(limit: number = 50, offset: number = 0): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async countBlogPosts(): Promise<number> {
    return this.blogPosts.size;
  }

  async createShortenedLink(link: InsertShortenedLink): Promise<ShortenedLink> {
    const id = this.currentLinkId++;
    const newLink: ShortenedLink = {
      ...link,
      id,
      createdAt: new Date(),
      expiresAt: link.expiresAt || null,
      clicks: 0
    };
    this.shortenedLinks.set(link.shortCode, newLink);
    return newLink;
  }
  
  async getShortenedLinkByCode(shortCode: string): Promise<ShortenedLink | undefined> {
    return this.shortenedLinks.get(shortCode);
  }
  
  async incrementLinkClicks(shortCode: string): Promise<void> {
    const link = this.shortenedLinks.get(shortCode);
    if (link) {
      link.clicks += 1;
      this.shortenedLinks.set(shortCode, link);
    }
  }
  
  async updateShortenedLink(shortCode: string, data: Partial<InsertShortenedLink>): Promise<ShortenedLink | undefined> {
    const link = this.shortenedLinks.get(shortCode);
    if (!link) return undefined;
    
    const updatedLink: ShortenedLink = { ...link, ...data };
    this.shortenedLinks.set(shortCode, updatedLink);
    return updatedLink;
  }
  
  async cleanupExpiredLinks(): Promise<void> {
    const now = new Date();
    // Convert the Map.entries() to an array first to avoid iteration issues
    Array.from(this.shortenedLinks.entries()).forEach(([shortCode, link]) => {
      // Only delete links that have a non-null expiresAt date that's in the past
      if (link.expiresAt !== null && link.expiresAt !== undefined && link.expiresAt < now) {
        this.shortenedLinks.delete(shortCode);
      }
    });
  }
  
  async getRecentLinks(limit: number): Promise<ShortenedLink[]> {
    return Array.from(this.shortenedLinks.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getConversionCounter(name: string): Promise<ConversionCounter | undefined> {
    return this.conversionCounters.get(name);
  }

  async incrementConversionCounter(name: string, incrementBy: number = 1): Promise<ConversionCounter> {
    // Ensure the increment is capped at 100
    const cappedIncrement = Math.min(100, Math.max(1, incrementBy));
    
    const counter = this.conversionCounters.get(name);
    
    if (counter) {
      // Counter exists, update it
      counter.count += cappedIncrement;
      counter.lastUpdated = new Date();
      this.conversionCounters.set(name, counter);
      return counter;
    } else {
      // Counter doesn't exist, create it
      const id = this.currentCounterId++;
      const newCounter: ConversionCounter = {
        id,
        name,
        count: cappedIncrement, // Use capped increment here too
        lastUpdated: new Date()
      };
      this.conversionCounters.set(name, newCounter);
      return newCounter;
    }
  }

  async getAllConversionCounters(): Promise<ConversionCounter[]> {
    return Array.from(this.conversionCounters.values())
      .sort((a, b) => b.count - a.count);
  }
  
  async createCounterToken(): Promise<CounterToken> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration time to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    const id = this.currentTokenId++;
    const counterToken: CounterToken = {
      id,
      token,
      expiresAt,
      used: false,
      createdAt: new Date()
    };
    
    this.counterTokens.set(token, counterToken);
    return counterToken;
  }
  
  async getCounterToken(token: string): Promise<CounterToken | undefined> {
    return this.counterTokens.get(token);
  }
  
  async useCounterToken(token: string): Promise<boolean> {
    const tokenObj = this.counterTokens.get(token);
    
    if (!tokenObj) {
      return false; // Token doesn't exist
    }
    
    if (tokenObj.used) {
      return false; // Token already used
    }
    
    if (tokenObj.expiresAt < new Date()) {
      return false; // Token expired
    }
    
    // Mark token as used
    tokenObj.used = true;
    this.counterTokens.set(token, tokenObj);
    
    return true;
  }
  
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    
    // Convert the Map.entries() to an array first to avoid iteration issues
    Array.from(this.counterTokens.entries()).forEach(([token, tokenObj]) => {
      if (tokenObj.expiresAt < now) {
        this.counterTokens.delete(token);
      }
    });
    
    log("Expired counter tokens cleaned up", "storage");
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();
