import { useState, useEffect, useMemo } from "react";

const SUPA_URL = "https://oltwaosdzgvbbvermilk.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHdhb3Nkemd2YmJ2ZXJtaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDU3MjksImV4cCI6MjA5NDEyMTcyOX0.WbDR65w6eywTgLc4Lwii_63RrJwKPN9oj1DsgjxeFBo";
const SBH = { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` };
const SBH_W = { ...SBH, "Content-Type": "application/json", "Prefer": "return=representation" };

async function fetchMes(mes) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?mes=eq.${mes}&excluido=eq.false&order=data.desc`, { headers: SBH });
    return r.ok ? r.json() : [];
  } catch { return []; }
}
async function fetchUltimos(clienteId) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?cliente_id=eq.${clienteId}&excluido=eq.false&order=data.desc&limit=1`, { headers: SBH });
    return r.ok ? r.json() : [];
  } catch { return []; }
}
async function sbPost(b) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos`, { method: "POST", headers: SBH_W, body: JSON.stringify(b) });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
async function sbPatch(id, b) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?id=eq.${id}`, { method: "PATCH", headers: { ...SBH_W, "Prefer": "return=minimal" }, body: JSON.stringify(b) });
    return r.ok;
  } catch { return false; }
}

const P = {
  blue: "#4F86C6", blueL: "rgba(79,134,198,0.10)", bluePale: "#EAF1FA",
  orange: "#E8854E", orangeL: "rgba(232,133,78,0.10)", orangePale: "#FEF0E6",
  green: "#4DAF85", greenL: "rgba(77,175,133,0.10)", greenPale: "#E6F5EF",
  purple: "#8B78D0", red: "#D95F5F", redL: "rgba(217,95,95,0.10)",
  text: "#1E2D3D", muted: "#7A9BB5",
  border: "rgba(120,160,200,0.16)",
  bg: "#F2F6FA", glass: "rgba(255,255,255,0.82)",
  shadow: "0 4px 24px rgba(60,100,150,0.09)",
};

const CAT_COR = {
  "Funcionário": P.orange, "Infraestrutura": P.blue, "Administrativo": P.green,
  "Insumos": P.purple, "Investimento": "#F0A050", "Outros": P.muted,
  "Compromissos Financeiros": P.orange, "Moradia": P.blue, "Transporte": P.green,
  "Alimentação": P.purple, "Reserva": "#8BC4A0", "Salários": P.blue,
  "Mensalidades": P.green, "Material Didático": P.purple,
  "Marketing": "#E882B4", "Lazer": "#7BC8A4", "Serviços": "#16A085",
};

const CATS_EMP_PICO  = ["Administrativo","Funcionário","Infraestrutura","Insumos","Investimento","Marketing","Outros"];
const CATS_PES_PICO  = ["Alimentação","Compromissos Financeiros","Lazer","Moradia","Reserva","Transporte","Outros"];
const CATS_EMP_CRIAR = ["Administrativo","Alimentação","Infraestrutura","Material Didático","Mensalidades","Salários","Serviços","Transporte"];
const MEIOS          = ["Crédito","Débito","Dinheiro","Pix","Transferência"];

const NOMES_MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function gerarMeses() {
  const arr = [];
  const labels = {};
  const hj = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(hj.getFullYear(), hj.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    arr.push(key);
    labels[key] = `${NOMES_MES[d.getMonth()]} ${d.getFullYear()}`;
  }
  return { arr, labels, idxAtual: 3 };
}
const { arr: MESES_DISP, labels: MESES_LABEL, idxAtual: IDX_ATUAL } = gerarMeses();

const CLIENTES = [
  { id: "pico",  nome: "Pico Barber Shop",         seg: "Barbearia", hasPessoal: true,  cor: P.orange, corL: P.orangeL, corT: "#B85C20", corPale: P.orangePale, catsEmp: CATS_EMP_PICO,  catsPes: CATS_PES_PICO  },
  { id: "criar", nome: "CRIAR Centro Educacional",  seg: "Educação",  hasPessoal: false, cor: P.blue,   corL: P.blueL,   corT: "#2558A0", corPale: P.bluePale,   catsEmp: CATS_EMP_CRIAR, catsPes: [] },
];

const fmt  = v  => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";
const ag   = list => { const m = {}; list.forEach(l => { m[l.categoria] = (m[l.categoria] || 0) + l.valor; }); return Object.entries(m).map(([cat, val]) => ({ cat, val, cor: CAT_COR[cat] || P.muted })).sort((a, b) => b.val - a.val); };
const uid  = () => crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();
const fd   = d  => { const [, m, day] = d.split("-"); return `${day}/${m}`; };

// Dias sem lançar
const diasSemLancar = (ultimaData) => {
  if (!ultimaData) return 999;
  const hoje = new Date();
  const ult = new Date(ultimaData);
  return Math.floor((hoje - ult) / (1000 * 60 * 60 * 24));
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${P.bg}; font-family: 'Sora', sans-serif; color: ${P.text}; }
body::before { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse 60% 40% at 90% 2%, rgba(79,134,198,.13) 0%, transparent 60%),
    radial-gradient(ellipse 45% 35% at 2% 95%, rgba(77,175,133,.10) 0%, transparent 60%); }
.lift { transition: all .22s cubic-bezier(.4,0,.2,1); cursor: pointer; }
.lift:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(60,100,150,.13) !important; }
.glass { background: ${P.glass}; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid ${P.border}; }
.spin { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(79,134,198,.2); border-top-color: ${P.blue}; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fu { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.fu { animation: fu .28s ease forwards; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
.pulse { animation: pulse 2s ease-in-out infinite; }
@keyframes alertPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.alert-pulse { animation: alertPulse 1.5s ease-in-out infinite; }
.inp { width: 100%; border: 1.5px solid ${P.border}; border-radius: 10px; padding: 11px 13px; font-size: 14px; font-family: 'Sora', sans-serif; background: rgba(255,255,255,.9); color: ${P.text}; outline: none; transition: border .18s; -webkit-appearance: none; appearance: none; }
.inp:focus { border-color: ${P.blue}; box-shadow: 0 0 0 3px rgba(79,134,198,.10); }
.seg { cursor: pointer; border-radius: 20px; border: 1.5px solid ${P.border}; padding: 7px 13px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 10px; letter-spacing: .05em; text-align: center; transition: all .18s; background: rgba(255,255,255,.82); color: ${P.muted}; }
.seg.on { color: #fff; box-shadow: 0 2px 10px rgba(60,100,150,.2); }
.overlay { position: fixed; inset: 0; background: rgba(30,45,61,.5); z-index: 200; display: flex; align-items: flex-end; backdrop-filter: blur(3px); }
.sheet { background: #fff; border-radius: 20px 20px 0 0; padding: 8px 20px 48px; width: 100%; max-width: 480px; margin: 0 auto; max-height: 92vh; overflow-y: auto; animation: up .26s cubic-bezier(.32,.72,0,1); }
@keyframes up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.handle { width: 36px; height: 4px; background: #E8EDF5; border-radius: 2px; margin: 12px auto 20px; }
.btn { width: 100%; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-family: 'Sora', sans-serif; font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-main { color: #fff; } .btn-main:hover { opacity: .9; } .btn-main:disabled { opacity: .5; cursor: not-allowed; }
.btn-ghost { background: none; border: 1.5px solid ${P.border}; color: ${P.muted}; margin-top: 10px; }
.btn-ghost:hover { border-color: ${P.blue}; color: ${P.blue}; }
.search-inp { width: 100%; border: 1.5px solid ${P.border}; border-radius: 10px; padding: 10px 14px 10px 36px; font-size: 13px; font-family: 'Sora', sans-serif; background: rgba(255,255,255,.9); color: ${P.text}; outline: none; transition: border .18s; }
.search-inp:focus { border-color: ${P.blue}; }
::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(79,134,198,.22); border-radius: 2px; }
`;

