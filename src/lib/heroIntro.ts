import { isReducedMotion } from "./motionPreference";

const LUSION_EASE = "cubic-bezier(.35, 0, 0, 1)";

export function initHeroIntro(): void {
  let hasRevealed = false;

  const reveal = () => {
    if (hasRevealed) return;
    hasRevealed = true;

    const reducedMotion = isReducedMotion();
    const words = Array.from(document.querySelectorAll<HTMLElement>(".hero-intro__word"));
    const subtitle = document.querySelector<HTMLElement>(".hero__subtitle");
    const actions = document.querySelector<HTMLElement>(".hero__actions");

    document.body.classList.remove("is-intro-pending");
    if (reducedMotion) {
      [...words, subtitle, actions].forEach((element) => {
        element?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 240,
          easing: "ease-out",
          fill: "both",
        });
      });
      return;
    }

    words.forEach((word, index) => {
      word.animate(
        [
          { transform: "translate3d(0, 1.7em, 0) rotate(15deg)" },
          { transform: "translate3d(0, 0, 0) rotate(0deg)" },
        ],
        {
          duration: 1000,
          delay: index * 50,
          easing: LUSION_EASE,
          fill: "both",
        },
      );
    });

    subtitle?.animate(
      [
        { opacity: 0, transform: "scale(.8)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 600, delay: 200, easing: LUSION_EASE, fill: "both" },
    );
    actions?.animate(
      [
        { opacity: 0, transform: "scale(.8)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 600, delay: 300, easing: LUSION_EASE, fill: "both" },
    );
  };

  window.addEventListener("amv:intro-complete", reveal, { once: true });
  if (
    !document.getElementById("preloader") &&
    (!document.getElementById("clothintro") || !document.body.classList.contains("ci-site-hidden"))
  ) {
    requestAnimationFrame(reveal);
  }
}
