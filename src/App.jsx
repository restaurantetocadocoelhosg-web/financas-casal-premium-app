import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase, SUPABASE_ENABLED } from "./supabaseClient";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";
import {
  Mic, Sparkles, Home, List, MessageCircle, Plus, Trash2, Pencil,
  X, Check, Wallet, Send, ChevronLeft, ChevronRight, Loader2,
  Target, Calendar, Search, Camera, ChevronDown, ReceiptText,
  RotateCcw, ImagePlus, UserRound, Eye, Download, FileSpreadsheet,
  FileText, Upload, BrainCircuit, ShieldCheck, BadgeDollarSign,
  TrendingDown, Database, Printer, LockKeyhole, LogOut, UserPlus, Users,
  Cloud, Copy, KeyRound
} from "lucide-react";

/* ═══════════════════════════════════════════════
   IDENTIDADE VISUAL
   Neutro claro · Teal · Índigo · Dourado
═══════════════════════════════════════════════ */
const C = {
  bg:          "#F7F8F4",
  bgAlt:       "#E7ECEA",
  surface:     "#FFFFFF",
  ink:         "#172321",
  inkSoft:     "#36524D",
  muted:       "#72817E",
  faint:       "#B8C4C1",
  border:      "rgba(23,35,33,0.11)",
  hairline:    "rgba(23,35,33,0.07)",
  caramel:     "#0F766E",
  caramelDeep: "#0B5D56",
  gold:        "#D6A83B",
  goldPale:    "#F7EDC7",
  plum:        "#5B4BB2",
  plumPale:    "#ECE9FF",
  green:       "#17815F",
  greenPale:   "#E6F4EE",
  red:         "#C2413A",
  redPale:     "#FBE9E7",
  amber:       "#9A6A10",
  amberPale:   "#F8EFCF",
  blue:        "#2563A8",
  bluePale:    "#E6EEF8",
  shadow:      "0 12px 32px rgba(23,35,33,0.10)",
  shadowSm:    "0 3px 12px rgba(23,35,33,0.08)",
};

