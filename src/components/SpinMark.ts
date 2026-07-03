// Ícone: anel de texto 3D girando (adaptado de um pen do CodePen).
// Letras com o gradiente da loja; o círculo (borda) fica simples, como no original.
import { site } from "../data/site";

export function SpinMark(text: string = site.brand): string {
  return /* html */ `
    <span class="spin-mark" aria-hidden="true">
      <span class="spin-mark__ring"></span>
      <span class="spin-mark__text" data-spin>${text.toUpperCase()} </span>
    </span>`;
}

// Quebra o texto em letras posicionadas ao redor do círculo (eixo 3D).
export function initSpinMark(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll<HTMLElement>("[data-spin]").forEach((el) => {
    const letters = (el.textContent ?? "").split("");
    el.innerHTML = letters
      .map((ch, i) => {
        const frac = i / (letters.length + 1);
        const display = ch === " " ? "&nbsp;" : ch;
        return `<span style="--i:${frac.toFixed(4)}">${display}</span>`;
      })
      .join("");
    if (reduce) el.style.animation = "none";
  });
}
