import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertShortenedLinkSchema, ShortenedLink } from "@shared/schema";
import { log } from "./vite";

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  category: string;
}

// Validation schema for creating a short link
const createShortLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL including http:// or https://")
});

// Generate a random short code
function generateShortCode(length = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Calculate expiration date (7 days from now)
function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate the required fields
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Please provide all required fields" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // In a real application, you would:
      // 1. Save to database
      // 2. Send an email notification 
      // 3. Implement rate limiting to prevent abuse

      // For now, just return a success message
      res.status(200).json({ message: "Message received successfully" });
    } catch (error) {
      console.error("Error in contact form submission:", error);
      res.status(500).json({ message: "An error occurred while submitting the form" });
    }
  });

  // Photography API - Get all photos or by category
  app.get("/api/photos", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const photos: PhotoItem[] = [];
      
      // Base directory for photography images
      const baseDir = path.join("client", "public", "assets", "images", "photography");
      
      // If category is specified and valid, only get images from that category folder
      if (category && category !== "all" && ["urban", "nature", "people"].includes(category)) {
        const categoryDir = path.join(baseDir, category);
        
        if (fs.existsSync(categoryDir)) {
          const files = fs.readdirSync(categoryDir);
          files.forEach((file, index) => {
            if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
              photos.push({
                id: `${category}-${index}`,
                url: `/assets/images/photography/${category}/${file}`,
                title: formatTitle(file),
                category
              });
            }
          });
        }
      } else {
        // Get all images from all categories
        const categories = ["urban", "nature", "people"];
        
        categories.forEach(cat => {
          const categoryDir = path.join(baseDir, cat);
          
          if (fs.existsSync(categoryDir)) {
            const files = fs.readdirSync(categoryDir);
            files.forEach((file, index) => {
              if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
                photos.push({
                  id: `${cat}-${index}`,
                  url: `/assets/images/photography/${cat}/${file}`,
                  title: formatTitle(file),
                  category: cat
                });
              }
            });
          }
        });
      }
      
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Link Shortener API
  // Create a shortened link
  app.post("/api/shorten", async (req, res) => {
    try {
      // Validate the input
      const validationResult = createShortLinkSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.format() 
        });
      }

      const { url } = validationResult.data;
      
      // Generate a unique short code
      let shortCode = generateShortCode();
      let existingLink = await storage.getShortenedLinkByCode(shortCode);
      
      // Keep generating until we find a unique code
      while (existingLink) {
        shortCode = generateShortCode();
        existingLink = await storage.getShortenedLinkByCode(shortCode);
      }
      
      // Set expiration date (7 days from now)
      const expiresAt = getExpirationDate();
      
      // Create the shortened link
      const newLink = await storage.createShortenedLink({
        originalUrl: url,
        shortCode,
        expiresAt
      });
      
      // Return the shortened link
      res.status(201).json({
        shortCode: newLink.shortCode,
        originalUrl: newLink.originalUrl,
        expiresAt: newLink.expiresAt,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${newLink.shortCode}`
      });
      
    } catch (error) {
      log(`Error creating shortened link: ${error}`, "routes");
      res.status(500).json({ message: "Failed to create shortened link" });
    }
  });
  
  // Get a shortened link
  app.get("/api/links/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const link = await storage.getShortenedLinkByCode(shortCode);
      
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      res.json({
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clicks: link.clicks,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`
      });
      
    } catch (error) {
      log(`Error retrieving shortened link: ${error}`, "routes");
      res.status(500).json({ message: "Failed to retrieve shortened link" });
    }
  });
  
  // Get recent links
  app.get("/api/links", async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const links = await storage.getRecentLinks(limit);
      
      // Add the shortUrl to each link
      const linksWithShortUrl = links.map(link => ({
        ...link,
        shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`
      }));
      
      res.json(linksWithShortUrl);
      
    } catch (error) {
      log(`Error retrieving recent links: ${error}`, "routes");
      res.status(500).json({ message: "Failed to retrieve recent links" });
    }
  });
  
  // Redirect from shortened URL
  app.get("/s/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const link = await storage.getShortenedLinkByCode(shortCode);
      
      // If link not found or expired, redirect to not-found page
      if (!link || link.expiresAt < new Date()) {
        return res.redirect('/not-found');
      }
      
      // Increment click count
      await storage.incrementLinkClicks(shortCode);
      
      // Redirect to the original URL
      res.redirect(link.originalUrl);
      
    } catch (error) {
      log(`Error redirecting shortened link: ${error}`, "routes");
      res.redirect('/not-found');
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to format file names as titles
function formatTitle(filename: string): string {
  // Remove extension and replace dashes/underscores with spaces
  const name = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  
  // Capitalize first letter of each word
  return name.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
