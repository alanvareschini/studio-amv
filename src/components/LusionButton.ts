// Botão estilo Lusion: pílula clara com um ponto; no hover um círculo com o
// gradiente da loja cresce a partir do ponto e preenche o botão (+ leve magnético).
import { isReducedMotion } from "../lib/motionPreference";

export function LusionButton(label: string, href: string): string {
  return /* html */ `
    <a class="lusion-btn" href="${href}" draggable="false">
      <span class="lusion-btn__dot" aria-hidden="true"></span>
      <span class="lusion-btn__label">${label}</span>
    </a>`;
}

// efeito magnético: o botão e o texto seguem levemente o cursor
export function initLusionButtons(): void {
  if (isReducedMotion()) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll<HTMLElement>(".lusion-btn").forEach((btn) => {
    const label = btn.querySelector<HTMLElement>(".lusion-btn__label");
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      btn.style.transform = `translate(${(x * 12).toFixed(1)}px, ${(y * 10).toFixed(1)}px)`;
      if (label) label.style.transform = `translate(${(x * 5).toFixed(1)}px, ${(y * 4).toFixed(1)}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
      if (label) label.style.transform = "";
    });
  });
}
