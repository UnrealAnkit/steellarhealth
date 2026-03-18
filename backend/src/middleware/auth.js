// src/middleware/auth.js
import jwt from "jsonwebtoken";
import { checkTokenAccess } from "../lib/stellar.js";
import { Audit } from "../models/index.js";

// ── Verify JWT ────────────────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Stellar token-gate: check on-chain balance ────────────────────────────────
export async function requireStellarAccess(req, res, next) {
  const stellarKey = req.user?.stellarKey;
  if (!stellarKey) return res.status(403).json({ error: "No Stellar key on account" });

  const check = await checkTokenAccess(stellarKey);
  if (!check.allowed) {
    return res.status(403).json({
      error:   "Token-gate: insufficient Stellar balance",
      reason:  check.reason,
      balance: check.balance,
    });
  }

  req.stellarAccess = check;
  next();
}

// ── Role check ────────────────────────────────────────────────────────────────
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(" or ")}` });
    }
    next();
  };
}

// ── Audit logger ──────────────────────────────────────────────────────────────
export async function logAudit({ action, actorKey, actorName, patientId, details, txHash, ip }) {
  try {
    await Audit.create({ action, actorKey, actorName, patientId, details, txHash, ip });
  } catch { /* non-blocking */ }
}
