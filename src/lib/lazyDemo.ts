interface LazyDemoModule {
  render: () => string;
  init: () => void;
}

interface LazyDemoOptions {
  scene: string;
  sceneElementId: string;
  label: string;
  load: () => Promise<LazyDemoModule>;
}

export function initLazyDemo(options: LazyDemoOptions): void {
  const trigger = document.querySelector<HTMLElement>(`[data-demo-scene="${options.scene}"]`);
  if (!trigger) return;

  let ready = false;
  let pending: Promise<void> | null = null;

  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-label", options.label);

  const ensureLoaded = (): Promise<void> => {
    if (ready) return Promise.resolve();
    if (pending) return pending;

    trigger.setAttribute("aria-busy", "true");
    trigger.classList.add("is-demo-loading");
    pending = options.load()
      .then((demo) => {
        if (!document.getElementById(options.sceneElementId)) {
          document.body.insertAdjacentHTML("beforeend", demo.render());
        }
        demo.init();
        ready = true;
        trigger.dataset.demoReady = "true";
      })
      .catch((error) => {
        pending = null;
        console.error(`[demo] falhou ao carregar ${options.scene}`, error);
        throw error;
      })
      .finally(() => {
        trigger.removeAttribute("aria-busy");
        trigger.classList.remove("is-demo-loading");
      });
    return pending;
  };

  const preload = () => {
    void ensureLoaded().catch(() => undefined);
  };
  trigger.addEventListener("pointerenter", preload, { once: true, passive: true });
  trigger.addEventListener("focus", preload, { once: true });
  trigger.addEventListener("click", (event) => {
    if (ready) return;
    event.preventDefault();
    void ensureLoaded()
      .then(() => trigger.click())
      .catch(() => undefined);
  });
  trigger.addEventListener("keydown", (event) => {
    if (ready || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    void ensureLoaded()
      .then(() => trigger.click())
      .catch(() => undefined);
  });
}
