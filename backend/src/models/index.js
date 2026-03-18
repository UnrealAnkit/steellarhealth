// src/models/index.js
import mongoose from "mongoose";

// ── User (doctors / admins) ───────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  role:        { type: String, enum: ["admin", "doctor", "patient"], default: "doctor" },
  stellarKey:  { type: String, required: true },   // Stellar public key — identity
  tokenBalance:{ type: Number, default: 0 },        // cached from chain
  createdAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// ── Patient record ────────────────────────────────────────────────────────────
const PatientSchema = new mongoose.Schema({
  patientId:   { type: String, required: true, unique: true },  // PATIENT-xxxxx
  name:        { type: String, required: true },
  dob:         { type: String },
  bloodGroup:  { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"] },
  contact:     { type: String },
  stellarKey:  { type: String },   // patient's own Stellar address (optional)

  // Medical data
  conditions:  [{ type: String }],
  allergies:   [{ type: String }],
  medications: [{ name:String, dosage:String, frequency:String }],
  vitals: [{
    date:        String,
    bp:          String,
    pulse:       Number,
    temp:        Number,
    weight:      Number,
    spo2:        Number,
    recordedBy:  String,
  }],
  visits: [{
    date:        String,
    diagnosis:   String,
    notes:       String,
    doctor:      String,
    prescription:String,
    txHash:      String,   // on-chain proof of visit record
  }],

  // Access control
  accessLevel: { type: String, enum: ["public","restricted","private"], default: "restricted" },
  createdBy:   { type: String },   // stellarKey of creator
  createdAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// ── Access Grant (token-gated) ────────────────────────────────────────────────
// When a doctor holds the ACCESS_TOKEN on Stellar, we log the grant here
const AccessGrantSchema = new mongoose.Schema({
  patientId:     { type: String, required: true },
  grantedTo:     { type: String, required: true },  // stellarKey
  grantedBy:     { type: String, required: true },  // stellarKey
  txHash:        { type: String },                  // Stellar TX that proves token transfer
  accessType:    { type: String, enum: ["read","write","full"], default: "read" },
  expiresAt:     { type: Date },
  revoked:       { type: Boolean, default: false },
  revokedAt:     { type: Date },
}, { timestamps: true });

// ── Audit Log ─────────────────────────────────────────────────────────────────
const AuditSchema = new mongoose.Schema({
  action:      { type: String, required: true },  // "VIEW_RECORD", "UPDATE_VITALS", etc.
  actorKey:    { type: String, required: true },
  actorName:   { type: String },
  patientId:   { type: String },
  details:     { type: String },
  txHash:      { type: String },   // optional on-chain anchor
  ip:          { type: String },
  timestamp:   { type: Date, default: Date.now },
});

export const User        = mongoose.model("User",        UserSchema);
export const Patient     = mongoose.model("Patient",     PatientSchema);
export const AccessGrant = mongoose.model("AccessGrant", AccessGrantSchema);
export const Audit       = mongoose.model("Audit",       AuditSchema);
