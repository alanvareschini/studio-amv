const ACTIVE_MARGIN = "35% 0px 35% 0px";
const REGION_SELECTOR = ".hero, .proof, .section, .cta-final, .footer";

export function initRenderActivity(): void {
  const root = document.documentElement;
  const regions = Array.from(
    document.querySelectorAll<HTMLElement>(REGION_SELECTOR),
  );

  const syncPageActivity = () => {
    root.dataset.pageActive = document.hidden ? "false" : "true";
  };

  syncPageActivity();
  document.addEventListener("visibilitychange", syncPageActivity, {
    passive: true,
  });

  if (!regions.length) return;

  if (!("IntersectionObserver" in window)) {
    regions.forEach((region) => {
      region.dataset.renderActive = "true";
    });
    return;
  }

  const viewportPadding = window.innerHeight * 0.35;
  regions.forEach((region) => {
    const rect = region.getBoundingClientRect();
    const isNearViewport =
      rect.bottom >= -viewportPadding &&
      rect.top <= window.innerHeight + viewportPadding;
    region.dataset.renderActive = String(isNearViewport);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        (entry.target as HTMLElement).dataset.renderActive = String(
          entry.isIntersecting,
        );
      });
    },
    {
      rootMargin: ACTIVE_MARGIN,
      threshold: 0,
    },
  );

  regions.forEach((region) => observer.observe(region));
}
