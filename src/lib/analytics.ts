// Rastreamento ANÔNIMO e leve do site de vendas (LGPD-friendly):
// - Sem cookies de rastreamento e sem identificar a pessoa.
// - Usa um id aleatório anônimo no localStorage (amv_vid) só para não contar o
//   mesmo aparelho várias vezes; e amv_notrack para o dono se excluir.
// - Mede tempo ENGAJADO (só quando a aba está visível), rolagem e cliques.
//   Envia via sendBeacon (não trava a página).

const ENDPOINT = "/api/track";

// Tipo de aparelho pelo userAgent (não pela largura da janela): assim um PC
// com Windows nunca vira "tablet" só por estar com a janela estreita/zoom.
function deviceType(u: string): "mobile" | "tablet" | "desktop" {
  // tablets: iPad, Android sem "Mobile", e outros
  if (/\b(iPad|Tablet|PlayBook|Silk)\b/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) {
    return "tablet";
  }
  // iPadOS recente se identifica como Mac com toque
  if (/Macintosh/.test(u) && typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 1) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(u)) {
    return "mobile";
  }
  return "desktop";
}

// Detecção por CATEGORIA (não identifica a pessoa): navegador e sistema.
function browserName(u: string): string {
  if (/Edg\//.test(u)) return "Edge";
  if (/OPR\/|Opera/.test(u)) return "Opera";
  if (/SamsungBrowser/.test(u)) return "Samsung Internet";
  if (/Firefox\//.test(u)) return "Firefox";
  if (/Chrome\//.test(u)) return "Chrome";
  if (/Safari\//.test(u)) return "Safari";
  return "Outro";
}
function osName(u: string): string {
  if (/Android/.test(u)) return "Android";
  if (/iPhone|iPad|iPod/.test(u)) return "iOS";
  if (/Windows/.test(u)) return "Windows";
  if (/Mac OS X|Macintosh/.test(u)) return "macOS";
  if (/Linux/.test(u)) return "Linux";
  return "Outro";
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

  // Modo "não me rastreie" — o dono do site visita /?notrack=1 uma vez em cada
  // aparelho/navegador para que suas próprias visitas NÃO entrem nas estatísticas.
  try {
    const p = new URLSearchParams(location.search);
    if (p.get("notrack") === "1") localStorage.setItem("amv_notrack", "1");
    if (p.get("track") === "1") localStorage.removeItem("amv_notrack");
    if (localStorage.getItem("amv_notrack")) return;
  } catch {
    /* ignora */
  }

  const visit = Math.random().toString(36).slice(2) + Date.now().toString(36);
  // id ANÔNIMO e fixo do aparelho (só um código aleatório) → conta o mesmo
  // computador uma vez e permite distinguir novos de recorrentes.
  let vid = "";
  try {
    vid = localStorage.getItem("amv_vid") || "";
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem("amv_vid", vid);
    }
  } catch {
    vid = "anon";
  }
  const ua = navigator.userAgent || "";
  const device = deviceType(ua);
  const browser = browserName(ua);
  const os = osName(ua);
  const path = location.pathname || "/";

  // 1) pageview
  send({ type: "pageview", path, ref: refDomain(), device, browser, os, visit, vid });

  // conversões: evento disparado pelo site (ex.: formulário enviado)
  window.addEventListener("amv:conv", (e) => {
    const name = (e as CustomEvent).detail as string;
    send({ type: "conv", path, label: name, device, visit, vid });
  });

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
      send({ type: "click", path, label, device, visit, vid });

      // conversão: clique em qualquer link/botão de WhatsApp
      const href = (el.getAttribute("href") || "").toLowerCase();
      if (href.includes("wa.me") || href.includes("whatsapp") || el.classList.contains("wa-fab")) {
        send({ type: "conv", path, label: "whatsapp", device, visit, vid });
      }
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
    send({ type: "leave", path, device, browser, os, visit, vid, duration: engaged, scroll: maxScroll });
  };
  window.addEventListener("pagehide", leave);
}
