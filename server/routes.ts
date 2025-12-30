import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDraftSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all saved drafts
  app.get("/api/drafts", async (_req, res) => {
    try {
      const drafts = await storage.getDrafts();
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drafts" });
    }
  });

  // Get a single draft
  app.get("/api/drafts/:id", async (req, res) => {
    try {
      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        res.status(404).json({ message: "Draft not found" });
        return;
      }
      res.json(draft);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch draft" });
    }
  });

  // Create a new draft
  app.post("/api/drafts", async (req, res) => {
    try {
      const validated = insertDraftSchema.parse(req.body);
      const draft = await storage.createDraft(validated);
      res.status(201).json(draft);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid draft data" });
    }
  });

  // Update a draft
  app.patch("/api/drafts/:id", async (req, res) => {
    try {
      const partial = insertDraftSchema.partial().parse(req.body);
      const draft = await storage.updateDraft(req.params.id, partial);
      if (!draft) {
        res.status(404).json({ message: "Draft not found" });
        return;
      }
      res.json(draft);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid draft data" });
    }
  });

  // Delete a draft
  app.delete("/api/drafts/:id", async (req, res) => {
    try {
      const success = await storage.deleteDraft(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Draft not found" });
        return;
      }
      res.json({ message: "Draft deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete draft" });
    }
  });

  return httpServer;
}
