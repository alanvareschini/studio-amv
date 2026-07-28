// Menu estilo Lusion: botao fixo no canto que abre um menu compacto,
// com links grandes e o blob original de dia/noite dentro.
import { HeroBlob } from "./HeroBlob";
import {
  getPerformanceTier,
  getMotionMode,
  isSystemMotionReduced,
  setMotionMode,
  type MotionMode,
} from "../lib/motionPreference";
import { acquireScrollLock, releaseScrollLock } from "../lib/scrollLock";

const LINKS: [string, string][] = [
  ["#servicos", "Servi&ccedil;os"],
  ["#pacotes", "Pacotes"],
  ["#processo", "Processo"],
  ["#modelos", "Modelos"],
  ["#faq", "FAQ"],
  ["#orcamento", "Or&ccedil;amento"],
];

export function Menu(): string {
  const links = LINKS.map(
    ([href, label], i) =>
      `<a class="menu-link" href="${href}" style="--i:${i}">${label}</a>`
  ).join("");

  return /* html */ `
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menuOverlay">
      <span class="menu-btn__label">Menu</span>
      <span class="menu-btn__ic" aria-hidden="true"><i></i><i></i></span>
    </button>
    <div class="menu-overlay" id="menuOverlay" role="dialog" aria-modal="true" aria-label="Menu principal" aria-hidden="true" inert>
      <nav class="menu-nav" aria-label="Navega&ccedil;&atilde;o">${links}</nav>
      <div class="menu-theme">
        <span class="menu-theme__label">Modo claro / escuro</span>
        <div class="menu-theme__blob">${HeroBlob("hero-blob--menu")}</div>
      </div>
      <div class="menu-motion" data-motion-control>
        <div class="menu-motion__head">
          <span class="menu-motion__label">Anima&ccedil;&otilde;es</span>
          <span class="menu-motion__status" data-motion-status aria-live="polite"></span>
        </div>
        <div class="menu-motion__options" role="group" aria-label="Qualidade da experi&ecirc;ncia visual">
          <button type="button" data-motion-mode="auto">Auto</button>
          <button type="button" data-motion-mode="full">M&aacute;xima</button>
          <button type="button" data-motion-mode="balanced">M&eacute;dia</button>
          <button type="button" data-motion-mode="reduced">Leve</button>
        </div>
      </div>
    </div>`;
}

export function initMenu(): void {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("menuOverlay");
  if (!btn || !overlay) return;
  let previousFocus: HTMLElement | null = null;
  const focusableSelector =
    "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

  const motionButtons = Array.from(
    overlay.querySelectorAll<HTMLButtonElement>("[data-motion-mode]"),
  );
  const motionStatus = overlay.querySelector<HTMLElement>("[data-motion-status]");
  const motionLabels: Record<MotionMode, string> = {
    auto: "",
    full: "Qualidade máxima",
    balanced: "Equilibrada",
    reduced: "Experiência otimizada",
  };
  const tierLabels = {
    high: "máxima",
    balanced: "equilibrada",
    low: "leve",
    minimal: "essencial",
  } as const;
  const syncMotionControl = () => {
    const mode = getMotionMode();
    motionButtons.forEach((motionButton) => {
      const active = motionButton.dataset.motionMode === mode;
      motionButton.classList.toggle("is-active", active);
      motionButton.setAttribute("aria-pressed", String(active));
    });
    if (motionStatus) {
      const tierLabel = tierLabels[getPerformanceTier()];
      motionStatus.textContent = mode === "auto"
        ? isSystemMotionReduced()
          ? `Sistema reduzido · ${tierLabel}`
          : `Detectado: ${tierLabel}`
        : motionLabels[mode];
    }
  };

  motionButtons.forEach((motionButton) => {
    motionButton.addEventListener("click", () => {
      const mode = motionButton.dataset.motionMode as MotionMode | undefined;
      if (!mode || mode === getMotionMode()) return;
      setMotionMode(mode);
      syncMotionControl();
      if (motionStatus) motionStatus.textContent = "Aplicando...";
      try {
        sessionStorage.setItem("amv-skip-intro-once", "1");
      } catch {
        // A recarga continua funcionando mesmo sem sessionStorage.
      }
      window.setTimeout(() => window.location.reload(), 120);
    });
  });
  window.addEventListener("amv:performance-tier-change", syncMotionControl);
  syncMotionControl();

  const open = () => {
    previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : btn;
    overlay.removeAttribute("inert");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    btn.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    acquireScrollLock("main-menu");
    requestAnimationFrame(() => {
      overlay.querySelector<HTMLElement>(".menu-link")?.focus({ preventScroll: true });
    });
  };
  const close = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    overlay.setAttribute("inert", "");
    releaseScrollLock("main-menu");
    previousFocus?.focus({ preventScroll: true });
    previousFocus = null;
  };

  btn.addEventListener("click", () =>
    overlay.classList.contains("open") ? close() : open()
  );
  overlay.querySelectorAll(".menu-link").forEach((link) =>
    link.addEventListener("click", close)
  );
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [
      ...overlay.querySelectorAll<HTMLElement>(focusableSelector),
      btn,
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    const t = e.target as Node;
    if (!overlay.contains(t) && !btn.contains(t)) close();
  });
}
