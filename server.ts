import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aiService } from "./src/server/modules/ai/ai.service";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes (Modular Setup) ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "triid-api", version: "1.0.0" });
  });

  // Emergency Triage Job Creation
  app.post("/api/v1/jobs", async (req, res) => {
    try {
      const { mode, description, location } = req.body;
      
      if (mode === 'emergency') {
        // 1. Run AI Triage immediately
        const triage = await aiService.triageEmergency(description);
        
        // 2. Mock saving to DB (We will connect real Supabase SQL here)
        const jobMock = {
          id: "job_" + Math.random().toString(36).substring(2, 9),
          status: "pending",
          mode: "emergency",
          category: triage.category,
          urgency: triage.urgency,
          summary: triage.summary,
          description,
          createdAt: new Date().toISOString()
        };
        
        return res.status(201).json(jobMock);
      }

      res.status(400).json({ error: "Only emergency mode is supported in this build version so far." });
    } catch (error: any) {
      console.error("Job creation constraint error:", error);
      res.status(500).json({ error: "Failed to process emergency ping." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
