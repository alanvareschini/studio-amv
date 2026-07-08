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

    const touchSurface = el.closest<HTMLElement>(".card, .pkg") || el;
    let activePointerId: number | null = null;
    let touchTimer = 0;

    el.setAttribute("data-text", text);
    el.classList.add("txt-wave");
    if (!hasHover) el.classList.add("txt-wave--touch");

    const update = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const mx = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      const my = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      el.style.setProperty("--my", `${my.toFixed(1)}%`);
    };

    const activateTouch = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      activePointerId = e.pointerId;
      window.clearTimeout(touchTimer);
      try {
        touchSurface.setPointerCapture(e.pointerId);
      } catch {
        // Alguns browsers cancelam captura durante scroll; o listener global cobre o resto.
      }
      update(e);
      el.classList.add("is-touching");
    };

    const moveTouch = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return;
      update(e);
      el.classList.add("is-touching");
    };

    const settleTouch = (e?: PointerEvent) => {
      if (e && activePointerId !== e.pointerId) return;
      activePointerId = null;
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => el.classList.remove("is-touching"), touchHoldMs);
    };

    el.addEventListener("pointermove", update, { passive: true });
    touchSurface.addEventListener("pointerdown", activateTouch, { passive: true });
    window.addEventListener("pointermove", moveTouch, { passive: true });
    window.addEventListener("pointerup", settleTouch, { passive: true });
    window.addEventListener("pointercancel", settleTouch, { passive: true });
  });
}
