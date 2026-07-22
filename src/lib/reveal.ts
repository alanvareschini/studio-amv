// RNF04 / RNF06 — Animações de entrada leves via IntersectionObserver.
import { isReducedMotion } from "./motionPreference";

export function initReveal(): void {
  const reducedMotion = isReducedMotion();
  const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = reducedMotion ? null : el.dataset.revealDelay;
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach((el) => observer.observe(el));
}
