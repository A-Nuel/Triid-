import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aiService } from "./src/server/modules/ai/ai.service";
import { createClient } from "@supabase/supabase-js";

// Helper to create a Supabase client with the user's JWT
const createAuthClient = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace("Bearer ", "") : "";
  
  return createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.VITE_SUPABASE_ANON_KEY || "",
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  );
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  
  // Custom middleware to capture raw body primarily for Paystack webhook verification (PRD 16.4)
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // --- API Routes (Modular Monolith Setup) ---
  const apiRouter = express.Router();
  
  // Health
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", service: "triid-api", version: "1.0.0" });
  });

  // Jobs & Emergency Triage
  apiRouter.post("/jobs", async (req, res) => {
    try {
      const { mode, description, location, artisan_id, scheduled_for } = req.body;
      const supabase = createAuthClient(req);

      // Get user from token directly 
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: { message: "Unauthorized" } });
      }

      let communityId = user.user_metadata?.community_id;
      if (!communityId) {
        // Fallback to first available community for demo purposes
        const { data: comms } = await supabase.from('communities').select('id').limit(1);
        if (comms && comms.length > 0) {
          communityId = comms[0].id;
        } else {
          throw new Error("No community configured.");
        }
      }

      let jobData: any = {
        resident_id: user.id,
        community_id: communityId,
        mode,
        description,
        location,
        status: 'pending'
      };

      if (mode === 'emergency') {
        const triage = await aiService.triageEmergency(description);
        jobData.category = triage.category;
        jobData.urgency = triage.urgency;
        // In real emergency, matching module assigns artisan later. Or we can fake assign immediately for demo:
        jobData.estimated_amount = 15000;
        
      } else if (mode === 'scheduled') {
        jobData.artisan_id = artisan_id;
        jobData.scheduled_for = scheduled_for;
        jobData.category = "other"; // Fallback, could fetch from artisan
        jobData.estimated_amount = 10000;
      } else {
        return res.status(400).json({ error: { message: "Unsupported job mode." } });
      }

      // Insert Job
      const { data: insertedJob, error: insertError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Hack for Hackathon Demo: If emergency, trigger a "match" after 3 seconds by updating the db
      if (mode === 'emergency') {
        setTimeout(async () => {
          // Use service role for background mock assignment
          const adminClient = createClient(
            process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
          );
          
          // Find any artisan to mock assign
          const { data: artisans } = await adminClient.from('artisan_profiles').select('id, user_id').limit(1);
          if (artisans && artisans.length > 0) {
            await adminClient.from('jobs').update({
              status: 'matched',
              artisan_id: artisans[0].user_id
            }).eq('id', insertedJob.id);
          }
        }, 3000);
      }

      return res.status(201).json({ data: insertedJob });
    } catch (error: any) {
      console.error("Job creation error:", error);
      res.status(500).json({ error: { message: error.message || "Failed to process job." } });
    }
  });

  apiRouter.post("/jobs/:id/accept", (req, res) => {
    res.status(200).json({ message: "Job accept stub" });
  });

  apiRouter.post("/jobs/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = createAuthClient(req);
      
      const { data, error } = await supabase.from('jobs').update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      }).eq('id', id).select().single();
      
      if (error) throw error;
      res.status(200).json({ data });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.post("/payments/jobs/:id/initiate", async (req, res) => {
    // Escrow holding mock
    res.status(200).json({ checkout_url: "mock_url" });
  });

  app.use('/api/v1', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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
