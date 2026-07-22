import { isReducedMotion } from "./motionPreference";

const ACTIVE_CLASS = "is-icon-active";
const TOUCH_DURATION = 1500;

export function initEmojiMotion(): void {
  if (isReducedMotion()) return;

  const timers = new WeakMap<HTMLElement, number>();

  document.querySelectorAll<HTMLElement>("[data-icon-motion]").forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;

      const previousTimer = timers.get(card);
      if (previousTimer) clearTimeout(previousTimer);

      card.classList.remove(ACTIVE_CLASS);
      requestAnimationFrame(() => {
        card.classList.add(ACTIVE_CLASS);
        const timer = window.setTimeout(() => {
          card.classList.remove(ACTIVE_CLASS);
          timers.delete(card);
        }, TOUCH_DURATION);
        timers.set(card, timer);
      });
    }, { passive: true });
  });
}
