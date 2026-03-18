// src/routes/patients.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Patient, AccessGrant, Audit } from "../models/index.js";
import { requireAuth, requireStellarAccess, logAudit } from "../middleware/auth.js";
import { checkTokenAccess } from "../lib/stellar.js";

const router = express.Router();
const audit = (data, req) => logAudit({ ...data, ip: req.ip });

// ── All patient routes require JWT ────────────────────────────────────────────
router.use(requireAuth);

// ── GET /api/patients — list (public info only) ───────────────────────────────
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find({}, "patientId name bloodGroup accessLevel createdAt");
    await audit({ action: "LIST_PATIENTS", actorKey: req.user.stellarKey, actorName: req.user.name, details: `Listed ${patients.length} patients` }, req);
    res.json({ patients, count: patients.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/patients — create ───────────────────────────────────────────────
router.post("/", requireStellarAccess, async (req, res) => {
  try {
    const { name, dob, bloodGroup, contact, stellarKey, conditions, allergies, accessLevel } = req.body;
    if (!name) return res.status(400).json({ error: "Patient name required" });

    const patientId = `PAT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const patient = await Patient.create({
      patientId, name, dob, bloodGroup: bloodGroup || "Unknown",
      contact, stellarKey, conditions: conditions || [],
      allergies: allergies || [], accessLevel: accessLevel || "restricted",
      createdBy: req.user.stellarKey,
    });

    await audit({ action: "CREATE_PATIENT", actorKey: req.user.stellarKey, actorName: req.user.name, patientId, details: `Created record for ${name}` }, req);
    res.status(201).json({ patient, message: "Patient record created" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/patients/:id — full record (token-gated) ────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const stellarKey = req.user.stellarKey;

    // Access logic:
    // 1. Creator always has access
    // 2. Public records: open to all authenticated users
    // 3. Restricted: requires Stellar token-gate
    // 4. Private: only creator or explicit grant
    let hasAccess = false;
    let accessReason = "";

    if (patient.createdBy === stellarKey) {
      hasAccess = true; accessReason = "Record creator";
    } else if (patient.accessLevel === "public") {
      hasAccess = true; accessReason = "Public record";
    } else if (patient.accessLevel === "restricted") {
      const tokenCheck = await checkTokenAccess(stellarKey);
      hasAccess    = tokenCheck.allowed;
      accessReason = tokenCheck.reason;
    } else if (patient.accessLevel === "private") {
      const grant = await AccessGrant.findOne({ patientId: patient.patientId, grantedTo: stellarKey, revoked: false });
      hasAccess    = !!grant;
      accessReason = grant ? "Explicit access grant" : "No grant found";
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Token-gate: access denied", reason: accessReason, accessLevel: patient.accessLevel });
    }

    await audit({ action: "VIEW_RECORD", actorKey: stellarKey, actorName: req.user.name, patientId: patient.patientId, details: `Accessed via: ${accessReason}` }, req);
    res.json({ patient, accessReason });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/patients/:id/vitals — add vitals (token-gated) ─────────────────
router.post("/:id/vitals", requireStellarAccess, async (req, res) => {
  try {
    const { bp, pulse, temp, weight, spo2 } = req.body;
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const vital = { date: new Date().toISOString().split("T")[0], bp, pulse, temp, weight, spo2, recordedBy: req.user.name };
    patient.vitals.push(vital);
    await patient.save();

    await audit({ action: "ADD_VITALS", actorKey: req.user.stellarKey, actorName: req.user.name, patientId: patient.patientId, details: `BP:${bp} Pulse:${pulse}` }, req);
    res.json({ message: "Vitals recorded", vital });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/patients/:id/visits — log a visit ───────────────────────────────
router.post("/:id/visits", requireStellarAccess, async (req, res) => {
  try {
    const { diagnosis, notes, prescription } = req.body;
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const visit = {
      date: new Date().toLocaleDateString("en-IN"),
      diagnosis, notes, prescription,
      doctor: req.user.name,
      txHash: null, // would be filled by on-chain anchoring in production
    };
    patient.visits.push(visit);
    await patient.save();

    await audit({ action: "LOG_VISIT", actorKey: req.user.stellarKey, actorName: req.user.name, patientId: patient.patientId, details: diagnosis }, req);
    res.json({ message: "Visit logged", visit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/patients/:id/grant — grant access ────────────────────────────────
router.post("/:id/grant", requireStellarAccess, async (req, res) => {
  try {
    const { grantTo, accessType, expiresInDays } = req.body;
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (patient.createdBy !== req.user.stellarKey) return res.status(403).json({ error: "Only creator can grant access" });

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;
    const grant = await AccessGrant.create({
      patientId: patient.patientId,
      grantedTo: grantTo,
      grantedBy: req.user.stellarKey,
      accessType: accessType || "read",
      expiresAt,
    });

    await audit({ action: "GRANT_ACCESS", actorKey: req.user.stellarKey, actorName: req.user.name, patientId: patient.patientId, details: `Granted ${accessType} to ${grantTo.slice(0,10)}…` }, req);
    res.json({ message: "Access granted", grant });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/patients/:id/audit — audit trail ────────────────────────────────
router.get("/:id/audit", requireStellarAccess, async (req, res) => {
  try {
    const logs = await Audit.find({ patientId: req.params.id }).sort({ timestamp: -1 }).limit(50);
    res.json({ logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/patients/:id — delete ────────────────────────────────────────
router.delete("/:id", requireStellarAccess, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (patient.createdBy !== req.user.stellarKey) return res.status(403).json({ error: "Only creator can delete" });
    await patient.deleteOne();
    await audit({ action: "DELETE_PATIENT", actorKey: req.user.stellarKey, actorName: req.user.name, patientId: req.params.id }, req);
    res.json({ message: "Patient record deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
