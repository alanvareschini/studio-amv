// Efeito leve (CSS): um brilho com o gradiente da loja segue o cursor/dedo sobre
// o texto, mantendo o texto real (selecao/SEO). Sem canvas, sem simulacao pesada.
export function initTextWave(selector: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const touchHoldMs = 520;

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;

    let touchTimer = 0;

    el.setAttribute("data-text", text);
    el.classList.add("txt-wave");
    if (!hasHover) el.classList.add("txt-wave--touch");

    const update = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    const activateTouch = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(touchTimer);
      update(e);
      el.classList.add("is-touching");
    };

    const settleTouch = () => {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => el.classList.remove("is-touching"), touchHoldMs);
    };

    el.addEventListener("pointermove", update, { passive: true });
    el.addEventListener("pointerdown", activateTouch, { passive: true });
    el.addEventListener("pointerup", settleTouch, { passive: true });
    el.addEventListener("pointercancel", settleTouch, { passive: true });
  });
}
