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

const TOK_KEY = "amv_dash_token";
const getTok = () => localStorage.getItem(TOK_KEY) || "";
const authHeaders = (): Record<string, string> => {
  const t = getTok();
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
async function showDashboard(): Promise<void> {
  gate.hidden = true;
  app.hidden = false;
  await load();
}

async function checkSession(): Promise<void> {
  try {
    const r = await fetch("/api/auth", { method: "GET", credentials: "same-origin", headers: authHeaders() });
    const j = await r.json();
    if (j.authed) await showDashboard();
  } catch {
    /* mostra login */
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
  localStorage.removeItem(TOK_KEY);
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
  renderKpis(d.summary || {});
  renderChart(d.series || []);
  const devHtml = bars((d.devices || []).map((x: Rec) => ({ label: x.device, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("devicesMini").innerHTML = devHtml;
  $("devices").innerHTML = devHtml;
  $("browsers").innerHTML = bars((d.browsers || []).map((x: Rec) => ({ label: x.browser, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("systems").innerHTML = bars((d.systems || []).map((x: Rec) => ({ label: x.os, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("refs").innerHTML = bars((d.referrers || []).map((x: Rec) => ({ label: x.ref, value: fmtInt(x.visitors), n: Number(x.visitors) })));
  $("topPages").innerHTML = bars((d.topPages || []).map((x: Rec) => ({ label: x.path, value: `${fmtInt(x.visitors)} · ${fmtDuration(x.avg_ms)}`, n: Number(x.visitors) })));
  $("least").innerHTML = bars((d.leastEngaged || []).map((x: Rec) => ({ label: x.path, value: fmtDuration(x.avg_ms), n: Number(x.avg_ms) })));
  $("clicks").innerHTML = bars((d.clicks || []).map((x: Rec) => ({ label: x.label, value: fmtInt(x.n), n: Number(x.n) })));
  renderVisits(d.recentVisits || []);
}

type Rec = Record<string, string>;

function renderKpis(s: Rec): void {
  const cards = [
    { label: "Visitantes", value: fmtInt(s.visitors), hint: "pessoas únicas" },
    { label: "Tempo médio", value: fmtDuration(s.avg_ms), hint: "engajado por visita" },
    { label: "Rolagem média", value: `${fmtInt(s.avg_scroll)}%`, hint: "da página" },
    { label: "Cliques", value: fmtInt(s.clicks), hint: "em botões e links" },
    { label: "Celular", value: fmtInt(s.mobile), hint: "visitantes" },
    { label: "Computador", value: fmtInt(s.desktop), hint: "visitantes" },
  ];
  $("kpis").innerHTML = cards
    .map(
      (c) => `<div class="card"><div class="card__v">${c.value}</div>
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

function renderVisits(rows: Rec[]): void {
  const body = $("visitsBody");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Ainda sem visitantes neste período.</td></tr>`;
    return;
  }
  body.innerHTML = rows
    .map(
      (v) => `<tr>
        <td>${esc(v.quando)}</td>
        <td>${deviceIcon(v.device)} ${deviceName(v.device)}</td>
        <td>${esc(v.browser || "—")}</td>
        <td>${esc(v.os || "—")}</td>
        <td>${v.duration != null ? fmtDuration(v.duration) : "—"}</td>
        <td>${v.scroll != null ? esc(v.scroll) + "%" : "—"}</td>
      </tr>`
    )
    .join("");
}

checkSession();
