// Teste (somente mobile): linhas com o gradiente da loja que "fluem" conforme o
// scroll (dash animado), ao fundo, com os nossos cards passando por cima.
import { getPerformanceTier, isReducedMotion } from "../lib/motionPreference";

export function FlowLines(): string {
  return /* html */ `
    <svg class="flow-lines" aria-hidden="true" viewBox="0 0 100 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="50%" stop-color="#22d3ee" />
          <stop offset="100%" stop-color="#00ff88" />
        </linearGradient>
      </defs>
      <path class="flow-lines__p" d="M18 -5 C 55 30 -5 70 28 110 C 55 145 5 180 35 205" />
      <path class="flow-lines__p" d="M55 -5 C 92 35 35 75 70 115 C 96 150 48 185 78 205" />
      <path class="flow-lines__p" d="M82 -5 C 60 40 112 80 78 120 C 52 155 102 185 70 205" />
    </svg>`;
}

export function initFlowLines(): void {
  const svg = document.querySelector(".flow-lines");
  if (!svg) return;
  if (!window.matchMedia("(max-width: 760px)").matches) return;
  if (isReducedMotion() || getPerformanceTier() === "low") return;

  const root = document.documentElement;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      root.style.setProperty("--flowOffset", `${(-p * 800).toFixed(1)}`);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
