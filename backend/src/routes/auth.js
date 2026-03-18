// src/routes/auth.js
import express from "express";
import jwt     from "jsonwebtoken";
import { User } from "../models/index.js";
import { isValidStellarKey, checkTokenAccess, generateChallenge, verifySignature, fundTestnet } from "../lib/stellar.js";

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || "dev_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// In-memory challenge store (use Redis in production)
const challenges = new Map();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, role, stellarKey } = req.body;
    if (!name || !email || !stellarKey) return res.status(400).json({ error: "name, email, stellarKey required" });
    if (!isValidStellarKey(stellarKey))  return res.status(400).json({ error: "Invalid Stellar public key" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({ name, email, role: role || "doctor", stellarKey });
    const token = jwt.sign({ id: user._id, name, email, role: user.role, stellarKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role, stellarKey } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, stellarKey } = req.body;
    if (!email || !stellarKey) return res.status(400).json({ error: "email and stellarKey required" });

    const user = await User.findOne({ email, stellarKey });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email, role: user.role, stellarKey },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, stellarKey } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/auth/challenge/:publicKey ───────────────────────────────────────
// SEP-10 style: issue a challenge the user signs with their Stellar key
router.get("/challenge/:publicKey", (req, res) => {
  const { publicKey } = req.params;
  if (!isValidStellarKey(publicKey)) return res.status(400).json({ error: "Invalid Stellar key" });

  const challenge = generateChallenge(publicKey);
  challenges.set(publicKey, { ...challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json(challenge);
});

// ── POST /api/auth/verify-challenge ──────────────────────────────────────────
router.post("/verify-challenge", async (req, res) => {
  try {
    const { publicKey, signature } = req.body;
    const stored = challenges.get(publicKey);
    if (!stored || Date.now() > stored.expiresAt) return res.status(400).json({ error: "Challenge expired or not found" });

    const valid = verifySignature(publicKey, stored.message, signature);
    if (!valid) return res.status(401).json({ error: "Invalid signature" });

    challenges.delete(publicKey);

    // Find or auto-create user
    let user = await User.findOne({ stellarKey: publicKey });
    if (!user) {
      user = await User.create({ name: `User ${publicKey.slice(0,6)}`, email: `${publicKey.slice(0,10)}@stellar.local`, stellarKey: publicKey, role: "doctor" });
    }

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role, stellarKey: publicKey }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, stellarKey: publicKey } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/auth/token-check/:publicKey ─────────────────────────────────────
router.get("/token-check/:publicKey", async (req, res) => {
  try {
    const check = await checkTokenAccess(req.params.publicKey);
    res.json(check);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/auth/fund-testnet ───────────────────────────────────────────────
router.post("/fund-testnet", async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!isValidStellarKey(publicKey)) return res.status(400).json({ error: "Invalid Stellar key" });
    const result = await fundTestnet(publicKey);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