function Bar({ p, color, h = 5 }) {
  return (
    <div style={{ background: "rgba(120,160,200,.12)", borderRadius: 4, height: h, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(Math.max(p, 0), 100)}%`, background: color, height: "100%", borderRadius: 4, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Donut({ segs, size = 96 }) {
  const r = 28, cx = 45, cy = 45, circ = 2 * Math.PI * r;
  const total = segs.reduce((s, sg) => s + sg.val, 0);
  let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(120,160,200,.12)" strokeWidth="10" />
      {segs.map((sg, i) => {
        const len = total > 0 ? (sg.val / total) * circ : 0;
        const s = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sg.cor} strokeWidth="10"
          strokeDasharray={`${Math.max(len - 1.5, 0)} ${circ}`} strokeDashoffset={-off}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />;
        off += len; return s;
      })}
    </svg>
  );
}

function Logo({ id, size = 42 }) {
  if (id === "pico") return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill={P.orangePale} />
      <g transform="translate(18,10)">
        <circle cx="8" cy="8" r="3" fill="none" stroke={P.orange} strokeWidth="2" />
        <circle cx="32" cy="4" r="3" fill="none" stroke={P.orange} strokeWidth="2" />
        <circle cx="56" cy="8" r="3" fill="none" stroke={P.orange} strokeWidth="2" />
        <polyline points="8,8 18,26 32,16 46,26 56,8 52,32 12,32" fill="none" stroke={P.orange} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        <line x1="12" y1="32" x2="52" y2="32" stroke={P.orange} strokeWidth="2.2" />
      </g>
      <g transform="translate(12,42)">
        <rect x="0" y="0" width="76" height="28" rx="3" fill="none" stroke={P.orange} strokeWidth="2.5" />
        <text x="4" y="22" fontFamily="Arial Black,sans-serif" fontSize="22" fontWeight="900" fill={P.orange} letterSpacing="2">PICO</text>
      </g>
      <text x="38" y="88" fontFamily="Georgia,serif" fontSize="11" fill={P.orange} fontStyle="italic" textAnchor="middle">barbershop</text>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill={P.bluePale} />
      {[{ c: P.blue, r: 0 }, { c: P.orange, r: -72 }, { c: P.green, r: 72 }, { c: P.purple, r: -144 }, { c: "#E882B4", r: 144 }].map(({ c, r }, i) => (
        <g key={i} transform={`rotate(${r} 50 50)`}>
          <ellipse cx="50" cy="24" rx="9" ry="13" fill={c} opacity=".85" />
          <ellipse cx="47" cy="13" rx="2" ry="5" fill={c} />
          <ellipse cx="51" cy="12" rx="2" ry="5" fill={c} />
          <ellipse cx="55" cy="13" rx="2" ry="5" fill={c} />
        </g>
      ))}
      <text x="50" y="53" textAnchor="middle" fontFamily="sans-serif" fontSize="8.5" fontWeight="900" fill={P.blue} letterSpacing="2">CRIAR</text>
    </svg>
  );
}

// ─── FORM LANÇAMENTO ─────────────────────────────────────────────────────────────
function FormLancamento({ c, mes, onSaved, onClose }) {
  const [cls, setCls]   = useState("empresa");
  const [cat, setCat]   = useState("");
  const [desc, setDesc] = useState("");
  const [val, setVal]   = useState("");
  const [meio, setMeio] = useState("Pix");
  const [data, setData] = useState(mes + "-" + new Date().toISOString().slice(8, 10));
  const [obs, setObs]   = useState("");
  const [err, setErr]   = useState({});
  const [busy, setBusy] = useState(false);

  const cats = cls === "empresa" ? c.catsEmp : c.catsPes;
  const set = (k, v) => {
    if (k === "cls") { setCls(v); setCat(""); }
    else if (k === "cat") setCat(v); else if (k === "desc") setDesc(v);
    else if (k === "val") setVal(v); else if (k === "meio") setMeio(v);
    else if (k === "data") setData(v); else setObs(v);
    setErr(e => ({ ...e, [k]: false }));
  };

  const salvar = async () => {
    const e = {};
    if (!cat) e.cat = true;
    if (!desc.trim()) e.desc = true;
    const v = parseFloat(val.replace(",", "."));
    if (!v || v <= 0) e.val = true;
    if (!data) e.data = true;
    if (Object.keys(e).length) { setErr(e); return; }
    setBusy(true);
    const item = { id: uid(), cliente_id: c.id, mes: data.slice(0, 7), centro: cls, categoria: cat, descricao: desc.trim(), valor: v, meio, data, obs, excluido: false, recorrente: false, motivo_exclusao: "" };
    const res = await sbPost(item);
    setBusy(false);
    if (res) { onSaved(); onClose(); }
    else setErr({ geral: "Erro ao salvar." });
  };

  const LBL = { fontSize: 10, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 7 };
  const E = ({ k }) => err[k] ? <div style={{ fontSize: 11, color: P.red, marginTop: 4, fontWeight: 600 }}>Obrigatório</div> : null;

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Logo id={c.id} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>Novo lançamento</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.nome}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: P.muted, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        {err.geral && <div style={{ background: P.redL, border: `1px solid ${P.red}33`, borderRadius: 8, padding: "10px 13px", fontSize: 12, color: P.red, marginBottom: 14, fontWeight: 600 }}>{err.geral}</div>}
        {c.hasPessoal && (
          <div style={{ marginBottom: 16 }}>
            <span style={LBL}>Tipo *</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[["empresa", "🏢 Empresa"], ["pessoal", "👤 Pessoal"]].map(([v, l]) => (
                <div key={v} className={`seg${cls === v ? " on" : ""}`} style={cls === v ? { background: c.cor, borderColor: c.cor } : {}} onClick={() => set("cls", v)}>{l}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={LBL}>Categoria *</label>
          <select className={`inp${err.cat ? " inp-err" : ""}`} value={cat} onChange={e => set("cat", e.target.value)}>
            <option value="">Selecione…</option>
            {cats.map(ct => <option key={ct}>{ct}</option>)}
          </select><E k="cat" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={LBL}>Descrição *</label>
          <input className="inp" placeholder="Ex: Aluguel, Salário Lucas…" value={desc} onChange={e => set("desc", e.target.value)} /><E k="desc" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={LBL}>Valor (R$) *</label>
          <input className="inp" type="number" inputMode="decimal" placeholder="0,00" value={val} onChange={e => set("val", e.target.value)} /><E k="val" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={LBL}>Meio</label>
            <select className="inp" value={meio} onChange={e => set("meio", e.target.value)}>
              {MEIOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Data *</label>
            <input className="inp" type="date" value={data} onChange={e => set("data", e.target.value)} /><E k="data" />
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={LBL}>Observação</label>
          <textarea className="inp" style={{ minHeight: 56, resize: "none", fontSize: 13 }} placeholder="Opcional…" value={obs} onChange={e => set("obs", e.target.value)} />
        </div>
        <button className="btn btn-main" style={{ background: c.cor }} onClick={salvar} disabled={busy}>
          {busy ? <><span className="spin" /> Salvando…</> : "✓ Registrar Lançamento"}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── EDITAR LANÇAMENTO ───────────────────────────────────────────────────────────
function EditarLancamento({ c, item, onDone, onClose }) {
  const [cls, setCls]   = useState(item.centro || "empresa");
  const [cat, setCat]   = useState(item.categoria);
  const [desc, setDesc] = useState(item.descricao);
  const [val, setVal]   = useState(String(item.valor));
  const [meio, setMeio] = useState(item.meio);
  const [data, setData] = useState(item.data);
  const [obs, setObs]   = useState(item.obs || "");
  const [busy, setBusy] = useState(false);
  const [delMode, setDelMode] = useState(false);
  const [motivo, setMotivo]   = useState("");
  const [mErr, setMErr]       = useState(false);

  const cats = cls === "empresa" ? c.catsEmp : c.catsPes;
  const LBL = { fontSize: 10, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 7 };

  const salvar = async () => {
    const v = parseFloat(val.replace(",", "."));
    if (!cat || !desc.trim() || !v || v <= 0 || !data) return;
    setBusy(true);
    await sbPatch(item.id, { centro: cls, categoria: cat, descricao: desc.trim(), valor: v, meio, data, mes: data.slice(0, 7), obs });
    setBusy(false);
    onDone(); onClose();
  };

  const excluir = async () => {
    if (!motivo.trim()) { setMErr(true); return; }
    setBusy(true);
    await sbPatch(item.id, { excluido: true, motivo_exclusao: motivo.trim() });
    setBusy(false);
    onDone(); onClose();
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="handle" />
        {!delMode ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Logo id={c.id} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>Editar lançamento</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{c.nome}</div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: P.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            {c.hasPessoal && (
              <div style={{ marginBottom: 16 }}>
                <span style={LBL}>Tipo</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["empresa", "🏢 Empresa"], ["pessoal", "👤 Pessoal"]].map(([v, l]) => (
                    <div key={v} className={`seg${cls === v ? " on" : ""}`} style={cls === v ? { background: c.cor, borderColor: c.cor } : {}} onClick={() => { setCls(v); setCat(""); }}>{l}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Categoria</label>
              <select className="inp" value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">Selecione…</option>
                {cats.map(ct => <option key={ct}>{ct}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Descrição</label>
              <input className="inp" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Valor (R$)</label>
              <input className="inp" type="number" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={LBL}>Meio</label>
                <select className="inp" value={meio} onChange={e => setMeio(e.target.value)}>
                  {MEIOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Data</label>
                <input className="inp" type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={LBL}>Observação</label>
              <textarea className="inp" style={{ minHeight: 56, resize: "none", fontSize: 13 }} value={obs} onChange={e => setObs(e.target.value)} />
            </div>
            <button className="btn btn-main" style={{ background: c.cor }} onClick={salvar} disabled={busy}>
              {busy ? <><span className="spin" /> Salvando…</> : "✓ Salvar Alterações"}
            </button>
            <button className="btn" style={{ background: "none", border: `1.5px solid ${P.red}`, color: P.red, marginTop: 10 }} onClick={() => setDelMode(true)}>
              Excluir Lançamento
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: P.red, marginBottom: 6 }}>Excluir Lançamento</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.descricao}</div>
            <div style={{ fontSize: 13, color: P.muted, marginBottom: 18 }}>{fmt(item.valor)} · {fd(item.data)}</div>
            <div style={{ background: P.redL, border: `1px solid ${P.red}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: P.red, fontWeight: 600 }}>
              O valor será excluído da soma total.
            </div>
            <label style={LBL}>Motivo *</label>
            <textarea className="inp" style={{ minHeight: 76, resize: "none", borderColor: mErr ? P.red : undefined }}
              placeholder="Descreva o motivo…" value={motivo}
              onChange={e => { setMotivo(e.target.value); setMErr(false); }} />
            {mErr && <div style={{ fontSize: 11, color: P.red, marginTop: 4, fontWeight: 600 }}>Informe o motivo</div>}
            <div style={{ height: 16 }} />
            <button className="btn" style={{ background: P.red, color: "#fff" }} onClick={excluir} disabled={busy}>
              {busy ? <><span className="spin" /> Excluindo…</> : "Confirmar Exclusão"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDelMode(false)}>Voltar</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────────
function Dashboard({ c, lancs, lancsAnt }) {
  const emp = lancs.filter(l => l.centro === "empresa");
  const pes = lancs.filter(l => l.centro === "pessoal");
  const totE = emp.reduce((s, l) => s + l.valor, 0);
  const totP = pes.reduce((s, l) => s + l.valor, 0);
  const total = totE + totP;
  const totAnt = lancsAnt.reduce((s, l) => s + l.valor, 0);
  const diff = totAnt > 0 ? ((total - totAnt) / totAnt * 100) : null;
  const cats = ag(lancs).slice(0, 5);
  const donut = ag(lancs).slice(0, 6);

  if (total === 0) return (
    <div className="fu glass" style={{ borderRadius: 14, padding: "36px", textAlign: "center", marginTop: 8 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>Nenhum lançamento neste mês</div>
    </div>
  );

  return (
    <div className="fu">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { l: "Total Geral", v: fmt(total), sub: `${lancs.length} lançamentos`, cor: c.cor },
          { l: "vs Mês Anterior", v: diff != null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%` : "—", sub: diff != null ? (diff < 0 ? "↓ reduziu" : "↑ aumentou") : "sem comparativo", cor: diff != null ? (diff < 0 ? P.green : P.red) : P.muted },
          { l: "Empresa", v: fmt(totE), sub: `${pct(totE, total)}% do total`, cor: c.cor },
          ...(totP > 0 ? [{ l: "Pessoal", v: fmt(totP), sub: `${pct(totP, total)}% do total`, cor: P.muted }] : []),
        ].map((k, i) => (
          <div key={i} className="glass" style={{ borderRadius: 14, padding: "14px" }}>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{k.l}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: k.cor, fontFamily: "'DM Serif Display',serif", lineHeight: 1.1 }}>{k.v}</div>
            <div style={{ fontSize: 10, color: P.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ borderRadius: 16, padding: "18px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Distribuição por Categoria</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ flexShrink: 0, position: "relative" }}>
            <Donut segs={donut} size={90} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 8, color: P.muted, fontWeight: 600, textTransform: "uppercase" }}>total</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: P.text, fontFamily: "'DM Serif Display',serif", textAlign: "center", lineHeight: 1.2, maxWidth: 52 }}>{fmt(total)}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {cats.map(({ cat, val, cor }) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>{cat}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{pct(val, total)}%</span>
                </div>
                <Bar p={total > 0 ? (val / total) * 100 : 0} color={cor} h={4} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {totP > 0 && (
        <div className="glass" style={{ borderRadius: 16, padding: "18px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Empresa × Pessoal</div>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 10 }}>
            <div style={{ flex: totE, background: c.cor, transition: "flex .7s ease" }} />
            <div style={{ flex: totP, background: P.muted, transition: "flex .7s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.cor }} />
              <div><div style={{ fontSize: 12, fontWeight: 700, color: c.corT }}>{fmt(totE)}</div><div style={{ fontSize: 10, color: P.muted }}>Empresa · {pct(totE, total)}%</div></div>
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: P.muted }} />
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(totP)}</div><div style={{ fontSize: 10, color: P.muted }}>Pessoal · {pct(totP, total)}%</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RELATÓRIO ────────────────────────────────────────────────────────────────────
function Relatorio({ c, lancs }) {
  const [ab, setAb] = useState({});
  const tog = k => setAb(p => ({ ...p, [k]: !p[k] }));
  const emp = lancs.filter(l => l.centro === "empresa");
  const pes = lancs.filter(l => l.centro === "pessoal");
  const totE = emp.reduce((s, l) => s + l.valor, 0);
  const totP = pes.reduce((s, l) => s + l.valor, 0);
  const total = totE + totP;

  const Sec = ({ titulo, list, totBase, cor }) => {
    const cats = ag(list);
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${cor}22` }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{titulo}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: cor, fontFamily: "'DM Serif Display',serif" }}>{fmt(totBase)}</div>
        </div>
        {cats.length === 0 && <div style={{ fontSize: 12, color: P.muted, padding: "8px 0" }}>Sem lançamentos.</div>}
        {cats.map(({ cat, val, cor: cc }) => {
          const key = `${titulo}-${cat}`;
          const open = ab[key];
          const itens = list.filter(l => l.categoria === cat).sort((a, b) => b.data.localeCompare(a.data));
          return (
            <div key={cat} className="glass" style={{ borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
              <div onClick={() => tog(key)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, minHeight: 18, background: cc, borderRadius: 2, alignSelf: "stretch" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{fmt(val)}</span>
                  </div>
                  <Bar p={totBase > 0 ? (val / totBase) * 100 : 0} color={cc} h={4} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: P.muted }}>{itens.length} item(ns)</span>
                    <span style={{ fontSize: 10, color: P.muted }}>{pct(val, totBase)}%</span>
                  </div>
                </div>
                <div style={{ color: P.muted, fontSize: 12, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", marginLeft: 4 }}>▾</div>
              </div>
              {open && (
                <div style={{ borderTop: `1px solid ${P.border}`, background: "rgba(245,249,255,.6)" }}>
                  {itens.map((it, i) => (
                    <div key={it.id} style={{ padding: "10px 16px 10px 36px", borderBottom: i < itens.length - 1 ? `1px solid ${P.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{it.descricao}</div>
                        <div style={{ fontSize: 10, color: P.muted, marginTop: 2 }}>{fd(it.data)} · {it.meio}</div>
                        {it.obs && <div style={{ fontSize: 10, color: P.muted, fontStyle: "italic", marginTop: 1 }}>{it.obs}</div>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmt(it.valor)}</div>
                    </div>
                  ))}
                  <div style={{ padding: "9px 16px 9px 36px", background: `${cc}10`, borderTop: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cc, letterSpacing: ".06em", textTransform: "uppercase" }}>Subtotal</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{fmt(val)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fu">
      <div className="glass" style={{ borderRadius: 16, padding: "18px", marginBottom: 18, borderLeft: `4px solid ${c.cor}` }}>
        <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Resumo Executivo</div>
        <div style={{ fontSize: 24, fontWeight: 400, color: c.corT, fontFamily: "'DM Serif Display',serif", marginBottom: 10 }}>{fmt(total)}</div>
        <div style={{ display: "grid", gridTemplateColumns: totP > 0 ? "1fr 1fr" : "1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 3 }}>Empresa</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.corT }}>{fmt(totE)}</div>
            <div style={{ fontSize: 10, color: P.muted }}>{emp.length} lançamentos</div>
          </div>
          {totP > 0 && <div>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 3 }}>Pessoal</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(totP)}</div>
            <div style={{ fontSize: 10, color: P.muted }}>{pes.length} lançamentos</div>
          </div>}
        </div>
      </div>
      <Sec titulo="Empresa" list={emp} totBase={totE} cor={c.cor} />
      {totP > 0 && <Sec titulo="Pessoal" list={pes} totBase={totP} cor={P.muted} />}
    </div>
  );
}

// ─── HISTÓRICO ────────────────────────────────────────────────────────────────────
function Historico({ c, lancs, onRefresh }) {
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca]   = useState("");
  const [editItem, setEditItem] = useState(null);

  const filtrados = useMemo(() => {
    let list = [...lancs].sort((a, b) => b.data.localeCompare(a.data));
    if (filtro === "empresa") list = list.filter(l => l.centro === "empresa");
    if (filtro === "pessoal") list = list.filter(l => l.centro === "pessoal");
    if (busca.trim()) list = list.filter(l => l.descricao.toLowerCase().includes(busca.toLowerCase()) || l.categoria.toLowerCase().includes(busca.toLowerCase()));
    return list;
  }, [lancs, filtro, busca]);

  const total = useMemo(() => filtrados.filter(l => !l.excluido).reduce((s, l) => s + l.valor, 0), [filtrados]);

  return (
    <div className="fu">
      {editItem && <EditarLancamento c={c} item={editItem} onDone={onRefresh} onClose={() => setEditItem(null)} />}

      {/* Filtros */}
      <div className="glass" style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[["todos", "Todos"], ["empresa", "Empresa"], ...(c.hasPessoal ? [["pessoal", "Pessoal"]] : [])].map(([v, l]) => (
            <div key={v} className={`seg${filtro === v ? " on" : ""}`}
              style={filtro === v ? { background: c.cor, borderColor: c.cor } : {}}
              onClick={() => setFiltro(v)}>{l}</div>
          ))}
        </div>

        {/* Busca */}
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="search-inp" placeholder="Buscar por descrição ou categoria…"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Contador */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{filtrados.length} lançamentos</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.corT }}>{fmt(total)}</div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="glass" style={{ borderRadius: 14, padding: "36px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>Nenhum lançamento encontrado</div>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
          {filtrados.map((it, i) => (
            <div key={it.id} style={{
              padding: "12px 16px",
              borderBottom: i < filtrados.length - 1 ? `1px solid ${P.border}` : "none",
              display: "flex", alignItems: "center", gap: 12,
              opacity: it.excluido ? 0.4 : 1,
              background: i % 2 === 0 ? "rgba(255,255,255,0.4)" : "transparent",
            }}>
              <div style={{ width: 3, height: 36, background: it.excluido ? "#DDD" : (CAT_COR[it.categoria] || P.muted), borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: it.excluido ? "line-through" : "none" }}>
                  {it.descricao}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: P.muted }}>{fd(it.data)}</span>
                  <span style={{ fontSize: 10, color: P.muted }}>·</span>
                  <span style={{ fontSize: 10, color: CAT_COR[it.categoria] || P.muted, fontWeight: 600 }}>{it.categoria}</span>
                  <span style={{ fontSize: 10, color: P.muted }}>·</span>
                  <span style={{ fontSize: 10, color: P.muted }}>{it.meio}</span>
                  {it.centro === "pessoal" && (
                    <span style={{ fontSize: 9, background: `${P.muted}18`, color: P.muted, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>PESSOAL</span>
                  )}
                  {it.recorrente && (
                    <span style={{ fontSize: 9, background: `${c.cor}18`, color: c.cor, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>↻ REC</span>
                  )}
                  {it.excluido && it.motivo_exclusao && (
                    <span style={{ fontSize: 9, background: `${P.red}18`, color: P.red, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>Excluído: {it.motivo_exclusao}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: it.excluido ? "#CCC" : P.text }}>
                  {fmt(it.valor)}
                </div>
                {!it.excluido && (
                  <button onClick={() => setEditItem(it)}
                    style={{ background: "none", border: `1px solid ${P.border}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: P.muted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = c.cor}
                    onMouseLeave={e => e.currentTarget.style.color = P.muted}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DETALHE ─────────────────────────────────────────────────────────────────────
function Detalhe({ c, mes, mesAnt, allLancs, onBack, onRefresh }) {
  const lancs    = allLancs.filter(l => l.cliente_id === c.id);
  const lancsAnt = allLancs.filter(l => l.cliente_id === c.id && l.mes === mesAnt);
  const [tab, setTab]   = useState("dashboard");
  const [form, setForm] = useState(false);
  const total = lancs.reduce((s, l) => s + l.valor, 0);

  return (
    <div>
      {form && <FormLancamento c={c} mes={mes} onSaved={() => { onRefresh(); setForm(false); }} onClose={() => setForm(false)} />}

      <div className="glass" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", padding: "14px 20px 0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 4px 18px rgba(60,100,150,.07)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: P.muted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Sora',sans-serif", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Todos os clientes
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, marginBottom: 12 }}>
          <Logo id={c.id} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.nome}</div>
            <div style={{ fontSize: 11, color: P.muted }}>{MESES_LABEL[mes]} · {lancs.length} lançamentos</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: P.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 1 }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.corT, fontFamily: "'DM Serif Display',serif" }}>{fmt(total)}</div>
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${P.border}` }}>
          {[["dashboard", "Dashboard"], ["relatorio", "Relatório"], ["historico", "Histórico"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ flex: 1, padding: "10px 4px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: tab === v ? c.cor : P.muted + "88", borderBottom: tab === v ? `2.5px solid ${c.cor}` : "2.5px solid transparent", border: "none", background: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all .18s" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 20px 80px" }}>
        {tab === "dashboard" && <Dashboard c={c} lancs={lancs} lancsAnt={lancsAnt} />}
        {tab === "relatorio" && <Relatorio c={c} lancs={lancs} />}
        {tab === "historico" && <Historico c={c} lancs={lancs} onRefresh={onRefresh} />}
      </div>

      <button onClick={() => setForm(true)}
        style={{ position: "fixed", bottom: 24, right: 20, background: c.cor, color: "#fff", border: "none", borderRadius: 14, padding: "13px 20px", fontSize: 13, fontWeight: 700, fontFamily: "'Sora',sans-serif", cursor: "pointer", boxShadow: `0 6px 20px ${c.cor}55`, zIndex: 100, display: "flex", alignItems: "center", gap: 8 }}>
        + Novo lançamento
      </button>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────────
function Card({ c, lancs, ultimaData, onClick }) {
  const totE = lancs.filter(l => l.centro === "empresa").reduce((s, l) => s + l.valor, 0);
  const totP = lancs.filter(l => l.centro === "pessoal").reduce((s, l) => s + l.valor, 0);
  const total = totE + totP;
  const dias = diasSemLancar(ultimaData);
  const alerta = dias >= 3;

  return (
    <div className="lift glass" onClick={onClick} style={{ borderRadius: 16, padding: 20, boxShadow: total === 0 ? "none" : P.shadow, position: "relative", border: alerta ? `1.5px solid ${P.red}44` : `1px solid ${P.border}` }}>

      {/* Badge alerta inatividade */}
      {alerta && (
        <div className="alert-pulse" style={{
          position: "absolute", top: -8, right: -8,
          background: P.red, color: "#fff", borderRadius: 20,
          padding: "3px 10px", fontSize: 10, fontWeight: 700,
          boxShadow: `0 2px 8px ${P.red}55`,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          ⚠ {dias === 999 ? "Sem lançamentos" : `${dias}d sem lançar`}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: total === 0 ? 0 : 14 }}>
        <Logo id={c.id} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{c.nome}</div>
          <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
            {c.seg}
            {total > 0 ? ` · ${lancs.length} lançamentos` : ""}
          </div>
          {ultimaData && (
            <div style={{ fontSize: 10, color: alerta ? P.red : P.muted, marginTop: 2, fontWeight: alerta ? 700 : 400 }}>
              {alerta ? `⚠ Último lançamento: ${fd(ultimaData)}` : `Último: ${fd(ultimaData)}`}
            </div>
          )}
        </div>
        {total > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 2 }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.corT, fontFamily: "'DM Serif Display',serif" }}>{fmt(total)}</div>
          </div>
        )}
      </div>

      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: totP > 0 ? "1fr 1fr" : "1fr", gap: 10 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: P.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>Empresa</span>
              <span style={{ fontSize: 11, color: c.corT, fontWeight: 600 }}>{fmt(totE)}</span>
            </div>
            <Bar p={(totE / total) * 100} color={c.cor} />
          </div>
          {totP > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: P.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>Pessoal</span>
                <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{fmt(totP)}</span>
              </div>
              <Bar p={(totP / total) * 100} color={P.muted} />
            </div>
          )}
        </div>
      )}

      {total === 0 && (
        <div style={{ fontSize: 11, color: P.muted, textAlign: "center", padding: "10px 0", opacity: .5 }}>
          Sem lançamentos neste mês
        </div>
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────────
export default function PainelConsultor() {
  const [mesIdx,    setMesIdx]    = useState(IDX_ATUAL);
  const [sel,       setSel]       = useState(null);
  const [lancs,     setLancs]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastSync,  setLastSync]  = useState(null);
  const [novos,     setNovos]     = useState(0);
  const [prevCnt,   setPrevCnt]   = useState(0);
  const [ultimasDatas, setUltimasDatas] = useState({});

  const mes    = MESES_DISP[mesIdx];
  const mesAnt = mesIdx > 0 ? MESES_DISP[mesIdx - 1] : null;

  const carregar = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await fetchMes(mes);
    const arr = data || [];
    setLancs(arr);
    setPrevCnt(prev => {
      if (prev > 0 && arr.length > prev) setNovos(n => n + (arr.length - prev));
      return arr.length;
    });
    setLastSync(new Date());
    if (!silent) setLoading(false);
  };

  const carregarUltimasDatas = async () => {
    const datas = {};
    for (const c of CLIENTES) {
      const res = await fetchUltimos(c.id);
      datas[c.id] = res && res.length > 0 ? res[0].data : null;
    }
    setUltimasDatas(datas);
  };

  useEffect(() => { setSel(null); setLancs([]); setPrevCnt(0); setLoading(true); carregar(); }, [mes]);
  useEffect(() => {
    carregarUltimasDatas();
    const t1 = setInterval(() => carregar(true), 3000);
    const t2 = setInterval(() => carregarUltimasDatas(), 30000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [mes]);

  useEffect(() => {
    if (novos > 0) { const t = setTimeout(() => setNovos(0), 4000); return () => clearTimeout(t); }
  }, [novos]);

  const totalGeral = useMemo(() => lancs.reduce((s, l) => s + l.valor, 0), [lancs]);
  const porCliente = useMemo(() => {
    const m = {};
    CLIENTES.forEach(c => { m[c.id] = lancs.filter(l => l.cliente_id === c.id); });
    return m;
  }, [lancs]);

  const alertas = useMemo(() => CLIENTES.filter(c => diasSemLancar(ultimasDatas[c.id]) >= 3).length, [ultimasDatas]);
  const co = sel ? CLIENTES.find(c => c.id === sel) : null;

  return (
    <div style={{ fontFamily: "'Sora',sans-serif", background: P.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="glass" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 18px rgba(60,100,150,.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 3, fontWeight: 600 }}>Mentoria Financeira</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: P.text, fontFamily: "'DM Serif Display',serif", lineHeight: 1.15 }}>
              gestão fora da <em style={{ color: P.blue }}>caixa</em>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Badge alertas */}
            {alertas > 0 && !sel && (
              <div className="alert-pulse" style={{ background: P.red, color: "#fff", borderRadius: 20, padding: "5px 10px", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                ⚠ {alertas} cliente{alertas > 1 ? "s" : ""} inativo{alertas > 1 ? "s" : ""}
              </div>
            )}
            <div style={{ background: P.blueL, borderRadius: 12, padding: "9px 13px", border: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? <span className="spin" /> : <div style={{ width: 7, height: 7, borderRadius: "50%", background: P.green }} className="pulse" />}
              <div>
                <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 }}>{loading ? "Carregando" : "Ao vivo · 3s"}</div>
                {lastSync && <div style={{ fontSize: 9, color: P.muted, marginTop: 1 }}>{lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(120,160,200,.10)", borderRadius: 12, padding: "6px 10px", border: `1px solid ${P.border}` }}>
          <button onClick={() => setMesIdx(i => Math.max(0, i - 1))} disabled={mesIdx === 0}
            style={{ background: "none", border: "none", cursor: "pointer", color: P.muted, display: "flex", padding: 4, opacity: mesIdx === 0 ? .3 : 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: P.text }}>{MESES_LABEL[mes]}</div>
          <button onClick={() => setMesIdx(i => Math.min(MESES_DISP.length - 1, i + 1))} disabled={mesIdx === MESES_DISP.length - 1}
            style={{ background: "none", border: "none", cursor: "pointer", color: P.muted, display: "flex", padding: 4, opacity: mesIdx === MESES_DISP.length - 1 ? .3 : 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {co ? (
        <Detalhe c={co} mes={mes} mesAnt={mesAnt} allLancs={lancs} onBack={() => setSel(null)} onRefresh={() => carregar(true)} />
      ) : (
        <div style={{ padding: "20px 16px 60px" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "22px 20px", marginBottom: 20, boxShadow: P.shadow }}>
            <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Total da Carteira — {MESES_LABEL[mes]}</div>
            {loading && lancs.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                <span className="spin" />
                <span style={{ fontSize: 13, color: P.muted }}>Buscando dados…</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32, fontWeight: 400, color: P.text, lineHeight: 1, fontFamily: "'DM Serif Display',serif", marginBottom: 6 }}>{fmt(totalGeral)}</div>
                <div style={{ fontSize: 11, color: P.muted, opacity: .6, marginBottom: totalGeral > 0 ? 16 : 0, textTransform: "uppercase", letterSpacing: ".08em" }}>
                  {lancs.length} lançamentos · {CLIENTES.length} clientes
                </div>
                {CLIENTES.map(c => {
                  const tot = (porCliente[c.id] || []).reduce((s, l) => s + l.valor, 0);
                  if (!tot) return null;
                  return (
                    <div key={c.id} style={{ marginBottom: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: .75 }}>{c.nome}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.corT }}>{fmt(tot)}</span>
                      </div>
                      <Bar p={totalGeral > 0 ? (tot / totalGeral) * 100 : 0} color={c.cor} />
                    </div>
                  );
                })}
                {totalGeral === 0 && (
                  <div style={{ textAlign: "center", padding: "16px 0", color: P.muted, fontSize: 13 }}>
                    Nenhum lançamento registrado neste mês.
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ fontSize: 9, color: P.muted, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600, opacity: .6 }}>
            Clientes — toque para detalhar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CLIENTES.map(c => (
              <Card key={c.id} c={c} lancs={porCliente[c.id] || []} ultimaData={ultimasDatas[c.id]} onClick={() => setSel(c.id)} />
            ))}
          </div>

          <div style={{ fontSize: 9, color: P.border, textAlign: "center", padding: "28px 0 8px", letterSpacing: ".25em", textTransform: "uppercase", fontWeight: 600 }}>
            Painel Confidencial · {MESES_LABEL[mes]}
          </div>
        </div>
      )}
    </div>
  );
}
