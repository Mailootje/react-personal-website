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
  log(`Session check: Session ID=${req.sessionID}, userId=${req.session?.userId}`, 'auth');
  
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  log(`Admin check: Session ID=${req.sessionID}, userId=${req.session?.userId}`, 'auth');
  
  if (!req.session || !req.session.userId) {
    log('Admin check failed: No session or no userId', 'auth');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      log(`Admin check failed: User ${req.session.userId} not found`, 'auth');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!user.isAdmin) {
      log(`Admin check failed: User ${user.username} is not an admin`, 'auth');
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    log(`Admin check passed: User ${user.username} (ID: ${user.id})`, 'auth');
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
  log(`Setting up session with store: ${sessionStore ? 'Provided' : 'None'}, ENV: ${process.env.NODE_ENV || 'development'}`, 'auth');
  
  app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: true, // Changed to true to ensure session is saved even if it wasn't modified
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    cookie: {
      secure: false, // Set to false to work in both HTTP and HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      path: '/' // Ensure cookie is available across the entire site
    },
    name: 'mailo_session'
  }));
  
  // Add debugging middleware to log session data on each request
  app.use((req: Request, res: Response, next: NextFunction) => {
    log(`Request to ${req.method} ${req.url} | Session ID: ${req.sessionID} | UserId: ${req.session?.userId}`, 'session');
    next();
  });
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
  
  // Public registration endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;
      
      // Basic validation
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
      
      // Create user with regular (non-admin) privileges
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        isAdmin: false // Always create regular users through this endpoint
      });
      
      // Automatically log the user in after registration
      if (!req.session) {
        log('ERROR: Session object is undefined or null during registration!', 'auth');
        return res.status(500).json({ error: 'Session initialization failed' });
      }
      
      // Set up session for the new user
      req.session.regenerate(async (err) => {
        if (err) {
          log(`Error regenerating session after registration: ${err}`, 'auth');
          return res.status(500).json({ error: 'Session setup failed' });
        }
        
        // Set user ID in the new session
        req.session.userId = newUser.id;
        
        // Save session explicitly
        req.session.save((saveErr) => {
          if (saveErr) {
            log(`Error saving session after registration: ${saveErr}`, 'auth');
            return res.status(500).json({ error: 'Session save failed' });
          }
          
          // Remove password from response
          const { password: _, ...userWithoutPassword } = newUser;
          
          log(`User ${username} registered and logged in successfully. Session ID: ${req.sessionID}`, 'auth');
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      log(`Error in registration process: ${error}`, 'auth');
      res.status(500).json({ error: 'Error during registration' });
    }
  });

  // Login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      log(`Login attempt for username: ${req.body.username}`, 'auth');
      log(`Initial session state - ID: ${req.sessionID}, exists: ${!!req.session}`, 'auth');
      
      const { username, password } = req.body;
      
      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        log(`Login failed: User ${username} not found`, 'auth');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        log(`Login failed: Invalid password for user ${username}`, 'auth');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      log(`Login validated for user ${user.username} (ID: ${user.id})`, 'auth');
      log(`Before session update - Session data: ${JSON.stringify(req.session)}`, 'auth');
      
      // Set session
      if (!req.session) {
        log('ERROR: Session object is undefined or null!', 'auth');
        return res.status(500).json({ error: 'Session initialization failed' });
      }
      
      // Clear any existing session data and set new userId
      req.session.regenerate(async (err) => {
        if (err) {
          log(`Error regenerating session: ${err}`, 'auth');
          return res.status(500).json({ error: 'Session setup failed' });
        }
        
        // Set user ID in the new session
        req.session.userId = user.id;
        
        log(`After userId set - Session data: userId=${req.session.userId}`, 'auth');
        
        // Save session explicitly
        req.session.save((saveErr) => {
          if (saveErr) {
            log(`Error saving session: ${saveErr}`, 'auth');
            return res.status(500).json({ error: 'Session save failed' });
          }
          
          log(`Session saved successfully. New session ID: ${req.sessionID}`, 'auth');
          
          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;
          
          // Log success for debugging
          log(`User ${username} logged in successfully. Session ID: ${req.sessionID}, userId: ${req.session.userId}`, 'auth');
          
          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      log(`Error in login process: ${error}`, 'auth');
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
    log(`GET /api/me - Session ID: ${req.sessionID}, Has session: ${!!req.session}, UserId: ${req.session?.userId}`, 'auth');
    
    if (!req.session) {
      log('No session object found - session middleware issue', 'auth');
      return res.status(401).json({ error: 'Not authenticated - No session' });
    }
    
    if (!req.session.userId) {
      log('User ID not found in session', 'auth');
      return res.status(401).json({ error: 'Not authenticated - No user ID' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        log(`User with ID ${req.session.userId} not found in database`, 'auth');
        req.session.destroy((err) => {
          if (err) {
            log(`Error destroying invalid session: ${err}`, 'auth');
          }
        });
        return res.status(401).json({ error: 'User not found' });
      }
      
      log(`User ${user.username} (ID: ${user.id}) authenticated successfully`, 'auth');
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      log(`Error getting current user: ${error}`, 'auth');
      res.status(500).json({ error: 'Error getting user information' });
    }
  });
  
  // User profile update endpoint (for regular users)
  app.put('/api/profile', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if current password is correct (only needed for password change)
      const { currentPassword, newPassword, email } = req.body;
      const updateData: Partial<InsertUser> = {};
      
      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' });
        }
        
        const isPasswordValid = await verifyPassword(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        updateData.password = await hashPassword(newPassword);
      }
      
      // Update email if provided
      if (email !== undefined) {
        updateData.email = email;
      }
      
      // If there's nothing to update, return the current user
      if (Object.keys(updateData).length === 0) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
      
      // Update user in storage
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Failed to update user' });
      }
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      log(`Error updating user profile: ${error}`, 'auth');
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });
  
  // Profile picture upload endpoint
  app.post('/api/profile/picture', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userId = req.session.userId;
      log(`Processing profile picture upload for user ID: ${userId}`, 'auth');
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        log(`User with ID ${userId} not found`, 'auth');
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if image data was sent
      if (!req.body.image) {
        log('No image data provided in request body', 'auth');
        return res.status(400).json({ error: 'No image provided' });
      }
      
      try {
        // Import necessary utilities for image processing
        const { 
          convertToWebP, 
          saveProfileImage, 
          deleteProfileImage, 
          isValidImageType, 
          isFileTooLarge 
        } = require('./imageUtils');
        
        // Parse the base64 image
        const imageData = req.body.image;
        const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          log('Invalid image format - failed to parse base64 data', 'auth');
          return res.status(400).json({ error: 'Invalid image format' });
        }
        
        const imageType = matches[1];
        const base64Data = matches[2];
        log(`Image type detected: ${imageType}, processing...`, 'auth');
        
        // Create buffer from base64
        let imageBuffer;
        try {
          imageBuffer = Buffer.from(base64Data, 'base64');
          log(`Created buffer from base64 data, size: ${imageBuffer.length} bytes`, 'auth');
        } catch (bufferError) {
          log(`Error creating buffer from base64: ${bufferError}`, 'auth');
          return res.status(400).json({ error: 'Invalid base64 data' });
        }
        
        // Validate image type
        if (!isValidImageType(imageType)) {
          log(`Invalid image type: ${imageType}`, 'auth');
          return res.status(400).json({ 
            error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are supported.' 
          });
        }
        
        // Validate file size (max 5MB)
        if (isFileTooLarge(imageBuffer.length)) {
          log(`Image too large: ${imageBuffer.length} bytes`, 'auth');
          return res.status(400).json({ 
            error: 'Image too large. Maximum size is 5MB.' 
          });
        }
        
        // Convert to WebP, resize to 256x256, and optimize
        log('Converting image to WebP format...', 'auth');
        let webpBuffer;
        try {
          webpBuffer = await convertToWebP(imageBuffer);
          log(`Converted to WebP, new size: ${webpBuffer.length} bytes`, 'auth');
        } catch (conversionError) {
          log(`Error converting image to WebP: ${conversionError}`, 'auth');
          return res.status(500).json({ error: 'Failed to process image' });
        }
        
        // Delete old profile picture if exists
        if (user.profilePicture) {
          log(`Deleting existing profile picture: ${user.profilePicture}`, 'auth');
          try {
            await deleteProfileImage(user.profilePicture);
          } catch (deleteError) {
            log(`Warning: Failed to delete old profile picture: ${deleteError}`, 'auth');
            // Continue with the process even if deletion fails
          }
        }
        
        // Save the new profile picture
        log('Saving new profile picture...', 'auth');
        let profilePicturePath;
        try {
          profilePicturePath = await saveProfileImage(webpBuffer);
          log(`Saved new profile picture at: ${profilePicturePath}`, 'auth');
        } catch (saveError) {
          log(`Error saving profile picture: ${saveError}`, 'auth');
          return res.status(500).json({ error: 'Failed to save image' });
        }
        
        // Update user record with the new profile picture path
        log(`Updating user record with new profile picture path`, 'auth');
        const updatedUser = await storage.updateUser(userId, {
          profilePicture: profilePicturePath
        });
        
        if (!updatedUser) {
          log('Failed to update user record with new profile picture', 'auth');
          return res.status(500).json({ error: 'Failed to update user profile' });
        }
        
        // Return updated user without password
        const { password: _, ...userWithoutPassword } = updatedUser;
        log('Profile picture update successful', 'auth');
        
        res.setHeader("Content-Type", "application/json");
        return res.json({
          success: true,
          user: userWithoutPassword,
          profilePicture: profilePicturePath
        });
      } catch (processingError) {
        log(`Error in image processing: ${processingError}`, 'auth');
        return res.status(500).json({ error: 'Failed to process image' });
      }
    } catch (error) {
      log(`Error uploading profile picture: ${error}`, 'auth');
      return res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  });
  
  // Admin profile update endpoint
  app.put('/api/admin/profile', isAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if current password is correct
      const { currentPassword, newPassword, ...userData } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      
      const isPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Update user data
      const updateData: Partial<InsertUser> = {
        ...userData
      };
      
      // Update password if a new one is provided
      if (newPassword) {
        updateData.password = await hashPassword(newPassword);
      }
      
      // Update user in storage
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Failed to update user' });
      }
      
      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      log(`Error updating user profile: ${error}`, 'auth');
      res.status(500).json({ error: 'Failed to update profile' });
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