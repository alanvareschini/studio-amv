// Efeito leve (CSS): um brilho com o gradiente da loja segue o cursor sobre o
// texto, mantendo o texto real (seleção/SEO). Sem canvas, sem simulação pesada.
export function initTextWave(selector: string): void {
  if (
    !window.matchMedia("(hover: hover)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;
    el.setAttribute("data-text", text);
    el.classList.add("txt-wave");

    el.addEventListener(
      "pointermove",
      (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      },
      { passive: true }
    );
  });
}
