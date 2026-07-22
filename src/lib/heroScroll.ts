
// Revelações controladas pelo scroll (GSAP ScrollTrigger):
// 1) Hero: começa só com o nome; conforme rola, as infos vão surgindo.
// 2) Cards de plano: aparecem um por um conforme o scroll.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isReducedMotion } from "./motionPreference";

gsap.registerPlugin(ScrollTrigger);

export function initHeroScroll(): void {
  // Em "reduzir movimento", deixa tudo visível e estático (nada de scrub).
  if (isReducedMotion()) return;

  setupPackages();
}

function setupPackages(): void {
  const cards = gsap.utils.toArray<HTMLElement>(".pkg-wrap");
  if (!cards.length) return;

  // estado inicial escondido (definido por JS, então o fallback sem JS mostra tudo)
  gsap.set(cards, { autoAlpha: 0, y: 80 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#pacotes",
      start: "top 75%",
      end: "top 5%",
      scrub: 1,
    },
  });

  // cada card entra na sequência → "um por um" conforme o scroll
  cards.forEach((card, i) => {
    tl.to(card, { autoAlpha: 1, y: 0, ease: "power2.out", duration: 1 }, i * 0.9);
  });
}
