// Rastreamento ANÔNIMO e leve do site de vendas (LGPD-friendly):
// - Sem cookies, sem localStorage, sem identificar a pessoa.
// - Mede tempo ENGAJADO (só conta quando a aba está visível), rolagem máxima
//   e cliques em elementos marcados. Envia via sendBeacon (não trava a página).
// O "visit" é um id aleatório em memória (some ao fechar a aba) usado só para
// correlacionar os eventos de uma mesma visita no cálculo de médias.

const ENDPOINT = "/api/track";

function deviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function refDomain(): string | null {
  try {
    if (!document.referrer) return null;
    const u = new URL(document.referrer);
    if (u.hostname === location.hostname) return null; // navegação interna
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function send(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    } else {
      fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    /* rastreamento nunca deve quebrar o site */
  }
}

export function initAnalytics(): void {
  // não roda em ambiente de desenvolvimento local
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
  if (navigator.doNotTrack === "1") return; // respeita "não rastrear"

  const visit = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const device = deviceType();
  const path = location.pathname || "/";

  // 1) pageview
  send({ type: "pageview", path, ref: refDomain(), device, visit });

  // 2) tempo engajado: só conta enquanto a aba está visível
  let engaged = 0;
  let last = document.visibilityState === "visible" ? Date.now() : 0;
  const tickPause = () => {
    if (last) {
      engaged += Date.now() - last;
      last = 0;
    }
  };
  const tickResume = () => {
    if (!last) last = Date.now();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tickResume();
    else tickPause();
  });

  // 3) rolagem máxima (0-100%)
  let maxScroll = 0;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 4) cliques em elementos marcados (data-track) ou botões/links relevantes
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-track], a[href], button"
      );
      if (!el) return;
      const label =
        el.getAttribute("data-track") ||
        (el.textContent || "").trim().slice(0, 60) ||
        el.getAttribute("aria-label") ||
        el.tagName.toLowerCase();
      send({ type: "click", path, label, device, visit });
    },
    { passive: true }
  );

  // 5) ao FECHAR a página: envia tempo engajado + rolagem.
  // (trocar de aba só pausa o cronômetro — não encerra a visita)
  let sent = false;
  const leave = () => {
    if (sent) return;
    sent = true;
    tickPause();
    send({ type: "leave", path, device, visit, duration: engaged, scroll: maxScroll });
  };
  window.addEventListener("pagehide", leave);
}
