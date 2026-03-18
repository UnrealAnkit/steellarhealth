// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { api } from "../lib/api.js";
import { Card, Badge, Stat, SectionHead, Btn, Alert, Spinner, TokenGate, shortKey } from "../components/UI.jsx";
import NewPatientModal from "../components/NewPatientModal.jsx";

const BLOOD_COLORS = { "A+":"#E63946","A-":"#C1121F","B+":"#F4A261","B-":"#E76F51","AB+":"#8338EC","AB-":"#3A0CA3","O+":"#06D6A0","O-":"#1B9AAA","Unknown":"#6B7A8D" };

export default function Dashboard() {
  const { user, tokenOk, logout } = useAuth();
  const nav = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showNew,  setShowNew]  = useState(false);
  const [funding,  setFunding]  = useState(false);
  const [fundMsg,  setFundMsg]  = useState(null);
  const [search,   setSearch]   = useState("");

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.listPatients();
      setPatients(data.patients || []);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const fundAccount = async () => {
    setFunding(true); setFundMsg(null);
    try {
      await api.fundTestnet(user.stellarKey);
      setFundMsg({ type:"success", msg:"Account funded with 10,000 XLM via Friendbot! Refresh the page." });
    } catch(e) { setFundMsg({ type:"error", msg:e.message }); }
    setFunding(false);
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} .fade-up{animation:fadeUp .3s ease both} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Topbar ── */}
      <header style={{ background:"#0A1628", borderBottom:"1px solid #132040", padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:"linear-gradient(135deg,#00B4D8,#3E8EFF)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚕</div>
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:"#fff", letterSpacing:"0.04em" }}>StellarHealth</div>
            <div style={{ fontSize:9, color:"#3A5A7A", letterSpacing:"0.08em" }}>PATIENT RECORDS</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:12, color:"#4A6A8A" }}>
            <span style={{ color:"#fff", fontWeight:600 }}>{user?.name}</span>
            <span style={{ marginLeft:6 }}><Badge color="#3E8EFF">{user?.role}</Badge></span>
          </div>
          <div style={{ fontSize:11, color:"#4A6A8A", fontFamily:"IBM Plex Mono" }}>{shortKey(user?.stellarKey)}</div>
          <div style={{ background:"#0D2A10", border:"1px solid #00C48C44", color:"#00C48C", borderRadius:20, padding:"4px 10px", fontSize:9, letterSpacing:"0.08em" }}>● TESTNET</div>
          <button onClick={logout} style={{ fontSize:11, color:"#4A6A8A", background:"transparent", border:"1px solid #1E3058", borderRadius:6, padding:"5px 12px" }}>Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px" }}>

        {/* Token gate status */}
        <div style={{ marginBottom:20 }}>
          <TokenGate tokenOk={tokenOk} />
          {tokenOk && !tokenOk.allowed && (
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10 }}>
              <Alert type="warn">You need ≥10 XLM on Stellar testnet to access protected records.</Alert>
              <Btn variant="outline" onClick={fundAccount} disabled={funding} style={{ whiteSpace:"nowrap", flexShrink:0 }}>
                {funding ? <><Spinner size={13}/>Funding…</> : "Fund via Friendbot"}
              </Btn>
            </div>
          )}
          {fundMsg && <Alert type={fundMsg.type} style={{ marginTop:8 }}>{fundMsg.msg}</Alert>}
        </div>

        {/* Stats */}
        <div className="grid3" style={{ marginBottom:24 }}>
          <Stat icon="🏥" label="Total Patients" value={patients.length} color="#00B4D8" />
          <Stat icon="🔒" label="Restricted Records" value={patients.filter(p=>p.accessLevel==="restricted").length} color="#F4A261" />
          <Stat icon="✅" label="Token Gate" value={tokenOk?.allowed?"OPEN":"CLOSED"} color={tokenOk?.allowed?"#00C48C":"#E63946"} />
        </div>

        {/* Patient list */}
        <Card>
          <SectionHead
            action={
              <div style={{ display:"flex", gap:10 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients…"
                  style={{ background:"#F0F4F8", border:"1.5px solid #D1DCE8", borderRadius:8, padding:"7px 12px", fontSize:12, outline:"none", width:200 }} />
                <Btn variant="navy" onClick={()=>setShowNew(true)}>+ New Patient</Btn>
              </div>
            }>
            Patient Records
          </SectionHead>

          {loading ? (
            <div style={{ textAlign:"center", padding:"40px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"#6B7A8D" }}>
              <Spinner /> Loading records…
            </div>
          ) : error ? (
            <Alert type="error">{error}</Alert>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🏥</div>
              <div style={{ fontWeight:600, color:"#0A1628", marginBottom:6 }}>No patients yet</div>
              <div style={{ fontSize:12, color:"#6B7A8D", marginBottom:16 }}>Create your first patient record to get started.</div>
              <Btn variant="navy" onClick={()=>setShowNew(true)}>+ Add First Patient</Btn>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid #F0F4F8" }}>
                  {["Patient ID","Name","Blood","Access","Created",""].map(h => (
                    <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11, fontWeight:700,
                      color:"#6B7A8D", letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i) => (
                  <tr key={p.patientId} className="fade-up" style={{ borderBottom:"1px solid #F0F4F8", transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFB"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px", fontSize:12, fontFamily:"IBM Plex Mono", color:"#00B4D8" }}>{p.patientId}</td>
                    <td style={{ padding:"12px", fontWeight:600, fontSize:13 }}>{p.name}</td>
                    <td style={{ padding:"12px" }}>
                      <span style={{ background:BLOOD_COLORS[p.bloodGroup]+"18", color:BLOOD_COLORS[p.bloodGroup],
                        border:`1px solid ${BLOOD_COLORS[p.bloodGroup]}33`, borderRadius:4, padding:"2px 8px", fontSize:12, fontWeight:700 }}>
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td style={{ padding:"12px" }}>
                      <Badge color={p.accessLevel==="public"?"#00C48C":p.accessLevel==="restricted"?"#F4A261":"#E63946"}>
                        {p.accessLevel==="public"?"🌐 Public":p.accessLevel==="restricted"?"🔒 Restricted":"🔐 Private"}
                      </Badge>
                    </td>
                    <td style={{ padding:"12px", fontSize:11, color:"#6B7A8D" }}>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ padding:"12px" }}>
                      <Link to={`/patient/${p.patientId}`}>
                        <Btn variant="outline" style={{ padding:"6px 14px", fontSize:11 }}>View →</Btn>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {showNew && <NewPatientModal onClose={()=>setShowNew(false)} onCreated={()=>{ setShowNew(false); fetchPatients(); }} />}
    </div>
  );
}
