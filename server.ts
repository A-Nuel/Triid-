import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aiService } from "./src/server/modules/ai/ai.service";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Redis } from "@upstash/redis";

// Zod Schemas for Input Sanitization
const JobCreateSchema = z.object({
  mode: z.enum(['emergency', 'scheduled']),
  description: z.string().min(5).max(1000),
  location: z.any().optional(), // PostGIS point or mock object
  artisan_id: z.string().uuid().optional(),
  scheduled_for: z.string().datetime().optional()
}).refine(data => {
  if (data.mode === 'scheduled') {
    return !!data.artisan_id && !!data.scheduled_for;
  }
  return true;
}, "Scheduled jobs require artisan_id and scheduled_for");

const JobStatusUpdateSchema = z.object({
  status: z.enum(['matched', 'in_progress', 'completed', 'cancelled'])
});

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

// Initialize Upstash Redis
// Fails gracefully if not provided, for local dev
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;


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
  
  // Provide demo credentials and ensure they exist
  apiRouter.post("/auth/demo", async (req, res) => {
    try {
      const { role } = req.body;
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const email = role === 'artisan' ? 'demo_artisan@triid.app' : 'demo_resident@triid.app';
      const password = 'DemoPassword123!';
      const fullName = role === 'artisan' ? 'Chidi (Electrician)' : 'Jane (Resident)';

      // Check if user exists by trying to sign in
      const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
        email,
        password
      });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // Create user
        const { data: createUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
        
        if (createError) throw createError;

        if (createUser.user) {
          // ensure 'users' entry exists (which might be handled by trigger, but just in case)
          // The schema triggers should handle it, but wait, do we have a trigger for new users?
          // Let's assume we do, or we just insert it
          const { error: insertUserErr } = await adminClient.from('users').upsert({
            id: createUser.user.id,
            email: email,
            full_name: fullName,
            role: role
          });

          if (role === 'artisan') {
            await adminClient.from('artisan_profiles').upsert({
              user_id: createUser.user.id,
              skill_categories: ['electrical'],
              bio: 'Expert electrician with 10 years of experience in Redemption City.',
              starting_price_min: 5000,
              starting_price_max: 20000,
              trust_tier: 'verified',
              verification_status: 'verified'
            });
          }
        }
      }

      res.status(200).json({ email, password });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // Health
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", service: "triid-api", version: "1.0.0" });
  });

  // Jobs & Emergency Triage
  apiRouter.get("/jobs", async (req, res) => {
    try {
      const { mode, status } = req.query;
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      let query = supabase.from('jobs').select('*, resident:resident_id(full_name, phone)');
      
      if (mode) query = query.eq('mode', mode);
      if (status) query = query.eq('status', status);

      // Simple implementation:
      // If user is resident, only show their own jobs.
      // If user is artisan, show pending jobs (for feed), OR jobs assigned to them (for history/active).
      const role = user.user_metadata?.role;
      if (role === 'resident') {
        query = query.eq('resident_id', user.id);
      } else if (role === 'artisan') {
        if (status === 'pending') {
          query = query.is('artisan_id', null);
        } else {
          query = query.eq('artisan_id', user.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      res.status(200).json({ data });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.post("/jobs", async (req, res) => {
    try {
      // 1. Zod Input Sanitization
      const parsedData = JobCreateSchema.parse(req.body);
      const { mode, description, location, artisan_id, scheduled_for } = parsedData;

      // 2. Idempotency (PRD 16.2 requirement)
      const idempotencyKey = req.headers['idempotency-key'] as string;
      if (!idempotencyKey) {
        return res.status(400).json({ error: { message: "Idempotency-Key header is required" } });
      }

      if (redis) {
        const cachedResponse = await redis.get(`idemp:${idempotencyKey}`);
        if (cachedResponse) {
          // Return the cached successful response to avoid duplicates
          return res.status(201).json({ data: cachedResponse });
        }
      }
      
      const supabase = createAuthClient(req);

      // Get user from token directly 
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: { message: "Unauthorized" } });
      }

      // 3. User-Based Rate Limiting (PRD 16.5 requirement)
      // Limit to 1 request per 2 minutes per user for emergency, easier limit for scheduled
      /*
      // Temporarily disabled for demo
      if (redis) {
        const rateLimitKey = `rate_limit:${user.id}:jobs_create`;
        const requests = await redis.incr(rateLimitKey);
        if (requests === 1) {
          await redis.expire(rateLimitKey, 120); // 2 minutes window
        }
        if (requests > 1) {
          return res.status(429).json({ error: { message: "Rate limit exceeded. Please wait 2 minutes." } });
        }
      }
      */

      let communityId = user.user_metadata?.community_id;
      if (!communityId) {
        // Fallback to first available community for demo purposes
        const { data: comms } = await supabase.from('communities').select('id').limit(1);
        if (comms && comms.length > 0) {
          communityId = comms[0].id;
        } else {
          communityId = null;
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
        try {
          const triage = await aiService.triageEmergency(description);
          jobData.category = triage.category;
          jobData.urgency = triage.urgency;
        } catch (aiError) {
          console.warn("AI Triage failed, using fallback values for demo:", aiError);
          jobData.category = 'plumbing';
          jobData.urgency = 'high';
        }
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

      // Save Idempotency
      if (redis) {
        await redis.setex(`idemp:${idempotencyKey}`, 86400, insertedJob); // Cache for 24h
      }

      // Hack for Hackathon Demo: If emergency, trigger a "match" after 3 seconds by updating the db
      if (mode === 'emergency') {
        setTimeout(async () => {
          try {
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
          } catch (e) {
            console.error("Mock matching error:", e);
          }
        }, 3000);
      }

      return res.status(201).json({ data: insertedJob });
    } catch (error: any) {
      console.error("Job creation error:", error);
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: { message: "Validation failed", details: error.errors } });
      }
      res.status(500).json({ error: { message: error.message || "Failed to process job." } });
    }
  });

  apiRouter.post("/jobs/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { data: job } = await supabase.from('jobs').select('status').eq('id', id).single();
      if (!job || (job.status !== 'pending' && job.status !== 'matched')) {
        return res.status(409).json({ error: { message: "Job already taken or not found." } });
      }

      const { error } = await supabase.from('jobs').update({
        status: 'accepted',
        artisan_id: user.id,
        accepted_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) throw error;
      res.status(200).json({ message: "Job accepted" });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.patch("/jobs/:id/status", async (req, res) => {
     try {
       const { id } = req.params;
       const { status } = req.body;
       const supabase = createAuthClient(req);
       const updateData: any = { status };
       if (status === 'completed') updateData.completed_at = new Date().toISOString();
       
       const { data, error } = await supabase.from('jobs').update(updateData).eq('id', id).select().single();
       if (error) throw error;
       res.status(200).json({ data });
     } catch(e: any) {
       res.status(500).json({ error: { message: e.message } });
     }
  });

  apiRouter.post("/artisans/verify-identity", async (req, res) => {
    try {
      const { nin } = req.body;
      if (!nin) return res.status(400).json({ error: { message: "NIN is required" } });

      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      // Service role client needed to safely perform verification insertions 
      // without exposing write access to clients directly
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Get artisan profile
      const { data: profile, error: profileErr } = await adminClient
        .from('artisan_profiles')
        .select('id, trust_tier')
        .eq('user_id', user.id)
        .single();
        
      if (profileErr || !profile) {
         return res.status(404).json({ error: { message: "Artisan profile not found." } });
      }

      // 1. Set to pending
      await adminClient.from('artisan_profiles').update({ verification_status: 'pending' }).eq('id', profile.id);

      // 2. Mock provider call
      const isMatch = true; // Hardcoded true for demo
      const providerRef = "demo_ref_" + Date.now();

      // 3. Insert verification record (raw NIN is immediately discarded)
      await adminClient.from('identity_verifications').insert({
        artisan_id: profile.id,
        provider: 'demo_provider',
        provider_reference: providerRef,
        name_match: isMatch,
        verified_at: new Date().toISOString()
      });

      // 4. Update status based on match
      const newStatus = isMatch ? 'verified' : 'failed';
      await adminClient.from('artisan_profiles')
        .update({ verification_status: newStatus })
        .eq('id', profile.id);

      // 5. Evaluate trust tier progression (new -> vouched) if verified
      if (newStatus === 'verified' && profile.trust_tier === 'new') {
        const { count } = await adminClient
          .from('vouches')
          .select('*', { count: 'exact', head: true })
          .eq('vouchee_id', user.id);
          
        if (count && count > 0) {
          await adminClient.from('artisan_profiles').update({ trust_tier: 'vouched' }).eq('id', profile.id);
        }
      }

      res.status(200).json({ message: "Verification processed", status: newStatus });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.post("/jobs/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = createAuthClient(req);
      
      // Needs admin client or secure way to execute RPC if normal user lacks RPC execute perms on jobs/wallets
      // In a real env, RLS applies. Provided user is resident returning true, we can just use auth client.
      const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (jobError || !job) throw new Error("Job not found");

      const amountToRelease = job.estimated_amount || 0;
      const { data, error } = await supabase.rpc('confirm_job_completion_atomic', {
        p_job_id: id,
        p_artisan_id: job.artisan_id,
        p_release_amount: amountToRelease,
        p_paystack_ref: 'sys_release_' + Date.now()
      });
      
      if (error) throw error;
      res.status(200).json({ message: "Job confirmed and funds released." });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.post("/payments/jobs/:id/initiate", async (req, res) => {
    // Escrow holding mock
    res.status(200).json({ checkout_url: "mock_url" });
  });

  apiRouter.post("/jobs/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { data: job } = await supabase.from('jobs').select('artisan_id').eq('id', id).single();
      if (!job || !job.artisan_id) throw new Error("Job or artisan not found");

      const { data, error } = await supabase.from('reviews').insert({
        job_id: id,
        reviewer_id: user.id,
        artisan_id: job.artisan_id,
        rating,
        comment
      });
      if (error) throw error;
      res.status(200).json({ message: "Review submitted" });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.post("/vouches", async (req, res) => {
    try {
      const { artisan_id } = req.body;
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { data, error } = await supabase.from('vouches').insert({
        voucher_id: user.id,
        artisan_id
      });
      if (error && error.code !== '23505') throw error; // ignore unique violation for demo
      res.status(200).json({ message: "Vouch submitted" });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
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
