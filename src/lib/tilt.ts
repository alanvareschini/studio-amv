// Tilt 3D leve que segue o cursor no desktop e o dedo no mobile. Aplica a
// transform inline (sobrepoe outras regras, evitando conflito com [data-reveal]).
export function initCardTilt(selector: string, maxAngle = 6, lift = 3, persp = 800): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
  let activeTouchCard: HTMLElement | null = null;
  let raf = 0;

  const applyTilt = (card: HTMLElement, clientX: number, clientY: number, isTouch = false) => {
    const r = card.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * 2 - 1; // -1 a 1
    const py = ((clientY - r.top) / r.height) * 2 - 1;

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const touchSoftener = isTouch ? 0.72 : 1;
      const ry = (px * maxAngle * touchSoftener).toFixed(2);
      const rx = (-py * maxAngle * touchSoftener).toFixed(2);

      card.classList.toggle("is-touching", isTouch);
      card.style.transition = isTouch ? "transform 0.14s ease-out" : "transform 0.12s ease-out";
      card.style.transitionDelay = "0s";
      card.style.transform = `perspective(${persp}px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(-${lift}px)`;
    });
  };

  const reset = (card: HTMLElement | null) => {
    if (!card) return;
    cancelAnimationFrame(raf);
    card.classList.remove("is-touching");
    card.style.transition = "transform 0.35s ease";
    card.style.transform = "";
  };

  const findCard = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const card = hit?.closest<HTMLElement>(selector) ?? null;
    return card && cards.includes(card) ? card : null;
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

  const moveTouch = (touch: Touch) => {
    const card = findCard(touch.clientX, touch.clientY);
    if (activeTouchCard && activeTouchCard !== card) reset(activeTouchCard);
    activeTouchCard = card;
    if (card) applyTilt(card, touch.clientX, touch.clientY, true);
  };

  const endTouch = () => {
    reset(activeTouchCard);
    activeTouchCard = null;
  };

  window.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (touch) moveTouch(touch);
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
