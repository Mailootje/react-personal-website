import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertShortenedLinkSchema, ShortenedLink } from "@shared/schema";
import { log } from "./vite";
import QRCode from 'qrcode';
import https from 'https';

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  category: string;
  subcategory: string | null;
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
  // Image proxy API for handling CORS issues with external images
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }
      
      // Check URL protocol for security reasons
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL protocol" });
      }
      
      // Use fetch API instead of https module for better handling
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Failed to fetch image: ${response.statusText}` 
        });
      }
      
      // Get content type from response headers and set it in our response
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      
      // Get binary data directly
      const imageBuffer = await response.arrayBuffer();
      
      // Send the image data
      res.send(Buffer.from(imageBuffer));
      
    } catch (error) {
      console.error("Error in image proxy:", error);
      res.status(500).json({ message: "Failed to proxy image" });
    }
  });
  // Download files API
  app.get("/api/downloads/ets2", async (req, res) => {
    try {
      // Get version from query parameter, default to 'v1.53.x'
      const version = req.query.version as string || 'v1.53.x';
      
      // Fetch the ETS2 mods from mailobedo.nl
      const response = await fetch('https://mailobedo.nl/files/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch mods: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if we have the new format with Euro_Truck_Simulator_2 key
      if (!data.Euro_Truck_Simulator_2 || !Array.isArray(data.Euro_Truck_Simulator_2)) {
        throw new Error('Invalid data format received from API');
      }
      
      // Extract available versions from the URLs
      const availableVersions = new Set<string>();
      data.Euro_Truck_Simulator_2.forEach((file: any) => {
        if (file.url) {
          const urlParts = file.url.split('/');
          // Look for version pattern in the URL (e.g., v1.53.x)
          for (let i = 0; i < urlParts.length; i++) {
            if (/^v\d+\.\d+\.x$/i.test(urlParts[i])) {
              availableVersions.add(urlParts[i].toLowerCase());
              break;
            }
          }
        }
      });
      
      // Filter files by selected version
      const filteredFiles = data.Euro_Truck_Simulator_2.filter((file: any) => {
        return file.url && file.url.toLowerCase().includes(version.toLowerCase());
      });
      
      // Process the files to create a proper response
      const processedFiles = filteredFiles.map((file: any, index: number) => {
        // Extract filename from file object
        const filename = file.name || '';
        const cleanFilename = filename.replace('.scs', '').replace('.zip', '');
        
        // Create a more user-friendly name from the filename
        const name = cleanFilename
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
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
        const tags = cleanFilename.split(/[-_]/).filter((tag: string) => 
          tag.length > 2 && 
          !['and', 'the', 'for', 'with', 'v1', 'v2', 'v3'].includes(tag.toLowerCase())
        );
        
        // Format the file size
        const fileSizeInMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
        const fileSize = fileSizeInMB >= 1000 
          ? `${(fileSizeInMB / 1024).toFixed(2)} GB` 
          : `${fileSizeInMB.toFixed(1)} MB`;
        
        return {
          id: `ets2-${index}`,
          name: name,
          description: `${fileType} for Euro Truck Simulator 2 ${version}`,
          fileSize: fileSize,
          version: filename.match(/v[0-9.]+/)?.[0] || 'Latest',
          uploadDate: "2025-03-01", // Placeholder date
          downloadCount: Math.floor(Math.random() * 1000) + 500, // Random count for display
          category: category,
          tags: Array.from(new Set(tags)).slice(0, 3), // Take up to 3 unique tags
          originalUrl: file.url,
          downloadUrl: `/api/downloads/proxy?url=${encodeURIComponent(file.url)}`
        };
      });
      
      // Return versions along with the files
      res.json({
        versions: Array.from(availableVersions).sort().reverse(),
        currentVersion: version,
        files: processedFiles
      });
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

  // Photography API - Get photos by country category and subcategory
  app.get("/api/photos", async (req, res) => {
    try {
      const category = req.query.category as string || "root";
      const subcategory = req.query.subcategory as string || null;
      const photos: PhotoItem[] = [];
      
      // Fetch the gallery JSON from mailobedo.nl
      const response = await fetch("https://mailobedo.nl/gallery/");
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery: ${response.status} ${response.statusText}`);
      }
      
      const galleryData = await response.json();
      
      // Valid categories that match directly with the JSON response
      const validCategories = ["root", "Belgium", "Germany", "Netherlands", "Spain"];
      
      if (validCategories.includes(category)) {
        // Make sure the category exists in the gallery data
        if (galleryData[category] && Array.isArray(galleryData[category])) {
          // Process photos from the selected category
          galleryData[category].forEach((photo: any, index: number) => {
            if (photo.url && photo.name && photo.url.match(/\.(jpg|jpeg|png|gif)$/i) && photo.name !== "Thumbs.db") {
              // Extract subcategory from URL if present
              let photoSubcategory = null;
              if (photo.url.includes(`/${category}/`)) {
                const urlParts = photo.url.split(`/${category}/`)[1].split('/');
                if (urlParts.length > 1) {
                  photoSubcategory = urlParts[0]; // Capture the subcategory
                }
              }
              
              // Only add the photo if it matches the subcategory filter or if no subcategory filter is applied
              if (!subcategory || (photoSubcategory && photoSubcategory === subcategory)) {
                photos.push({
                  id: `${category.toLowerCase()}-${index}`,
                  url: photo.url,
                  title: formatTitle(photo.name),
                  category: category,
                  subcategory: photoSubcategory
                });
              }
            }
          });
        }
      } else {
        // Fallback to root category if the requested category doesn't exist
        if (galleryData.root && Array.isArray(galleryData.root)) {
          galleryData.root.forEach((photo: any, index: number) => {
            if (photo.url && photo.name && photo.url.match(/\.(jpg|jpeg|png|gif)$/i) && photo.name !== "Thumbs.db") {
              photos.push({
                id: `root-${index}`,
                url: photo.url,
                title: formatTitle(photo.name),
                category: "root",
                subcategory: null
              });
            }
          });
        }
      }
      
      // Sort photos by filename for consistent ordering
      photos.sort((a, b) => a.title.localeCompare(b.title));
      
      // Return all photos without limiting
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // API endpoint to get available subcategories for a category
  app.get("/api/photos/subcategories", async (req, res) => {
    try {
      const category = req.query.category as string;
      
      if (!category) {
        return res.status(400).json({ error: "Category parameter is required" });
      }
      
      // Fetch the gallery JSON from mailobedo.nl
      const response = await fetch("https://mailobedo.nl/gallery/");
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery: ${response.status} ${response.statusText}`);
      }
      
      const galleryData = await response.json();
      
      // Valid categories that match directly with the JSON response
      const validCategories = ["root", "Belgium", "Germany", "Netherlands", "Spain"];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      // Collect all subcategories from the selected category
      const subcategories = new Set<string>();
      
      if (galleryData[category] && Array.isArray(galleryData[category])) {
        galleryData[category].forEach((photo: any) => {
          if (photo.url && photo.url.includes(`/${category}/`)) {
            const urlParts = photo.url.split(`/${category}/`)[1].split('/');
            if (urlParts.length > 1) {
              subcategories.add(urlParts[0]);
            }
          }
        });
      }
      
      // Convert Set to Array and sort alphabetically
      const sortedSubcategories = Array.from(subcategories).sort();
      
      res.json(sortedSubcategories);
    } catch (error) {
      console.error("Error fetching subcategories", error);
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
  
  // Special route for clearing session storage (helps with testing animation)
  app.get("/api/clear-session", (req, res) => {
    res.send(`
      <script>
        sessionStorage.clear();
        console.log("Session storage cleared!");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      </script>
      <div style="font-family: system-ui; padding: 20px; text-align: center;">
        <h1>Session cleared!</h1>
        <p>Redirecting to homepage...</p>
      </div>
    `);
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
