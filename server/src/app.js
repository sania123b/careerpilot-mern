import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import JobApplication from "./models/JobApplication.js";
import { analyzeSkills } from "./analyzer.js";
const statuses = ["Applied", "Interview", "Offer", "Rejected", "Wishlist"];
const applicationSchema = z.object({ company: z.string().trim().min(1).max(100), role: z.string().trim().min(1).max(120), location: z.string().trim().max(120).optional().default(""), jobUrl: z.union([z.string().trim().max(500).url().refine(value => /^https?:\/\//i.test(value), "Use an http or https URL."), z.literal("")]).optional().default(""), status: z.enum(statuses).optional().default("Applied"), appliedAt: z.coerce.date().optional(), notes: z.string().trim().max(2000).optional().default("") }).strict();
const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export function createApp({ clientOrigin = "http://localhost:5173" } = {}) {
  const app = express(); app.disable("x-powered-by"); app.use(helmet());
  app.use(cors({ origin: clientOrigin.split(",").map(value => value.trim()), methods: ["GET", "POST", "PATCH", "DELETE"] })); app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
  app.get("/api/applications", asyncRoute(async (_req, res) => res.json({ applications: await JobApplication.find().sort({ appliedAt: -1, createdAt: -1 }).lean() })));
  app.post("/api/applications", asyncRoute(async (req, res) => { const parsed = applicationSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Check the application details.", details: parsed.error.flatten() }); res.status(201).json({ application: await JobApplication.create(parsed.data) }); }));
  app.patch("/api/applications/:id", asyncRoute(async (req, res) => { const id = idSchema.safeParse(req.params.id), parsed = applicationSchema.partial().safeParse(req.body); if (!id.success) return res.status(400).json({ error: "Invalid application id." }); if (!parsed.success || !Object.keys(req.body ?? {}).length) return res.status(400).json({ error: "Check the updated application details.", details: parsed.error?.flatten() }); const application = await JobApplication.findByIdAndUpdate(id.data, parsed.data, { new: true, runValidators: true }); if (!application) return res.status(404).json({ error: "Application not found." }); res.json({ application }); }));
  app.delete("/api/applications/:id", asyncRoute(async (req, res) => { const id = idSchema.safeParse(req.params.id); if (!id.success) return res.status(400).json({ error: "Invalid application id." }); if (!await JobApplication.findByIdAndDelete(id.data)) return res.status(404).json({ error: "Application not found." }); res.json({ message: "Application deleted." }); }));
  app.post("/api/analyze", rateLimit({ windowMs: 60000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }), (req, res, next) => { try { const jd = z.string().max(10000).safeParse(req.body?.jobDescription), skills = z.string().max(2000).safeParse(req.body?.candidateSkills); if (!jd.success || !skills.success) return res.status(400).json({ error: "Provide a job description (up to 10,000 characters) and skills (up to 2,000 characters)." }); res.json(analyzeSkills(jd.data, skills.data)); } catch (error) { next(error); } });
  app.get("/api/analytics", asyncRoute(async (_req, res) => { const counts = await JobApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]); const byStatus = Object.fromEntries(statuses.map(status => [status, 0])); counts.forEach(({ _id, count }) => { byStatus[_id] = count; }); const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0); res.json({ total, active: byStatus.Applied + byStatus.Interview, interviews: byStatus.Interview, offers: byStatus.Offer, byStatus }); }));
  app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
  app.use((error, _req, res, _next) => { if (res.headersSent) return; if (["ValidationError", "CastError"].includes(error.name)) return res.status(400).json({ error: error.message }); if (error.name === "MongoServerError" && error.code === 11000) return res.status(409).json({ error: "This application already exists." }); const status = error.status || 500; if (status >= 500) console.error(error); res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : error.message }); });
  return app;
}
