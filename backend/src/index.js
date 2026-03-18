// src/index.js
import express      from "express";
import cors         from "cors";
import helmet       from "helmet";
import rateLimit    from "express-rate-limit";
import mongoose     from "mongoose";
import dotenv       from "dotenv";
import authRoutes   from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: "Too many requests" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/patients", patientRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", service: "StellarHealthRecord API", network: process.env.STELLAR_NETWORK || "TESTNET" }));

// ── DB + Start ────────────────────────────────────────────────────────────────
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/stellar-health";

let connectPromise;

export function ensureDbConnection() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connectPromise) {
    connectPromise = mongoose.connect(MONGO).then(() => {
      console.log("✓ MongoDB connected");
    });
  }
  return connectPromise;
}

if (!process.env.VERCEL) {
  ensureDbConnection()
    .then(() => {
      app.listen(PORT, () => console.log(`✓ API running → http://localhost:${PORT}`));
    })
    .catch(e => {
      console.error("✗ MongoDB connection failed:", e.message);
      process.exit(1);
    });
}

export default app;
