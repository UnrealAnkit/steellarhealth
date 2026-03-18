// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { Inp, Sel, Btn, Alert, Spinner } from "../components/UI.jsx";
import * as StellarSdk from "stellar-sdk";

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode,    setMode]   = useState("login");   // "login" | "register"
  const [loading, setLoad]   = useState(false);
  const [status,  setStatus] = useState(null);
  const [form,    setForm]   = useState({ name:"", email:"", role:"doctor", stellarKey:"", secretKey:"" });
  const [genKP,   setGenKP]  = useState(null);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const generateNew = () => {
    const kp = StellarSdk.Keypair.random();
    setGenKP({ publicKey: kp.publicKey(), secretKey: kp.secret() });
    set("stellarKey", kp.publicKey());
  };

  const submit = async () => {
    setLoad(true); setStatus(null);
    try {
      if (mode === "login") {
        await login({ email: form.email, stellarKey: form.stellarKey });
      } else {
        if (!form.name) throw new Error("Name required");
        await register({ name:form.name, email:form.email, role:form.role, stellarKey:form.stellarKey });
      }
      nav("/dashboard");
    } catch(e) { setStatus({ type:"error", msg: e.message }); }
    setLoad(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0A1628", display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
      {/* background grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(#132040 1px,transparent 1px),linear-gradient(90deg,#132040 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:.4 }} />
      {/* teal glow */}
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:500, height:500, background:"radial-gradient(circle,#00B4D822 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", width:"100%", maxWidth:440, zIndex:1 }}>
        {/* logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:56, height:56, background:"linear-gradient(135deg,#00B4D8,#3E8EFF)", borderRadius:14, fontSize:26, marginBottom:12 }}>⚕</div>
          <h1 style={{ fontFamily:"IBM Plex Sans", fontWeight:700, fontSize:24, color:"#fff", marginBottom:4 }}>StellarHealth</h1>
          <p style={{ fontSize:12, color:"#4A6A8A", letterSpacing:"0.08em" }}>TOKEN-GATED PATIENT RECORDS</p>
        </div>

        <div style={{ background:"#111E38", border:"1px solid #1E3058", borderRadius:16, padding:28 }}>
          {/* tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:24, background:"#0A1628", borderRadius:8, padding:4 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{
                flex:1, padding:"8px", fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase",
                background: mode===m ? "#00B4D8" : "transparent",
                color: mode===m ? "#fff" : "#4A6A8A",
                border:"none", borderRadius:6,
              }}>{m}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register" && (
              <>
                <Inp label="Full Name" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Dr. Ankit Sharma"
                  inputStyle={{ background:"#0A1628", borderColor:"#1E3058", color:"#fff" }} />
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#4A6A8A", display:"block", marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>Role</label>
                  <select style={{ width:"100%", background:"#0A1628", border:"1.5px solid #1E3058", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#fff", outline:"none" }}
                    value={form.role} onChange={e=>set("role",e.target.value)}>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              </>
            )}
            <Inp label="Email" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="doctor@hospital.com"
              inputStyle={{ background:"#0A1628", borderColor:"#1E3058", color:"#fff" }} />

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4A6A8A", display:"block", marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>Stellar Public Key</label>
              <input value={form.stellarKey} onChange={e=>set("stellarKey",e.target.value)} placeholder="G…"
                style={{ width:"100%", background:"#0A1628", border:"1.5px solid #1E3058", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#00B4D8", outline:"none", fontFamily:"IBM Plex Mono,monospace" }} />
              <button onClick={generateNew} style={{ marginTop:6, fontSize:11, color:"#4A6A8A", background:"transparent", border:"1px dashed #1E3058", borderRadius:6, padding:"5px 12px", width:"100%" }}>
                + Generate new Stellar keypair
              </button>
            </div>

            {genKP && (
              <div style={{ background:"#0A1628", border:"1px solid #F4A26144", borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, color:"#F4A261", marginBottom:6, fontWeight:600 }}>⚠ SAVE YOUR SECRET KEY — NOT RECOVERABLE</div>
                <div style={{ fontSize:10, color:"#4A6A8A", marginBottom:2 }}>Public Key</div>
                <div style={{ fontSize:10, color:"#00B4D8", fontFamily:"IBM Plex Mono", wordBreak:"break-all", marginBottom:8 }}>{genKP.publicKey}</div>
                <div style={{ fontSize:10, color:"#4A6A8A", marginBottom:2 }}>Secret Key</div>
                <div style={{ fontSize:10, color:"#F4A261", fontFamily:"IBM Plex Mono", wordBreak:"break-all" }}>{genKP.secretKey}</div>
              </div>
            )}

            {status && <Alert type={status.type}>{status.msg}</Alert>}

            <button onClick={submit} disabled={loading} style={{
              background:"linear-gradient(135deg,#00B4D8,#3E8EFF)", color:"#fff",
              border:"none", borderRadius:8, padding:"12px", fontSize:13, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              marginTop:4, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1,
            }}>
              {loading ? <><Spinner color="#fff" size={15}/> Authenticating…</> : mode==="login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>

          <p style={{ fontSize:11, color:"#2A4A6A", textAlign:"center", marginTop:16, lineHeight:1.6 }}>
            Your Stellar public key is your identity.<br />
            Token-gated access requires ≥10 XLM on testnet.
          </p>
        </div>
      </div>
    </div>
  );
}