const F = {
  display: "'Fraunces', Georgia, serif",
  body: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const STORAGE_KEY = "financas-casal-v3";
const AUTH_KEY = "financas-casal-auth-v1";
const SESSION_KEY = "financas-casal-session-v1";
const PEOPLE = ["Rubens", "Nayara"];
const PERSON_COLOR = { Rubens: C.caramelDeep, Nayara: C.plum };
const PAYMENTS = ["Pix", "Dinheiro", "Crédito", "Débito", "Boleto", "Transferência", "Outro"];
const CAT_GASTO = ["Mercado","Padaria","Açougue","Farmácia","Restaurante","Delivery","Combustível","Casa","Energia","Água","Internet","Streaming","Assinaturas","Carro","Seguro","Lazer","Roupas","Pets","Presentes","Saúde","Viagem","Impostos","Outros"];
const CAT_GANHO = ["Salário","Vendas","Freelance","Investimentos","Reembolso","Outros ganhos"];
const EMOJI = {Mercado:"🛒",Padaria:"🥖",Açougue:"🥩",Farmácia:"💊",Restaurante:"🍽️",Delivery:"🛵",Combustível:"⛽",Casa:"🏠",Energia:"💡",Água:"💧",Internet:"🌐",Streaming:"📺",Assinaturas:"🔁",Carro:"🚗",Seguro:"🛡️",Lazer:"🎉",Roupas:"👕",Pets:"🐾",Presentes:"🎁",Saúde:"🏥",Viagem:"✈️",Impostos:"🧾",Outros:"📦",Salário:"💼",Vendas:"💰",Freelance:"🖥️",Investimentos:"📈",Reembolso:"↩️","Outros ganhos":"🪙"};
const GOAL_EMOJIS = ["🏖️","🏠","🚗","💍","📱","🎓","💼","🌍","🎁","💰","🐕","✈️"];
const CHART_COLORS = ["#0B5D56","#5B4BB2","#D6A83B","#2563A8","#17815F","#C2413A","#7C63D8","#0F766E","#9A6A10","#3B6D8A"];

/* ── utilitários ── */
const fmt = (v) => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtShort = (v) => { const n=Number(v||0); return n>=1000?`R$ ${(n/1000).toFixed(1).replace(".",",")}k`:fmt(n); };
const todayISO = () => new Date().toISOString().slice(0,10);
const monthLabel = (d) => d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
const greeting = () => { const h=new Date().getHours(); return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"; };
const dayLabel = (iso) => new Date(iso+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"});
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
};
const monthFile = (month) => `${month.y}-${String(month.m+1).padStart(2,"0")}`;
const normalize = (s="") => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const numBR = (value) => {
  if (typeof value === "number") return value;
  const clean = String(value||"").replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3})/g,"").replace(",",".");
  return Number(clean)||0;
};
const txDate = (t) => new Date(`${t.data}T12:00:00`);
const inMonth = (t, month) => {
  const d = txDate(t);
  return d.getFullYear()===month.y && d.getMonth()===month.m;
};
const groupSum = (items, keyFn) => Object.entries(items.reduce((acc,item)=>{
  const key = keyFn(item) || "Sem categoria";
  acc[key] = (acc[key]||0) + Number(item.valor||0);
  return acc;
},{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);

function downloadBlob(filename, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const htmlEscape = (value) => String(value ?? "")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");

function exportCSVFile(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(";")).join("\n");
  downloadBlob(filename, `\uFEFFsep=;\n${csv}`, "text/csv;charset=utf-8");
}

function buildFinancialReport(allTx, fixedExpenses, goals, month, person="Todos") {
  const monthTx = allTx
    .filter(t => inMonth(t, month) && (person==="Todos" || t.pessoa===person))
    .sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const gastos = monthTx.filter(t=>t.tipo==="gasto");
  const ganhos = monthTx.filter(t=>t.tipo==="ganho");
  const totalGastos = gastos.reduce((s,t)=>s+Number(t.valor||0),0);
  const totalGanhos = ganhos.reduce((s,t)=>s+Number(t.valor||0),0);
  const supTotal = gastos.filter(t=>!t.necessario).reduce((s,t)=>s+Number(t.valor||0),0);
  const necessaryTotal = totalGastos - supTotal;
  const fixedTotal = fixedExpenses.reduce((s,f)=>s+Number(f.valor||0),0);
  const byCategory = groupSum(gastos, t=>t.categoria);
  const byPerson = groupSum(gastos, t=>t.pessoa);
  const byPayment = groupSum(gastos, t=>t.pagamento);
  const topCategory = byCategory[0];
  const prev = month.m===0 ? {y:month.y-1,m:11} : {y:month.y,m:month.m-1};
  const prevGastos = allTx
    .filter(t=>t.tipo==="gasto" && inMonth(t, prev) && (person==="Todos" || t.pessoa===person))
    .reduce((s,t)=>s+Number(t.valor||0),0);
  const changePct = prevGastos>0 ? ((totalGastos-prevGastos)/prevGastos)*100 : null;
  const saldo = totalGanhos-totalGastos;
  const savingsRate = totalGanhos>0 ? (saldo/totalGanhos)*100 : 0;
  const insights = [
    saldo < 0
      ? `Saldo negativo de ${fmt(Math.abs(saldo))}. Prioridade: segurar novos gastos variáveis até fechar o mês.`
      : `Saldo positivo de ${fmt(saldo)}. Bom momento para separar parte para reserva/metas.`,
    topCategory
      ? `${topCategory.name} lidera os gastos com ${fmt(topCategory.value)} (${totalGastos?((topCategory.value/totalGastos)*100).toFixed(0):0}% do mês).`
      : "Ainda não há gastos suficientes para encontrar padrão por categoria.",
    supTotal > totalGastos*0.18
      ? `Gastos supérfluos somam ${fmt(supTotal)}. Cortar 25% disso liberaria ${fmt(supTotal*0.25)}.`
      : `Supérfluos sob controle: ${fmt(supTotal)} no mês.`,
    fixedTotal > 0 && totalGanhos > 0
      ? `Contas fixas cadastradas representam ${((fixedTotal/totalGanhos)*100).toFixed(0)}% dos ganhos informados.`
      : "Cadastre contas fixas para o agente prever pressão no orçamento.",
    goals.length
      ? `Metas ativas: ${goals.length}. Total guardado: ${fmt(goals.reduce((s,g)=>s+Number(g.saved||0),0))}.`
      : "Criem uma meta de reserva para o app transformar sobra do mês em plano concreto.",
  ];

  return {
    month,
    person,
    title: `Relatório financeiro - ${monthLabel(new Date(month.y,month.m,1))}`,
    fileBase: `relatorio-financas-${monthFile(month)}${person!=="Todos"?`-${normalize(person).replace(/\s+/g,"-")}`:""}`,
    tx: monthTx,
    fixedExpenses,
    goals,
    totalGastos,
    totalGanhos,
    saldo,
    savingsRate,
    supTotal,
    necessaryTotal,
    fixedTotal,
    byCategory,
    byPerson,
    byPayment,
    topCategory,
    changePct,
    insights,
  };
}

function excelTable(title, headers, rows) {
  const head = headers.map(h=>`<th>${htmlEscape(h)}</th>`).join("");
  const body = rows.map(row=>`<tr>${row.map(cell=>`<td>${htmlEscape(cell)}</td>`).join("")}</tr>`).join("");
  return `<h2>${htmlEscape(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function exportReportExcel(report) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;color:#172321}h1{font-size:22px}h2{font-size:16px;margin-top:24px}table{border-collapse:collapse;width:100%;margin-bottom:16px}th,td{border:1px solid #d7dfdc;padding:8px;font-size:12px;text-align:left}th{background:#e6f4ee}</style></head><body>
    <h1>${htmlEscape(report.title)}</h1>
    <p>Filtro: ${htmlEscape(report.person)}</p>
    ${excelTable("Resumo", ["Indicador","Valor"], [
      ["Ganhos", fmt(report.totalGanhos)],
      ["Gastos", fmt(report.totalGastos)],
      ["Saldo", fmt(report.saldo)],
      ["Taxa de sobra", `${report.savingsRate.toFixed(2)}%`],
      ["Gastos necessários", fmt(report.necessaryTotal)],
      ["Gastos supérfluos", fmt(report.supTotal)],
      ["Contas fixas cadastradas", fmt(report.fixedTotal)],
    ])}
    ${excelTable("Categorias", ["Categoria","Valor"], report.byCategory.map(r=>[r.name, fmt(r.value)]))}
    ${excelTable("Por pessoa", ["Pessoa","Valor"], report.byPerson.map(r=>[r.name, fmt(r.value)]))}
    ${excelTable("Pagamentos", ["Pagamento","Valor"], report.byPayment.map(r=>[r.name, fmt(r.value)]))}
    ${excelTable("Extrato", ["Data","Pessoa","Tipo","Categoria","Descricao","Pagamento","Necessario","Valor"], report.tx.map(t=>[t.data,t.pessoa,t.tipo,t.categoria,t.descricao||"",t.pagamento,t.necessario?"Sim":"Nao",fmt(t.valor)]))}
    ${excelTable("Contas fixas", ["Nome","Categoria","Dia","Valor"], report.fixedExpenses.map(f=>[f.nome,f.categoria,f.dia,fmt(f.valor)]))}
    ${excelTable("Metas", ["Meta","Alvo","Guardado","Prazo"], report.goals.map(g=>[g.nome,fmt(g.alvo),fmt(g.saved||0),g.prazo||""]))}
    ${excelTable("Insights", ["Insight"], report.insights.map(i=>[i]))}
  </body></html>`;
  downloadBlob(`${report.fileBase}.xls`, `\uFEFF${html}`, "application/vnd.ms-excel;charset=utf-8");
}

async function exportReportPDF(report) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ unit:"pt", format:"a4" });
  doc.setProperties({ title: report.title, subject: "Relatório financeiro do casal" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(report.title, 40, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Filtro: ${report.person} | Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 40, 64);
  autoTable(doc, {
    startY: 88,
    head: [["Indicador", "Valor"]],
    body: [
      ["Ganhos", fmt(report.totalGanhos)],
      ["Gastos", fmt(report.totalGastos)],
      ["Saldo", fmt(report.saldo)],
      ["Gastos supérfluos", fmt(report.supTotal)],
      ["Contas fixas", fmt(report.fixedTotal)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15,118,110] },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [["Categoria", "Valor"]],
    body: report.byCategory.slice(0,8).map(r=>[r.name, fmt(r.value)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [91,75,178] },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [["Insights do agente"]],
    body: report.insights.map(i=>[i]),
    styles: { fontSize: 9, cellWidth: "wrap" },
    headStyles: { fillColor: [15,118,110] },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [["Data","Pessoa","Categoria","Descricao","Valor"]],
    body: report.tx.slice(0,28).map(t=>[t.data,t.pessoa,t.categoria,t.descricao||"",fmt(t.valor)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [54,82,77] },
  });
  doc.save(`${report.fileBase}.pdf`);
}

function exportReportCSV(report) {
  exportCSVFile(`${report.fileBase}-extrato.csv`, [
    ["Data","Pessoa","Tipo","Categoria","Descricao","Pagamento","Necessario","Valor"],
    ...report.tx.map(t=>[t.data,t.pessoa,t.tipo,t.categoria,t.descricao,t.pagamento,t.necessario?"Sim":"Nao",Number(t.valor||0).toFixed(2).replace(".",",")]),
  ]);
}

function exportBackup(data) {
  const payload = { ...data, exportedAt: new Date().toISOString(), app: "financas-casal-premium" };
  downloadBlob(`backup-financas-${todayISO()}.json`, JSON.stringify(payload,null,2), "application/json;charset=utf-8");
}

function printReport(report) {
  const rows = report.tx.map(t=>`<tr><td>${htmlEscape(t.data)}</td><td>${htmlEscape(t.pessoa)}</td><td>${htmlEscape(t.categoria)}</td><td>${htmlEscape(t.descricao||"")}</td><td>${htmlEscape(fmt(t.valor))}</td></tr>`).join("");
  const insights = report.insights.map(i=>`<li>${htmlEscape(i)}</li>`).join("");
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${htmlEscape(report.title)}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#172321}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #d7dfdc;padding:8px;font-size:12px;text-align:left}th{background:#e6f4ee}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.box{border:1px solid #d7dfdc;padding:12px;border-radius:8px}</style></head><body><h1>${htmlEscape(report.title)}</h1><p>Filtro: ${htmlEscape(report.person)}</p><div class="grid"><div class="box"><b>Ganhos</b><br>${htmlEscape(fmt(report.totalGanhos))}</div><div class="box"><b>Gastos</b><br>${htmlEscape(fmt(report.totalGastos))}</div><div class="box"><b>Saldo</b><br>${htmlEscape(fmt(report.saldo))}</div><div class="box"><b>Supérfluos</b><br>${htmlEscape(fmt(report.supTotal))}</div></div><h2>Insights</h2><ul>${insights}</ul><h2>Extrato</h2><table><thead><tr><th>Data</th><th>Pessoa</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body></html>`);
  w.document.close();
}

/* ── compressão de imagem (canvas) ── */
function compressImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const r = Math.min(maxDim/width, maxDim/height);
          width = Math.round(width*r); height = Math.round(height*r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── storage ── */
const DEFAULT_DATA = { transactions:[], goals:[], fixedExpenses:[], avatars:{} };
const sanitizeData = (input) => ({
  ...DEFAULT_DATA,
  ...input,
  transactions: Array.isArray(input?.transactions) ? input.transactions : [],
  goals: Array.isArray(input?.goals) ? input.goals : [],
  fixedExpenses: Array.isArray(input?.fixedExpenses) ? input.fixedExpenses : [],
  avatars: input?.avatars && typeof input.avatars === "object" ? input.avatars : {},
});
const hasFinancialData = (input) => {
  const d = sanitizeData(input);
  return Boolean(
    d.transactions.length ||
    d.goals.length ||
    d.fixedExpenses.length ||
    Object.keys(d.avatars).length
  );
};
const browserStorage = {
  async get(key) {
    if (typeof window === "undefined") return null;
    if (window.storage?.get) return window.storage.get(key);
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    if (typeof window === "undefined") return;
    if (window.storage?.set) return window.storage.set(key, value);
    localStorage.setItem(key, value);
  },
  async delete(key) {
    if (typeof window === "undefined") return;
    if (window.storage?.delete) return window.storage.delete(key);
    localStorage.removeItem(key);
  },
};

const DEFAULT_AUTH = { users:[], createdAt:null };
const cleanLogin = (value="") => normalize(value).replace(/\s+/g,"").slice(0,32);
const publicUser = (user) => user ? ({
  id: user.id,
  name: user.name,
  login: user.login,
  role: user.role,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
}) : null;

const salt = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, b=>b.toString(16).padStart(2,"0")).join("");
  }
  return `${uid()}${Date.now()}`;
};

async function digestPassword(password, userSalt) {
  const payload = `${userSalt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
    return Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,"0")).join("");
  }
  return btoa(unescape(encodeURIComponent(payload)));
}

async function makeAuthUser({ name, login, password, role="user" }) {
  const userSalt = salt();
  return {
    id: uid(),
    name: String(name||"").trim().slice(0,42),
    login: cleanLogin(login),
    role: role === "admin" ? "admin" : "user",
    salt: userSalt,
    passwordHash: await digestPassword(password, userSalt),
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
}

async function loadAuth() {
  try {
    const r = await browserStorage.get(AUTH_KEY);
    if (r?.value) {
      const parsed = JSON.parse(r.value);
      return {
        ...DEFAULT_AUTH,
        ...parsed,
        users: Array.isArray(parsed?.users) ? parsed.users : [],
      };
    }
  } catch {}
  return DEFAULT_AUTH;
}

async function loadSession() {
  try {
    const r = await browserStorage.get(SESSION_KEY);
    return r?.value ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

const persistAuth = (auth) => browserStorage.set(AUTH_KEY, JSON.stringify(auth)).catch(()=>{});
const persistSession = (session) => browserStorage.set(SESSION_KEY, JSON.stringify(session)).catch(()=>{});
const clearSession = () => browserStorage.delete(SESSION_KEY).catch(()=>{});

async function loadAll() {
  try {
    const r = await browserStorage.get(STORAGE_KEY);
    if (r?.value) return sanitizeData(JSON.parse(r.value));
  } catch {}
  // migração da versão anterior
  try {
    const old = await browserStorage.get("financas-casal-v2");
    if (old?.value) return sanitizeData(JSON.parse(old.value));
  } catch {}
  return DEFAULT_DATA;
}
const persistAll = (d) => browserStorage.set(STORAGE_KEY, JSON.stringify(d)).catch(()=>{});
const savePhoto = (id, dataUrl) => browserStorage.set(`txfoto-${id}`, dataUrl).catch(()=>{});
const loadPhoto = async (id) => { try { const r = await browserStorage.get(`txfoto-${id}`); return r?.value||null; } catch { return null; } };
const removePhoto = (id) => browserStorage.delete(`txfoto-${id}`).catch(()=>{});

function detectMoney(text) {
  const clean = normalize(text);
  const patterns = [
    /r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|rs)\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return numBR(m[1]);
  }
  const all = [...clean.matchAll(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/g)].map(m=>numBR(m[1])).filter(Boolean);
  return all.at(-1)||0;
}

function detectDate(text) {
  const clean = normalize(text);
  if (clean.includes("anteontem")) return addDaysISO(-2);
  if (clean.includes("ontem")) return addDaysISO(-1);
  if (clean.includes("amanha")) return addDaysISO(1);
  const full = clean.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (full) {
    const day = String(Math.min(Number(full[1]),31)).padStart(2,"0");
    const mon = String(Math.min(Number(full[2]),12)).padStart(2,"0");
    const year = full[3] ? (full[3].length===2 ? `20${full[3]}` : full[3]) : String(new Date().getFullYear());
    return `${year}-${mon}-${day}`;
  }
  return todayISO();
}

function detectCategory(text, tipo) {
  const clean = normalize(text);
  const rules = [
    ["Mercado", ["mercado","compras","supermercado","hortifruti","sacolao"]],
    ["Padaria", ["padaria","pao","leite"]],
    ["Açougue", ["acougue","carne","frango"]],
    ["Farmácia", ["farmacia","remedio","medicamento"]],
    ["Restaurante", ["restaurante","almoco","jantar","lanche"]],
    ["Delivery", ["delivery","ifood","uber eats","pedido"]],
    ["Combustível", ["combustivel","gasolina","etanol","abasteci","posto"]],
    ["Casa", ["casa","obra","limpeza","condominio"]],
    ["Energia", ["energia","luz","enel"]],
    ["Água", ["agua","cedae"]],
    ["Internet", ["internet","wifi","vivo","claro","tim"]],
    ["Streaming", ["netflix","spotify","prime","streaming"]],
    ["Assinaturas", ["assinatura","mensalidade"]],
    ["Carro", ["carro","oficina","mecanico","pneu"]],
    ["Seguro", ["seguro"]],
    ["Lazer", ["lazer","cinema","bar","passeio"]],
    ["Roupas", ["roupa","calcado","sapato"]],
    ["Pets", ["pet","cachorro","gato","racao"]],
    ["Presentes", ["presente"]],
    ["Saúde", ["saude","consulta","medico","dentista"]],
    ["Viagem", ["viagem","hotel","passagem"]],
    ["Impostos", ["imposto","iptu","ipva","taxa"]],
  ];
  if (tipo==="ganho") {
    if (clean.includes("salario")) return "Salário";
    if (clean.includes("venda")) return "Vendas";
    if (clean.includes("freela") || clean.includes("freelance")) return "Freelance";
    if (clean.includes("invest")) return "Investimentos";
    if (clean.includes("reembolso")) return "Reembolso";
    return "Outros ganhos";
  }
  return rules.find(([,keys])=>keys.some(k=>clean.includes(k)))?.[0] || "Outros";
}

function detectPayment(text) {
  const clean = normalize(text);
  if (clean.includes("dinheiro")) return "Dinheiro";
  if (clean.includes("credito") || clean.includes("cartao de credito")) return "Crédito";
  if (clean.includes("debito") || clean.includes("cartao de debito")) return "Débito";
  if (clean.includes("boleto")) return "Boleto";
  if (clean.includes("transfer")) return "Transferência";
  if (clean.includes("pix")) return "Pix";
  return "Pix";
}

function interpretFinancialText(text, defaultPerson) {
  const clean = normalize(text);
  const valor = detectMoney(text);
  if (!valor) throw new Error("valor");
  const tipo = /(recebi|ganhei|entrou|salario|venda|freela|reembolso)/.test(clean) ? "ganho" : "gasto";
  const pessoa = PEOPLE.find(p=>clean.includes(normalize(p))) || defaultPerson;
  const categoria = detectCategory(text, tipo);
  const pagamento = detectPayment(text);
  const necessaryFalse = ["Delivery","Restaurante","Streaming","Lazer","Roupas","Presentes","Viagem"].includes(categoria) || /(besteira|supérfluo|superfluo|luxo)/.test(clean);
  const necessaryTrue = /(necessario|essencial|conta|fixo|remedio|mercado)/.test(clean);
  return {
    tipo,
    valor,
    categoria,
    descricao: text.trim().replace(/\s+/g," ").slice(0,70) || categoria,
    pagamento,
    pessoa,
    data: detectDate(text),
    necessario: necessaryTrue ? true : !necessaryFalse,
  };
}

function answerFinanceQuestion(question, transactions, fixedExpenses=[], goals=[]) {
  const q = normalize(question);
  const now = new Date();
  const month = { y: now.getFullYear(), m: now.getMonth() };
  const person = PEOPLE.find(p=>q.includes(normalize(p))) || "Todos";
  const report = buildFinancialReport(transactions, fixedExpenses, goals, month, person);
  const category = [...CAT_GASTO, ...CAT_GANHO].find(c=>q.includes(normalize(c)));
  if (category) {
    const total = report.tx.filter(t=>normalize(t.categoria)===normalize(category)).reduce((s,t)=>s+Number(t.valor||0),0);
    return `${person==="Todos"?"Vocês":person} somaram ${fmt(total)} em ${category} neste mês. ${total>0 && report.totalGastos>0 ? `Isso dá ${((total/report.totalGastos)*100).toFixed(0)}% dos gastos do período.` : "Ainda não há volume grande nessa categoria."}`;
  }
  if (q.includes("econom") || q.includes("cortar") || q.includes("melhor")) {
    const top = report.byCategory[0];
    const cut = report.supTotal*0.25;
    return [
      top ? `O maior ponto de atenção é ${top.name}: ${fmt(top.value)}.` : "Ainda preciso de mais lançamentos para achar o maior padrão.",
      report.supTotal ? `Supérfluos estão em ${fmt(report.supTotal)}; uma redução de 25% libera ${fmt(cut)}.` : "Os supérfluos estão baixos ou ainda não foram marcados.",
      report.saldo < 0 ? `Como o saldo está negativo (${fmt(report.saldo)}), a regra da semana é segurar gastos variáveis.` : `Como o saldo está positivo (${fmt(report.saldo)}), vale transferir uma parte para meta ou reserva.`
    ].join("\n");
  }
  if (q.includes("resumo") || q.includes("mes") || q.includes("mês") || q.includes("saldo")) {
    return [
      `${report.title}:`,
      `Ganhos: ${fmt(report.totalGanhos)}.`,
      `Gastos: ${fmt(report.totalGastos)}.`,
      `Saldo: ${fmt(report.saldo)}.`,
      report.changePct!==null ? `Comparado ao mês anterior, os gastos ${report.changePct>0?"subiram":"caíram"} ${Math.abs(report.changePct).toFixed(0)}%.` : "Ainda não há comparação com o mês anterior.",
      report.insights[1],
    ].join("\n");
  }
  if (q.includes("meta") || q.includes("guardar") || q.includes("reserva")) {
    const totalSaved = goals.reduce((s,g)=>s+Number(g.saved||0),0);
    const suggested = Math.max(0, report.saldo*0.3);
    return goals.length
      ? `Vocês têm ${goals.length} meta(s) e ${fmt(totalSaved)} guardados. Pela sobra deste mês, uma sugestão prudente é guardar ${fmt(suggested)} agora.`
      : `Ainda não há metas. Eu criaria primeiro uma reserva de emergência e colocaria ${fmt(suggested)} da sobra atual nela.`;
  }
  if (q.includes("fix") || q.includes("conta")) {
    return `Contas fixas cadastradas: ${fixedExpenses.length}, total de ${fmt(report.fixedTotal)} por mês. ${report.totalGanhos ? `Isso equivale a ${((report.fixedTotal/report.totalGanhos)*100).toFixed(0)}% dos ganhos do mês.` : "Cadastre ganhos para calcular o peso no orçamento."}`;
  }
  return report.insights.join("\n");
}

/* ═══════════════════════════════════════════════
   COMPONENTES BASE
═══════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background:C.surface, borderRadius:22, border:`1px solid ${C.border}`,
    boxShadow:C.shadowSm, padding:18, cursor:onClick?"pointer":"default", ...style
  }}>{children}</div>
);

const Eyebrow = ({children, style}) => (
  <div style={{fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:1.6,fontWeight:700,fontFamily:F.body,...style}}>{children}</div>
);

const inputStyle = {
  width:"100%", background:"#FBF7EE", border:`1.5px solid ${C.border}`,
  borderRadius:14, padding:"12px 14px", color:C.ink, fontSize:15,
  outline:"none", boxSizing:"border-box", fontFamily:F.body,
};

const Input = (props) => (
  <input {...props} style={{...inputStyle,...props.style}}
    onFocus={e=>e.target.style.borderColor=C.caramel}
    onBlur={e=>e.target.style.borderColor=C.border}/>
);

const Select = ({value,onChange,children,style}) => (
  <select value={value} onChange={onChange} style={{...inputStyle,appearance:"none",
    backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238A7A66' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:36, ...style}}>
    {children}
  </select>
);

const Btn = ({children, variant="dark", onClick, disabled, style, small}) => {
  const variants = {
    dark:    { background:C.ink, color:"#F6F1E7" },
    gold:    { background:`linear-gradient(135deg,${C.caramelDeep},${C.gold})`, color:"#fff" },
    plum:    { background:C.plum, color:"#fff" },
    ghost:   { background:"#FBF7EE", color:C.inkSoft, border:`1px solid ${C.border}` },
    outline: { background:"transparent", color:C.muted, border:`1.5px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border:"none", borderRadius:small?12:16, fontWeight:700, fontFamily:F.body,
      cursor:disabled?"not-allowed":"pointer", fontSize:small?13:14.5,
      opacity:disabled?0.45:1, padding:small?"9px 14px":"14px 20px",
      display:"flex",alignItems:"center",justifyContent:"center",gap:7,
      letterSpacing:0.2, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

/* ── Avatar com foto ── */
const Avatar = ({ name, avatars, size=34, ring=true }) => {
  const photo = avatars?.[name];
  const color = PERSON_COLOR[name] || C.caramel;
  return photo ? (
    <img src={photo} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:ring?`2px solid ${color}`:"none",flexShrink:0,display:"block"}}/>
  ) : (
    <div style={{width:size,height:size,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.42,fontFamily:F.body,flexShrink:0,border:ring?`2px solid ${C.goldPale}`:"none"}}>
      {name?.[0]||"?"}
    </div>
  );
};

