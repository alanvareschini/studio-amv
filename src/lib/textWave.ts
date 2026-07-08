// Efeito leve (CSS): um brilho com o gradiente da loja segue o cursor/dedo sobre
// o texto, mantendo o texto real (selecao/SEO). Sem canvas, sem simulacao pesada.
export function initTextWave(selector: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const touchHoldMs = 520;
  const items: HTMLElement[] = [];
  let activeTouchItem: HTMLElement | null = null;
  let touchTimer = 0;

  const updateFromPoint = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    const mx = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const my = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${my.toFixed(1)}%`);
  };

  const nearestItemIn = (surface: HTMLElement, clientX: number, clientY: number) => {
    const candidates = Array.from(surface.querySelectorAll<HTMLElement>(".txt-wave"));
    if (!candidates.length) return null;

    return candidates.reduce((best, item) => {
      const r = item.getBoundingClientRect();
      const cx = Math.max(r.left, Math.min(clientX, r.right));
      const cy = Math.max(r.top, Math.min(clientY, r.bottom));
      const d = (clientX - cx) ** 2 + (clientY - cy) ** 2;
      return !best || d < best.d ? { item, d } : best;
    }, null as { item: HTMLElement; d: number } | null)?.item ?? null;
  };

  const findTouchItem = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const direct = hit?.closest<HTMLElement>(selector);
    if (direct?.classList.contains("txt-wave")) return direct;

    const surface = hit?.closest<HTMLElement>(".card, .pkg");
    return surface ? nearestItemIn(surface, clientX, clientY) : null;
  };

  const activateTouch = (touch: Touch) => {
    const item = findTouchItem(touch.clientX, touch.clientY);
    if (!item) return;

    if (activeTouchItem && activeTouchItem !== item) {
      activeTouchItem.classList.remove("is-touching");
    }

    window.clearTimeout(touchTimer);
    activeTouchItem = item;
    updateFromPoint(item, touch.clientX, touch.clientY);
    item.classList.add("is-touching");
  };

  const settleTouch = () => {
    window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(() => {
      activeTouchItem?.classList.remove("is-touching");
      activeTouchItem = null;
    }, touchHoldMs);
  };

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;

    el.setAttribute("data-text", text);
    el.classList.add("txt-wave");
    if (!hasHover) el.classList.add("txt-wave--touch");
    items.push(el);

    el.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse" && !hasHover) return;
        updateFromPoint(el, e.clientX, e.clientY);
      },
      { passive: true }
    );
  });

  if (!items.length) return;

  window.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (touch) activateTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch) activateTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener("touchend", settleTouch, { passive: true });
  window.addEventListener("touchcancel", settleTouch, { passive: true });
}
