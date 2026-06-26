import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aiService } from "./src/server/modules/ai/ai.service";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (memory storage)
const upload = multer({ storage: multer.memoryStorage() });
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
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // --- API Routes (Modular Monolith Setup) ---
  const apiRouter = express.Router();
  
  // Cloudinary Media Upload Endpoint
  apiRouter.post("/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Convert buffer to base64 for Cloudinary upload stream alternative
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto", // Allows image, video, raw audio
        folder: "triid_uploads",
      });

      res.status(200).json({ url: result.secure_url });
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ error: "Failed to upload file to Cloudinary" });
    }
  });

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

  // --- Artisan Profile & Settings Updates ---
  apiRouter.put("/artisan/profile", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { bio, skill_categories, starting_price_min, starting_price_max, portfolio_images, full_name, avatar_url } = req.body;
      
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Update full_name and avatar_url in users if provided
      const metadataUpdate: any = {};
      if (full_name !== undefined) metadataUpdate.full_name = full_name;
      if (avatar_url !== undefined) metadataUpdate.avatar_url = avatar_url;

      if (Object.keys(metadataUpdate).length > 0) {
        await adminClient.auth.admin.updateUserById(user.id, { user_metadata: metadataUpdate });
      }

      // Ensure user exists in public.users to satisfy foreign key constraint
      await adminClient.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: full_name || user.user_metadata?.full_name || "Unknown",
        role: "artisan"
      }, { onConflict: "id" });

      const updatePayload: any = { user_id: user.id };
      if (bio !== undefined) updatePayload.bio = bio;
      if (skill_categories !== undefined) updatePayload.skill_categories = skill_categories;
      if (starting_price_min !== undefined) updatePayload.starting_price_min = starting_price_min;
      if (starting_price_max !== undefined) updatePayload.starting_price_max = starting_price_max;
      if (portfolio_images !== undefined) updatePayload.portfolio_images = portfolio_images;
      
      try {
        const { error } = await adminClient.from('artisan_profiles').upsert(updatePayload, { onConflict: "user_id" });
        if (error) console.error("Error updating profile", error);
      } catch (e) {
        console.error(e);
      }

      res.status(200).json({ message: "Profile updated" });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.put("/artisan/availability", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { accepts_emergency, accepts_standard, availability_schedule } = req.body;
      
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: profile } = await adminClient.from('artisan_profiles').select('id').eq('user_id', user.id).single();
      if (!profile) return res.status(404).json({ error: { message: "Artisan profile not found." } });

      const updatePayload: any = {};
      if (accepts_emergency !== undefined) updatePayload.accepts_emergency = accepts_emergency;
      if (accepts_standard !== undefined) updatePayload.accepts_standard = accepts_standard;
      if (availability_schedule !== undefined) updatePayload.availability_schedule = availability_schedule;

      const { error } = await adminClient.from('artisan_profiles').update(updatePayload).eq('id', profile.id);
      if (error) {
         console.warn("Could not update availability columns.", error);
      }
      
      // Update older logic is_available based on accepts_standard
      if (accepts_standard !== undefined) {
         await adminClient.from('artisan_profiles').update({ is_available: accepts_standard }).eq('id', profile.id);
      }

      res.status(200).json({ message: "Availability updated" });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.get("/artisan/settings", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Try to fetch all columns. If new columns don't exist, Supabase will just ignore or we handle error by fetching what we can.
      const { data: profile, error } = await adminClient.from('artisan_profiles').select('*').eq('user_id', user.id).single();
      if (!profile) return res.status(404).json({ error: { message: "Artisan profile not found." } });

      res.status(200).json({ profile, user });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.get("/artisan/dashboard", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Get profile stats
      const { data: profile } = await adminClient.from('artisan_profiles').select('*').eq('user_id', user.id).single();
      if (!profile) return res.status(404).json({ error: { message: "Artisan profile not found." } });

      // Get today's earnings (from payments table or mock)
      // Since payments table might not have everything, let's just send the profile info and some derived/mocked stats
      // We will calculate completion profile progress
      let fieldsFilled = 0;
      const totalFields = 6;
      if (profile.bio) fieldsFilled++;
      if (profile.skill_categories && profile.skill_categories.length > 0) fieldsFilled++;
      if (profile.starting_price_min) fieldsFilled++;
      if (profile.portfolio_images && profile.portfolio_images.length > 0) fieldsFilled++;
      if (profile.verification_status === 'verified') fieldsFilled++;
      if (profile.location) fieldsFilled++;
      
      const completion_percentage = Math.round((fieldsFilled / totalFields) * 100);

      res.status(200).json({
        profile: {
          ...profile,
          completion_percentage,
          completion_rate: 94, // Mocked for now
          todays_earnings: 45200 // Mocked for now
        },
        user
      });
    } catch(e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });


  // ─── Messaging Routes ──────────────────────────────────────────────────────

  // GET /api/v1/messages/conversations — list all conversations for current user
  apiRouter.get("/messages/conversations", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Get all messages involving this user, grouped by job_id
      const { data: messages, error } = await adminClient
        .from("messages")
        .select(`
          id, job_id, content, created_at, is_read, sender_id, receiver_id,
          sender:users!messages_sender_id_fkey(id, full_name),
          receiver:users!messages_receiver_id_fkey(id, full_name),
          job:jobs(id, category, description, status)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Messages query error:", error);
        return res.status(500).json({ error: { message: error.message } });
      }

      // Group by job_id — keep only the latest message per job
      const conversationMap = new Map<string, any>();
      for (const msg of (messages || [])) {
        if (!msg.job_id) continue;
        if (!conversationMap.has(msg.job_id)) {
          const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;
          conversationMap.set(msg.job_id, {
            jobId: msg.job_id,
            partnerId: msg.sender_id === user.id ? msg.receiver_id : msg.sender_id,
            partnerName: partner?.full_name || "Unknown",
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            job: msg.job,
            unreadCount: 0,
          });
        }
        // Count unread from the other person
        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = conversationMap.get(msg.job_id);
          if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      }

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      res.status(200).json({ conversations });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // GET /api/v1/messages/:jobId — get all messages for a job thread
  apiRouter.get("/messages/:jobId", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { jobId } = req.params;
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: messages, error } = await adminClient
        .from("messages")
        .select(`
          id, job_id, content, created_at, is_read, sender_id, receiver_id,
          sender:users!messages_sender_id_fkey(id, full_name)
        `)
        .eq("job_id", jobId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) return res.status(500).json({ error: { message: error.message } });

      // Mark messages sent TO this user as read
      await adminClient
        .from("messages")
        .update({ is_read: true })
        .eq("job_id", jobId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      // Fetch job details
      const { data: job } = await adminClient
        .from("jobs")
        .select("id, category, description, status, resident_id, artisan_id")
        .eq("id", jobId)
        .single();

      res.status(200).json({ messages: messages || [], job });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // POST /api/v1/messages — send a message
  apiRouter.post("/messages", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { job_id, receiver_id, content } = req.body;
      if (!job_id || !receiver_id || !content?.trim()) {
        return res.status(400).json({ error: { message: "job_id, receiver_id, and content are required" } });
      }

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: message, error } = await adminClient
        .from("messages")
        .insert({
          job_id,
          sender_id: user.id,
          receiver_id,
          content: content.trim(),
          is_read: false,
        })
        .select(`
          id, job_id, content, created_at, is_read, sender_id, receiver_id,
          sender:users!messages_sender_id_fkey(id, full_name)
        `)
        .single();

      if (error) return res.status(500).json({ error: { message: error.message } });

      res.status(201).json({ message });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // ─── Resident Profile & Settings Routes ──────────────────────────────────────
  apiRouter.get("/resident/profile", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: profile } = await adminClient
        .from("resident_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      res.status(200).json({ profile: profile || {}, user });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  apiRouter.put("/resident/profile", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const { username, phone, estate_name, block_chalet, default_gate_instructions, full_name, avatar_url } = req.body;

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      // Update full_name and avatar_url in users metadata if provided
      const metadataUpdate: any = {};
      if (full_name !== undefined) metadataUpdate.full_name = full_name;
      if (avatar_url !== undefined) metadataUpdate.avatar_url = avatar_url;

      if (Object.keys(metadataUpdate).length > 0) {
        await adminClient.auth.admin.updateUserById(user.id, { user_metadata: metadataUpdate });
      }

      // Ensure user exists in public.users to satisfy foreign key constraint
      await adminClient.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: full_name || user.user_metadata?.full_name || "Unknown",
        role: "resident"
      }, { onConflict: "id" });

      const { data, error } = await adminClient
        .from("resident_profiles")
        .upsert({
          user_id: user.id,
          username,
          phone,
          estate_name,
          block_chalet,
          default_gate_instructions
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) return res.status(500).json({ error: { message: error.message } });
      res.status(200).json({ profile: data });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // GET payment methods
  apiRouter.get("/resident/payment-methods", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: methods } = await adminClient
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      res.status(200).json({ payment_methods: methods || [] });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // GET notifications
  apiRouter.get("/notifications", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      const { data: notifications } = await adminClient
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      res.status(200).json({ notifications: notifications || [] });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  // PUT notifications/read (mark all as read)
  apiRouter.put("/notifications/read", async (req, res) => {
    try {
      const supabase = createAuthClient(req);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });

      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      );

      await adminClient
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);

      res.status(200).json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: { message: e.message } });
    }
  });

  app.use('/api/v1', apiRouter);


  // Global API Error Handler to return JSON instead of HTML for middleware errors (like PayloadTooLarge)
  app.use('/api/v1', (err: any, req: any, res: any, next: any) => {
    console.error('API Error:', err.message);
    res.status(err.status || 500).json({ error: { message: err.message || 'Internal Server Error' } });
  });

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
