// Painel administrativo (página separada, não linkada no site de vendas).
// Faz login por senha, busca as estatísticas agregadas e desenha os gráficos.
import "./dashboard.css";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const gate = $("gate");
const app = $("app");
const loginForm = $<HTMLFormElement>("loginForm");
const loginErr = $("loginErr");
const pwd = $<HTMLInputElement>("pwd");
const rangeSel = $<HTMLSelectElement>("range");

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}
const fmtInt = (n: number) => Number(n || 0).toLocaleString("pt-BR");

async function showDashboard(): Promise<void> {
  gate.hidden = true;
  app.hidden = false;
  await load();
}

async function checkSession(): Promise<void> {
  try {
    const r = await fetch("/api/auth", { method: "GET" });
    const j = await r.json();
    if (j.authed) await showDashboard();
  } catch {
    /* mostra login */
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErr.hidden = true;
  const r = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pwd.value }),
  });
  if (r.ok) {
    pwd.value = "";
    await showDashboard();
  } else {
    loginErr.textContent = "Senha incorreta.";
    loginErr.hidden = false;
  }
});

$("logout").addEventListener("click", async () => {
  await fetch("/api/auth", { method: "DELETE" });
  location.reload();
});

rangeSel.addEventListener("change", load);

async function load(): Promise<void> {
  const days = rangeSel.value;
  const r = await fetch(`/api/stats?days=${days}`, { cache: "no-store" });
  if (r.status === 401) {
    app.hidden = true;
    gate.hidden = false;
    return;
  }
  if (!r.ok) return;
  const d = await r.json();
  renderKpis(d.summary);
  renderChart(d.series);
  renderPages(d.topPages);
  renderLeast(d.leastEngaged);
  renderClicks(d.clicks);
  renderDevices(d.devices);
  renderRefs(d.referrers);
}

function renderKpis(s: Record<string, number>): void {
  const cards = [
    { label: "Visitas", value: fmtInt(s.visits), hint: "visitantes únicos" },
    { label: "Páginas vistas", value: fmtInt(s.pageviews), hint: "total de aberturas" },
    { label: "Tempo médio", value: fmtDuration(Number(s.avg_ms)), hint: "engajado por visita" },
    { label: "Rolagem média", value: `${fmtInt(s.avg_scroll)}%`, hint: "da página" },
    { label: "Cliques", value: fmtInt(s.clicks), hint: "em botões e links" },
  ];
  $("kpis").innerHTML = cards
    .map(
      (c) => `<div class="card">
        <div class="card__v">${c.value}</div>
        <div class="card__l">${c.label}</div>
        <div class="card__h">${c.hint}</div>
      </div>`
    )
    .join("");
}

type Point = { day: string; visits: number };
function renderChart(series: Point[]): void {
  const box = $("chart");
  if (!series || series.length === 0) {
    box.innerHTML = `<div class="empty">Ainda sem dados neste período.</div>`;
    return;
  }
  const W = 900, H = 240, pad = 30;
  const max = Math.max(1, ...series.map((p) => Number(p.visits)));
  const stepX = series.length > 1 ? (W - pad * 2) / (series.length - 1) : 0;
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = series.map((p, i) => `${x(i).toFixed(1)},${y(Number(p.visits)).toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${x(series.length - 1)},${H - pad}`;
  const dots = series
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(Number(p.visits)).toFixed(1)}" r="3" />`)
    .join("");
  const labels = series
    .filter((_, i) => i % Math.ceil(series.length / 8) === 0 || i === series.length - 1)
    .map((p) => {
      const i = series.indexOf(p);
      const d = p.day.slice(5);
      return `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${d}</text>`;
    })
    .join("");

  box.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart__svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(34,211,238,0.35)"/>
          <stop offset="1" stop-color="rgba(34,211,238,0)"/>
        </linearGradient>
      </defs>
      <polygon points="${area}" fill="url(#g)"/>
      <polyline points="${line}" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
      <g class="dots">${dots}</g>
      <g class="xlabels">${labels}</g>
    </svg>`;
}

function bars(rows: Array<{ label: string; value: string; n: number }>, unit = ""): string {
  if (!rows.length) return `<div class="empty">Sem dados ainda.</div>`;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows
    .map(
      (r) => `<div class="row">
        <div class="row__bar" style="--w:${(r.n / max) * 100}%"></div>
        <span class="row__label" title="${r.label}">${r.label}</span>
        <span class="row__val">${r.value}${unit}</span>
      </div>`
    )
    .join("");
}

function renderPages(rows: Array<Record<string, string>>): void {
  $("topPages").innerHTML = bars(
    (rows || []).map((r) => ({
      label: r.path,
      value: `${fmtInt(Number(r.views))} · ${fmtDuration(Number(r.avg_ms))}`,
      n: Number(r.views),
    }))
  );
}

function renderLeast(rows: Array<Record<string, string>>): void {
  $("least").innerHTML = bars(
    (rows || []).map((r) => ({
      label: r.path,
      value: fmtDuration(Number(r.avg_ms)),
      n: Number(r.avg_ms),
    }))
  );
}

function renderClicks(rows: Array<Record<string, string>>): void {
  $("clicks").innerHTML = bars(
    (rows || []).map((r) => ({ label: r.label, value: fmtInt(Number(r.n)), n: Number(r.n) }))
  );
}

function renderDevices(rows: Array<Record<string, string>>): void {
  $("devices").innerHTML = bars(
    (rows || []).map((r) => ({ label: r.device, value: fmtInt(Number(r.visits)), n: Number(r.visits) }))
  );
}

function renderRefs(rows: Array<Record<string, string>>): void {
  $("refs").innerHTML = bars(
    (rows || []).map((r) => ({ label: r.ref, value: fmtInt(Number(r.n)), n: Number(r.n) }))
  );
}

checkSession();
