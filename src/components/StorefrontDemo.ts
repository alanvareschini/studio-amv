import gsap from "gsap";
import { claimDemoScene, releaseDemoScene } from "../lib/demoSceneManager";

const SCENE_ID = "storefront-demo";

interface StoreProduct {
  name: string;
  category: string;
  price: string;
  slug: string;
}

const PRODUCTS: StoreProduct[] = [
  { name: "Arandela Horizonte", category: "Iluminação artesanal", price: "R$ 289", slug: "arandela-horizonte" },
  { name: "Lanterna Nômade", category: "Luz portátil", price: "R$ 239", slug: "lanterna-nomade" },
  { name: "Vaso Maré", category: "Cerâmica iluminada", price: "R$ 198", slug: "vaso-mare" },
  { name: "Ritual da Casa", category: "Bem-estar", price: "R$ 164", slug: "ritual-da-casa" },
];

const renderProduct = (product: StoreProduct, index: number) => /* html */ `
  <article class="sf-product" data-sf-product="${index}" data-sf-product-kind="${product.slug}">
    <figure class="sf-product__visual">
      <span class="sf-product__number">0${index + 1}</span>
      <img
        class="sf-product__image sf-product__image--off"
        data-sf-image
        data-sf-src="/storefront/${product.slug}-off.webp"
        width="1122"
        height="1402"
        alt=""
        decoding="async"
      >
      <img
        class="sf-product__image sf-product__image--on"
        data-sf-image
        data-sf-src="/storefront/${product.slug}-on.webp"
        width="1122"
        height="1402"
        alt=""
        decoding="async"
      >
      <span class="sf-product__availability">Peça disponível</span>
    </figure>
    <div class="sf-product__meta">
      <div>
        <span>${product.category}</span>
        <h3>${product.name}</h3>
      </div>
      <strong>${product.price}</strong>
    </div>
    <button class="sf-product__add" type="button" data-sf-add aria-label="Adicionar ${product.name} à seleção">
      <span>Adicionar</span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>
    </button>
  </article>`;

export function StorefrontDemo(): string {
  return /* html */ `
    <div class="sf-scene" id="storefrontDemoScene" data-store-theme="light" data-store-lights="off" aria-hidden="true" hidden>
      <button class="sf-scene__backdrop" type="button" data-sf-close tabindex="-1" aria-label="Fechar vitrine"></button>
      <section class="sf-shell" role="dialog" aria-modal="true" aria-labelledby="storefrontDemoTitle" tabindex="-1">
        <header class="sf-topbar">
          <div class="sf-brand" aria-label="Vitrine de Bairro">
            <svg viewBox="0 0 34 34" aria-hidden="true"><path d="M5 14 17 5l12 9v15H5V14Zm7 15V18h10v11"/></svg>
            <span>Vitrine<br><b>de Bairro</b></span>
          </div>

          <div class="sf-controls" aria-label="Aparência da vitrine">
            <button class="sf-switch" type="button" data-sf-toggle="theme" aria-pressed="false" aria-label="Alternar tema da vitrine">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/><circle cx="12" cy="12" r="4"/></svg>
              <span><i></i></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.1A8 8 0 0 1 8.9 4a8 8 0 1 0 11.1 11.1Z"/></svg>
              <small>Tema</small>
            </button>
            <button class="sf-switch sf-switch--light" type="button" data-sf-toggle="lights" aria-pressed="false" aria-label="Acender luzes da vitrine">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 3h4m4-10a6 6 0 1 0-9.7 4.7c.5.4.7 1 .7 1.6V18h6v-.7c0-.6.3-1.2.7-1.6A6 6 0 0 0 18 11Z"/></svg>
              <span><i></i></span>
              <small>Luz</small>
            </button>
          </div>

          <div class="sf-actions">
            <span class="sf-bag" aria-live="polite">Seleção <b data-sf-count>0</b></span>
            <button class="sf-close" type="button" data-sf-close aria-label="Fechar vitrine">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
            </button>
          </div>
        </header>

        <div class="sf-content">
          <header class="sf-hero">
            <div>
              <span class="sf-kicker">Coleção 01 · Feita por perto</span>
              <h2 id="storefrontDemoTitle">Objetos com história.<br><em>Vitrine com presença.</em></h2>
            </div>
            <div class="sf-hero__aside">
              <p>Uma loja demonstrativa para mostrar produtos, valores e personalidade antes mesmo da primeira mensagem.</p>
              <span>Entrega local · Retirada no bairro</span>
            </div>
          </header>

          <section class="sf-products" aria-label="Produtos demonstrativos">
            ${PRODUCTS.map(renderProduct).join("")}
          </section>

          <footer class="sf-footer">
            <p>Produtos, marca e valores são ilustrativos.</p>
            <button type="button" data-sf-cta>
              Quero uma vitrine assim
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
            </button>
          </footer>
        </div>
      </section>
    </div>`;
}

