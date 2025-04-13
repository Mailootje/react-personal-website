import { 
  users, 
  type User, 
  type InsertUser, 
  shortenedLinks, 
  type ShortenedLink, 
  type InsertShortenedLink 
} from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, lt, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { log } from './vite';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Link shortener methods
  createShortenedLink(link: InsertShortenedLink): Promise<ShortenedLink>;
  getShortenedLinkByCode(shortCode: string): Promise<ShortenedLink | undefined>;
  incrementLinkClicks(shortCode: string): Promise<void>;
  cleanupExpiredLinks(): Promise<void>;
  getRecentLinks(limit: number): Promise<ShortenedLink[]>;
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
}

// Memory storage implementation for backward compatibility
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private shortenedLinks: Map<string, ShortenedLink>;
  private currentUserId: number;
  private currentLinkId: number;

  constructor() {
    this.users = new Map();
    this.shortenedLinks = new Map();
    this.currentUserId = 1;
    this.currentLinkId = 1;
    
    // Schedule cleanup of expired links every hour
    setInterval(() => {
      this.cleanupExpiredLinks().catch(error => {
        log(`Error cleaning up expired links: ${error}`, "storage");
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async createShortenedLink(link: InsertShortenedLink): Promise<ShortenedLink> {
    const id = this.currentLinkId++;
    const newLink: ShortenedLink = {
      ...link,
      id,
      createdAt: new Date(),
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
  
  async cleanupExpiredLinks(): Promise<void> {
    const now = new Date();
    // Convert the Map.entries() to an array first to avoid iteration issues
    Array.from(this.shortenedLinks.entries()).forEach(([shortCode, link]) => {
      if (link.expiresAt < now) {
        this.shortenedLinks.delete(shortCode);
      }
    });
  }
  
  async getRecentLinks(limit: number): Promise<ShortenedLink[]> {
    return Array.from(this.shortenedLinks.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();
