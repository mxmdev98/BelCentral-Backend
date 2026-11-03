// src/index.ts — Express entrypoint.
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.js";
import { notFoundHandler } from "./middleware/notFound.js";

import authRoutes from "./routes/auth.js";
import villagesRoutes from "./routes/villages.js";
import tribesRoutes from "./routes/tribes.js";
import clansRoutes from "./routes/clans.js";
import residentsRoutes from "./routes/residents.js";
import reportsRoutes from "./routes/reports.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// Trust first proxy hop in production so secure cookies work behind Nginx.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true, // required for cross-origin cookies
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health check — no auth, useful for Nginx/uptime monitors.
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/villages", villagesRoutes);
app.use("/api/tribes", tribesRoutes);
app.use("/api/clans", clansRoutes);
app.use("/api/residents", residentsRoutes);
app.use("/api/reports", reportsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API listening on http://localhost:${PORT}`);
  logger.info(`CORS origin: ${CORS_ORIGIN}`);
});
