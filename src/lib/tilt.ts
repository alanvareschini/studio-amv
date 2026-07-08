// Tilt 3D leve que segue o cursor no desktop e o dedo no mobile. Aplica a
// transform inline (sobrepoe outras regras, evitando conflito com [data-reveal]).
export function initCardTilt(selector: string, maxAngle = 6, lift = 3, persp = 800): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;

  document.querySelectorAll<HTMLElement>(selector).forEach((card) => {
    let activePointerId: number | null = null;
    let raf = 0;

    const applyTilt = (e: PointerEvent, isTouch = false) => {
      const r = card.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 2 - 1; // -1 a 1
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const touchSoftener = isTouch ? 0.72 : 1;
        const ry = (px * maxAngle * touchSoftener).toFixed(2);
        const rx = (-py * maxAngle * touchSoftener).toFixed(2);

        card.classList.toggle("is-touching", isTouch);
        card.style.transition = isTouch ? "transform 0.16s ease-out" : "transform 0.12s ease-out";
        card.style.transitionDelay = "0s";
        card.style.transform = `perspective(${persp}px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(-${lift}px)`;
      });
    };

    const reset = () => {
      cancelAnimationFrame(raf);
      card.classList.remove("is-touching");
      card.style.transition = "transform 0.35s ease";
      card.style.transform = "";
    };

    card.addEventListener(
      "pointermove",
      (e) => {
        if (activePointerId != null && activePointerId !== e.pointerId) return;
        if (e.pointerType === "mouse" && !hasHover) return;
        applyTilt(e, e.pointerType !== "mouse");
      },
      { passive: true }
    );

    card.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse") return;
        activePointerId = e.pointerId;
        try {
          card.setPointerCapture(e.pointerId);
        } catch {
          // A captura pode falhar se o navegador transformar o gesto em scroll.
        }
        applyTilt(e, true);
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      reset();
    });

    window.addEventListener(
      "pointermove",
      (e) => {
        if (activePointerId !== e.pointerId) return;
        applyTilt(e, true);
      },
      { passive: true }
    );

    const endTouch = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
      reset();
    };

    window.addEventListener("pointerup", endTouch, { passive: true });
    window.addEventListener("pointercancel", endTouch, { passive: true });
  });
}
