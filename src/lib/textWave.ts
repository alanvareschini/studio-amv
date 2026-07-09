// Efeito leve (CSS): um brilho com o gradiente da loja segue o cursor/dedo sobre
// o texto, mantendo o texto real (selecao/SEO). Sem canvas, sem simulacao pesada.
export function initTextWave(selector: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const items: HTMLElement[] = [];
  let activeTouchItem: HTMLElement | null = null;
  let isTouchActive = false;
  let touchX = 0;
  let touchY = 0;
  let loopRaf = 0;

  const updateFromPoint = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    const mx = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const my = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${my.toFixed(1)}%`);
  };

  const isBlocked = (el: HTMLElement) => Boolean(el.closest(".pkg--physics-active"));

  const findTouchItem = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const direct = hit?.closest<HTMLElement>(selector);
    if (direct?.classList.contains("txt-wave") && !isBlocked(direct)) return direct;

    return (
      items.find((item) => {
        if (isBlocked(item)) return false;
        const r = item.getBoundingClientRect();
        return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
      }) ?? null
    );
  };

  const updateTouchTarget = () => {
    const item = findTouchItem(touchX, touchY);
    if (!item) {
      activeTouchItem?.classList.remove("is-touching");
      activeTouchItem = null;
      return;
    }

    if (activeTouchItem && activeTouchItem !== item) {
      activeTouchItem.classList.remove("is-touching");
    }

    activeTouchItem = item;
    updateFromPoint(item, touchX, touchY);
    item.classList.add("is-touching");
  };

  const loopTouch = () => {
    if (!isTouchActive) return;
    updateTouchTarget();
    loopRaf = requestAnimationFrame(loopTouch);
  };

  const startTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
    isTouchActive = true;
    if (!loopRaf) loopRaf = requestAnimationFrame(loopTouch);
  };

  const moveTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
  };

  const settleTouch = () => {
    isTouchActive = false;
    cancelAnimationFrame(loopRaf);
    loopRaf = 0;
    activeTouchItem?.classList.remove("is-touching");
    activeTouchItem = null;
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
        if (isBlocked(el)) {
          el.classList.remove("is-touching");
          return;
        }
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
      if (touch) startTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch) moveTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener("touchend", settleTouch, { passive: true });
  window.addEventListener("touchcancel", settleTouch, { passive: true });
}
