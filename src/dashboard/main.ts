// Painel de analytics (página separada, não linkada no site de vendas).
// Login por senha (com token), abas e renderização dos dados agregados.
import "./dashboard.css";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const gate = $("gate");
const app = $("app");
const loginForm = $<HTMLFormElement>("loginForm");
const loginErr = $("loginErr");
const pwd = $<HTMLInputElement>("pwd");
const rangeSel = $<HTMLSelectElement>("range");

// Sessão salva: quem loga com a senha certa fica conectado (token no
// localStorage, válido por 12h). Nas próximas visitas entra automático.
const TOK_KEY = "amv_dash_token";
const authHeaders = (): Record<string, string> => {
  let t = "";
  try {
    t = localStorage.getItem(TOK_KEY) || "";
  } catch {
    /* ignora */
  }
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const fmtInt = (n: unknown) => Number(n || 0).toLocaleString("pt-BR");
function fmtDuration(ms: unknown): string {
  const s = Math.round(Number(ms || 0) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

// ---- abas ----
$("tabs").addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".tab");
  if (!btn) return;
  const tab = btn.dataset.tab;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === btn));
  document.querySelectorAll<HTMLElement>(".tabpane").forEach((p) =>
    p.classList.toggle("is-active", p.dataset.pane === tab)
  );
});

// ---- sessão ----
let refreshTimer: number | undefined;
async function showDashboard(): Promise<void> {
  gate.hidden = true;
  app.hidden = false;
  await load();
  // atualização automática (tempo real) — só quando a aba está visível
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    if (!app.hidden && document.visibilityState === "visible") load();
  }, 30000);
}

// login automático se já houver uma sessão válida (logou antes com a senha)
async function checkSession(): Promise<void> {
  try {
    const r = await fetch("/api/auth", { method: "GET", credentials: "same-origin", headers: authHeaders() });
    const j = await r.json();
    if (j.authed) await showDashboard();
  } catch {
    /* mostra a tela de senha */
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErr.hidden = true;
  let r: Response;
  try {
    r = await fetch("/api/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd.value }),
    });
  } catch {
    loginErr.textContent = "Falha de conexão. Tente novamente.";
    loginErr.hidden = false;
    return;
  }
  if (r.ok) {
    pwd.value = "";
    try {
      const j = await r.json();
      if (j.token) localStorage.setItem(TOK_KEY, j.token);
      // dono do painel: não contar os próprios acessos ao site (dados limpos)
      localStorage.setItem("amv_notrack", "1");
    } catch {
      /* ignora */
    }
    await showDashboard();
  } else if (r.status === 401) {
    loginErr.textContent = "Senha incorreta.";
    loginErr.hidden = false;
  } else {
    const j = await r.json().catch(() => ({}));
    loginErr.textContent = j.hint || j.error || "Erro ao entrar. Tente novamente.";
    loginErr.hidden = false;
  }
});

$("logout").addEventListener("click", async () => {
  await fetch("/api/auth", { method: "DELETE", credentials: "same-origin", headers: authHeaders() });
  try {
    localStorage.removeItem(TOK_KEY);
  } catch {
    /* ignora */
  }
  location.reload();
});

rangeSel.addEventListener("change", load);

