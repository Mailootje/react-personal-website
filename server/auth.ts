import { Request, Response, NextFunction, Express } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { log } from './vite';
import { User, InsertUser } from '@shared/schema';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import crypto from 'crypto';

// Extend Express Request type to include session property
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const SALT_ROUNDS = 10;

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  } catch (error) {
    log(`Error in isAdmin middleware: ${error}`, 'auth');
    res.status(500).json({ error: 'Server error' });
  }
};

// Hash a password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Check if password matches hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Configure and initialize session
export const setupSession = (app: Express) => {
  // Generate a random secret for sessions
  const sessionSecret = process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');
  
  let sessionStore;
  if (process.env.DATABASE_URL) {
    // Use PostgreSQL session store if database is available
    const PgSession = connectPgSimple(session);
    sessionStore = new PgSession({
      pool,
      tableName: 'session', // Default session table name
      createTableIfMissing: true
    });
  } else {
    // Use in-memory session store for development
    const MemoryStore = require('memorystore')(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }
  
  // Configure session middleware
  app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));
};

// Register auth routes
export const registerAuthRoutes = (app: Express) => {
  // Register a new user (admin only)
  app.post('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, email, isAdmin } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        isAdmin: isAdmin || false
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      log(`Error creating user: ${error}`, 'auth');
      res.status(500).json({ error: 'Error creating user' });
    }
  });

  // Login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      log(`Error logging in: ${error}`, 'auth');
      res.status(500).json({ error: 'Error logging in' });
    }
  });

  // Logout
  app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        log(`Error logging out: ${err}`, 'auth');
        return res.status(500).json({ error: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/me', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy((err) => {
          if (err) {
            log(`Error destroying invalid session: ${err}`, 'auth');
          }
        });
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      log(`Error getting current user: ${error}`, 'auth');
      res.status(500).json({ error: 'Error getting user information' });
    }
  });

  // Create initial admin if none exists
  app.post('/api/setup-admin', async (req: Request, res: Response) => {
    try {
      // Check if there are any users with admin privileges
      const adminUsers = await storage.listUsers(1, 0, true);
      
      if (adminUsers.length > 0) {
        return res.status(403).json({ error: 'Admin user already exists' });
      }
      
      const { username, password, email } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create admin user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        isAdmin: true
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      log(`Error setting up admin: ${error}`, 'auth');
      res.status(500).json({ error: 'Error setting up admin' });
    }
  });
};