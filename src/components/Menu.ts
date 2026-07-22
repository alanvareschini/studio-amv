// Menu estilo Lusion: botao fixo no canto que abre um menu compacto,
// com links grandes e o blob original de dia/noite dentro.
import { HeroBlob } from "./HeroBlob";
import {
  getMotionMode,
  setMotionMode,
  type MotionMode,
} from "../lib/motionPreference";

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
    <div class="menu-overlay" id="menuOverlay" aria-hidden="true">
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
        <div class="menu-motion__options" role="group" aria-label="Intensidade das anima&ccedil;&otilde;es">
          <button type="button" data-motion-mode="auto">Auto</button>
          <button type="button" data-motion-mode="full">Completa</button>
          <button type="button" data-motion-mode="reduced">Leve</button>
        </div>
      </div>
    </div>`;
}

export function initMenu(): void {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("menuOverlay");
  if (!btn || !overlay) return;

  const motionButtons = Array.from(
    overlay.querySelectorAll<HTMLButtonElement>("[data-motion-mode]"),
  );
  const motionStatus = overlay.querySelector<HTMLElement>("[data-motion-status]");
  const motionLabels: Record<MotionMode, string> = {
    auto: "Segue o aparelho",
    full: "Qualidade total",
    reduced: "Mais leve",
  };
  const syncMotionControl = () => {
    const mode = getMotionMode();
    motionButtons.forEach((motionButton) => {
      const active = motionButton.dataset.motionMode === mode;
      motionButton.classList.toggle("is-active", active);
      motionButton.setAttribute("aria-pressed", String(active));
    });
    if (motionStatus) motionStatus.textContent = motionLabels[mode];
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
  syncMotionControl();

  const open = () => {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    btn.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () =>
    overlay.classList.contains("open") ? close() : open()
  );
  overlay.querySelectorAll(".menu-link").forEach((link) =>
    link.addEventListener("click", close)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    const t = e.target as Node;
    if (!overlay.contains(t) && !btn.contains(t)) close();
  });
}
