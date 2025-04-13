import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Contact form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to handle contact form submissions
  app.post('/api/contact', async (req, res) => {
    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(req.body);
      
      // In a real app, you'd save to a database or send an email
      // For now, we'll just return success
      
      return res.status(200).json({
        success: true,
        message: 'Message received successfully'
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form data',
          errors: error.errors
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