// ---- carregamento dos dados ----
async function load(): Promise<void> {
  const r = await fetch(`/api/stats?days=${rangeSel.value}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: authHeaders(),
  });
  if (r.status === 401) {
    app.hidden = true;
    gate.hidden = false;
    return;
  }
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try {
      const j = await r.json();
      detail = j.detail || j.error || detail;
    } catch {
      /* ignora */
    }
    $("kpis").innerHTML = `<div class="card" style="grid-column:1/-1">
      <div class="card__l" style="color:#ff8590">Não foi possível carregar os dados</div>
      <div class="card__h" style="margin-top:6px;word-break:break-word">${esc(detail)}</div></div>`;
    return;
  }
  const d = await r.json();
  const brand = document.querySelector(".topbar__brand");
  if (brand) {
    let tag = brand.querySelector<HTMLElement>(".livedot");
    if (!tag) {
      tag = document.createElement("span");
      tag.className = "livedot";
      tag.title = "Atualiza automaticamente";
      brand.appendChild(tag);
    }
    tag.classList.remove("blink");
    void tag.offsetWidth; // reinicia a animação
    tag.classList.add("blink");
  }
  renderLive(d.realtime || {}, d.newReturning || {});
  renderKpis(d.summary || {}, d.prev || {}, d.bounce || {});
  renderFunnel(d.conv || {});
  renderChart(d.series || []);
  $("countries").innerHTML = bars((d.countries || []).map((x: Rec) => ({ label: x.country, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("cities").innerHTML = bars((d.cities || []).map((x: Rec) => ({ label: x.city, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  renderPeakHours(d.peakHours || []);
  renderPeakDays(d.peakDays || []);
  const devHtml = bars((d.devices || []).map((x: Rec) => ({ label: x.device, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("devicesMini").innerHTML = devHtml;
  $("devices").innerHTML = devHtml;
  $("browsers").innerHTML = bars((d.browsers || []).map((x: Rec) => ({ label: x.browser, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("systems").innerHTML = bars((d.systems || []).map((x: Rec) => ({ label: x.os, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("refs").innerHTML = bars((d.referrers || []).map((x: Rec) => ({ label: x.ref, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("topPages").innerHTML = bars((d.topPages || []).map((x: Rec) => ({ label: x.path, value: `${fmtInt(x.visitors)} · ${fmtDuration(x.avg_ms)}`, n: Number(x.visitors) })));
  $("least").innerHTML = bars((d.leastEngaged || []).map((x: Rec) => ({ label: x.path, value: fmtDuration(x.avg_ms), n: Number(x.avg_ms) })));
  $("clicks").innerHTML = bars((d.clicks || []).map((x: Rec) => ({ label: x.label, value: fmtInt(x.n), n: Number(x.n) })));
  renderOnline(d.online || []);
  renderVisits(d.recentVisits || []);
}

type Rec = Record<string, string>;

function renderLive(rt: Rec, nr: Rec): void {
  const items = [
    { v: fmtInt(rt.online), l: "agora", cls: "live__now" },
    { v: fmtInt(rt.today), l: "hoje" },
    { v: fmtInt(nr.novos), l: "novos" },
    { v: fmtInt(nr.recorrentes), l: "recorrentes" },
  ];
  $("live").innerHTML = items
    .map(
      (i) => `<div class="live__item ${i.cls || ""}"><span class="live__v">${i.v}</span><span class="live__l">${i.l}</span></div>`
    )
    .join("");
}

function renderFunnel(c: Rec): void {
  const visitors = Number(c.visitors || 0);
  const wa = Number(c.whatsapp || 0);
  const forms = Number(c.forms || 0);
  const pct = (n: number) => (visitors > 0 ? Math.round((n / visitors) * 100) : 0);
  const steps = [
    { label: "Visitantes", n: visitors, p: 100, color: "var(--cyan)" },
    { label: "Clicaram no WhatsApp", n: wa, p: pct(wa), color: "var(--green)" },
    { label: "Enviaram o formulário", n: forms, p: pct(forms), color: "var(--purple)" },
  ];
  $("funnel").innerHTML = steps
    .map(
      (s) => `<div class="fstep">
        <div class="fstep__top"><span>${s.label}</span><b>${fmtInt(s.n)} <small>· ${s.p}%</small></b></div>
        <div class="fstep__bar"><i style="width:${s.p}%;background:${s.color}"></i></div>
      </div>`
    )
    .join("");
}

function renderPeakHours(rows: Array<{ hour: number; sessions: number }>): void {
  const map = new Map(rows.map((r) => [Number(r.hour), Number(r.sessions)]));
  const all = Array.from({ length: 24 }, (_, h) => ({
    label: `${String(h).padStart(2, "0")}h`,
    value: fmtInt(map.get(h) || 0),
    n: map.get(h) || 0,
  }));
  $("peakHours").innerHTML = bars(all);
}

const DOW = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
function renderPeakDays(rows: Array<{ dow: number; sessions: number }>): void {
  const map = new Map(rows.map((r) => [Number(r.dow), Number(r.sessions)]));
  const all = DOW.map((name, i) => ({ label: name, value: fmtInt(map.get(i) || 0), n: map.get(i) || 0 }));
  $("peakDays").innerHTML = bars(all);
}

// variação vs período anterior → seta ↑/↓ com cor
function delta(cur: unknown, prev: unknown): string {
  const c = Number(cur || 0), p = Number(prev || 0);
  if (p === 0) return c > 0 ? `<span class="chg up">novo</span>` : "";
  const pct = Math.round(((c - p) / p) * 100);
  if (pct === 0) return `<span class="chg flat">0%</span>`;
  const up = pct > 0;
  return `<span class="chg ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(pct)}%</span>`;
}

function renderKpis(s: Rec, prev: Rec, bounce: Rec): void {
  const visitors = Number(s.visitors || 0);
  const convs = Number(s.convs || 0);
  const convRate = visitors > 0 ? Math.round((convs / visitors) * 100) : 0;
  const bTotal = Number(bounce.total || 0), bounced = Number(bounce.bounced || 0);
  const bounceRate = bTotal > 0 ? Math.round((bounced / bTotal) * 100) : 0;
  const cards = [
    { label: "Visitantes", value: fmtInt(s.visitors), hint: "pessoas únicas", chg: delta(s.visitors, prev.visitors) },
    { label: "Tempo médio", value: fmtDuration(s.avg_ms), hint: "engajado por visita", chg: delta(s.avg_ms, prev.avg_ms) },
    { label: "Conversão", value: `${convRate}%`, hint: `${fmtInt(convs)} de ${fmtInt(visitors)}`, chg: delta(s.convs, prev.convs) },
    { label: "Rejeição", value: `${bounceRate}%`, hint: "saíram em < 10s" },
    { label: "Cliques", value: fmtInt(s.clicks), hint: "em botões e links", chg: delta(s.clicks, prev.clicks) },
    { label: "Rolagem média", value: `${fmtInt(s.avg_scroll)}%`, hint: "da página" },
  ];
  $("kpis").innerHTML = cards
    .map(
      (c) => `<div class="card"><div class="card__v">${c.value} ${c.chg || ""}</div>
        <div class="card__l">${c.label}</div><div class="card__h">${c.hint}</div></div>`
    )
    .join("");
}

function renderChart(series: Array<{ day: string; visitors: number }>): void {
  const box = $("chart");
  if (!series.length) {
    box.innerHTML = `<div class="empty">Ainda sem visitas neste período.</div>`;
    return;
  }
  const W = 900, H = 240, pad = 30;
  const max = Math.max(1, ...series.map((p) => Number(p.visitors)));
  const stepX = series.length > 1 ? (W - pad * 2) / (series.length - 1) : 0;
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const line = series.map((p, i) => `${x(i).toFixed(1)},${y(Number(p.visitors)).toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${x(series.length - 1)},${H - pad}`;
  const dots = series.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(Number(p.visitors)).toFixed(1)}" r="3" />`).join("");
  const step = Math.ceil(series.length / 8);
  const labels = series
    .map((p, i) => (i % step === 0 || i === series.length - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${p.day.slice(5)}</text>` : ""))
    .join("");
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart__svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(34,211,238,0.35)"/><stop offset="1" stop-color="rgba(34,211,238,0)"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#g)"/>
      <polyline points="${line}" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
      <g class="dots">${dots}</g><g class="xlabels">${labels}</g></svg>`;
}

function bars(rows: Array<{ label: string; value: string; n: number }>): string {
  if (!rows.length) return `<div class="empty">Sem dados ainda.</div>`;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows
    .map(
      (r) => `<div class="row"><div class="row__bar" style="--w:${(r.n / max) * 100}%"></div>
        <span class="row__label" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="row__val">${esc(r.value)}</span></div>`
    )
    .join("");
}

const deviceIcon = (d: string) =>
  d === "mobile" ? "📱" : d === "tablet" ? "📲" : d === "desktop" ? "💻" : "❔";
const deviceName = (d: string) =>
  d === "mobile" ? "Celular" : d === "tablet" ? "Tablet" : d === "desktop" ? "Computador" : "—";
const localTxt = (v: Rec) => {
  const parts = [v.city, v.country].filter((x) => x && x !== "—");
  return parts.length ? esc(parts.join(", ")) : "—";
};

function renderOnline(rows: Rec[]): void {
  const body = $("onlineBody");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty">Ninguém online agora.</td></tr>`;
    return;
  }
  body.innerHTML = rows
    .map(
      (v) => `<tr>
        <td>${esc(v.visto)}</td>
        <td>${localTxt(v)}</td>
        <td>${deviceIcon(v.device)} ${deviceName(v.device)}</td>
        <td>${esc(v.browser || "—")}</td>
        <td>${esc(v.os || "—")}</td>
      </tr>`
    )
    .join("");
}

function renderVisits(rows: Rec[]): void {
  const body = $("visitsBody");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty">Ainda sem visitantes neste período.</td></tr>`;
    return;
  }
  const local = (v: Rec) => {
    const parts = [v.city, v.country].filter((x) => x && x !== "—");
    return parts.length ? esc(parts.join(", ")) : "—";
  };
  body.innerHTML = rows
    .map(
      (v) => `<tr>
        <td>${esc(v.quando)}</td>
        <td>${local(v)}</td>
        <td>${deviceIcon(v.device)} ${deviceName(v.device)}</td>
        <td>${esc(v.browser || "—")}</td>
        <td>${esc(v.os || "—")}</td>
        <td>${v.duration != null ? fmtDuration(v.duration) : "—"}</td>
        <td>${v.scroll != null ? esc(v.scroll) + "%" : "—"}</td>
      </tr>`
    )
    .join("");
}

// entra automático se já tiver logado com a senha certa (senão, mostra a senha)
checkSession();
