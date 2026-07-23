import { isReducedMotion } from "./motionPreference";

// Tilt 3D leve que segue o cursor no desktop e o dedo no mobile. Aplica a
// transform inline (sobrepoe outras regras, evitando conflito com [data-reveal]).
export function initCardTilt(selector: string, maxAngle = 6, lift = 3, persp = 800): void {
  if (isReducedMotion()) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const cardSet = new Set(cards);
  let activeTouchCard: HTMLElement | null = null;
  let isTouchActive = false;
  let touchX = 0;
  let touchY = 0;
  let touchRaf = 0;
  let raf = 0;
  let pendingCard: HTMLElement | null = null;
  let pendingX = 0;
  let pendingY = 0;
  let pendingIsTouch = false;

  const renderTilt = (
    card: HTMLElement,
    clientX: number,
    clientY: number,
    isTouch: boolean,
  ) => {
    const r = card.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * 2 - 1; // -1 a 1
    const py = ((clientY - r.top) / r.height) * 2 - 1;
    const touchSoftener = isTouch ? 0.72 : 1;
    const ry = (px * maxAngle * touchSoftener).toFixed(2);
    const rx = (-py * maxAngle * touchSoftener).toFixed(2);

    card.classList.toggle("is-touching", isTouch);
    card.style.transition = isTouch ? "transform 0.14s ease-out" : "transform 0.12s ease-out";
    card.style.transitionDelay = "0s";
    card.style.transform = `perspective(${persp}px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(-${lift}px)`;
  };

  const applyTilt = (
    card: HTMLElement,
    clientX: number,
    clientY: number,
    isTouch = false,
  ) => {
    pendingCard = card;
    pendingX = clientX;
    pendingY = clientY;
    pendingIsTouch = isTouch;
    if (raf) return;

    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!pendingCard) return;
      renderTilt(pendingCard, pendingX, pendingY, pendingIsTouch);
    });
  };

  const reset = (card: HTMLElement | null) => {
    if (!card) return;
    if (pendingCard === card) {
      cancelAnimationFrame(raf);
      raf = 0;
      pendingCard = null;
    }
    card.classList.remove("is-touching");
    card.style.transition = "transform 0.35s ease";
    card.style.transform = "";
  };

  const findCard = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const card = hit?.closest<HTMLElement>(selector) ?? null;
    return card && cardSet.has(card) ? card : null;
  };

  cards.forEach((card) => {
    card.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse" && !hasHover) return;
        applyTilt(card, e.clientX, e.clientY, false);
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      reset(card);
    });
  });

  if (!cards.length) return;

  const moveTouchAtPoint = () => {
    const card = findCard(touchX, touchY);
    if (activeTouchCard && activeTouchCard !== card) reset(activeTouchCard);
    activeTouchCard = card;
    if (card) renderTilt(card, touchX, touchY, true);
  };

  const renderTouchAtPoint = () => {
    touchRaf = 0;
    if (!isTouchActive) return;
    moveTouchAtPoint();
  };

  const scheduleTouch = () => {
    if (!touchRaf) touchRaf = requestAnimationFrame(renderTouchAtPoint);
  };

  const startTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
    isTouchActive = true;
    scheduleTouch();
  };

  const moveTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
    scheduleTouch();
  };

  const endTouch = () => {
    isTouchActive = false;
    cancelAnimationFrame(touchRaf);
    touchRaf = 0;
    reset(activeTouchCard);
    activeTouchCard = null;
  };

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

  window.addEventListener("touchend", endTouch, { passive: true });
  window.addEventListener("touchcancel", endTouch, { passive: true });
}
