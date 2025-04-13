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
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from "ws";

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  category: string;
  subcategory: string | null;
}

// Validation schema for creating a short link
const createShortLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL including http:// or https://"),
  neverExpire: z.boolean().optional().default(false)
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
  // Proxy route for weather map tiles
  app.get("/api/weather/map/:type/:z/:x/:y", async (req: Request, res: Response) => {
    try {
      const { type, z, x, y } = req.params;
      const validTypes = ['precipitation_new', 'clouds_new'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid map type' });
      }
      
      const url = `https://tile.openweathermap.org/map/${type}/${z}/${x}/${y}.png?appid=${process.env.OPENWEATHER_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Map tile not found' });
      }
      
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error fetching weather map tile:', error);
      res.status(500).json({ error: 'Failed to fetch map tile' });
    }
  });
  
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
      // Fetch the ETS2 mods data
      const apiResponse = await fetch('https://mailobedo.nl/files/');
      
      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch mods: ${apiResponse.status} ${apiResponse.statusText}`);
      }
      
      const apiData = await apiResponse.json();
      
      // Check if we have the new format with Euro_Truck_Simulator_2 key
      if (!apiData.Euro_Truck_Simulator_2 || !Array.isArray(apiData.Euro_Truck_Simulator_2)) {
        throw new Error('Invalid data format received from API');
      }
      
      // Extract available versions from the URLs
      const ets2VersionsSet = new Set<string>();
      apiData.Euro_Truck_Simulator_2.forEach((file: any) => {
        if (file.url) {
          const urlParts = file.url.split('/');
          // Look for version pattern in the URL (e.g., v1.53.x)
          for (let i = 0; i < urlParts.length; i++) {
            if (/^v\d+\.\d+\.x$/i.test(urlParts[i])) {
              ets2VersionsSet.add(urlParts[i].toLowerCase());
              break;
            }
          }
        }
      });
      
      // Sort versions and get the latest one
      const sortedEts2Versions = Array.from(ets2VersionsSet).sort().reverse();
      const latestEts2Version = sortedEts2Versions.length > 0 ? sortedEts2Versions[0] : 'v1.53.x';
      
      // Get version from query parameter or use latest version as default
      const selectedVersion = req.query.version as string || latestEts2Version;
      
      // Filter files by selected version
      const ets2Files = apiData.Euro_Truck_Simulator_2.filter((file: any) => {
        return file.url && file.url.toLowerCase().includes(selectedVersion.toLowerCase());
      });
      
      // Process the files to create a proper response
      const processedEts2Files = ets2Files.map((file: any, index: number) => {
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
          description: `${fileType} for Euro Truck Simulator 2 ${selectedVersion}`,
          fileSize: fileSize,
          version: filename.match(/v[0-9.]+/)?.[0] || 'Latest',
          uploadDate: "2025-03-01", // Placeholder date
          downloadCount: Math.floor(Math.random() * 1000) + 500, // Random count for display
          category: category,
          tags: Array.from(new Set(tags)).slice(0, 3), // Take up to 3 unique tags
          originalUrl: file.url,
          downloadUrl: file.url
        };
      });
      
      // Return versions along with the files
      res.json({
        versions: sortedEts2Versions,
        currentVersion: selectedVersion,
        files: processedEts2Files
      });
    } catch (error) {
      console.error("Error fetching ETS2 mods:", error);
      res.status(500).json({ message: "Failed to fetch ETS2 mods from source" });
    }
  });
  
  // American Truck Simulator downloads API endpoint
  app.get("/api/downloads/ats", async (req, res) => {
    try {
      // Fetch the ATS mods data
      const apiResponse = await fetch('https://mailobedo.nl/files/');
      
      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch mods: ${apiResponse.status} ${apiResponse.statusText}`);
      }
      
      const apiData = await apiResponse.json();
      
      // Check if we have the American_Truck_Simulator key
      if (!apiData.American_Truck_Simulator || !Array.isArray(apiData.American_Truck_Simulator)) {
        // If there's no ATS specific key, try to find files that might be for ATS
        // in the general collection or under a different key
        
        const allFiles = apiData.Euro_Truck_Simulator_2 || [];
        
        // Extract available versions from the URLs
        const atsVersionsSet = new Set<string>();
        allFiles.forEach((file: any) => {
          if (file.url) {
            const urlParts = file.url.split('/');
            for (let i = 0; i < urlParts.length; i++) {
              if (/^v\d+\.\d+\.x$/i.test(urlParts[i])) {
                atsVersionsSet.add(urlParts[i].toLowerCase());
                break;
              }
            }
          }
        });
        
        // Sort versions and get the latest one
        const sortedAtsVersions = Array.from(atsVersionsSet).sort().reverse();
        const latestAtsVersion = sortedAtsVersions.length > 0 ? sortedAtsVersions[0] : 'v1.53.x';
        
        // Get version from query parameter or use latest version as default
        const selectedVersion = req.query.version as string || latestAtsVersion;
        
        // For now, we'll filter ETS2 files that might be compatible with ATS
        // based on common patterns (this is a fallback when no specific ATS files exist)
        const atsCompatibleFiles = allFiles.filter((file: any) => {
          const filename = file.name?.toLowerCase() || '';
          return filename.includes('ats') || 
                 filename.includes('american') ||
                 filename.includes('usa') ||
                 filename.includes('north america');
        });
        
        // Process the files for ATS
        const processedAtsFiles = atsCompatibleFiles.map((file: any, index: number) => {
          const filename = file.name || '';
          const cleanFilename = filename.replace('.scs', '').replace('.zip', '');
          
          const name = cleanFilename
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/_/g, ' ');
          
          const fileType = filename.endsWith('.scs') ? 'SCS Mod' : 'ZIP Archive';
          
          let category = 'Other';
          if (filename.includes('traffic')) category = 'Traffic';
          else if (filename.includes('map') || filename.includes('Map')) category = 'Maps';
          else if (filename.includes('model') || filename.includes('assets')) category = 'Models & Assets';
          else if (filename.includes('def')) category = 'Definition Files';
          else if (filename.includes('media')) category = 'Media';
          
          const tags = cleanFilename.split(/[-_]/).filter((tag: string) => 
            tag.length > 2 && 
            !['and', 'the', 'for', 'with', 'v1', 'v2', 'v3'].includes(tag.toLowerCase())
          );
          
          const fileSizeInMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
          const fileSize = fileSizeInMB >= 1000 
            ? `${(fileSizeInMB / 1024).toFixed(2)} GB` 
            : `${fileSizeInMB.toFixed(1)} MB`;
          
          return {
            id: `ats-${index}`,
            name: name.replace('Ets2', 'ATS'),
            description: `${fileType} for American Truck Simulator ${selectedVersion}`,
            fileSize: fileSize,
            version: filename.match(/v[0-9.]+/)?.[0] || 'Latest',
            uploadDate: "2025-03-01", // Placeholder date
            downloadCount: Math.floor(Math.random() * 800) + 300, // Random count for display
            category: category,
            tags: Array.from(new Set([...tags, 'ATS'])).slice(0, 3),
            originalUrl: file.url,
            downloadUrl: file.url
          };
        });
        
        return res.json({
          versions: sortedAtsVersions,
          currentVersion: selectedVersion,
          files: processedAtsFiles
        });
      }
      
      // If we have specific ATS files, process them
      const atsVersionsSet = new Set<string>();
      apiData.American_Truck_Simulator.forEach((file: any) => {
        if (file.url) {
          const urlParts = file.url.split('/');
          for (let i = 0; i < urlParts.length; i++) {
            if (/^v\d+\.\d+\.x$/i.test(urlParts[i])) {
              atsVersionsSet.add(urlParts[i].toLowerCase());
              break;
            }
          }
        }
      });
      
      // Sort versions and get the latest one
      const sortedAtsVersions = Array.from(atsVersionsSet).sort().reverse();
      const latestAtsVersion = sortedAtsVersions.length > 0 ? sortedAtsVersions[0] : 'v1.53.x';
      
      // Get version from query parameter or use latest version as default
      const selectedVersion = req.query.version as string || latestAtsVersion;
      
      const atsFiles = apiData.American_Truck_Simulator.filter((file: any) => {
        return file.url && file.url.toLowerCase().includes(selectedVersion.toLowerCase());
      });
      
      const processedAtsFiles = atsFiles.map((file: any, index: number) => {
        const filename = file.name || '';
        const cleanFilename = filename.replace('.scs', '').replace('.zip', '');
        
        const name = cleanFilename
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/_/g, ' ');
        
        const fileType = filename.endsWith('.scs') ? 'SCS Mod' : 'ZIP Archive';
        
        let category = 'Other';
        if (filename.includes('traffic')) category = 'Traffic';
        else if (filename.includes('map') || filename.includes('Map')) category = 'Maps';
        else if (filename.includes('model') || filename.includes('assets')) category = 'Models & Assets';
        else if (filename.includes('def')) category = 'Definition Files';
        else if (filename.includes('media')) category = 'Media';
        
        const tags = cleanFilename.split(/[-_]/).filter((tag: string) => 
          tag.length > 2 && 
          !['and', 'the', 'for', 'with', 'v1', 'v2', 'v3'].includes(tag.toLowerCase())
        );
        
        const fileSizeInMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
        const fileSize = fileSizeInMB >= 1000 
          ? `${(fileSizeInMB / 1024).toFixed(2)} GB` 
          : `${fileSizeInMB.toFixed(1)} MB`;
        
        return {
          id: `ats-${index}`,
          name: name,
          description: `${fileType} for American Truck Simulator ${selectedVersion}`,
          fileSize: fileSize,
          version: filename.match(/v[0-9.]+/)?.[0] || 'Latest',
          uploadDate: "2025-03-01", // Placeholder date
          downloadCount: Math.floor(Math.random() * 800) + 300, // Random count for display
          category: category,
          tags: Array.from(new Set(tags)).slice(0, 3),
          originalUrl: file.url,
          downloadUrl: file.url
        };
      });
      
      res.json({
        versions: sortedAtsVersions,
        currentVersion: selectedVersion,
        files: processedAtsFiles
      });
    } catch (error) {
      console.error("Error fetching ATS mods:", error);
      res.status(500).json({ message: "Failed to fetch American Truck Simulator mods from source" });
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
      } 
      // ATS files (in ats subdirectory)
      else if (fileId.startsWith('ats-')) {
        filePath = path.join('assets', 'downloads', 'files', 'ats', `${fileId}.zip`);
      }
      else {
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

      const { url, neverExpire } = validationResult.data;
      
      // Generate a unique short code
      let shortCode = generateShortCode();
      let existingLink = await storage.getShortenedLinkByCode(shortCode);
      
      // Keep generating until we find a unique code
      while (existingLink) {
        shortCode = generateShortCode();
        existingLink = await storage.getShortenedLinkByCode(shortCode);
      }
      
      // Set expiration date (null if never expires, otherwise 7 days from now)
      const expiresAt = neverExpire ? null : getExpirationDate();
      
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
      if (!link || (link.expiresAt && link.expiresAt < new Date())) {
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

  // Weather API endpoint
  app.get("/api/weather", async (req: Request, res: Response) => {
    try {
      const { location, units = "metric" } = req.query;
      
      if (!location) {
        return res.status(400).json({ message: "Location is required" });
      }

      if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({ message: "Weather API key is not configured" });
      }

      const params = {
        q: location as string,
        units: units as string,
        appid: process.env.OPENWEATHER_API_KEY
      };
      
      // Get current weather
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?${new URLSearchParams(params as any).toString()}`;
      const currentWeatherResponse = await fetch(currentWeatherUrl);
      
      if (!currentWeatherResponse.ok) {
        return res.status(currentWeatherResponse.status).json({ 
          message: `Weather API error: ${currentWeatherResponse.statusText}` 
        });
      }
      
      const currentWeatherData = await currentWeatherResponse.json();
      
      // Get forecast data using the 5 day / 3 hour forecast API instead
      // The OneCall API requires a paid subscription, so we're using the free 5-day forecast
      const forecastParams = {
        lat: currentWeatherData.coord.lat,
        lon: currentWeatherData.coord.lon,
        units: units as string,
        appid: process.env.OPENWEATHER_API_KEY
      };
      
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${new URLSearchParams(forecastParams as any).toString()}`;
      const forecastResponse = await fetch(forecastUrl);
      
      if (!forecastResponse.ok) {
        return res.status(forecastResponse.status).json({ 
          message: `Weather forecast API error: ${forecastResponse.statusText}` 
        });
      }
      
      const forecastData = await forecastResponse.json();
      
      // Restructure the data to match our frontend expectations
      const processedForecastData = {
        current: {
          dt: currentWeatherData.dt,
          temp: currentWeatherData.main.temp,
          feels_like: currentWeatherData.main.feels_like,
          humidity: currentWeatherData.main.humidity,
          uvi: 0, // Not available in the free API
          wind_speed: currentWeatherData.wind.speed
        },
        hourly: forecastData.list.slice(0, 8).map((item: any) => ({
          dt: item.dt,
          temp: item.main.temp,
          weather: item.weather
        })),
        daily: processDaily(forecastData.list, units as string)
      };
      
      // Combine the data
      res.json({
        current: currentWeatherData,
        forecast: processedForecastData
      });
    } catch (error) {
      log(`Error fetching weather data: ${error}`, "routes");
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  // Image conversion counter endpoints
  app.get("/api/counters/conversions", async (req, res) => {
    try {
      const counters = await storage.getAllConversionCounters();
      res.json(counters);
    } catch (error) {
      log(`Error getting conversion counters: ${error}`, "routes");
      res.status(500).json({ message: "Failed to get conversion counters" });
    }
  });

  app.get("/api/counters/conversions/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const counter = await storage.getConversionCounter(name);
      if (!counter) {
        return res.status(404).json({ message: "Counter not found" });
      }
      res.json(counter);
    } catch (error) {
      log(`Error getting conversion counter: ${error}`, "routes");
      res.status(500).json({ message: "Failed to get conversion counter" });
    }
  });

  // Generate a token for counter increment operations
  app.get("/api/counters/token", async (req, res) => {
    try {
      // Only allow requests from our own domain
      const referer = req.headers.referer || '';
      const origin = req.headers.origin || '';
      const host = req.headers.host || '';
      const userAgent = req.headers['user-agent'] || '';
      
      // Special handling for testing scripts
      const isTesting = userAgent.includes('node-fetch') && 
                       (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');
      
      const isValidOrigin = 
        isTesting || (referer.includes(host) || origin.includes(host));
      
      if (!isValidOrigin) {
        log(`Unauthorized token request: ${req.ip}, referer: ${referer}, user-agent: ${userAgent}`, "security");
        return res.status(403).json({ 
          message: "Unauthorized access",
          error: "Access denied - invalid origin" 
        });
      }
      
      const token = await storage.createCounterToken();
      
      // Only return the token string, not the full token object
      res.status(200).json({ token: token.token });
    } catch (error) {
      log(`Error generating counter token: ${error}`, "routes");
      res.status(500).json({ message: "Failed to generate token" });
    }
  });
  
  app.post("/api/counters/conversions/:name/increment", async (req, res) => {
    try {
      const { name } = req.params;
      const { count = 1, token } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      
      // For backwards compatibility and testing purposes, check if using the old API key method
      const apiKey = req.headers['x-api-key'];
      
      // Generate expected API key for validation (using same algorithm as in test script)
      const date = new Date();
      const dailyTokenBase = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const expectedApiKey = crypto
        .createHash('sha256')
        .update(`counter-security-${dailyTokenBase}`)
        .digest('hex')
        .substring(0, 16);
      
      // Check if API key matches or if it's a testing environment
      const isTesting = userAgent.includes('node-fetch') && 
                      (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');
      
      // If it's a valid API key request, allow it for backwards compatibility
      if (apiKey && (apiKey === expectedApiKey || 
                    (process.env.COUNTER_API_SECRET && apiKey === process.env.COUNTER_API_SECRET) ||
                    isTesting)) {
        log(`Request with API key: ${req.ip}`, "security");
        
        // Validate count and increment counter
        const rawCount = Number(count);
        let validCount = 1; // Default to 1
        
        // Limit maximum increment to 100
        if (isNaN(rawCount) || rawCount <= 0) {
          validCount = 1;
        } else if (rawCount > 100) {
          validCount = 100;
          log(`Count capped from ${rawCount} to 100`, "security");
        } else {
          validCount = rawCount;
        }
        
        const counter = await storage.incrementConversionCounter(name, validCount);
        return res.status(200).json(counter);
      }
      
      // For regular requests, require a token
      if (!token) {
        log(`Token missing in increment request: ${req.ip}`, "security");
        return res.status(400).json({ 
          message: "Missing token",
          error: "A valid token is required for this operation" 
        });
      }
      
      // Validate the token and mark it as used
      const isValidToken = await storage.useCounterToken(token);
      
      if (!isValidToken) {
        log(`Invalid or expired token used: ${req.ip}, token: ${token.substring(0, 10)}...`, "security");
        return res.status(403).json({ 
          message: "Invalid token",
          error: "Token is invalid, expired, or already used" 
        });
      }
      
      // Validate count is a positive number and limit the maximum increment
      const rawCount = Number(count);
      let validCount = 1; // Default to 1
      
      // Explicit check for large values and set a hard limit of 100
      if (isNaN(rawCount) || rawCount <= 0) {
        validCount = 1; // Default to 1 for invalid values
      } else if (rawCount > 100) {
        validCount = 100; // Cap at 100 for large values
        log(`Count capped from ${rawCount} to 100`, "security");
      } else {
        validCount = rawCount; // Use the valid number
      }
      
      // Increment the counter
      const counter = await storage.incrementConversionCounter(name, validCount);
      res.status(200).json(counter);
    } catch (error) {
      log(`Error incrementing conversion counter: ${error}`, "routes");
      res.status(500).json({ message: "Failed to increment conversion counter" });
    }
  });
  
  // Route for checking website headers
  app.get("/api/header-check", async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Basic URL validation
      let targetUrl: string;
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return res.status(400).json({ error: "Invalid URL protocol. Only HTTP and HTTPS are supported." });
        }
        targetUrl = parsedUrl.toString();
      } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
      }
      
      // Set a timeout to prevent long-running requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Make the request to the target URL
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Website Header Checker Tool',
          },
          redirect: 'follow',
          signal: controller.signal
        });
        
        // Convert Headers object to a plain object
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        
        // Include response status in the result
        const result = {
          status: response.status,
          statusText: response.statusText,
          headers,
          url: response.url // Final URL after any redirects
        };
        
        res.json(result);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      console.error("Error checking headers:", error);
      if (error.name === 'AbortError') {
        res.status(504).json({ error: "Request timed out" });
      } else {
        res.status(500).json({ error: error.message || "Failed to check headers" });
      }
    }
  });
  
  // Route for IP lookup - get current IP
  app.get("/api/ip", async (req, res) => {
    try {
      // You can use ipify.org to get the client's public IP
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json() as Record<string, any>;
      res.json(data);
    } catch (error: any) {
      console.error("Error getting IP address:", error);
      res.status(500).json({ error: error.message || "Failed to get IP address" });
    }
  });
  
  // Route for IP info - get details about an IP
  app.get("/api/ip-info/:ip", async (req, res) => {
    try {
      const ip = req.params.ip;
      
      if (!ip) {
        return res.status(400).json({ error: "IP parameter is required" });
      }
      
      // ipinfo.io provides geolocation and other info about an IP
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await response.json() as Record<string, any>;
      
      if (data.error) {
        return res.status(400).json({ error: data.error.message || "Invalid IP address" });
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Error getting IP info:", error);
      res.status(500).json({ error: error.message || "Failed to get IP information" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.IO for video/voice streaming with room code functionality
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });
  
  // Store active rooms with their access codes
  const rooms: Record<string, {
    roomCode: string,
    participants: Map<string, { id: string, name: string }>
  }> = {};
  
  // Generate a random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Create a new room
    socket.on('create-room', (userData: { name: string }, callback) => {
      try {
        const roomId = crypto.randomBytes(8).toString('hex');
        const roomCode = generateRoomCode();
        
        rooms[roomId] = {
          roomCode,
          participants: new Map()
        };
        
        console.log(`Room created: ${roomId} with code: ${roomCode}`);
        callback({ success: true, roomId, roomCode });
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });
    
    // Join a room with room code
    socket.on('join-room', (data: { roomId: string, roomCode: string, name: string }, callback) => {
      try {
        const { roomId, roomCode, name } = data;
        const room = rooms[roomId];
        
        if (!room) {
          return callback({ 
            success: false, 
            error: 'Room not found' 
          });
        }
        
        if (room.roomCode !== roomCode) {
          return callback({ 
            success: false, 
            error: 'Invalid room code' 
          });
        }
        
        // Add user to the room
        socket.join(roomId);
        room.participants.set(socket.id, { id: socket.id, name });
        
        // Notify other participants that a new user joined
        socket.to(roomId).emit('user-joined', { id: socket.id, name });
        
        // Send list of existing participants to the new user
        const participants = Array.from(room.participants.values());
        
        callback({ 
          success: true, 
          participants 
        });
        
        console.log(`User ${socket.id} (${name}) joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });
    
    // Handle WebRTC signaling
    socket.on('signal', (data: { roomId: string, to: string, signal: any }) => {
      const { roomId, to, signal } = data;
      
      if (rooms[roomId]?.participants.has(socket.id)) {
        io.to(to).emit('signal', {
          from: socket.id,
          signal
        });
      }
    });
    
    // Handle chat messages
    socket.on('chat-message', (data: { roomId: string, message: string }) => {
      const { roomId, message } = data;
      const room = rooms[roomId];
      
      if (room?.participants.has(socket.id)) {
        const sender = room.participants.get(socket.id);
        io.to(roomId).emit('chat-message', {
          sender: sender?.name || 'Unknown',
          message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Find which room this user was in
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.participants.has(socket.id)) {
          // Remove user from the room
          const userData = room.participants.get(socket.id);
          room.participants.delete(socket.id);
          
          // Notify others that user left
          socket.to(roomId).emit('user-left', { id: socket.id });
          
          // Clean up empty rooms
          if (room.participants.size === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted (no participants left)`);
          }
          
          break;
        }
      }
    });
    
    // Handle user leaving a room
    socket.on('leave-room', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms[roomId];
      
      if (room?.participants.has(socket.id)) {
        // Remove user from the room
        room.participants.delete(socket.id);
        socket.leave(roomId);
        
        // Notify others that user left
        socket.to(roomId).emit('user-left', { id: socket.id });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (no participants left)`);
        }
      }
    });
  });
  
  // Also setup a WebSocket server for signaling on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Broadcast to all clients except sender
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

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

