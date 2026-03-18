// src/components/NewPatientModal.jsx
import { useState } from "react";
import { api } from "../lib/api.js";
import { Inp, Sel, Btn, Alert, Spinner, SectionHead } from "./UI.jsx";

export default function NewPatientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:"", dob:"", bloodGroup:"Unknown", contact:"",
    stellarKey:"", conditions:"", allergies:"", accessLevel:"restricted",
  });
  const [loading, setLoad] = useState(false);
  const [status,  setStatus] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.name.trim()) { setStatus({ type:"error", msg:"Patient name required." }); return; }
    setLoad(true); setStatus(null);
    try {
      await api.createPatient({
        ...form,
        conditions: form.conditions.split(",").map(s=>s.trim()).filter(Boolean),
        allergies:  form.allergies.split(",").map(s=>s.trim()).filter(Boolean),
      });
      onCreated();
    } catch(e) { setStatus({ type:"error", msg:e.message }); }
    setLoad(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,22,40,.6)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:560,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(10,22,40,.2)" }}>

        {/* Header */}
        <div style={{ background:"#0A1628", padding:"18px 24px", borderRadius:"16px 16px 0 0",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#fff" }}>+ New Patient Record</div>
          <button onClick={onClose} style={{ color:"#4A6A8A", background:"transparent", border:"none", fontSize:20, lineHeight:1 }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          <SectionHead color="#00B4D8">Basic Info</SectionHead>
          <div className="grid2" style={{ marginBottom:14 }}>
            <Inp label="Full Name *" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Patient full name" />
            <Inp label="Date of Birth" type="date" value={form.dob} onChange={e=>set("dob",e.target.value)} />
          </div>
          <div className="grid2" style={{ marginBottom:14 }}>
            <Sel label="Blood Group" value={form.bloodGroup} onChange={e=>set("bloodGroup",e.target.value)}>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map(g=><option key={g}>{g}</option>)}
            </Sel>
            <Inp label="Contact" value={form.contact} onChange={e=>set("contact",e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <Inp label="Patient Stellar Address (optional)" value={form.stellarKey}
            onChange={e=>set("stellarKey",e.target.value)} placeholder="G…"
            inputStyle={{ fontFamily:"IBM Plex Mono", fontSize:11 }} style={{ marginBottom:14 }} />

          <SectionHead color="#00B4D8" style={{ marginTop:8 }}>Medical Info</SectionHead>
          <Inp label="Known Conditions (comma-separated)" value={form.conditions}
            onChange={e=>set("conditions",e.target.value)} placeholder="Diabetes, Hypertension"
            style={{ marginBottom:14 }} />
          <Inp label="Allergies (comma-separated)" value={form.allergies}
            onChange={e=>set("allergies",e.target.value)} placeholder="Penicillin, Peanuts"
            style={{ marginBottom:14 }} />

          <SectionHead color="#F4A261">Access Level</SectionHead>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {[
              { val:"public",      label:"🌐 Public",     desc:"Anyone logged in can view" },
              { val:"restricted",  label:"🔒 Restricted", desc:"Requires Stellar token (≥10 XLM)" },
              { val:"private",     label:"🔐 Private",    desc:"Explicit grant only" },
            ].map(opt => (
              <div key={opt.val} onClick={()=>set("accessLevel",opt.val)} style={{
                flex:1, padding:"12px", borderRadius:10, cursor:"pointer",
                border:`2px solid ${form.accessLevel===opt.val?"#00B4D8":"#D1DCE8"}`,
                background: form.accessLevel===opt.val?"#E0F7FC":"#F0F4F8",
                transition:"all .15s",
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0A1628", marginBottom:3 }}>{opt.label}</div>
                <div style={{ fontSize:10, color:"#6B7A8D", lineHeight:1.4 }}>{opt.desc}</div>
              </div>
            ))}
          </div>

          {status && <Alert type={status.type} style={{ marginBottom:14 }}>{status.msg}</Alert>}

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="navy" onClick={submit} disabled={loading}>
              {loading ? <><Spinner size={13} color="#fff"/>Creating…</> : "Create Patient Record"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
