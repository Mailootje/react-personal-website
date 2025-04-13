import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  category: string;
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
