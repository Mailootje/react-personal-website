import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertShortenedLinkSchema, ShortenedLink } from "@shared/schema";
import { log } from "./vite";
import QRCode from 'qrcode';

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

// Interface for download file stats
interface DownloadStat {
  fileId: string;
  downloadCount: number;
  lastDownloaded: Date;
}

// In-memory storage for download stats
const downloadStats: Map<string, DownloadStat> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Download files API
  app.get("/api/downloads/ets2", async (req, res) => {
    try {
      // Fetch the ETS2 mods from mailobedo.nl
      const response = await fetch('https://mailobedo.nl/files/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch mods: ${response.status} ${response.statusText}`);
      }
      
      const files = await response.json();
      
      // Process the files to create a proper response
      const processedFiles = files.map((url: string, index: number) => {
        // Extract filename from URL
        const filename = url.split('/').pop() || '';
        const cleanFilename = filename.replace('.scs', '').replace('.zip', '');
        
        // Create a more user-friendly name from the filename
        const name = cleanFilename
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/_/g, ' ');
        
        // Determine file type from extension
        const fileType = filename.endsWith('.scs') ? 'SCS Mod' : 'ZIP Archive';
        
        // Determine category based on filename patterns
        let category = 'Other';
        if (filename.includes('traffic')) category = 'Traffic';
        else if (filename.includes('map') || filename.includes('Map')) category = 'Maps';
        else if (filename.includes('model') || filename.includes('assets')) category = 'Models & Assets';
        else if (filename.includes('def')) category = 'Definition Files';
        else if (filename.includes('media')) category = 'Media';
        
        // Create tags from the filename components
        const tags = cleanFilename.split(/[-_]/).filter(tag => 
          tag.length > 2 && 
          !['and', 'the', 'for', 'with', 'v1', 'v2', 'v3'].includes(tag.toLowerCase())
        );
        
        return {
          id: `ets2-${index}`,
          name: name,
          description: `${fileType} for Euro Truck Simulator 2 v1.53.x`,
          fileSize: "Unknown", // We don't have actual file sizes
          version: filename.match(/v[0-9.]+/)?.[0] || 'Latest',
          uploadDate: "2025-03-01", // Placeholder date
          downloadCount: Math.floor(Math.random() * 1000) + 500, // Random count for display
          category: category,
          tags: Array.from(new Set(tags)).slice(0, 3), // Take up to 3 unique tags
          originalUrl: url,
          downloadUrl: `/api/downloads/proxy?url=${encodeURIComponent(url)}`
        };
      });
      
      res.json(processedFiles);
    } catch (error) {
      console.error("Error fetching ETS2 mods:", error);
      res.status(500).json({ message: "Failed to fetch ETS2 mods from source" });
    }
  });
  
  // Proxy endpoint for downloading files
  app.get("/api/downloads/proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }
      
      // Extract the filename from the URL
      const filename = url.split('/').pop() || 'download';
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Create a fetch request to the original URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      // Pipe the response to our response
      const body = await response.arrayBuffer();
      res.send(Buffer.from(body));
      
    } catch (error) {
      console.error("Error proxying download:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });
  
  app.get("/api/downloads/stats/:fileId", (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Get the download stats for the file
      const stats = downloadStats.get(fileId) || {
        fileId,
        downloadCount: 0,
        lastDownloaded: new Date(0) // Unix epoch
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error getting download stats:", error);
      res.status(500).json({ message: "Failed to get download stats" });
    }
  });

  // Track download endpoint - increment counter and redirect to actual file
  app.get("/downloads/files/:fileId", (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Update download stats
      const stats = downloadStats.get(fileId) || {
        fileId,
        downloadCount: 0,
        lastDownloaded: new Date()
      };
      
      // Increment download count and update timestamp
      stats.downloadCount += 1;
      stats.lastDownloaded = new Date();
      
      // Save back to map
      downloadStats.set(fileId, stats);
      
      // Create proper file path for the download
      // This assumes files are stored in client/public/assets/downloads/files/
      // with proper organization by game/category
      let filePath;
      
      // ETS2 files (in ets2 subdirectory)
      if (fileId.startsWith('ets2-')) {
        filePath = path.join('assets', 'downloads', 'files', 'ets2', `${fileId}.zip`);
      } else {
        // Default path for other files
        filePath = path.join('assets', 'downloads', 'files', `${fileId}.zip`);
      }
      
      console.log(`Download request for ${fileId}, serving file: ${filePath}`);
      
      // Check if the file exists (for better debugging)
      const fullPath = path.join(process.cwd(), 'client', 'public', filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        res.status(404).json({ message: "File not found" });
        return;
      }
      
      // Send the file for download with appropriate headers
      res.download(fullPath, path.basename(fullPath), (err) => {
        if (err) {
          console.error(`Error downloading file: ${err}`);
          // If headers already sent, we can't send another response
          if (!res.headersSent) {
            res.status(500).json({ message: "Error downloading file" });
          }
        }
      });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ message: "Failed to process download" });
    }
  });
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

  // Generate QR Code API
  app.post("/api/generate-qrcode", async (req, res) => {
    try {
      const { content, type, options } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      let finalContent = content;

      // Format content based on type
      if (type) {
        switch (type) {
          case 'email':
            finalContent = `mailto:${content}`;
            break;
          case 'tel':
            finalContent = `tel:${content}`;
            break;
          case 'sms':
            finalContent = `sms:${content}`;
            break;
          case 'whatsapp':
            // Remove any non-digit characters for WhatsApp
            const cleanNumber = content.replace(/\D/g, '');
            finalContent = `https://wa.me/${cleanNumber}`;
            break;
          case 'wifi':
            // Expected format: {ssid, password, encryption}
            if (content.ssid) {
              const encryption = content.encryption || 'WPA';
              finalContent = `WIFI:S:${content.ssid};T:${encryption};${content.password ? `P:${content.password};` : ''};;`;
            }
            break;
          case 'vcard':
            // Basic vCard format
            if (content.name) {
              finalContent = `BEGIN:VCARD\nVERSION:3.0\nN:${content.name}\n`;
              if (content.phone) finalContent += `TEL:${content.phone}\n`;
              if (content.email) finalContent += `EMAIL:${content.email}\n`;
              if (content.url) finalContent += `URL:${content.url}\n`;
              if (content.company) finalContent += `ORG:${content.company}\n`;
              finalContent += 'END:VCARD';
            }
            break;
          default:
            // For URLs and other types, use as is
            break;
        }
      }

      // Generate QR code as data URL
      const qrOptions = {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        ...options
      };

      const dataUrl = await QRCode.toDataURL(finalContent, qrOptions);
      
      res.json({ 
        qrcode: dataUrl,
        content: finalContent 
      });
    } catch (error) {
      log(`Error generating QR code: ${error}`, "routes");
      res.status(500).json({ message: "Failed to generate QR code" });
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
