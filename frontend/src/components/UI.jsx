// src/components/UI.jsx — shared design system components

const T = {
  teal:"#00B4D8", navy:"#0A1628", green:"#00C48C", red:"#E63946",
  amber:"#F4A261", border:"#D1DCE8", muted:"#6B7A8D", text:"#0A1628",
  bg:"#F0F4F8", surface:"#FFFFFF", stellar:"#3E8EFF",
};

export const Spinner = ({ size=16, color=T.teal }) => (
  <div style={{ width:size, height:size, border:`2px solid #D1DCE8`,
    borderTopColor:color, borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
);

export const Badge = ({ children, color=T.teal, style={} }) => (
  <span style={{ background:color+"18", color, border:`1px solid ${color}33`,
    borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600,
    letterSpacing:"0.04em", whiteSpace:"nowrap", ...style }}>
    {children}
  </span>
);

export const Tag = ({ children, color=T.teal }) => (
  <span style={{ background:color+"14", color, border:`1px solid ${color}28`,
    borderRadius:20, padding:"2px 10px", fontSize:11, display:"inline-block" }}>
    {children}
  </span>
);

export const Card = ({ children, style={}, className="" }) => (
  <div className={className} style={{ background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(10,22,40,.06)", ...style }}>
    {children}
  </div>
);

export const Inp = ({ label, style={}, inputStyle={}, error, ...p }) => (
  <div style={style}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.muted, display:"block",
      marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</label>}
    <input style={{ width:"100%", background:T.bg, border:`1.5px solid ${error?T.red:T.border}`,
      borderRadius:8, padding:"10px 12px", fontSize:13, color:T.text, outline:"none",
      transition:"border .15s", ...inputStyle }}
      onFocus={e=>!error&&(e.target.style.borderColor=T.teal)}
      onBlur={e=>!error&&(e.target.style.borderColor=T.border)} {...p} />
    {error && <div style={{ fontSize:11, color:T.red, marginTop:4 }}>{error}</div>}
  </div>
);

export const Sel = ({ label, children, style={}, ...p }) => (
  <div style={style}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.muted, display:"block",
      marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</label>}
    <select style={{ width:"100%", background:T.bg, border:`1.5px solid ${T.border}`,
      borderRadius:8, padding:"10px 12px", fontSize:13, color:T.text, outline:"none" }} {...p}>
      {children}
    </select>
  </div>
);

export const Btn = ({ children, variant="primary", color, style={}, ...p }) => {
  const variants = {
    primary:  { bg:T.teal,    text:"#fff", border:T.teal },
    navy:     { bg:T.navy,    text:"#fff", border:T.navy },
    outline:  { bg:"transparent", text:T.teal, border:T.teal },
    danger:   { bg:T.red,     text:"#fff", border:T.red },
    ghost:    { bg:"transparent", text:T.muted, border:T.border },
    green:    { bg:T.green,   text:"#fff", border:T.green },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button style={{ background:v.bg, color:v.text, border:`1.5px solid ${v.border}`,
      borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600,
      display:"flex", alignItems:"center", gap:7, whiteSpace:"nowrap", ...style }} {...p}>
      {children}
    </button>
  );
};

export const Alert = ({ type="info", children, style={} }) => {
  const map = {
    info:    [T.teal,  "#E0F7FC"],
    success: [T.green, "#E0FAF3"],
    error:   [T.red,   "#FEE8EA"],
    warn:    [T.amber, "#FEF3E2"],
  };
  const [col, bg] = map[type] || map.info;
  return (
    <div style={{ background:bg, border:`1px solid ${col}44`, color:col,
      borderRadius:8, padding:"10px 14px", fontSize:12, display:"flex",
      gap:8, alignItems:"flex-start", lineHeight:1.6, ...style }}>
      <span style={{flexShrink:0}}>{type==="success"?"✓":type==="error"?"✗":type==="warn"?"⚠":"ℹ"}</span>
      <span>{children}</span>
    </div>
  );
};

export const Stat = ({ label, value, color=T.teal, icon }) => (
  <Card style={{ textAlign:"center", padding:"18px 14px" }}>
    {icon && <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>}
    <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1, fontFamily:"IBM Plex Mono,monospace" }}>{value}</div>
    <div style={{ fontSize:11, color:T.muted, marginTop:5, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</div>
  </Card>
);

export const SectionHead = ({ children, action, color=T.teal }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:3, height:16, background:color, borderRadius:2 }} />
      <span style={{ fontSize:13, fontWeight:700, letterSpacing:"0.06em",
        textTransform:"uppercase", color:"#0A1628" }}>{children}</span>
    </div>
    {action}
  </div>
);

export const TokenGate = ({ tokenOk }) => {
  if (!tokenOk) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
      background: tokenOk.allowed ? "#E0FAF3" : "#FEE8EA",
      border:`1px solid ${tokenOk.allowed?"#00C48C44":"#E6394444"}`,
      borderRadius:8, fontSize:12 }}>
      <div style={{ width:8, height:8, borderRadius:"50%",
        background: tokenOk.allowed ? T.green : T.red,
        animation: tokenOk.allowed ? "pulse 2s infinite" : "none" }} />
      <span style={{ color: tokenOk.allowed ? T.green : T.red, fontWeight:600 }}>
        {tokenOk.allowed ? "Token Gate: UNLOCKED" : "Token Gate: LOCKED"}
      </span>
      <span style={{ color:T.muted }}>— {tokenOk.reason}</span>
    </div>
  );
};

export const shortKey = k => k ? `${k.slice(0,6)}…${k.slice(-4)}` : "—";
