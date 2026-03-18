// src/pages/PatientDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { api } from "../lib/api.js";
import { Card, Badge, SectionHead, Btn, Alert, Spinner, Inp, Tag, shortKey } from "../components/UI.jsx";

const BLOOD_COLORS = { "A+":"#E63946","A-":"#C1121F","B+":"#F4A261","B-":"#E76F51","AB+":"#8338EC","AB-":"#3A0CA3","O+":"#06D6A0","O-":"#1B9AAA","Unknown":"#6B7A8D" };

// ── Tab components ─────────────────────────────────────────────────────────────
function VitalsTab({ patientId, vitals=[] }) {
  const [form, setForm] = useState({ bp:"", pulse:"", temp:"", weight:"", spo2:"" });
  const [loading, setLoad] = useState(false);
  const [status,  setStatus] = useState(null);
  const [list,    setList]   = useState(vitals);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const add = async () => {
    setLoad(true); setStatus(null);
    try {
      const res = await api.addVitals(patientId, form);
      setList(p=>[res.vital,...p]);
      setStatus({ type:"success", msg:"Vitals recorded successfully." });
      setForm({ bp:"", pulse:"", temp:"", weight:"", spo2:"" });
    } catch(e) { setStatus({ type:"error", msg:e.message }); }
    setLoad(false);
  };

  return (
    <div className="fade-up">
      <Card style={{ marginBottom:16 }}>
        <SectionHead color="#00B4D8">Record Vitals</SectionHead>
        <div className="grid3" style={{ marginBottom:14 }}>
          <Inp label="Blood Pressure" value={form.bp} onChange={e=>set("bp",e.target.value)} placeholder="120/80" />
          <Inp label="Pulse (bpm)" type="number" value={form.pulse} onChange={e=>set("pulse",e.target.value)} placeholder="72" />
          <Inp label="SpO2 (%)" type="number" value={form.spo2} onChange={e=>set("spo2",e.target.value)} placeholder="98" />
          <Inp label="Temp (°C)" type="number" value={form.temp} onChange={e=>set("temp",e.target.value)} placeholder="37.0" />
          <Inp label="Weight (kg)" type="number" value={form.weight} onChange={e=>set("weight",e.target.value)} placeholder="70" />
        </div>
        {status && <Alert type={status.type} style={{ marginBottom:12 }}>{status.msg}</Alert>}
        <Btn variant="navy" onClick={add} disabled={loading}>
          {loading ? <><Spinner size={13} color="#fff"/>Saving…</> : "+ Record Vitals"}
        </Btn>
      </Card>

      {list.length > 0 && (
        <Card>
          <SectionHead color="#00B4D8">Vitals History</SectionHead>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"2px solid #F0F4F8" }}>
                {["Date","BP","Pulse","Temp","SpO2","Weight","By"].map(h=>(
                  <th key={h} style={{ textAlign:"left", padding:"8px 10px", fontSize:11, color:"#6B7A8D", letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((v,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid #F0F4F8" }}>
                  <td style={{ padding:"10px", fontSize:12, color:"#6B7A8D", fontFamily:"IBM Plex Mono" }}>{v.date}</td>
                  <td style={{ padding:"10px", fontSize:13, fontWeight:600, color: v.bp&&parseInt(v.bp)>140?"#E63946":"#00C48C" }}>{v.bp||"—"}</td>
                  <td style={{ padding:"10px", fontSize:13 }}>{v.pulse||"—"}</td>
                  <td style={{ padding:"10px", fontSize:13 }}>{v.temp||"—"}°</td>
                  <td style={{ padding:"10px", fontSize:13, color:v.spo2&&v.spo2<95?"#E63946":"#0A1628" }}>{v.spo2||"—"}%</td>
                  <td style={{ padding:"10px", fontSize:13 }}>{v.weight||"—"} kg</td>
                  <td style={{ padding:"10px", fontSize:11, color:"#6B7A8D" }}>{v.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function VisitsTab({ patientId, visits=[] }) {
  const [form, setForm]   = useState({ diagnosis:"", notes:"", prescription:"" });
  const [loading, setLoad] = useState(false);
  const [status,  setStatus] = useState(null);
  const [list,    setList]   = useState(visits);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const add = async () => {
    if (!form.diagnosis.trim()) { setStatus({ type:"error", msg:"Diagnosis required." }); return; }
    setLoad(true); setStatus(null);
    try {
      const res = await api.addVisit(patientId, form);
      setList(p=>[res.visit,...p]);
      setStatus({ type:"success", msg:"Visit logged." });
      setForm({ diagnosis:"", notes:"", prescription:"" });
    } catch(e) { setStatus({ type:"error", msg:e.message }); }
    setLoad(false);
  };

  return (
    <div className="fade-up">
      <Card style={{ marginBottom:16 }}>
        <SectionHead color="#8338EC">Log Visit</SectionHead>
        <Inp label="Diagnosis *" value={form.diagnosis} onChange={e=>set("diagnosis",e.target.value)}
          placeholder="Primary diagnosis" style={{ marginBottom:12 }} />
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#6B7A8D", display:"block", marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>Clinical Notes</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Symptoms, observations, treatment plan…"
            rows={3} style={{ width:"100%", background:"#F0F4F8", border:"1.5px solid #D1DCE8", borderRadius:8,
              padding:"10px 12px", fontSize:13, color:"#0A1628", outline:"none", resize:"vertical", fontFamily:"IBM Plex Sans" }} />
        </div>
        <Inp label="Prescription" value={form.prescription} onChange={e=>set("prescription",e.target.value)}
          placeholder="e.g. Amoxicillin 500mg TDS x 5 days" style={{ marginBottom:12 }} />
        {status && <Alert type={status.type} style={{ marginBottom:12 }}>{status.msg}</Alert>}
        <Btn variant="navy" style={{ background:"#8338EC", borderColor:"#8338EC" }} onClick={add} disabled={loading}>
          {loading ? <><Spinner size={13} color="#fff"/>Saving…</> : "+ Log Visit"}
        </Btn>
      </Card>

      {list.length > 0 && (
        <div>
          {list.map((v,i)=>(
            <Card key={i} style={{ marginBottom:12, borderLeft:"4px solid #8338EC" }} className="fade-up">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#0A1628" }}>{v.diagnosis}</div>
                  <div style={{ fontSize:11, color:"#6B7A8D", marginTop:2 }}>Dr. {v.doctor} · {v.date}</div>
                </div>
                {v.txHash && <Badge color="#00B4D8">On-chain ↗</Badge>}
              </div>
              {v.notes && <p style={{ fontSize:12, color:"#3A4A5C", lineHeight:1.7, marginBottom:8 }}>{v.notes}</p>}
              {v.prescription && (
                <div style={{ background:"#F8F4FF", border:"1px solid #8338EC22", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#8338EC" }}>
                  💊 {v.prescription}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessTab({ patientId }) {
  const [grantTo,      setGrantTo]    = useState("");
  const [accessType,   setAccessType] = useState("read");
  const [expiresInDays,setExpires]    = useState("");
  const [loading, setLoad]  = useState(false);
  const [status,  setStatus] = useState(null);

  const grant = async () => {
    if (!grantTo.trim()) { setStatus({ type:"error", msg:"Enter a Stellar public key." }); return; }
    setLoad(true); setStatus(null);
    try {
      await api.grantAccess(patientId, { grantTo, accessType, expiresInDays: expiresInDays||null });
      setStatus({ type:"success", msg:`Access granted to ${grantTo.slice(0,14)}…` });
      setGrantTo(""); setExpires("");
    } catch(e) { setStatus({ type:"error", msg:e.message }); }
    setLoad(false);
  };

  return (
    <div className="fade-up">
      <Card>
        <SectionHead color="#F4A261">Grant Record Access</SectionHead>
        <p style={{ fontSize:12, color:"#6B7A8D", marginBottom:16, lineHeight:1.7 }}>
          Grant another Stellar account explicit access to this patient record.
          Access can be read-only, write, or full. You can set an expiry.
        </p>
        <Inp label="Stellar Public Key to Grant" value={grantTo} onChange={e=>setGrantTo(e.target.value)}
          placeholder="G…" inputStyle={{ fontFamily:"IBM Plex Mono", fontSize:11 }} style={{ marginBottom:12 }} />
        <div className="grid2" style={{ marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#6B7A8D", display:"block", marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>Access Type</label>
            <select value={accessType} onChange={e=>setAccessType(e.target.value)}
              style={{ width:"100%", background:"#F0F4F8", border:"1.5px solid #D1DCE8", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#0A1628", outline:"none" }}>
              <option value="read">Read Only</option>
              <option value="write">Read + Write</option>
              <option value="full">Full Access</option>
            </select>
          </div>
          <Inp label="Expires In (days, optional)" type="number" value={expiresInDays}
            onChange={e=>setExpires(e.target.value)} placeholder="e.g. 30" />
        </div>
        {status && <Alert type={status.type} style={{ marginBottom:12 }}>{status.msg}</Alert>}
        <Btn variant="navy" style={{ background:"#F4A261", borderColor:"#F4A261", color:"#fff" }} onClick={grant} disabled={loading}>
          {loading ? <><Spinner size={13} color="#fff"/>Granting…</> : "Grant Access →"}
        </Btn>
      </Card>

      {/* How token gating works */}
      <Card style={{ marginTop:16, background:"linear-gradient(135deg,#E0F7FC,#F0FAFF)", border:"1px solid #00B4D833" }}>
        <SectionHead color="#00B4D8">How Token Gating Works</SectionHead>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { icon:"🌐", title:"Public Records",    desc:"Any authenticated user can view. No token required." },
            { icon:"🔒", title:"Restricted Records", desc:"Doctor must hold ≥10 XLM on Stellar testnet. Checked live on-chain at time of access." },
            { icon:"🔐", title:"Private Records",    desc:"Only users explicitly granted access (this tab) can view. Creator has full control." },
            { icon:"⛓",  title:"On-Chain Proof",    desc:"Access grants and visit logs are anchored on Stellar via TX memos — immutable audit trail." },
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#0A1628" }}>{item.title}</div>
                <div style={{ fontSize:12, color:"#6B7A8D", lineHeight:1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditTab({ patientId }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(()=>{
    api.getAudit(patientId)
      .then(d=>setLogs(d.logs||[]))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  }, [patientId]);

  const ACTION_COLORS = {
    "VIEW_RECORD":"#00B4D8","CREATE_PATIENT":"#00C48C","ADD_VITALS":"#8338EC",
    "LOG_VISIT":"#F4A261","GRANT_ACCESS":"#3E8EFF","DELETE_PATIENT":"#E63946",
  };

  if (loading) return <div style={{ textAlign:"center", padding:40, display:"flex", justifyContent:"center", gap:10, color:"#6B7A8D" }}><Spinner/>Loading audit trail…</div>;
  if (error)   return <Alert type="error">{error}</Alert>;

  return (
    <div className="fade-up">
      <Card>
        <SectionHead color="#3E8EFF">Audit Trail ({logs.length} events)</SectionHead>
        {logs.length===0 ? (
          <div style={{ textAlign:"center", padding:"30px", color:"#6B7A8D", fontSize:13 }}>No audit events yet.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {logs.map((log,i)=>(
              <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start",
                padding:"10px 14px", background:"#F8FAFC", borderRadius:8,
                borderLeft:`3px solid ${ACTION_COLORS[log.action]||"#D1DCE8"}` }}>
                <div style={{ flexShrink:0, minWidth:140 }}>
                  <Badge color={ACTION_COLORS[log.action]||"#6B7A8D"} style={{ fontSize:10 }}>{log.action}</Badge>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0A1628" }}>{log.actorName || shortKey(log.actorKey)}</div>
                  {log.details && <div style={{ fontSize:11, color:"#6B7A8D", marginTop:2 }}>{log.details}</div>}
                </div>
                <div style={{ fontSize:10, color:"#6B7A8D", whiteSpace:"nowrap", flexShrink:0 }}>
                  {new Date(log.timestamp).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main PatientDetail page ────────────────────────────────────────────────────
export default function PatientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("overview");

  useEffect(()=>{
    api.getPatient(id)
      .then(d=>setPatient(d.patient))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  }, [id]);

  const TABS = [
    { id:"overview", label:"Overview"   },
    { id:"vitals",   label:"Vitals"     },
    { id:"visits",   label:"Visits"     },
    { id:"access",   label:"Access"     },
    { id:"audit",    label:"Audit Trail"},
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:"#6B7A8D" }}>
      <Spinner size={20}/> Loading patient record…
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <div style={{ fontWeight:700, fontSize:18, color:"#0A1628" }}>Access Denied</div>
      <Alert type="error" style={{ maxWidth:400 }}>{error}</Alert>
      <p style={{ fontSize:12, color:"#6B7A8D", textAlign:"center", maxWidth:360, lineHeight:1.7 }}>
        This record requires a Stellar token to access. Make sure your account holds ≥10 XLM on testnet, then try again.
      </p>
      <Link to="/dashboard"><Btn variant="navy">← Back to Dashboard</Btn></Link>
    </div>
  );

  const bloodColor = BLOOD_COLORS[patient.bloodGroup] || "#6B7A8D";

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .fade-up{animation:fadeUp .3s ease both} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px} .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}`}</style>

      {/* Topbar */}
      <header style={{ background:"#0A1628", borderBottom:"1px solid #132040", padding:"0 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <Link to="/dashboard" style={{ color:"#4A6A8A", fontSize:13, display:"flex", alignItems:"center", gap:5 }}>
            ← Dashboard
          </Link>
          <span style={{ color:"#1E3058" }}>|</span>
          <span style={{ color:"#fff", fontWeight:600, fontSize:14 }}>{patient.name}</span>
          <span style={{ fontFamily:"IBM Plex Mono", fontSize:11, color:"#00B4D8" }}>{patient.patientId}</span>
        </div>
        <div style={{ background:"#0D2A10", border:"1px solid #00C48C44", color:"#00C48C", borderRadius:20, padding:"4px 10px", fontSize:9 }}>● TESTNET</div>
      </header>

      {/* Hero banner */}
      <div style={{ background:"linear-gradient(135deg,#0A1628 0%,#132040 100%)", padding:"24px 28px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {/* Blood group badge */}
            <div style={{ width:60, height:60, background:bloodColor, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", fontFamily:"IBM Plex Mono", flexShrink:0 }}>
              {patient.bloodGroup}
            </div>
            <div>
              <h1 style={{ fontWeight:800, fontSize:22, color:"#fff", marginBottom:4 }}>{patient.name}</h1>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {patient.dob && <span style={{ fontSize:11, color:"#4A6A8A" }}>DOB: {patient.dob}</span>}
                {patient.contact && <span style={{ fontSize:11, color:"#4A6A8A" }}>📞 {patient.contact}</span>}
                <Badge color={patient.accessLevel==="public"?"#00C48C":patient.accessLevel==="restricted"?"#F4A261":"#E63946"}>
                  {patient.accessLevel==="public"?"🌐 Public":patient.accessLevel==="restricted"?"🔒 Restricted":"🔐 Private"}
                </Badge>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#00B4D8", fontFamily:"IBM Plex Mono" }}>{patient.vitals?.length||0}</div>
              <div style={{ fontSize:10, color:"#4A6A8A", letterSpacing:"0.08em" }}>VITALS</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#8338EC", fontFamily:"IBM Plex Mono" }}>{patient.visits?.length||0}</div>
              <div style={{ fontSize:10, color:"#4A6A8A", letterSpacing:"0.08em" }}>VISITS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid #D1DCE8", padding:"0 28px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", gap:2 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"14px 18px", fontSize:13, fontWeight:600,
              background:"transparent", border:"none",
              borderBottom:`3px solid ${tab===t.id?"#00B4D8":"transparent"}`,
              color: tab===t.id?"#00B4D8":"#6B7A8D",
              cursor:"pointer", transition:"all .15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>
        {/* Overview */}
        {tab==="overview" && (
          <div className="fade-up">
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
              <div>
                {/* Conditions */}
                <Card style={{ marginBottom:16 }}>
                  <SectionHead color="#E63946">Conditions</SectionHead>
                  {patient.conditions?.length ? (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {patient.conditions.map((c,i)=><Tag key={i} color="#E63946">{c}</Tag>)}
                    </div>
                  ) : <p style={{ fontSize:12, color:"#6B7A8D" }}>No conditions recorded.</p>}
                </Card>
                {/* Allergies */}
                <Card style={{ marginBottom:16 }}>
                  <SectionHead color="#F4A261">Allergies</SectionHead>
                  {patient.allergies?.length ? (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {patient.allergies.map((a,i)=><Tag key={i} color="#F4A261">{a}</Tag>)}
                    </div>
                  ) : <p style={{ fontSize:12, color:"#6B7A8D" }}>No allergies recorded.</p>}
                </Card>
                {/* Medications */}
                {patient.medications?.length > 0 && (
                  <Card>
                    <SectionHead color="#8338EC">Medications</SectionHead>
                    {patient.medications.map((m,i)=>(
                      <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid #F0F4F8" }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div>
                        <div style={{ fontSize:12, color:"#6B7A8D" }}>{m.dosage} · {m.frequency}</div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>

              {/* Right panel */}
              <div>
                {/* Latest vitals */}
                {patient.vitals?.length > 0 && (
                  <Card style={{ marginBottom:16 }}>
                    <SectionHead color="#00B4D8">Latest Vitals</SectionHead>
                    {(() => {
                      const v = patient.vitals[patient.vitals.length-1];
                      return (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {[
                            { label:"Blood Pressure", val:v.bp||"—", unit:"mmHg", warn:v.bp&&parseInt(v.bp)>140 },
                            { label:"Pulse",          val:v.pulse||"—", unit:"bpm" },
                            { label:"Temperature",    val:v.temp||"—", unit:"°C" },
                            { label:"SpO2",           val:v.spo2||"—", unit:"%", warn:v.spo2&&v.spo2<95 },
                            { label:"Weight",         val:v.weight||"—", unit:"kg" },
                          ].map((row,i)=>(
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                              padding:"6px 0", borderBottom:"1px solid #F0F4F8" }}>
                              <span style={{ fontSize:12, color:"#6B7A8D" }}>{row.label}</span>
                              <span style={{ fontSize:13, fontWeight:700, color:row.warn?"#E63946":"#0A1628", fontFamily:"IBM Plex Mono" }}>
                                {row.val} <span style={{ fontSize:10, fontWeight:400, color:"#6B7A8D" }}>{row.unit}</span>
                              </span>
                            </div>
                          ))}
                          <div style={{ fontSize:10, color:"#6B7A8D", marginTop:4 }}>Recorded: {v.date} by {v.recordedBy}</div>
                        </div>
                      );
                    })()}
                  </Card>
                )}

                {/* Stellar info */}
                <Card style={{ background:"linear-gradient(135deg,#E8F4FF,#F0F8FF)", border:"1px solid #3E8EFF22" }}>
                  <SectionHead color="#3E8EFF">On-Chain Identity</SectionHead>
                  <div style={{ fontSize:11, color:"#6B7A8D", marginBottom:6 }}>Patient Stellar Address</div>
                  <div style={{ fontSize:10, color:"#3E8EFF", fontFamily:"IBM Plex Mono", wordBreak:"break-all",
                    background:"#fff", padding:"8px 10px", borderRadius:6, border:"1px solid #3E8EFF22" }}>
                    {patient.stellarKey || "Not linked"}
                  </div>
                  <div style={{ fontSize:11, color:"#6B7A8D", marginTop:12, marginBottom:6 }}>Created By</div>
                  <div style={{ fontSize:10, color:"#3E8EFF", fontFamily:"IBM Plex Mono" }}>{shortKey(patient.createdBy)}</div>
                  <div style={{ fontSize:11, color:"#6B7A8D", marginTop:10, lineHeight:1.6 }}>
                    All record access events are logged in the Audit Trail tab and anchored on Stellar.
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {tab==="vitals"   && <VitalsTab patientId={id} vitals={patient.vitals||[]} />}
        {tab==="visits"   && <VisitsTab patientId={id} visits={patient.visits||[]} />}
        {tab==="access"   && <AccessTab patientId={id} />}
        {tab==="audit"    && <AuditTab  patientId={id} />}
      </div>
    </div>
  );
}