const NavBtn = ({icon:Icon,label,active,onClick}) => (
  <button onClick={onClick} style={{background:active?C.ink:"transparent",border:"none",borderRadius:16,padding:"10px 13px",color:active?"#F6F1E7":C.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",fontSize:9,fontWeight:active?700:500,fontFamily:F.body,minWidth:52,transition:"all .2s"}}>
    <Icon size={19} strokeWidth={active?2.2:1.8}/>
    {label}
  </button>
);

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
      ::-webkit-scrollbar{width:0}
      input::placeholder,textarea::placeholder{color:${C.faint}}
      select option{background:${C.surface};color:${C.ink}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes slideUp{from{transform:translateY(36px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes toastIn{from{transform:translate(-50%,16px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
      .su{animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
      @media(max-width:360px){.bottom-nav-shell{gap:0;padding:5px}.bottom-nav-shell button{min-width:44px;padding-left:8px!important;padding-right:8px!important}}
      @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    `}</style>
  );
}

function LoadingScreen({ label="Finanças do Casal", status }) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:20,textAlign:"center"}}>
      <GlobalStyles/>
      <div style={{fontFamily:F.display,fontSize:24,fontWeight:600,color:C.caramelDeep,fontStyle:"italic"}}>{label}</div>
      <Loader2 size={22} color={C.gold} style={{animation:"spin 1s linear infinite"}}/>
      {status&&<div style={{fontSize:12.5,color:C.muted,maxWidth:320,lineHeight:1.45}}>{status}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APP
═══════════════════════════════════════════════ */
export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [auth, setAuth] = useState(DEFAULT_AUTH);
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [person, setPerson] = useState("Todos");
  const [month, setMonth] = useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const [aiOpen, setAiOpen] = useState(false);
  const [notaOpen, setNotaOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [photoView, setPhotoView] = useState(null);
  const [toast, setToast] = useState(null);
  const [onlineUser, setOnlineUser] = useState(null);
  const [onlineWorkspace, setOnlineWorkspace] = useState(null);
  const [onlineMember, setOnlineMember] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineNeedsSetup, setOnlineNeedsSetup] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(SUPABASE_ENABLED);
  const [syncStatus, setSyncStatus] = useState(SUPABASE_ENABLED ? "Conectando ao Supabase..." : "Modo local");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const localSeedRef = useRef(DEFAULT_DATA);

  const showToast = useCallback((msg)=>{ setToast(msg); setTimeout(()=>setToast(null),2600); },[]);
  const persistAuthState = useCallback((next)=>{ setAuth(next); persistAuth(next); },[]);

  const saveRemoteState = useCallback(async (workspaceId, userId, next) => {
    if (!SUPABASE_ENABLED || !supabase || !workspaceId || !userId) return { ok:false };
    const clean = sanitizeData(next);
    const { error } = await supabase
      .from("finance_app_state")
      .upsert({
        workspace_id: workspaceId,
        data: clean,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict:"workspace_id" });
    return error ? { ok:false, message:error.message } : { ok:true };
  },[]);

  const loadOnlineMembers = useCallback(async (workspaceId) => {
    if (!SUPABASE_ENABLED || !supabase || !workspaceId) return;
    const { data: rows, error } = await supabase
      .from("finance_members")
      .select("id,user_id,display_name,role,created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending:true });
    if (error) {
      setSyncStatus(`Membros: ${error.message}`);
      return;
    }
    setOnlineMembers(rows || []);
  },[]);

  const loadOnlineWorkspace = useCallback(async (user, localSeed = DEFAULT_DATA) => {
    if (!SUPABASE_ENABLED || !supabase || !user) {
      setOnlineLoading(false);
      return;
    }

    setOnlineLoading(true);
    setSyncStatus("Sincronizando...");

    const { data: member, error: memberError } = await supabase
      .from("finance_members")
      .select("workspace_id,role,display_name,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending:true })
      .limit(1)
      .maybeSingle();

    if (memberError) {
      setSyncStatus(`Erro no acesso: ${memberError.message}`);
      setOnlineLoading(false);
      return;
    }

    if (!member) {
      setOnlineWorkspace(null);
      setOnlineMember(null);
      setOnlineMembers([]);
      setOnlineNeedsSetup(true);
      setSyncStatus("Crie o espaço do casal ou entre por convite.");
      setOnlineLoading(false);
      return;
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("finance_workspaces")
      .select("id,name,created_at")
      .eq("id", member.workspace_id)
      .single();

    if (workspaceError) {
      setSyncStatus(`Workspace: ${workspaceError.message}`);
      setOnlineLoading(false);
      return;
    }

    setOnlineNeedsSetup(false);
    setOnlineMember(member);
    setOnlineWorkspace(workspace);
    await loadOnlineMembers(member.workspace_id);

    const { data: stateRow, error: stateError } = await supabase
      .from("finance_app_state")
      .select("data,updated_at")
      .eq("workspace_id", member.workspace_id)
      .maybeSingle();

    if (stateError) {
      setSyncStatus(`Dados: ${stateError.message}`);
      setOnlineLoading(false);
      return;
    }

    const remoteData = sanitizeData(stateRow?.data);
    const localData = sanitizeData(localSeed);
    const shouldUploadLocal = (!stateRow || !hasFinancialData(remoteData)) && hasFinancialData(localData);
    const nextData = shouldUploadLocal ? localData : remoteData;

    setData(nextData);
    persistAll(nextData);

    if (shouldUploadLocal) {
      const uploaded = await saveRemoteState(member.workspace_id, user.id, nextData);
      setSyncStatus(uploaded.ok ? "Dados deste aparelho enviados ao Supabase." : `Entrou, mas não subiu o backup: ${uploaded.message}`);
    } else {
      setSyncStatus(`Sincronizado${stateRow?.updated_at ? ` em ${new Date(stateRow.updated_at).toLocaleString("pt-BR")}` : ""}.`);
    }

    setLastSyncedAt(new Date().toISOString());
    setOnlineLoading(false);
  },[loadOnlineMembers, saveRemoteState]);

  const persist = useCallback((next)=>{
    const clean = sanitizeData(next);
    setData(clean);
    persistAll(clean);
    if (SUPABASE_ENABLED && onlineWorkspace?.id && onlineUser?.id) {
      setSyncStatus("Salvando no Supabase...");
      saveRemoteState(onlineWorkspace.id, onlineUser.id, clean).then((result)=>{
        if (result.ok) {
          setLastSyncedAt(new Date().toISOString());
          setSyncStatus("Salvo no Supabase.");
        } else if (result.message) {
          setSyncStatus(`Salvo localmente. Supabase: ${result.message}`);
        }
      });
    }
  },[onlineWorkspace?.id, onlineUser?.id, saveRemoteState]);

  useEffect(()=>{
    let alive = true;
    Promise.all([loadAll(), loadAuth(), loadSession()]).then(([d, a, s])=>{
      if (!alive) return;
      localSeedRef.current = d;
      setData(d);
      setAuth(a);
      const validSession = s && a.users.some(u=>u.id===s.userId);
      setSession(validSession ? s : null);
      if (s && !validSession) clearSession();
      setLoaded(true);
    });
    return ()=>{ alive = false; };
  },[]);

  useEffect(()=>{
    if (!loaded || !SUPABASE_ENABLED || !supabase) return undefined;
    let active = true;

    const resetOnline = () => {
      setOnlineUser(null);
      setOnlineWorkspace(null);
      setOnlineMember(null);
      setOnlineMembers([]);
      setOnlineNeedsSetup(false);
      setOnlineLoading(false);
      setSyncStatus("Entre com email e senha para sincronizar.");
    };

    const start = async () => {
      setOnlineLoading(true);
      const { data: authData, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setSyncStatus(`Auth: ${error.message}`);
        setOnlineLoading(false);
        return;
      }
      const user = authData.session?.user || null;
      setOnlineUser(user);
      if (user) await loadOnlineWorkspace(user, localSeedRef.current);
      else resetOnline();
    };

    start();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!active) return;
      const user = authSession?.user || null;
      setOnlineUser(user);
      if (user) loadOnlineWorkspace(user, localSeedRef.current);
      else resetOnline();
    });

    return () => {
      active = false;
      listener.subscription?.unsubscribe();
    };
  },[loaded, loadOnlineWorkspace]);

  const currentUser = useMemo(
    ()=>auth.users.find(u=>u.id===session?.userId) || null,
    [auth.users, session]
  );

  const effectiveUser = useMemo(() => {
    if (SUPABASE_ENABLED && onlineUser) {
      const fallbackName = onlineUser.user_metadata?.display_name || onlineUser.email?.split("@")[0] || "Usuário";
      return {
        id: onlineUser.id,
        name: onlineMember?.display_name || fallbackName,
        login: onlineUser.email || "",
        role: onlineMember?.role === "admin" ? "admin" : "user",
        memberRole: onlineMember?.role || "member",
      };
    }
    return currentUser;
  },[currentUser, onlineMember, onlineUser]);

  useEffect(()=>{
    if (tab==="admin" && effectiveUser?.role !== "admin") setTab("home");
  },[tab,effectiveUser]);

  const createFirstUser = useCallback(async (form) => {
    const login = cleanLogin(form.login);
    if (!form.name.trim() || !login || String(form.password||"").length < 4) {
      return { ok:false, message:"Preencha nome, usuário e senha com pelo menos 4 caracteres." };
    }
    if (form.password !== form.confirm) return { ok:false, message:"As senhas não conferem." };
    const user = await makeAuthUser({ ...form, login, role:"admin" });
    const nextAuth = { createdAt:new Date().toISOString(), users:[user] };
    const nextSession = { userId:user.id, issuedAt:new Date().toISOString() };
    persistAuthState(nextAuth);
    setSession(nextSession);
    persistSession(nextSession);
    showToast("Admin criado ✓");
    return { ok:true };
  },[persistAuthState,showToast]);

  const signIn = useCallback(async ({ login, password }) => {
    const key = cleanLogin(login);
    const user = auth.users.find(u=>u.login===key);
    if (!user) return { ok:false, message:"Usuário não encontrado." };
    const hash = await digestPassword(password, user.salt);
    if (hash !== user.passwordHash) return { ok:false, message:"Senha incorreta." };
    const now = new Date().toISOString();
    const nextAuth = { ...auth, users:auth.users.map(u=>u.id===user.id ? { ...u, lastLoginAt:now } : u) };
    const nextSession = { userId:user.id, issuedAt:now };
    persistAuthState(nextAuth);
    setSession(nextSession);
    persistSession(nextSession);
    setTab("home");
    return { ok:true };
  },[auth,persistAuthState]);

  const logout = useCallback(async ()=>{
    clearSession();
    setSession(null);
    setTab("home");
    if (SUPABASE_ENABLED && supabase) {
      await supabase.auth.signOut();
      setOnlineUser(null);
      setOnlineWorkspace(null);
      setOnlineMember(null);
      setOnlineMembers([]);
      setOnlineNeedsSetup(false);
      setOnlineLoading(false);
      setSyncStatus("Sessão encerrada.");
    }
  },[]);

  const onlineSignIn = useCallback(async ({ email, password }) => {
    if (!supabase) return { ok:false, message:"Supabase não configurado." };
    const cleanEmail = String(email||"").trim().toLowerCase();
    if (!cleanEmail || String(password||"").length < 6) {
      return { ok:false, message:"Informe email e senha com pelo menos 6 caracteres." };
    }
    setOnlineLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email:cleanEmail, password });
    if (error) {
      setOnlineLoading(false);
      return { ok:false, message:error.message };
    }
    return { ok:true };
  },[]);

  const onlineSignUp = useCallback(async ({ name, email, password, confirm }) => {
    if (!supabase) return { ok:false, message:"Supabase não configurado." };
    const cleanEmail = String(email||"").trim().toLowerCase();
    const displayName = String(name||"").trim();
    if (!displayName || !cleanEmail || String(password||"").length < 6) {
      return { ok:false, message:"Preencha nome, email e senha com pelo menos 6 caracteres." };
    }
    if (password !== confirm) return { ok:false, message:"As senhas não conferem." };
    setOnlineLoading(true);
    const { data: created, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data:{ display_name:displayName } },
    });
    if (error) {
      setOnlineLoading(false);
      return { ok:false, message:error.message };
    }
    if (!created.session) {
      setOnlineLoading(false);
      return { ok:true, message:"Conta criada. Se o Supabase pedir confirmação, abra o email e depois entre com a senha." };
    }
    return { ok:true };
  },[]);

  const createOnlineWorkspace = useCallback(async (displayName) => {
    if (!supabase || !onlineUser) return { ok:false, message:"Entre primeiro." };
    const name = String(displayName||onlineUser.user_metadata?.display_name||onlineUser.email?.split("@")[0]||"").trim();
    const { error } = await supabase.rpc("finance_bootstrap_workspace", { display_name:name || null });
    if (error) return { ok:false, message:error.message };
    await loadOnlineWorkspace(onlineUser, localSeedRef.current);
    showToast("Espaço criado ✓");
    return { ok:true };
  },[loadOnlineWorkspace, onlineUser, showToast]);

  const acceptOnlineInvite = useCallback(async ({ code, displayName }) => {
    if (!supabase || !onlineUser) return { ok:false, message:"Entre primeiro." };
    const inviteCode = String(code||"").trim().toUpperCase();
    const name = String(displayName||onlineUser.user_metadata?.display_name||onlineUser.email?.split("@")[0]||"").trim();
    if (!inviteCode) return { ok:false, message:"Informe o código de convite." };
    const { error } = await supabase.rpc("finance_accept_invite", { invite_code:inviteCode, display_name:name || null });
    if (error) return { ok:false, message:error.message };
    await loadOnlineWorkspace(onlineUser, localSeedRef.current);
    showToast("Convite aceito ✓");
    return { ok:true };
  },[loadOnlineWorkspace, onlineUser, showToast]);

  const createOnlineInvite = useCallback(async (role) => {
    if (!supabase || !onlineWorkspace?.id) return { ok:false, message:"Espaço ainda não carregado." };
    if (onlineMember?.role !== "admin") return { ok:false, message:"Apenas admin pode criar convite." };
    const { data: rows, error } = await supabase.rpc("finance_create_invite", {
      target_workspace_id: onlineWorkspace.id,
      invite_role: role === "admin" ? "admin" : "member",
    });
    if (error) return { ok:false, message:error.message };
    const invite = Array.isArray(rows) ? rows[0] : rows;
    return { ok:true, invite };
  },[onlineMember, onlineWorkspace]);

  const createUser = useCallback(async (form) => {
    if (currentUser?.role !== "admin") return { ok:false, message:"Apenas admin pode criar acesso." };
    const login = cleanLogin(form.login);
    if (!form.name.trim() || !login || String(form.password||"").length < 4) {
      return { ok:false, message:"Preencha nome, usuário e senha com pelo menos 4 caracteres." };
    }
    if (auth.users.some(u=>u.login===login)) return { ok:false, message:"Esse usuário já existe." };
    const user = await makeAuthUser({ ...form, login });
    persistAuthState({ ...auth, users:[...auth.users,user] });
    showToast("Acesso criado ✓");
    return { ok:true };
  },[auth,currentUser,persistAuthState,showToast]);

  const deleteUser = useCallback((id) => {
    if (currentUser?.role !== "admin") return;
    if (id === currentUser.id) {
      showToast("Você não pode remover seu próprio acesso");
      return;
    }
    const target = auth.users.find(u=>u.id===id);
    if (!target) return;
    const adminCount = auth.users.filter(u=>u.role==="admin").length;
    if (target.role==="admin" && adminCount <= 1) {
      showToast("Mantenha pelo menos um admin");
      return;
    }
    persistAuthState({ ...auth, users:auth.users.filter(u=>u.id!==id) });
    showToast("Acesso removido");
  },[auth,currentUser,persistAuthState,showToast]);

  const addTx = useCallback(async (tx, foto) => {
    const id = uid();
    if (foto) await savePhoto(id, foto);
    persist({...data, transactions:[{...tx, id, foto:!!foto}, ...data.transactions]});
    showToast("Lançamento salvo ✓");
  },[data,persist,showToast]);

  const updateTx = useCallback(async (tx, foto, fotoRemovida) => {
    if (foto) { await savePhoto(tx.id, foto); tx.foto = true; }
    if (fotoRemovida) { removePhoto(tx.id); tx.foto = false; }
    persist({...data, transactions:data.transactions.map(t=>t.id===tx.id?tx:t)});
    showToast("Atualizado ✓");
  },[data,persist,showToast]);

  const deleteTx = useCallback((id) => {
    removePhoto(id);
    persist({...data, transactions:data.transactions.filter(t=>t.id!==id)});
    showToast("Excluído");
  },[data,persist,showToast]);

  const setAvatar = useCallback(async (name, file) => {
    const small = await compressImage(file, 220, 0.8);
    persist({...data, avatars:{...data.avatars,[name]:small}});
    showToast(`Foto de ${name} atualizada ✓`);
  },[data,persist,showToast]);

  const addGoal    = useCallback((g)=>{ persist({...data,goals:[...data.goals,{...g,id:uid()}]}); showToast("Meta criada ✓"); },[data,persist,showToast]);
  const updateGoal = useCallback((g)=>{ persist({...data,goals:data.goals.map(x=>x.id===g.id?g:x)}); },[data,persist]);
  const deleteGoal = useCallback((id)=>{ persist({...data,goals:data.goals.filter(g=>g.id!==id)}); },[data,persist]);
  const addFixed   = useCallback((f)=>{ persist({...data,fixedExpenses:[...data.fixedExpenses,{...f,id:uid()}]}); showToast("Conta fixa salva ✓"); },[data,persist,showToast]);
  const deleteFixed= useCallback((id)=>{ persist({...data,fixedExpenses:data.fixedExpenses.filter(f=>f.id!==id)}); },[data,persist]);
  const importData = useCallback((next)=>{
    const safe = sanitizeData(next);
    persist(safe);
    showToast("Backup importado ✓");
  },[persist,showToast]);

  const txMonth = useMemo(()=>data.transactions.filter(t=>{
    const d = new Date(t.data+"T12:00:00");
    return d.getFullYear()===month.y && d.getMonth()===month.m && (person==="Todos"||t.pessoa===person);
  }),[data.transactions,month,person]);

  if(!loaded) return <LoadingScreen status="Carregando dados locais..." />;

  if (SUPABASE_ENABLED && onlineLoading && !onlineWorkspace && !onlineNeedsSetup) {
    return <LoadingScreen status={syncStatus} />;
  }

  if (SUPABASE_ENABLED && !onlineUser) return (
    <OnlineAuthGate onLogin={onlineSignIn} onCreate={onlineSignUp} syncStatus={syncStatus}/>
  );

  if (SUPABASE_ENABLED && onlineUser && onlineNeedsSetup) return (
    <OnlineWorkspaceGate user={onlineUser} onCreateWorkspace={createOnlineWorkspace} onAcceptInvite={acceptOnlineInvite} onLogout={logout}/>
  );

  if (SUPABASE_ENABLED && onlineUser && !onlineWorkspace) return <LoadingScreen status={syncStatus} />;

  if (!SUPABASE_ENABLED && !currentUser) return (
    <AuthGate auth={auth} onCreateFirst={createFirstUser} onLogin={signIn}/>
  );

  const newManualTx = ()=>setEditing({tipo:"gasto",valor:"",categoria:"Mercado",descricao:"",pagamento:"Pix",pessoa:person==="Todos"?PEOPLE[0]:person,data:todayISO(),necessario:true});

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.ink,fontFamily:F.body,paddingBottom:104}}>
      <GlobalStyles/>

      <div style={{maxWidth:480,margin:"0 auto",padding:"22px 18px"}}>
        {/* ── HEADER ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <Eyebrow>{greeting()}</Eyebrow>
            <div style={{fontFamily:F.display,fontSize:26,fontWeight:600,letterSpacing:0,lineHeight:1.1}}>
              Finanças <em style={{color:C.caramelDeep}}>do Casal</em>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setSearchOpen(true)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:10,cursor:"pointer",display:"flex",boxShadow:C.shadowSm}}>
              <Search size={17} color={C.inkSoft}/>
            </button>
            <button onClick={()=>setProfileOpen(true)} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",marginLeft:2}}>
              <div style={{display:"flex"}}>
                <Avatar name={PEOPLE[0]} avatars={data.avatars} size={36}/>
                <div style={{marginLeft:-12}}><Avatar name={PEOPLE[1]} avatars={data.avatars} size={36}/></div>
              </div>
            </button>
            <button onClick={logout} title={`Sair de ${effectiveUser?.name || "usuário"}`} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:10,cursor:"pointer",display:"flex",boxShadow:C.shadowSm}}>
              <LogOut size={17} color={C.inkSoft}/>
            </button>
          </div>
        </div>

        {/* ── FILTRO PESSOA (chips com avatar) ── */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["Todos",...PEOPLE].map(p=>(
            <button key={p} onClick={()=>setPerson(p)} style={{display:"flex",alignItems:"center",gap:7,padding:p==="Todos"?"8px 16px":"5px 14px 5px 6px",borderRadius:99,border:`1.5px solid ${person===p?C.ink:C.border}`,background:person===p?C.ink:C.surface,color:person===p?"#F6F1E7":C.inkSoft,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:F.body}}>
              {p!=="Todos"&&<Avatar name={p} avatars={data.avatars} size={26} ring={false}/>}
              {p}
            </button>
          ))}
        </div>

        {/* ── NAVEGAÇÃO DE MÊS ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"6px 8px",boxShadow:C.shadowSm}}>
          <button onClick={()=>setMonth(m=>m.m===0?{y:m.y-1,m:11}:{y:m.y,m:m.m-1})} style={{background:"none",border:"none",padding:8,cursor:"pointer",display:"flex"}}><ChevronLeft size={18} color={C.muted}/></button>
          <div style={{fontFamily:F.display,fontSize:15,fontWeight:600,textTransform:"capitalize"}}>{monthLabel(new Date(month.y,month.m,1))}</div>
          <button onClick={()=>setMonth(m=>m.m===11?{y:m.y+1,m:0}:{y:m.y,m:m.m+1})} style={{background:"none",border:"none",padding:8,cursor:"pointer",display:"flex"}}><ChevronRight size={18} color={C.muted}/></button>
        </div>

        {tab==="home"    && <Dashboard tx={txMonth} allTx={data.transactions} month={month} fixed={data.fixedExpenses} avatars={data.avatars} onNewAI={()=>setAiOpen(true)} onNewNota={()=>setNotaOpen(true)} onNewManual={newManualTx} onOpenReports={()=>setReportOpen(true)} onAddFixed={addFixed} onDeleteFixed={deleteFixed}/>}
        {tab==="extrato" && <Extrato tx={txMonth} avatars={data.avatars} onDelete={deleteTx} onEdit={setEditing} onViewPhoto={setPhotoView}/>}
        {tab==="metas"   && <Metas goals={data.goals} onAdd={addGoal} onUpdate={updateGoal} onDelete={deleteGoal}/>}
        {tab==="chat"    && <ChatIA transactions={data.transactions} fixedExpenses={data.fixedExpenses} goals={data.goals} avatars={data.avatars}/>}
        {tab==="admin"   && effectiveUser?.role==="admin" && (
          SUPABASE_ENABLED
            ? <OnlineAdminPanel
                currentUser={effectiveUser}
                workspace={onlineWorkspace}
                members={onlineMembers}
                data={data}
                syncStatus={syncStatus}
                lastSyncedAt={lastSyncedAt}
                onCreateInvite={createOnlineInvite}
                onRefresh={()=>onlineUser && loadOnlineWorkspace(onlineUser, data)}
                onLogout={logout}
              />
            : <AdminPanel auth={auth} currentUser={publicUser(currentUser)} data={data} onCreateUser={createUser} onDeleteUser={deleteUser} onLogout={logout}/>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"center",padding:"0 16px 18px",zIndex:40,pointerEvents:"none"}}>
        <div className="bottom-nav-shell" style={{pointerEvents:"auto",display:"flex",alignItems:"center",gap:2,background:"rgba(255,253,248,0.92)",backdropFilter:"blur(18px)",border:`1px solid ${C.border}`,borderRadius:999,padding:6,boxShadow:"0 10px 40px rgba(90,65,35,0.18)"}}>
          <NavBtn icon={Home} label="Início" active={tab==="home"} onClick={()=>setTab("home")}/>
          <NavBtn icon={List} label="Extrato" active={tab==="extrato"} onClick={()=>setTab("extrato")}/>
          <button onClick={()=>setAiOpen(true)} style={{width:56,height:56,borderRadius:999,border:"none",background:`linear-gradient(140deg,${C.ink} 20%,${C.caramelDeep} 80%)`,color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",margin:"0 3px",boxShadow:"0 6px 20px rgba(90,60,30,0.35)",flexShrink:0}}>
            <Sparkles size={22}/>
          </button>
          <NavBtn icon={Target} label="Metas" active={tab==="metas"} onClick={()=>setTab("metas")}/>
          <NavBtn icon={MessageCircle} label="Agente" active={tab==="chat"} onClick={()=>setTab("chat")}/>
          {effectiveUser?.role==="admin"&&<NavBtn icon={ShieldCheck} label="Admin" active={tab==="admin"} onClick={()=>setTab("admin")}/>}
        </div>
      </div>

      {/* ── MODAIS ── */}
      {aiOpen     && <AISheet defaultPerson={person==="Todos"?PEOPLE[0]:person} avatars={data.avatars} onClose={()=>setAiOpen(false)} onConfirm={(tx)=>{addTx(tx);setAiOpen(false);}} onOpenNota={()=>{setAiOpen(false);setNotaOpen(true);}}/>}
      {notaOpen   && <NotaSheet defaultPerson={person==="Todos"?PEOPLE[0]:person} avatars={data.avatars} onClose={()=>setNotaOpen(false)} onConfirm={(tx,foto)=>{addTx(tx,foto);setNotaOpen(false);}}/>}
      {editing    && <EditSheet tx={editing} avatars={data.avatars} onClose={()=>setEditing(null)} onSave={(tx,foto,fotoRemovida)=>{tx.id?updateTx(tx,foto,fotoRemovida):addTx(tx,foto);setEditing(null);}}/>}
      {searchOpen && <SearchModal transactions={data.transactions} avatars={data.avatars} onClose={()=>setSearchOpen(false)} onEdit={t=>{setSearchOpen(false);setEditing(t);}} onDelete={deleteTx} onViewPhoto={setPhotoView}/>}
      {profileOpen&& <ProfileSheet avatars={data.avatars} onSetAvatar={setAvatar} onClose={()=>setProfileOpen(false)}/>}
      {reportOpen && <ReportSheet data={data} month={month} person={person} onClose={()=>setReportOpen(false)} onImport={importData}/>}
      {photoView  && <PhotoViewer txId={photoView} onClose={()=>setPhotoView(null)}/>}

      {toast && (
        <div style={{position:"fixed",bottom:104,left:"50%",transform:"translateX(-50%)",background:C.ink,color:C.goldPale,padding:"11px 22px",borderRadius:999,fontSize:13,fontWeight:700,zIndex:99,whiteSpace:"nowrap",boxShadow:"0 6px 24px rgba(0,0,0,0.25)",animation:"toastIn .3s ease",fontFamily:F.body}}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ACESSO E ADMIN
═══════════════════════════════════════════════ */
function OnlineAuthGate({ onLogin, onCreate, syncStatus }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"Rubens", email:"", password:"", confirm:"" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const s = (k,v) => { setForm(f=>({...f,[k]:v})); setError(""); setMessage(""); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const result = mode === "create" ? await onCreate(form) : await onLogin(form);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.message) setMessage(result.message);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg} 0%,${C.bgAlt} 100%)`,fontFamily:F.body,color:C.ink,display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <GlobalStyles/>
      <Card style={{width:"100%",maxWidth:430,padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{width:48,height:48,borderRadius:14,background:C.greenPale,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Cloud size={22} color={C.caramelDeep}/>
          </div>
          <div>
            <Eyebrow>Supabase seguro</Eyebrow>
            <div style={{fontFamily:F.display,fontSize:24,fontWeight:600,lineHeight:1.05}}>Finanças do Casal</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          <button type="button" onClick={()=>setMode("login")} style={{border:`1.5px solid ${mode==="login"?C.ink:C.border}`,background:mode==="login"?C.ink:C.surface,color:mode==="login"?"#F6F1E7":C.inkSoft,borderRadius:13,padding:"10px 12px",fontWeight:800,cursor:"pointer",fontFamily:F.body}}>Entrar</button>
          <button type="button" onClick={()=>setMode("create")} style={{border:`1.5px solid ${mode==="create"?C.ink:C.border}`,background:mode==="create"?C.ink:C.surface,color:mode==="create"?"#F6F1E7":C.inkSoft,borderRadius:13,padding:"10px 12px",fontWeight:800,cursor:"pointer",fontFamily:F.body}}>Criar conta</button>
        </div>

        <form onSubmit={submit}>
          {mode==="create"&&(
            <>
              <Eyebrow style={{marginBottom:5}}>Nome</Eyebrow>
              <Input value={form.name} onChange={e=>s("name",e.target.value)} placeholder="Rubens" autoComplete="name" style={{marginBottom:10}}/>
            </>
          )}
          <Eyebrow style={{marginBottom:5}}>Email</Eyebrow>
          <Input autoFocus type="email" value={form.email} onChange={e=>s("email",e.target.value)} placeholder="voce@email.com" autoComplete="email" style={{marginBottom:10}}/>
          <Eyebrow style={{marginBottom:5}}>Senha</Eyebrow>
          <Input type="password" value={form.password} onChange={e=>s("password",e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode==="create"?"new-password":"current-password"} style={{marginBottom:mode==="create"?10:14}}/>
          {mode==="create"&&(
            <>
              <Eyebrow style={{marginBottom:5}}>Confirmar senha</Eyebrow>
              <Input type="password" value={form.confirm} onChange={e=>s("confirm",e.target.value)} placeholder="Repita a senha" autoComplete="new-password" style={{marginBottom:14}}/>
            </>
          )}
          {error&&(
            <div style={{background:C.redPale,border:`1px solid rgba(194,65,58,0.18)`,borderRadius:12,padding:"10px 12px",fontSize:12.5,color:C.red,marginBottom:12,fontWeight:700}}>
              {error}
            </div>
          )}
          {message&&(
            <div style={{background:C.greenPale,border:`1px solid rgba(23,129,95,0.16)`,borderRadius:12,padding:"10px 12px",fontSize:12.5,color:C.green,marginBottom:12,fontWeight:700}}>
              {message}
            </div>
          )}
          <Btn variant="gold" disabled={busy} style={{width:"100%"}}>
            {busy ? <Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> : <KeyRound size={15}/>}
            {mode==="create" ? "Criar conta" : "Entrar"}
          </Btn>
        </form>

        <div style={{marginTop:14,fontSize:12.3,lineHeight:1.5,color:C.muted,background:C.bluePale,border:`1px solid rgba(37,99,168,0.14)`,borderRadius:12,padding:"10px 12px",display:"flex",gap:8}}>
          <Database size={15} color={C.blue} style={{flexShrink:0,marginTop:1}}/>
          <span>{syncStatus}</span>
        </div>
      </Card>
    </div>
  );
}

function OnlineWorkspaceGate({ user, onCreateWorkspace, onAcceptInvite, onLogout }) {
  const displayFallback = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ displayName:displayFallback, code:"" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = (k,v) => { setForm(f=>({...f,[k]:v})); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = mode === "create"
      ? await onCreateWorkspace(form.displayName)
      : await onAcceptInvite({ code:form.code, displayName:form.displayName });
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg} 0%,${C.bgAlt} 100%)`,fontFamily:F.body,color:C.ink,display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <GlobalStyles/>
      <Card style={{width:"100%",maxWidth:430,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:18}}>
          <div>
            <Eyebrow>Primeiro passo</Eyebrow>
            <div style={{fontFamily:F.display,fontSize:24,fontWeight:600,lineHeight:1.05}}>Espaço do casal</div>
            <div style={{fontSize:12.5,color:C.muted,marginTop:4,wordBreak:"break-word"}}>{user?.email}</div>
          </div>
          <button onClick={onLogout} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:9,cursor:"pointer",display:"flex"}}>
            <LogOut size={16} color={C.inkSoft}/>
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          <button type="button" onClick={()=>setMode("create")} style={{border:`1.5px solid ${mode==="create"?C.ink:C.border}`,background:mode==="create"?C.ink:C.surface,color:mode==="create"?"#F6F1E7":C.inkSoft,borderRadius:13,padding:"10px 12px",fontWeight:800,cursor:"pointer",fontFamily:F.body}}>Criar</button>
          <button type="button" onClick={()=>setMode("join")} style={{border:`1.5px solid ${mode==="join"?C.ink:C.border}`,background:mode==="join"?C.ink:C.surface,color:mode==="join"?"#F6F1E7":C.inkSoft,borderRadius:13,padding:"10px 12px",fontWeight:800,cursor:"pointer",fontFamily:F.body}}>Convite</button>
        </div>

        <form onSubmit={submit}>
          <Eyebrow style={{marginBottom:5}}>Seu nome</Eyebrow>
          <Input value={form.displayName} onChange={e=>s("displayName",e.target.value)} placeholder="Rubens" autoComplete="name" style={{marginBottom:10}}/>
          {mode==="join"&&(
            <>
              <Eyebrow style={{marginBottom:5}}>Código</Eyebrow>
              <Input value={form.code} onChange={e=>s("code",e.target.value.toUpperCase())} placeholder="ABC123" autoComplete="one-time-code" style={{marginBottom:14,textTransform:"uppercase",fontWeight:800,letterSpacing:1}}/>
            </>
          )}
          {error&&<div style={{fontSize:12.5,color:C.red,fontWeight:700,marginBottom:10}}>{error}</div>}
          <Btn variant="gold" disabled={busy} style={{width:"100%"}}>
            {busy ? <Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> : <ShieldCheck size={15}/>}
            {mode==="create" ? "Criar espaço" : "Entrar no espaço"}
          </Btn>
        </form>
      </Card>
    </div>
  );
}

function OnlineAdminPanel({ currentUser, workspace, members, data, syncStatus, lastSyncedAt, onCreateInvite, onRefresh, onLogout }) {
  const [role, setRole] = useState("member");
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const createInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setCopied(false);
    const result = await onCreateInvite(role);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setInvite(result.invite);
  };

  const copyInvite = async () => {
    const code = invite?.code || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(()=>setCopied(false),1800);
    } catch {
      setError("Não consegui copiar automaticamente.");
    }
  };

  return (
    <div className="su">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600}}>Admin</div>
          <div style={{fontSize:12,color:C.muted}}>Sessão: <b>{currentUser.name}</b></div>
        </div>
        <Btn variant="outline" small onClick={onLogout}><LogOut size={14}/> Sair</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <Card style={{padding:14,background:C.greenPale,border:`1px solid rgba(23,129,95,0.16)`}}>
          <Eyebrow style={{color:C.green}}>Lançamentos</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:C.green,marginTop:4}}>{data.transactions.length}</div>
        </Card>
        <Card style={{padding:14,background:C.plumPale,border:`1px solid rgba(91,75,178,0.15)`}}>
          <Eyebrow style={{color:C.plum}}>Membros</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:C.plum,marginTop:4}}>{members.length}</div>
        </Card>
      </div>

      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <Cloud size={17} color={C.caramelDeep}/>
          <div style={{fontFamily:F.display,fontSize:17,fontWeight:600}}>Supabase</div>
        </div>
        <div style={{fontSize:12.5,color:C.inkSoft,lineHeight:1.55}}>
          <div><b>Espaço:</b> {workspace?.name || "Finanças do Casal"}</div>
          <div><b>Status:</b> {syncStatus}</div>
          {lastSyncedAt&&<div><b>Último salvamento:</b> {new Date(lastSyncedAt).toLocaleString("pt-BR")}</div>}
        </div>
        <Btn variant="ghost" small onClick={onRefresh} style={{marginTop:12}}><RotateCcw size={14}/> Atualizar</Btn>
      </Card>

      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <UserPlus size={17} color={C.caramelDeep}/>
          <div style={{fontFamily:F.display,fontSize:17,fontWeight:600}}>Criar convite</div>
        </div>
        <form onSubmit={createInvite}>
          <Eyebrow style={{marginBottom:5}}>Perfil</Eyebrow>
          <Select value={role} onChange={e=>setRole(e.target.value)} style={{marginBottom:12}}>
            <option value="member">Membro</option>
            <option value="admin">Admin</option>
          </Select>
          {error&&<div style={{fontSize:12.5,color:C.red,fontWeight:700,marginBottom:10}}>{error}</div>}
          <Btn variant="gold" disabled={busy} style={{width:"100%"}}>
            {busy ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <UserPlus size={15}/>}
            Gerar convite
          </Btn>
        </form>
        {invite?.code&&(
          <div style={{marginTop:14,background:C.bluePale,border:`1px solid rgba(37,99,168,0.14)`,borderRadius:14,padding:12}}>
            <Eyebrow style={{color:C.blue,marginBottom:6}}>Código</Eyebrow>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:24,fontWeight:900,letterSpacing:2,color:C.blue,flex:1}}>{invite.code}</div>
              <button type="button" onClick={copyInvite} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:10,cursor:"pointer",display:"flex"}}>
                <Copy size={16} color={C.blue}/>
              </button>
            </div>
            <div style={{fontSize:11.5,color:C.muted,marginTop:6}}>
              {copied ? "Copiado." : `Perfil: ${invite.role==="admin"?"Admin":"Membro"}. Expira em ${new Date(invite.expires_at).toLocaleDateString("pt-BR")}.`}
            </div>
          </div>
        )}
      </Card>

      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <Users size={17} color={C.plum}/>
          <div style={{fontFamily:F.display,fontSize:17,fontWeight:600}}>Membros</div>
        </div>
        {members.map(member=>(
          <div key={member.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.hairline}`}}>
            <div style={{width:38,height:38,borderRadius:12,background:member.role==="admin"?C.greenPale:C.bgAlt,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {member.role==="admin"?<ShieldCheck size={17} color={C.caramelDeep}/>:<UserRound size={17} color={C.inkSoft}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:13.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{member.display_name || "Sem nome"}</div>
              <div style={{fontSize:11.5,color:C.muted}}>{member.role==="admin"?"admin":"membro"}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AuthGate({ auth, onCreateFirst, onLogin }) {
  const isSetup = auth.users.length === 0;
  const [form, setForm] = useState(isSetup
    ? { name:"Rubens", login:"rubens", password:"", confirm:"" }
    : { login:"", password:"" }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = (k,v) => { setForm(f=>({...f,[k]:v})); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = isSetup ? await onCreateFirst(form) : await onLogin(form);
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg} 0%,${C.bgAlt} 100%)`,fontFamily:F.body,color:C.ink,display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <GlobalStyles/>
      <Card style={{width:"100%",maxWidth:430,padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{width:48,height:48,borderRadius:14,background:C.greenPale,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <LockKeyhole size={22} color={C.caramelDeep}/>
          </div>
          <div>
            <Eyebrow>{isSetup ? "Primeiro acesso" : "Acesso privado"}</Eyebrow>
            <div style={{fontFamily:F.display,fontSize:24,fontWeight:600,lineHeight:1.05}}>Finanças do Casal</div>
          </div>
        </div>

        <form onSubmit={submit}>
          {isSetup&&(
            <>
              <Eyebrow style={{marginBottom:5}}>Nome do admin</Eyebrow>
              <Input value={form.name} onChange={e=>s("name",e.target.value)} placeholder="Rubens" style={{marginBottom:10}}/>
            </>
          )}
          <Eyebrow style={{marginBottom:5}}>Usuário</Eyebrow>
          <Input autoFocus value={form.login} onChange={e=>s("login",e.target.value)} placeholder="rubens" autoComplete="username" style={{marginBottom:10}}/>
          <Eyebrow style={{marginBottom:5}}>Senha</Eyebrow>
          <Input type="password" value={form.password} onChange={e=>s("password",e.target.value)} placeholder="Sua senha" autoComplete={isSetup?"new-password":"current-password"} style={{marginBottom:isSetup?10:14}}/>
          {isSetup&&(
            <>
              <Eyebrow style={{marginBottom:5}}>Confirmar senha</Eyebrow>
              <Input type="password" value={form.confirm} onChange={e=>s("confirm",e.target.value)} placeholder="Repita a senha" autoComplete="new-password" style={{marginBottom:14}}/>
            </>
          )}
          {error&&(
            <div style={{background:C.redPale,border:`1px solid rgba(194,65,58,0.18)`,borderRadius:12,padding:"10px 12px",fontSize:12.5,color:C.red,marginBottom:12,fontWeight:700}}>
              {error}
            </div>
          )}
          <Btn variant="gold" disabled={busy} style={{width:"100%"}}>
            {busy ? <Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> : <LockKeyhole size={15}/>}
            {isSetup ? "Criar admin e entrar" : "Entrar"}
          </Btn>
        </form>

        <div style={{marginTop:14,fontSize:12.3,lineHeight:1.5,color:C.muted,background:C.bluePale,border:`1px solid rgba(37,99,168,0.14)`,borderRadius:12,padding:"10px 12px",display:"flex",gap:8}}>
          <ShieldCheck size={15} color={C.blue} style={{flexShrink:0,marginTop:1}}/>
          <span>{isSetup ? "Crie o acesso principal deste aparelho. Depois, novos usuários ficam na aba Admin." : "Se precisar de outro usuário, peça para o admin criar o acesso na aba Admin."}</span>
        </div>
      </Card>
    </div>
  );
}

function AdminPanel({ auth, currentUser, data, onCreateUser, onDeleteUser, onLogout }) {
  const [form, setForm] = useState({ name:"Nayara", login:"nayara", password:"", role:"user" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = (k,v) => { setForm(f=>({...f,[k]:v})); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await onCreateUser(form);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setForm({ name:"", login:"", password:"", role:"user" });
  };

  return (
    <div className="su">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600}}>Admin</div>
          <div style={{fontSize:12,color:C.muted}}>Sessão: <b>{currentUser.name}</b></div>
        </div>
        <Btn variant="outline" small onClick={onLogout}><LogOut size={14}/> Sair</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <Card style={{padding:14,background:C.greenPale,border:`1px solid rgba(23,129,95,0.16)`}}>
          <Eyebrow style={{color:C.green}}>Lançamentos</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:C.green,marginTop:4}}>{data.transactions.length}</div>
        </Card>
        <Card style={{padding:14,background:C.plumPale,border:`1px solid rgba(91,75,178,0.15)`}}>
          <Eyebrow style={{color:C.plum}}>Acessos</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:C.plum,marginTop:4}}>{auth.users.length}</div>
        </Card>
      </div>

      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <UserPlus size={17} color={C.caramelDeep}/>
          <div style={{fontFamily:F.display,fontSize:17,fontWeight:600}}>Criar acesso</div>
        </div>
        <form onSubmit={submit}>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}>
              <Eyebrow style={{marginBottom:5}}>Nome</Eyebrow>
              <Input value={form.name} onChange={e=>s("name",e.target.value)} placeholder="Nayara"/>
            </div>
            <div style={{flex:1}}>
              <Eyebrow style={{marginBottom:5}}>Usuário</Eyebrow>
              <Input value={form.login} onChange={e=>s("login",e.target.value)} placeholder="nayara" autoComplete="off"/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1}}>
              <Eyebrow style={{marginBottom:5}}>Senha</Eyebrow>
              <Input type="password" value={form.password} onChange={e=>s("password",e.target.value)} placeholder="Senha" autoComplete="new-password"/>
            </div>
            <div style={{flex:1}}>
              <Eyebrow style={{marginBottom:5}}>Perfil</Eyebrow>
              <Select value={form.role} onChange={e=>s("role",e.target.value)}>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
          {error&&<div style={{fontSize:12.5,color:C.red,fontWeight:700,marginBottom:10}}>{error}</div>}
          <Btn variant="gold" disabled={busy} style={{width:"100%"}}>
            {busy ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <UserPlus size={15}/>}
            Criar usuário
          </Btn>
        </form>
      </Card>

      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <Users size={17} color={C.plum}/>
          <div style={{fontFamily:F.display,fontSize:17,fontWeight:600}}>Usuários</div>
        </div>
        {auth.users.map(user=>(
          <div key={user.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.hairline}`}}>
            <div style={{width:38,height:38,borderRadius:12,background:user.role==="admin"?C.greenPale:C.bgAlt,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {user.role==="admin"?<ShieldCheck size={17} color={C.caramelDeep}/>:<UserRound size={17} color={C.inkSoft}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:13.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
              <div style={{fontSize:11.5,color:C.muted}}>@{user.login} · {user.role==="admin"?"admin":"usuário"}</div>
            </div>
            {user.id!==currentUser.id&&(
              <button onClick={()=>onDeleteUser(user.id)} style={{background:C.redPale,border:"none",borderRadius:10,padding:8,cursor:"pointer",display:"flex"}}>
                <Trash2 size={14} color={C.red}/>
              </button>
            )}
          </div>
        ))}
      </Card>

      <div style={{background:C.amberPale,border:`1px solid rgba(154,106,16,0.16)`,borderRadius:14,padding:"12px 13px",fontSize:12.4,lineHeight:1.45,color:C.amber,display:"flex",gap:8}}>
        <ShieldCheck size={16} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
        <span>Proteção local ativa. Para senha centralizada entre celulares e bloqueio real no servidor, o próximo passo é conectar um banco online com autenticação.</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
function Dashboard({ tx, allTx, month, fixed, avatars, onNewAI, onNewNota, onNewManual, onOpenReports, onAddFixed, onDeleteFixed }) {
  const [calOpen, setCalOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);

  const gastos = tx.filter(t=>t.tipo==="gasto");
  const ganhos = tx.filter(t=>t.tipo==="ganho");
  const totalG = gastos.reduce((s,t)=>s+Number(t.valor),0);
  const totalR = ganhos.reduce((s,t)=>s+Number(t.valor),0);
  const saldo  = totalR-totalG;

  const prev = month.m===0?{y:month.y-1,m:11}:{y:month.y,m:month.m-1};
  const prevG = allTx.filter(t=>{const d=new Date(t.data+"T12:00:00");return t.tipo==="gasto"&&d.getFullYear()===prev.y&&d.getMonth()===prev.m;}).reduce((s,t)=>s+Number(t.valor),0);
  const diffPct = prevG>0?((totalG-prevG)/prevG)*100:null;

  const hoje = new Date();
  const diasCorridos = (month.y===hoje.getFullYear()&&month.m===hoje.getMonth())?hoje.getDate():new Date(month.y,month.m+1,0).getDate();
  const mediaDiaria = diasCorridos>0?totalG/diasCorridos:0;

  const byCat = Object.entries(gastos.reduce((a,t)=>{a[t.categoria]=(a[t.categoria]||0)+Number(t.valor);return a;},{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const byWeek = [1,2,3,4,5].map(w=>({
    name:`Sem ${w}`,
    gasto:gastos.filter(t=>Math.ceil(new Date(t.data+"T12:00:00").getDate()/7)===w).reduce((s,t)=>s+Number(t.valor),0),
    ganho:ganhos.filter(t=>Math.ceil(new Date(t.data+"T12:00:00").getDate()/7)===w).reduce((s,t)=>s+Number(t.valor),0),
  }));
  const byPerson = PEOPLE.map(p=>({name:p,gasto:gastos.filter(t=>t.pessoa===p).reduce((s,t)=>s+Number(t.valor),0)}));
  const topCat = byCat[0];
  const maiorCompra = [...gastos].sort((a,b)=>Number(b.valor)-Number(a.valor))[0];
  const supTotal = gastos.filter(t=>!t.necessario).reduce((s,t)=>s+Number(t.valor),0);

  return (
    <div className="su">
      {/* ── HERO ── */}
      <div style={{background:`linear-gradient(150deg,#102421 0%,#0B5D56 58%,#2563A8 130%)`,borderRadius:18,padding:"24px 22px",marginBottom:14,boxShadow:"0 16px 40px rgba(20,50,48,0.25)",position:"relative",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10.5,color:"rgba(255,255,255,0.62)",textTransform:"uppercase",letterSpacing:2,fontWeight:700}}>Saldo do mês</div>
            <div style={{fontFamily:F.display,fontSize:42,fontWeight:600,color:"#FFFFFF",letterSpacing:0,lineHeight:1.15,marginTop:4}}>
              {fmt(saldo)}
            </div>
          </div>
          <div style={{display:"flex"}}>
            <Avatar name={PEOPLE[0]} avatars={avatars} size={34}/>
            <div style={{marginLeft:-10}}><Avatar name={PEOPLE[1]} avatars={avatars} size={34}/></div>
          </div>
        </div>
        <div style={{display:"flex",gap:0,marginTop:18,borderTop:"1px solid rgba(255,255,255,0.20)",paddingTop:14}}>
          {[["Ganhos",fmtShort(totalR),"#A9F3D4"],["Gastos",fmtShort(totalG),"#FFD1C9"],["Média/dia",fmtShort(mediaDiaria),"#F7EDC7"]].map(([l,v,cor],i)=>(
            <div key={l} style={{flex:1,borderLeft:i>0?"1px solid rgba(255,255,255,0.18)":"none",paddingLeft:i>0?14:0}}>
              <div style={{fontSize:9.5,color:"rgba(255,255,255,0.58)",textTransform:"uppercase",letterSpacing:1.4,fontWeight:700}}>{l}</div>
              <div style={{fontFamily:F.display,fontSize:17,fontWeight:600,color:cor,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        {diffPct!==null&&(
          <div style={{marginTop:12,fontSize:11.5,color:"rgba(255,255,255,0.78)",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.20)",borderRadius:99,padding:"4px 12px",display:"inline-block",fontWeight:600}}>
            {diffPct<=0?"▾":"▴"} {Math.abs(diffPct).toFixed(0)}% em relação ao mês anterior
          </div>
        )}
      </div>

      {/* ── AÇÕES ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[
          {icon:Mic,label:"Falar",sub:"Agente",onClick:onNewAI,accent:C.plum,bg:C.plumPale},
          {icon:ReceiptText,label:"Recibo",sub:"Com foto",onClick:onNewNota,accent:C.caramelDeep,bg:C.greenPale},
          {icon:Plus,label:"Manual",sub:"Formulário",onClick:onNewManual,accent:C.inkSoft,bg:C.bgAlt},
          {icon:FileSpreadsheet,label:"Relatórios",sub:"PDF/XLS",onClick:onOpenReports,accent:C.blue,bg:C.bluePale},
        ].map(a=>(
          <button key={a.label} onClick={a.onClick} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,boxShadow:C.shadowSm,fontFamily:F.body,minWidth:0}}>
            <div style={{width:38,height:38,borderRadius:12,background:a.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <a.icon size={18} color={a.accent}/>
            </div>
            <div>
              <div style={{fontSize:12.5,fontWeight:800,color:C.ink}}>{a.label}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {tx.length===0 ? (
        <Card style={{textAlign:"center",padding:44}}>
          <div style={{fontFamily:F.display,fontSize:20,fontWeight:600,marginBottom:8,fontStyle:"italic",color:C.caramelDeep}}>Mês em branco</div>
          <div style={{fontSize:13.5,color:C.muted,lineHeight:1.6}}>Fale com o agente, fotografe um recibo<br/>ou lance manualmente o primeiro registro.</div>
        </Card>
      ):(
        <>
          {/* ── DESTAQUES ── */}
          <Eyebrow style={{marginBottom:8}}>Destaques do mês</Eyebrow>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {topCat&&(
              <Card style={{padding:14,background:C.goldPale,border:`1px solid rgba(181,121,63,0.18)`}}>
                <Eyebrow style={{color:C.caramelDeep}}>Top categoria</Eyebrow>
                <div style={{fontSize:22,margin:"6px 0 2px"}}>{EMOJI[topCat.name]||"📦"}</div>
                <div style={{fontWeight:800,fontSize:13.5,color:C.ink}}>{topCat.name}</div>
                <div style={{fontFamily:F.display,fontSize:16,fontWeight:600,color:C.caramelDeep}}>{fmt(topCat.value)}</div>
              </Card>
            )}
            {maiorCompra&&(
              <Card style={{padding:14,background:C.plumPale,border:`1px solid rgba(91,58,142,0.14)`}}>
                <Eyebrow style={{color:C.plum}}>Maior compra</Eyebrow>
                <div style={{fontSize:22,margin:"6px 0 2px"}}>{EMOJI[maiorCompra.categoria]||"📦"}</div>
                <div style={{fontWeight:800,fontSize:13.5,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{maiorCompra.descricao||maiorCompra.categoria}</div>
                <div style={{fontFamily:F.display,fontSize:16,fontWeight:600,color:C.plum}}>{fmt(maiorCompra.valor)}</div>
              </Card>
            )}
            {supTotal>0&&(
              <Card style={{padding:"10px 14px",gridColumn:"span 2",background:C.amberPale,border:`1px solid rgba(169,118,27,0.18)`,display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:18}}>⚠️</div>
                <div style={{fontSize:12.5,color:C.amber,fontWeight:600,lineHeight:1.4}}>
                  {((supTotal/totalG)*100).toFixed(0)}% dos gastos foram supérfluos — <span style={{fontFamily:F.display}}>{fmt(supTotal)}</span>
                </div>
              </Card>
            )}
          </div>

          {/* ── PIZZA ── */}
          {byCat.length>0&&(
            <Card style={{marginBottom:14}}>
              <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,marginBottom:10}}>Gastos por categoria</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <ResponsiveContainer width="48%" height={165}>
                  <PieChart>
                    <Pie data={byCat} dataKey="value" innerRadius={46} outerRadius={70} paddingAngle={2.5} stroke={C.surface} strokeWidth={2}>
                      {byCat.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{flex:1}}>
                  {byCat.slice(0,5).map((c,i)=>(
                    <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:12,color:C.inkSoft,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:8,height:8,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],display:"inline-block"}}/>
                        {c.name}
                      </span>
                      <span style={{fontSize:12.5,fontWeight:800,fontFamily:F.body}}>{fmtShort(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── BARRAS ── */}
          <Card style={{marginBottom:14}}>
            <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,marginBottom:10}}>Semana a semana</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={byWeek} barGap={3}>
                <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10.5,fontFamily:F.body}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip cursor={{fill:"rgba(120,90,50,0.05)"}} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,fontSize:12,boxShadow:C.shadow,fontFamily:F.body}} formatter={v=>fmt(v)}/>
                <Bar dataKey="gasto" name="Gastos" fill={C.caramelDeep} radius={[5,5,0,0]}/>
                <Bar dataKey="ganho" name="Ganhos" fill={C.gold} radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* ── POR PESSOA (com avatares) ── */}
          <Card style={{marginBottom:14}}>
            <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,marginBottom:12}}>Quem gastou o quê</div>
            {byPerson.map((p)=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Avatar name={p.name} avatars={avatars} size={40}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                    <span style={{fontWeight:700}}>{p.name}</span>
                    <span style={{fontFamily:F.display,fontWeight:600,color:PERSON_COLOR[p.name]}}>{fmt(p.gasto)}</span>
                  </div>
                  <div style={{background:C.bgAlt,borderRadius:99,height:7,overflow:"hidden"}}>
                    <div style={{width:`${totalG>0?Math.min(p.gasto/totalG*100,100):0}%`,height:"100%",background:PERSON_COLOR[p.name],borderRadius:99,transition:"width .6s ease"}}/>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ── CALENDÁRIO ── */}
      <Card style={{marginBottom:14}} onClick={()=>setCalOpen(!calOpen)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,display:"flex",gap:8,alignItems:"center"}}><Calendar size={16} color={C.caramelDeep}/> Calendário financeiro</div>
          <ChevronDown size={16} color={C.muted} style={{transform:calOpen?"rotate(180deg)":"none",transition:"transform .2s"}}/>
        </div>
        {calOpen&&<FinCalendar tx={tx} month={month}/>}
      </Card>

      {/* ── GASTOS FIXOS ── */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setFixOpen(!fixOpen)}>
          <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,display:"flex",gap:8,alignItems:"center"}}>
            <RotateCcw size={15} color={C.plum}/> Gastos fixos
            <span style={{fontFamily:F.body,background:C.plumPale,color:C.plum,fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:99}}>{fixed.length}</span>
          </div>
          <ChevronDown size={16} color={C.muted} style={{transform:fixOpen?"rotate(180deg)":"none",transition:"transform .2s"}}/>
        </div>
        {fixOpen&&<FixedSection fixed={fixed} onAdd={onAddFixed} onDelete={onDeleteFixed}/>}
      </Card>
    </div>
  );
}

/* ── CALENDÁRIO ── */
function FinCalendar({ tx, month }) {
  const firstDay = new Date(month.y,month.m,1).getDay();
  const totalDays = new Date(month.y,month.m+1,0).getDate();
  const byDay = tx.filter(t=>t.tipo==="gasto").reduce((a,t)=>{const d=Number(t.data.slice(8,10));a[d]=(a[d]||0)+Number(t.valor);return a;},{});
  const maxVal = Math.max(...Object.values(byDay),1);
  const cells = Array.from({length:Math.ceil((firstDay+totalDays)/7)*7},(_,i)=>{const d=i-firstDay+1;return d>=1&&d<=totalDays?d:null;});
  return (
    <div style={{marginTop:14}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:5}}>
        {["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:700}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((day,i)=>{
          const v = day?byDay[day]||0:0;
          const t = v>0?0.18+0.82*(v/maxVal):0;
          const bg = day ? (v>0 ? `rgba(143,90,43,${t})` : "rgba(84,60,32,0.04)") : "transparent";
          return (
            <div key={i} style={{aspectRatio:"1",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",background:bg,border:day?`1px solid ${C.hairline}`:"none"}}>
              {day&&<div style={{fontSize:10,fontWeight:700,color:t>0.5?"#FFF8ED":C.muted,lineHeight:1}}>{day}</div>}
              {day&&v>0&&<div style={{fontSize:7.5,color:t>0.5?"rgba(255,248,237,0.85)":C.caramelDeep,fontWeight:600}}>{fmtShort(v).replace("R$ ","")}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── GASTOS FIXOS ── */
function FixedSection({ fixed, onAdd, onDelete }) {
  const [form, setForm] = useState({nome:"",valor:"",dia:1,categoria:"Energia"});
  const [adding, setAdding] = useState(false);
  const total = fixed.reduce((s,f)=>s+Number(f.valor),0);
  return (
    <div style={{marginTop:12}} onClick={e=>e.stopPropagation()}>
      {fixed.map(f=>(
        <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.hairline}`}}>
          <div style={{fontSize:18}}>{EMOJI[f.categoria]||"🔁"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:700}}>{f.nome}</div>
            <div style={{fontSize:11,color:C.muted}}>Vence dia {f.dia}</div>
          </div>
          <div style={{fontFamily:F.display,fontSize:14.5,fontWeight:600,color:C.plum}}>{fmt(f.valor)}</div>
          <button onClick={()=>onDelete(f.id)} style={{background:C.redPale,border:"none",borderRadius:9,padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={13} color={C.red}/></button>
        </div>
      ))}
      {fixed.length>0&&<div style={{fontSize:12,fontWeight:700,color:C.plum,marginTop:10,textAlign:"right"}}>Total fixo: <span style={{fontFamily:F.display,fontSize:14}}>{fmt(total)}</span>/mês</div>}
      {adding?(
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8}}>
            <Input placeholder="Nome (ex: Internet)" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={{flex:2}}/>
            <Input type="number" placeholder="Valor" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} style={{flex:1}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Input type="number" min={1} max={31} placeholder="Dia" value={form.dia} onChange={e=>setForm({...form,dia:Number(e.target.value)})} style={{flex:1}}/>
            <Select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={{flex:2}}>{CAT_GASTO.map(c=><option key={c}>{c}</option>)}</Select>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="outline" small onClick={()=>setAdding(false)} style={{flex:1}}>Cancelar</Btn>
            <Btn variant="gold" small onClick={()=>{if(form.nome&&form.valor){onAdd(form);setForm({nome:"",valor:"",dia:1,categoria:"Energia"});setAdding(false);}}} style={{flex:2}}><Check size={14}/> Salvar</Btn>
          </div>
        </div>
      ):(
        <Btn variant="ghost" small onClick={()=>setAdding(true)} style={{width:"100%",marginTop:10}}><Plus size={14} color={C.caramelDeep}/> Adicionar conta fixa</Btn>
      )}
      {fixed.length===0&&!adding&&<div style={{fontSize:12.5,color:C.muted,textAlign:"center",padding:"6px 0"}}>Nenhuma conta fixa cadastrada.</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   EXTRATO
═══════════════════════════════════════════════ */
function Extrato({ tx, avatars, onDelete, onEdit, onViewPhoto }) {
  const [filter, setFilter] = useState("todos");
  const filtered = tx.filter(t=>filter==="todos"||t.tipo===filter);
  const groups = filtered.reduce((a,t)=>{(a[t.data]=a[t.data]||[]).push(t);return a;},{});
  const dates = Object.keys(groups).sort().reverse();
  const totalG = tx.filter(t=>t.tipo==="gasto").reduce((s,t)=>s+Number(t.valor),0);
  const totalR = tx.filter(t=>t.tipo==="ganho").reduce((s,t)=>s+Number(t.valor),0);
  return (
    <div className="su">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Card style={{padding:14,background:C.greenPale,border:"1px solid rgba(47,125,91,0.15)"}}>
          <Eyebrow style={{color:C.green}}>Ganhos</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.green,marginTop:3}}>{fmtShort(totalR)}</div>
        </Card>
        <Card style={{padding:14,background:C.redPale,border:"1px solid rgba(179,64,47,0.12)"}}>
          <Eyebrow style={{color:C.red}}>Gastos</Eyebrow>
          <div style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.red,marginTop:3}}>{fmtShort(totalG)}</div>
        </Card>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["todos","Todos"],["gasto","Gastos"],["ganho","Ganhos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{flex:1,padding:"9px 0",borderRadius:12,border:`1.5px solid ${filter===v?C.ink:C.border}`,background:filter===v?C.ink:C.surface,color:filter===v?"#F6F1E7":C.muted,fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:F.body}}>{l}</button>
        ))}
      </div>
      {dates.length===0&&<Card style={{textAlign:"center",padding:36,color:C.muted,fontSize:13.5}}>Nenhum lançamento neste mês.</Card>}
      {dates.map(d=>(
        <div key={d} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,padding:"0 4px"}}>
            <Eyebrow style={{textTransform:"capitalize",letterSpacing:0.8}}>{dayLabel(d)}</Eyebrow>
            <span style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.inkSoft}}>{fmt(groups[d].filter(t=>t.tipo==="gasto").reduce((s,t)=>s+Number(t.valor),0))}</span>
          </div>
          <Card style={{padding:"4px 16px"}}>
            {groups[d].map(t=><TxRow key={t.id} t={t} avatars={avatars} onDelete={onDelete} onEdit={onEdit} onViewPhoto={onViewPhoto}/>)}
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ── TX ROW (com avatar da pessoa e foto) ── */
function TxRow({ t, avatars, onDelete, onEdit, onViewPhoto }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:`1px solid ${C.hairline}`}}>
      <div style={{position:"relative",flexShrink:0}}>
        <div style={{width:40,height:40,borderRadius:13,background:t.tipo==="ganho"?C.greenPale:C.bgAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
          {EMOJI[t.categoria]||"📦"}
        </div>
        <div style={{position:"absolute",bottom:-4,right:-4}}>
          <Avatar name={t.pessoa} avatars={avatars} size={20} ring={false}/>
        </div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.descricao||t.categoria}</div>
        <div style={{fontSize:11,color:C.muted,display:"flex",gap:5,alignItems:"center",marginTop:1}}>
          <span>{t.pagamento}</span>
          {!t.necessario&&<span style={{background:C.amberPale,color:C.amber,padding:"1px 6px",borderRadius:99,fontWeight:600,fontSize:10}}>supérfluo</span>}
          {t.foto&&(
            <button onClick={()=>onViewPhoto&&onViewPhoto(t.id)} style={{background:C.plumPale,border:"none",borderRadius:99,padding:"1px 7px",color:C.plum,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
              <Camera size={9}/> foto
            </button>
          )}
        </div>
      </div>
      <div style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:t.tipo==="ganho"?C.green:C.ink,flexShrink:0}}>
        {t.tipo==="ganho"?"+":"−"}{fmtShort(t.valor)}
      </div>
      {onEdit&&<button onClick={()=>onEdit(t)} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",padding:3}}><Pencil size={14}/></button>}
      {onDelete&&<button onClick={()=>{if(window.confirm("Excluir este lançamento?"))onDelete(t.id)}} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",padding:3}}><Trash2 size={14}/></button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   METAS
═══════════════════════════════════════════════ */
function Metas({ goals, onAdd, onUpdate, onDelete }) {
  const [form, setForm] = useState(null);
  const [deposit, setDeposit] = useState({id:null,val:""});
  const totalSaved = goals.reduce((s,g)=>s+Number(g.saved||0),0);
  return (
    <div className="su">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:F.display,fontSize:20,fontWeight:600}}>Metas</div>
          <div style={{fontSize:12,color:C.muted}}>Guardado ao todo: <span style={{fontFamily:F.display,fontWeight:600,color:C.caramelDeep}}>{fmt(totalSaved)}</span></div>
        </div>
        <Btn variant="gold" small onClick={()=>setForm({nome:"",emoji:"🏖️",alvo:"",saved:0,prazo:""})}><Plus size={14}/> Nova</Btn>
      </div>
      {goals.length===0&&!form&&(
        <Card style={{textAlign:"center",padding:44}}>
          <div style={{fontSize:44,marginBottom:10}}>🎯</div>
          <div style={{fontFamily:F.display,fontSize:18,fontWeight:600,marginBottom:6}}>Nenhuma meta ainda</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:18,lineHeight:1.6}}>Crie um objetivo — viagem, reserva, casa —<br/>e acompanhe o progresso do casal.</div>
          <Btn variant="gold" onClick={()=>setForm({nome:"",emoji:"🏖️",alvo:"",saved:0,prazo:""})} style={{margin:"0 auto"}}><Plus size={15}/> Criar primeira meta</Btn>
        </Card>
      )}
      {goals.map(g=>{
        const pct = g.alvo>0?Math.min((g.saved||0)/g.alvo*100,100):0;
        return (
          <Card key={g.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:48,height:48,borderRadius:14,background:C.goldPale,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{g.emoji}</div>
                <div>
                  <div style={{fontFamily:F.display,fontWeight:600,fontSize:16}}>{g.nome}</div>
                  {g.prazo&&<div style={{fontSize:11.5,color:C.muted}}>até {new Date(g.prazo+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}</div>}
                </div>
              </div>
              <button onClick={()=>{if(window.confirm("Excluir esta meta?"))onDelete(g.id)}} style={{background:C.redPale,border:"none",borderRadius:9,padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={13} color={C.red}/></button>
            </div>
            <div style={{margin:"14px 0 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                <span style={{fontFamily:F.display,fontSize:17,fontWeight:600,color:C.caramelDeep}}>{fmt(g.saved||0)}</span>
                <span style={{fontSize:12,color:C.muted}}>de {fmt(g.alvo)} · <b>{pct.toFixed(0)}%</b></span>
              </div>
              <div style={{background:C.bgAlt,borderRadius:99,height:10,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.caramelDeep},${C.gold})`,borderRadius:99,transition:"width .6s ease"}}/>
              </div>
            </div>
            {deposit.id===g.id?(
              <div style={{display:"flex",gap:8}}>
                <Input type="number" placeholder="Valor a guardar" value={deposit.val} onChange={e=>setDeposit({...deposit,val:e.target.value})} style={{flex:1}}/>
                <Btn variant="gold" small onClick={()=>{onUpdate({...g,saved:Number(g.saved||0)+Number(deposit.val||0)});setDeposit({id:null,val:""});}}><Check size={14}/></Btn>
                <Btn variant="outline" small onClick={()=>setDeposit({id:null,val:""})}><X size={14}/></Btn>
              </div>
            ):(
              <Btn variant="ghost" small onClick={()=>setDeposit({id:g.id,val:""})} style={{width:"100%"}}><Plus size={13} color={C.caramelDeep}/> Guardar valor</Btn>
            )}
          </Card>
        );
      })}
      {form&&(
        <Card style={{border:`2px dashed ${C.gold}`,background:"#FDF9F0"}}>
          <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,marginBottom:12}}>Nova meta</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {GOAL_EMOJIS.map(e=>(
              <button key={e} onClick={()=>setForm({...form,emoji:e})} style={{fontSize:22,background:form.emoji===e?C.goldPale:"transparent",border:form.emoji===e?`2px solid ${C.gold}`:"2px solid transparent",borderRadius:10,cursor:"pointer",padding:4}}>{e}</button>
            ))}
          </div>
          <Input placeholder="Nome da meta (ex: Viagem)" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Input type="number" placeholder="Valor alvo (R$)" value={form.alvo} onChange={e=>setForm({...form,alvo:Number(e.target.value)})} style={{flex:1}}/>
            <Input type="month" value={form.prazo?form.prazo.slice(0,7):""} onChange={e=>setForm({...form,prazo:e.target.value+"-01"})} style={{flex:1}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="outline" onClick={()=>setForm(null)} style={{flex:1}}>Cancelar</Btn>
            <Btn variant="gold" onClick={()=>{if(form.nome&&form.alvo){onAdd(form);setForm(null);}}} style={{flex:2}}><Check size={15}/> Criar meta</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AGENTE POR VOZ / TEXTO
═══════════════════════════════════════════════ */
function AISheet({ onClose, onConfirm, defaultPerson, avatars, onOpenNota }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const recRef = useRef(null);

  const speechOK = typeof window!=="undefined"&&(window.SpeechRecognition||window.webkitSpeechRecognition);
  const toggleMic = () => {
    if(listening){ recRef.current?.stop(); setListening(false); return; }
    if(!speechOK){ setError("Microfone indisponível neste navegador — digite a frase."); return; }
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const r = new SR(); r.lang="pt-BR"; r.interimResults=true;
    r.onresult=e=>setText(Array.from(e.results).map(x=>x[0].transcript).join(""));
    r.onend=()=>setListening(false);
    r.onerror=()=>{setListening(false);setError("Não consegui ouvir. Tente de novo.");};
    recRef.current=r; setError(""); setListening(true); r.start();
  };

  const interpret = async () => {
    if(!text.trim())return;
    setLoading(true); setError("");
    try{
      const tx = interpretFinancialText(text, defaultPerson);
      setPending(tx);
    }catch{ setError('Não consegui interpretar. Ex.: "Gastei 50 reais no mercado no Pix".'); }
    setLoading(false);
  };

  return (
    <Sheet onClose={onClose} title={pending?"Confirme o lançamento":"Lançamento inteligente"}>
      {!pending?(
        <>
          <div style={{background:C.greenPale,border:`1px solid rgba(15,118,110,0.16)`,borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:C.caramelDeep,lineHeight:1.5}}>
            Fale naturalmente: <em style={{fontFamily:F.display}}>"Comprei pão e leite no mercado, 48 reais no Pix"</em>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder='"Abasteci o carro com 250 reais no débito"' style={{...inputStyle,resize:"none",marginBottom:6}}/>
          {error&&<div style={{color:C.red,fontSize:12.5,marginBottom:8}}>{error}</div>}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={toggleMic} style={{flex:1,padding:14,borderRadius:16,border:`1.5px solid ${listening?C.red:C.border}`,background:listening?C.redPale:"#FBF7EE",color:listening?C.red:C.inkSoft,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:F.body}}>
              <Mic size={17}/> {listening?"Ouvindo…":"Falar"}
            </button>
            <Btn variant="dark" onClick={interpret} disabled={loading||!text.trim()} style={{flex:1}}>
              {loading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<Sparkles size={16} color={C.gold}/>}
              {loading?"Lendo…":"Interpretar"}
            </Btn>
          </div>
          <button onClick={onOpenNota} style={{width:"100%",marginTop:12,background:"none",border:`1.5px dashed ${C.border}`,borderRadius:12,padding:12,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:F.body}}>
            <ReceiptText size={15}/> Prefiro fotografar a nota fiscal
          </button>
        </>
      ):(
        <TxForm tx={pending} avatars={avatars} onChange={setPending} onCancel={()=>setPending(null)} onSave={()=>onConfirm({...pending,valor:Number(pending.valor)})} saveLabel="Confirmar e salvar"/>
      )}
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   NOTA FISCAL / RECIBO COM FOTO
═══════════════════════════════════════════════ */
function NotaSheet({ onClose, onConfirm, defaultPerson, avatars }) {
  const [foto, setFoto] = useState(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    setError("");
    try{ setFoto(await compressImage(f, 1280, 0.8)); }
    catch{ setError("Não consegui carregar a imagem."); }
  };

  const criarLancamento = () => {
    if(!foto) return;
    setPending({
      tipo:"gasto",
      valor:"",
      categoria:"Mercado",
      descricao:"Nota fiscal / recibo",
      pagamento:"Pix",
      pessoa:defaultPerson,
      data:todayISO(),
      necessario:true,
    });
  };

  return (
    <Sheet onClose={onClose} title={pending?"Confira os dados do recibo":"Recibo com foto"}>
      {!pending?(
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{display:"none"}}/>
          {!foto?(
            <button onClick={()=>fileRef.current?.click()} style={{width:"100%",border:`2px dashed ${C.caramel}`,background:C.greenPale,borderRadius:16,padding:"40px 20px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              <div style={{width:60,height:60,borderRadius:14,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:C.shadowSm}}>
                <Camera size={26} color={C.caramelDeep}/>
              </div>
              <div style={{fontFamily:F.display,fontSize:17,fontWeight:600,color:C.caramelDeep}}>Fotografar recibo</div>
              <div style={{fontSize:12.5,color:C.muted,fontFamily:F.body}}>A foto fica anexada ao lançamento para conferência</div>
            </button>
          ):(
            <>
              <div style={{position:"relative",marginBottom:14}}>
                <img src={foto} alt="Nota" style={{width:"100%",maxHeight:300,objectFit:"contain",borderRadius:16,background:C.bgAlt,display:"block"}}/>
                <button onClick={()=>{setFoto(null);setError("");}} style={{position:"absolute",top:8,right:8,background:"rgba(42,32,24,0.75)",border:"none",borderRadius:99,width:30,height:30,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15}/></button>
              </div>
              {error&&<div style={{color:C.red,fontSize:12.5,marginBottom:10}}>{error}</div>}
              <div style={{display:"flex",gap:8}}>
                <Btn variant="outline" onClick={()=>fileRef.current?.click()} style={{flex:1}}><Camera size={15}/> Trocar</Btn>
                <Btn variant="gold" onClick={criarLancamento} style={{flex:2}}>
                  <Pencil size={16}/>
                  Preencher dados
                </Btn>
              </div>
            </>
          )}
        </>
      ):(
        <>
          <TxForm tx={pending} avatars={avatars} onChange={setPending} onCancel={()=>setPending(null)} onSave={()=>onConfirm({...pending,valor:Number(pending.valor)}, foto)} saveLabel="Salvar com a foto"/>
        </>
      )}
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   FORM DE LANÇAMENTO (+ anexar foto)
═══════════════════════════════════════════════ */
function EditSheet({ tx, avatars, onClose, onSave }) {
  const [form, setForm] = useState({...tx});
  const [foto, setFoto] = useState(null);
  const [fotoRemovida, setFotoRemovida] = useState(false);
  const [fotoExistente, setFotoExistente] = useState(null);
  const fileRef = useRef(null);

  useEffect(()=>{ if(tx.id&&tx.foto) loadPhoto(tx.id).then(setFotoExistente); },[tx]);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    setFoto(await compressImage(f, 1100, 0.75));
    setFotoRemovida(false);
  };
  const fotoAtual = foto || (!fotoRemovida && fotoExistente);

  return (
    <Sheet onClose={onClose} title={tx.id?"Editar lançamento":"Novo lançamento"}>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{display:"none"}}/>
      {fotoAtual?(
        <div style={{position:"relative",marginBottom:14}}>
          <img src={fotoAtual} alt="Anexo" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:16,display:"block"}}/>
          <button onClick={()=>{setFoto(null);setFotoRemovida(true);}} style={{position:"absolute",top:8,right:8,background:"rgba(42,32,24,0.75)",border:"none",borderRadius:99,width:30,height:30,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={14}/></button>
        </div>
      ):(
        <button onClick={()=>fileRef.current?.click()} style={{width:"100%",border:`1.5px dashed ${C.border}`,background:"#FBF7EE",borderRadius:14,padding:12,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14,fontFamily:F.body}}>
          <ImagePlus size={16} color={C.caramelDeep}/> Anexar foto (recibo, produto…)
        </button>
      )}
      <TxForm tx={form} avatars={avatars} onChange={setForm} onCancel={onClose}
        onSave={()=>{if(Number(form.valor)>0)onSave({...form,valor:Number(form.valor)}, foto, fotoRemovida&&!foto);}}
        saveLabel={tx.id?"Salvar alterações":"Salvar"}/>
    </Sheet>
  );
}

function TxForm({ tx, avatars, onChange, onCancel, onSave, saveLabel }) {
  const cats = tx.tipo==="ganho"?CAT_GANHO:CAT_GASTO;
  const s=(k,v)=>onChange({...tx,[k]:v});
  return (
    <>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["gasto","Gasto"],["ganho","Ganho"]].map(([tp,lb])=>(
          <button key={tp} onClick={()=>s("tipo",tp)} style={{flex:1,padding:11,borderRadius:14,border:`1.5px solid ${tx.tipo===tp?C.ink:C.border}`,background:tx.tipo===tp?C.ink:"#FBF7EE",color:tx.tipo===tp?"#F6F1E7":C.muted,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:F.body}}>{lb}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1.2}}>
          <Eyebrow style={{marginBottom:4}}>Valor</Eyebrow>
          <Input type="number" inputMode="decimal" value={tx.valor} onChange={e=>s("valor",e.target.value)} placeholder="0,00" style={{fontFamily:F.display,fontSize:18,fontWeight:600}}/>
        </div>
        <div style={{flex:1}}>
          <Eyebrow style={{marginBottom:4}}>Data</Eyebrow>
          <Input type="date" value={tx.data} onChange={e=>s("data",e.target.value)}/>
        </div>
      </div>
      <div style={{marginTop:10}}>
        <Eyebrow style={{marginBottom:4}}>Descrição</Eyebrow>
        <Input value={tx.descricao} onChange={e=>s("descricao",e.target.value)} placeholder="Ex.: compras da semana"/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <div style={{flex:1}}>
          <Eyebrow style={{marginBottom:4}}>Categoria</Eyebrow>
          <Select value={tx.categoria} onChange={e=>s("categoria",e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</Select>
        </div>
        <div style={{flex:1}}>
          <Eyebrow style={{marginBottom:4}}>Pagamento</Eyebrow>
          <Select value={tx.pagamento} onChange={e=>s("pagamento",e.target.value)}>{PAYMENTS.map(p=><option key={p}>{p}</option>)}</Select>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <Eyebrow style={{marginBottom:6}}>Quem foi</Eyebrow>
        <div style={{display:"flex",gap:8}}>
          {PEOPLE.map(p=>(
            <button key={p} onClick={()=>s("pessoa",p)} style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:14,border:`1.5px solid ${tx.pessoa===p?PERSON_COLOR[p]:C.border}`,background:tx.pessoa===p?(p===PEOPLE[0]?C.goldPale:C.plumPale):"#FBF7EE",cursor:"pointer",fontFamily:F.body}}>
              <Avatar name={p} avatars={avatars} size={28} ring={false}/>
              <span style={{fontWeight:700,fontSize:13,color:tx.pessoa===p?PERSON_COLOR[p]:C.muted}}>{p}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{marginTop:10}}>
        <Eyebrow style={{marginBottom:4}}>Classificação</Eyebrow>
        <Select value={tx.necessario?"sim":"nao"} onChange={e=>s("necessario",e.target.value==="sim")}>
          <option value="sim">Necessário</option>
          <option value="nao">Supérfluo</option>
        </Select>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <Btn variant="outline" onClick={onCancel} style={{flex:1}}>Cancelar</Btn>
        <Btn variant="gold" onClick={onSave} style={{flex:2}}><Check size={15}/>{saveLabel}</Btn>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   AGENTE FINANCEIRO
═══════════════════════════════════════════════ */
function ChatIA({ transactions, fixedExpenses, goals }) {
  const [msgs, setMsgs] = useState([{role:"ai",text:"Olá! Sou o agente financeiro de vocês.\n\nPergunte, por exemplo:\n• Quanto gastamos em mercado esse mês?\n• Faça um resumo do mês\n• Onde podemos economizar?\n• Quanto a Nayara gastou com delivery?\n• Como estão as metas?"}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const send = async () => {
    const q = input.trim();
    if(!q||loading)return;
    setMsgs(m=>[...m,{role:"user",text:q}]); setInput(""); setLoading(true);
    try{
      const r = answerFinanceQuestion(q, transactions, fixedExpenses, goals);
      setMsgs(m=>[...m,{role:"ai",text:r||"Não consegui responder agora."}]);
    }catch{ setMsgs(m=>[...m,{role:"ai",text:"Não consegui analisar essa pergunta. Tente pedir resumo, economia, meta, contas fixas ou uma categoria específica."}]); }
    setLoading(false);
  };

  return (
    <div className="su" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 300px)",minHeight:360}}>
      <div style={{flex:1,overflowY:"auto",paddingBottom:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,alignItems:"flex-end",gap:8}}>
            {m.role==="ai"&&<div style={{width:32,height:32,borderRadius:999,background:C.greenPale,border:`1.5px solid ${C.caramel}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}><BrainCircuit size={16} color={C.caramelDeep}/></div>}
            <div style={{maxWidth:"80%",padding:"11px 15px",borderRadius:18,fontSize:14,lineHeight:1.65,whiteSpace:"pre-wrap",background:m.role==="user"?C.ink:C.surface,color:m.role==="user"?"#F6F1E7":C.ink,border:m.role==="ai"?`1px solid ${C.border}`:"none",boxShadow:m.role==="ai"?C.shadowSm:"none",borderBottomRightRadius:m.role==="user"?4:18,borderBottomLeftRadius:m.role==="user"?18:4}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:13}}>
            <div style={{width:32,height:32,borderRadius:999,background:C.greenPale,border:`1.5px solid ${C.caramel}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}><BrainCircuit size={16} color={C.caramelDeep}/></div>
            <Loader2 size={13} style={{animation:"spin 1s linear infinite",color:C.gold}}/> analisando…
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:8,paddingTop:10}}>
        <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pergunte ao agente financeiro…" style={{flex:1}}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{width:48,borderRadius:14,border:"none",background:C.ink,color:C.gold,cursor:"pointer",opacity:loading||!input.trim()?0.45:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Send size={17}/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RELATÓRIOS E EXPORTAÇÃO
═══════════════════════════════════════════════ */
function ReportSheet({ data, month, person, onClose, onImport }) {
  const fileRef = useRef(null);
  const report = useMemo(
    ()=>buildFinancialReport(data.transactions, data.fixedExpenses, data.goals, month, person),
    [data.transactions,data.fixedExpenses,data.goals,month,person]
  );

  const importBackupFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      onImport(parsed);
    } catch {
      alert("Não consegui importar esse backup. Confira se é um JSON exportado pelo app.");
    } finally {
      e.target.value = "";
    }
  };

  const exportActions = [
    { icon:FileSpreadsheet, label:"Excel", hint:"Planilha organizada", onClick:()=>exportReportExcel(report), color:C.green, bg:C.greenPale },
    { icon:FileText, label:"PDF", hint:"Relatório pronto", onClick:()=>exportReportPDF(report), color:C.red, bg:C.redPale },
    { icon:Download, label:"CSV", hint:"Extrato simples", onClick:()=>exportReportCSV(report), color:C.blue, bg:C.bluePale },
    { icon:Printer, label:"Imprimir", hint:"Salvar como PDF", onClick:()=>printReport(report), color:C.plum, bg:C.plumPale },
  ];

  return (
    <Sheet title="Relatórios e exportação" onClose={onClose}>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importBackupFile} style={{display:"none"}}/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          ["Ganhos", report.totalGanhos, C.green, C.greenPale],
          ["Gastos", report.totalGastos, C.red, C.redPale],
          ["Saldo", report.saldo, report.saldo>=0?C.green:C.red, report.saldo>=0?C.greenPale:C.redPale],
          ["Supérfluos", report.supTotal, C.amber, C.amberPale],
        ].map(([label,value,color,bg])=>(
          <div key={label} style={{background:bg,border:`1px solid ${C.border}`,borderRadius:12,padding:12}}>
            <Eyebrow style={{color}}>{label}</Eyebrow>
            <div style={{fontFamily:F.display,fontWeight:600,fontSize:18,color,marginTop:4}}>{fmt(value)}</div>
          </div>
        ))}
      </div>

      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <BrainCircuit size={17} color={C.caramelDeep}/>
          <div style={{fontFamily:F.display,fontWeight:600,fontSize:16}}>Leitura do agente</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {report.insights.map((insight,i)=>(
            <div key={i} style={{fontSize:12.8,lineHeight:1.45,color:C.inkSoft,display:"flex",gap:8}}>
              <span style={{width:18,height:18,borderRadius:99,background:C.greenPale,color:C.caramelDeep,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {exportActions.map(action=>(
          <button key={action.label} onClick={action.onClick} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",fontFamily:F.body}}>
            <span style={{width:36,height:36,borderRadius:10,background:action.bg,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <action.icon size={17} color={action.color}/>
            </span>
            <span style={{minWidth:0}}>
              <span style={{display:"block",fontWeight:800,fontSize:13,color:C.ink}}>{action.label}</span>
              <span style={{display:"block",fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{action.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Btn variant="ghost" onClick={()=>exportBackup(data)} style={{width:"100%"}}>
          <Database size={15} color={C.caramelDeep}/> Backup JSON
        </Btn>
        <Btn variant="outline" onClick={()=>fileRef.current?.click()} style={{width:"100%"}}>
          <Upload size={15}/> Importar
        </Btn>
      </div>

      <div style={{marginTop:12,background:C.bluePale,border:`1px solid rgba(37,99,168,0.16)`,borderRadius:12,padding:"11px 12px",fontSize:12.4,lineHeight:1.45,color:C.inkSoft,display:"flex",gap:8}}>
        <ShieldCheck size={16} color={C.blue} style={{flexShrink:0,marginTop:1}}/>
        <span>Os dados ficam no navegador deste aparelho. Para compartilhar entre celulares sem banco online, exporte o backup JSON e importe no outro aparelho.</span>
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   BUSCA
═══════════════════════════════════════════════ */
function SearchModal({ transactions, avatars, onClose, onEdit, onDelete, onViewPhoto }) {
  const [q, setQ] = useState("");
  const results = useMemo(()=>{
    if(!q.trim())return[];
    const t=q.toLowerCase();
    return transactions.filter(tx=>
      (tx.descricao||"").toLowerCase().includes(t)||(tx.categoria||"").toLowerCase().includes(t)||
      (tx.pessoa||"").toLowerCase().includes(t)||(tx.pagamento||"").toLowerCase().includes(t)||
      String(tx.valor).includes(t)||(tx.data||"").includes(t)
    ).slice(0,30);
  },[q,transactions]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(42,32,24,0.35)",backdropFilter:"blur(5px)",zIndex:60,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"14px 16px"}}>
      <div className="su" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:C.surface,borderRadius:24,border:`1px solid ${C.border}`,boxShadow:C.shadow,padding:16,maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <Input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar: mercado, Pix, Nayara, 2026-06…" style={{flex:1}}/>
          <button onClick={onClose} style={{background:C.bgAlt,border:`1px solid ${C.border}`,borderRadius:12,padding:"0 13px",cursor:"pointer",color:C.muted,display:"flex",alignItems:"center"}}><X size={16}/></button>
        </div>
        {q&&results.length===0&&<div style={{textAlign:"center",color:C.muted,padding:24,fontSize:13}}>Nenhum resultado.</div>}
        {results.map(t=><TxRow key={t.id} t={t} avatars={avatars} onEdit={onEdit} onDelete={onDelete} onViewPhoto={onViewPhoto}/>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PERFIS — FOTOS DO CASAL
═══════════════════════════════════════════════ */
function ProfileSheet({ avatars, onSetAvatar, onClose }) {
  const refs = { [PEOPLE[0]]: useRef(null), [PEOPLE[1]]: useRef(null) };
  return (
    <Sheet onClose={onClose} title="Fotos do casal">
      <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>
        As fotos identificam quem fez cada lançamento em todo o aplicativo — no extrato, nos gráficos e nos gastos por pessoa.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {PEOPLE.map(p=>(
          <div key={p} style={{textAlign:"center"}}>
            <input ref={refs[p]} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)onSetAvatar(p,f);}} style={{display:"none"}}/>
            <button onClick={()=>refs[p].current?.click()} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <Avatar name={p} avatars={avatars} size={96}/>
                <div style={{position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:99,background:PERSON_COLOR[p],display:"flex",alignItems:"center",justifyContent:"center",border:`2.5px solid ${C.surface}`}}>
                  <Camera size={14} color="#fff"/>
                </div>
              </div>
            </button>
            <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,marginTop:10}}>{p}</div>
            <button onClick={()=>refs[p].current?.click()} style={{background:"none",border:"none",color:C.caramelDeep,fontSize:12,fontWeight:700,cursor:"pointer",marginTop:2,fontFamily:F.body}}>
              {avatars?.[p]?"Trocar foto":"Adicionar foto"}
            </button>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   VISUALIZADOR DE FOTO DO LANÇAMENTO
═══════════════════════════════════════════════ */
function PhotoViewer({ txId, onClose }) {
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ loadPhoto(txId).then(f=>{setFoto(f);setLoading(false);}); },[txId]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(24,18,12,0.85)",backdropFilter:"blur(6px)",zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      {loading?(
        <Loader2 size={28} color={C.gold} style={{animation:"spin 1s linear infinite"}}/>
      ):foto?(
        <img src={foto} alt="Foto do lançamento" style={{maxWidth:"100%",maxHeight:"85vh",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}/>
      ):(
        <div style={{color:"#F6E9D2",fontSize:14}}>Foto não encontrada.</div>
      )}
      <button onClick={onClose} style={{position:"fixed",top:20,right:20,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,width:38,height:38,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={18}/></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHEET WRAPPER
═══════════════════════════════════════════════ */
function Sheet({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(42,32,24,0.35)",backdropFilter:"blur(5px)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div className="su" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:C.surface,borderRadius:"28px 28px 0 0",border:`1px solid ${C.border}`,borderBottom:"none",padding:"22px 20px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(60,40,20,0.18)"}}>
        <div style={{width:40,height:4,borderRadius:99,background:C.bgAlt,margin:"-8px auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink}}>{title}</div>
          <button onClick={onClose} style={{background:C.bgAlt,border:"none",borderRadius:999,width:32,height:32,color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
