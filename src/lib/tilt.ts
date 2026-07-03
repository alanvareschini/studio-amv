// Tilt 3D leve que segue o cursor. Aplica a transform inline (sobrepõe outras
// regras, evitando conflito com a animação de entrada [data-reveal]).
// Pula em telas de toque e quando o usuário prefere menos movimento.
export function initCardTilt(selector: string, maxAngle = 6, lift = 3, persp = 800): void {
  if (
    !window.matchMedia("(hover: hover)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  document.querySelectorAll<HTMLElement>(selector).forEach((card) => {
    let raf = 0;

    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 2 - 1; // -1 a 1
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ry = (px * maxAngle).toFixed(2);
        const rx = (-py * maxAngle).toFixed(2);
        // sobrepõe a transição/atraso do [data-reveal] para o tilt seguir o cursor
        card.style.transition = "transform 0.12s ease-out";
        card.style.transitionDelay = "0s";
        card.style.transform = `perspective(${persp}px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(-${lift}px)`;
      });
    });

    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      card.style.transition = "transform 0.35s ease";
      card.style.transform = ""; // volta suave ao normal
    });
  });
}