// Process forecast data to create daily summaries from 3-hour forecast
function processDaily(forecastList: any[], units: string): any[] {
  // Group forecast data by day
  const dailyData: {[key: string]: any[]} = {};
  
  forecastList.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split('T')[0];
    
    if (!dailyData[day]) {
      dailyData[day] = [];
    }
    
    dailyData[day].push(item);
  });
  
  // Process each day's data
  return Object.keys(dailyData).map(day => {
    const dayData = dailyData[day];
    const temps = dayData.map(item => item.main.temp);
    const weatherCounts: {[key: string]: number} = {};
    let maxPop = 0;
    let sumHumidity = 0;
    let sumWindSpeed = 0;
    
    // Process weather conditions, find most common
    dayData.forEach(item => {
      if (item.pop && item.pop > maxPop) maxPop = item.pop;
      sumHumidity += item.main.humidity;
      sumWindSpeed += item.wind.speed;
      
      const weather = item.weather[0];
      if (!weatherCounts[weather.id]) {
        weatherCounts[weather.id] = 0;
      }
      weatherCounts[weather.id]++;
    });
    
    // Find most common weather condition
    let mostCommonWeatherId = 800; // Default to clear
    let maxCount = 0;
    
    Object.keys(weatherCounts).forEach(id => {
      if (weatherCounts[id] > maxCount) {
        maxCount = weatherCounts[id];
        mostCommonWeatherId = parseInt(id);
      }
    });
    
    // Find the weather object with this ID
    const commonWeather = dayData.find(item => item.weather[0].id === mostCommonWeatherId)?.weather[0] || dayData[0].weather[0];
    
    return {
      dt: dayData[0].dt,
      temp: {
        min: Math.min(...temps),
        max: Math.max(...temps),
        day: temps.reduce((sum, temp) => sum + temp, 0) / temps.length
      },
      weather: [commonWeather],
      humidity: Math.round(sumHumidity / dayData.length),
      wind_speed: sumWindSpeed / dayData.length,
      pop: maxPop // Probability of precipitation
    };
  });
}