export function initStorefrontDemo(): void {
  const trigger = document.querySelector<HTMLElement>(`[data-demo-scene="${SCENE_ID}"]`);
  const scene = document.getElementById("storefrontDemoScene");
  const shell = scene?.querySelector<HTMLElement>(".sf-shell");
  const app = document.getElementById("app");
  if (!trigger || !scene || !shell || !app) return;

  document.body.appendChild(scene);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const products = Array.from(scene.querySelectorAll<HTMLElement>(".sf-product"));
  const productImages = Array.from(scene.querySelectorAll<HTMLImageElement>("[data-sf-image]"));
  const toggles = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-sf-toggle]"));
  const count = scene.querySelector<HTMLElement>("[data-sf-count]");
  let timeline: gsap.core.Timeline | null = null;
  let imageLoadPromise: Promise<void> | null = null;
  let isOpen = false;
  let isClosing = false;
  let selected = 0;
  let previousFocus: HTMLElement | null = null;
  let afterClose: (() => void) | null = null;

  const loadProductImages = () => {
    if (imageLoadPromise) return imageLoadPromise;
    scene.classList.add("is-images-loading");
    imageLoadPromise = Promise.allSettled(
      productImages.map(async (image) => {
        const source = image.dataset.sfSrc;
        if (!source) return;
        image.src = source;
        try {
          await image.decode();
        } catch {
          // A failed decode still lets the browser render a successfully loaded image.
        }
      }),
    ).then(() => {
      scene.classList.remove("is-images-loading");
      scene.classList.add("is-images-ready");
    });
    return imageLoadPromise;
  };

  const cardTransform = () => {
    const cardRect = trigger.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    return {
      x: cardRect.left + cardRect.width / 2 - (shellRect.left + shellRect.width / 2),
      y: cardRect.top + cardRect.height / 2 - (shellRect.top + shellRect.height / 2),
      scaleX: Math.max(0.08, cardRect.width / shellRect.width),
      scaleY: Math.max(0.08, cardRect.height / shellRect.height),
    };
  };

  const finishClose = () => {
    timeline?.kill();
    timeline = null;
    gsap.killTweensOf([scene, shell, products]);
    gsap.set([scene, shell, products], { clearProps: "all" });
    scene.hidden = true;
    scene.classList.remove("is-open");
    scene.setAttribute("aria-hidden", "true");
    document.body.classList.remove("demo-scene-open");
    app.inert = false;
    app.removeAttribute("aria-hidden");
    isOpen = false;
    isClosing = false;
    releaseDemoScene(SCENE_ID);
    const focusTarget = previousFocus;
    previousFocus = null;
    requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
    const callback = afterClose;
    afterClose = null;
    callback?.();
  };

  const closeScene = (immediate = false, callback?: () => void) => {
    if ((!isOpen && !isClosing) || scene.hidden) return;
    afterClose = callback ?? null;
    timeline?.kill();
    timeline = null;
    gsap.killTweensOf([scene, shell, products]);
    if (immediate || reducedMotion.matches) {
      finishClose();
      return;
    }
    isClosing = true;
    const target = cardTransform();
    timeline = gsap
      .timeline({ defaults: { overwrite: "auto" }, onComplete: finishClose })
      .to(products, { autoAlpha: 0, y: 14, duration: 0.2, stagger: 0.02 }, 0)
      .to(shell, { ...target, autoAlpha: 0, duration: 0.52, ease: "power3.inOut" }, 0.12)
      .to(scene, { autoAlpha: 0, duration: 0.3 }, 0.28);
  };

  const openScene = () => {
    if (isOpen || isClosing) return;
    void loadProductImages();
    previousFocus = trigger;
    claimDemoScene({ id: SCENE_ID, deactivate: closeScene });
    isOpen = true;
    scene.hidden = false;
    scene.classList.add("is-open");
    scene.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-scene-open");
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    gsap.set([scene, shell, products], { clearProps: "all" });

    if (reducedMotion.matches) {
      gsap.set(scene, { autoAlpha: 1 });
      shell.focus({ preventScroll: true });
      return;
    }

    const origin = cardTransform();
    gsap.set(scene, { autoAlpha: 0 });
    gsap.set(shell, { ...origin, autoAlpha: 0, transformOrigin: "center center" });
    gsap.set(products, { autoAlpha: 0, y: 24 });
    timeline = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        shell.focus({ preventScroll: true });
      },
    });
    timeline
      .to(scene, { autoAlpha: 1, duration: 0.35 }, 0)
      .to(shell, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.78, ease: "expo.out" }, 0.04)
      .to(products, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.42);
  };

  const updateAppearance = (kind: "theme" | "lights", button: HTMLButtonElement) => {
    const current = kind === "theme" ? scene.dataset.storeTheme : scene.dataset.storeLights;
    const next = kind === "theme" ? (current === "light" ? "dark" : "light") : current === "off" ? "on" : "off";
    const update = () => {
      if (kind === "theme") scene.dataset.storeTheme = next;
      else scene.dataset.storeLights = next;
      button.setAttribute("aria-pressed", String(next === "dark" || next === "on"));
    };
    if (kind === "lights") {
      update();
      return;
    }
    const documentWithTransition = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (!reducedMotion.matches && documentWithTransition.startViewTransition) {
      documentWithTransition.startViewTransition(update);
    } else update();
  };

  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "storefrontDemoScene");
  trigger.setAttribute("aria-label", "Abrir modelo de vitrine para loja local");
  trigger.addEventListener("pointerenter", () => void loadProductImages(), { passive: true });
  trigger.addEventListener("focus", () => void loadProductImages());
  trigger.addEventListener("click", openScene);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScene();
    }
  });

  scene.querySelectorAll<HTMLElement>("[data-sf-close]").forEach((button) => {
    button.addEventListener("click", () => closeScene());
  });
  toggles.forEach((button) => {
    button.addEventListener("click", () => updateAppearance(button.dataset.sfToggle as "theme" | "lights", button));
  });
  scene.querySelectorAll<HTMLButtonElement>("[data-sf-add]").forEach((button) => {
    button.addEventListener("click", () => {
      selected += 1;
      if (count) count.textContent = String(selected);
      gsap.fromTo(count, { scale: 1.6, y: -3 }, { scale: 1, y: 0, duration: 0.45, ease: "back.out(2)" });
      button.classList.add("is-added");
      window.setTimeout(() => button.classList.remove("is-added"), 800);
    });
  });
  scene.querySelector<HTMLElement>("[data-sf-cta]")?.addEventListener("click", () => {
    closeScene(false, () => document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth" }));
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen || scene.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeScene();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(scene.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter(
      (element) => element.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === shell)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
