import "../restaurant-menu.css";
import gsap from "gsap";
import { claimDemoScene, releaseDemoScene } from "../lib/demoSceneManager";
import { isReducedMotion } from "../lib/motionPreference";

const SCENE_ID = "restaurant-menu";

type MenuItem = [name: string, price: string, description?: string];

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const FOOD_SECTIONS: MenuSection[] = [
  {
    title: "Para começar",
    items: [
      ["Pão da casa", "R$ 18", "Fermentação natural, manteiga tostada"],
      ["Croqueta de costela", "R$ 32", "Mostarda de rapadura, picles de cebola"],
      ["Burrata da estação", "R$ 46", "Tomates assados, manjericão, castanhas"],
    ],
  },
  {
    title: "Da cozinha",
    items: [
      ["Arroz do mar", "R$ 78", "Camarão, lula, peixe fresco e aioli de limão"],
      ["Nhoque de mandioquinha", "R$ 64", "Cogumelos, queijo curado e ervas"],
      ["Peixe na brasa", "R$ 84", "Purê defumado, legumes e molho de moqueca"],
    ],
  },
];

const BAR_SECTIONS: MenuSection[] = [
  {
    title: "Da casa",
    items: [
      ["Tônica da casa", "R$ 32", "Gin, cambuci, tônica e alecrim"],
      ["Caju alto", "R$ 29", "Cachaça, caju, limão e espuma de gengibre"],
      ["Brisa zero", "R$ 22", "Uva branca, manjericão e água com gás"],
    ],
  },
  {
    title: "Final feliz",
    items: [
      ["Pudim de cumaru", "R$ 24"],
      ["Chocolate e café", "R$ 28"],
      ["Frutas, coco e limão", "R$ 22"],
    ],
  },
];

const wave = () => /* html */ `
  <svg class="rm-wave" viewBox="0 0 84 8" preserveAspectRatio="none" aria-hidden="true">
    <g class="rm-wave__track">
      <path d="M0 4Q3 0 6 4T12 4T18 4T24 4T30 4T36 4T42 4T48 4T54 4T60 4T66 4T72 4T78 4T84 4" />
      <path d="M0 4Q3 0 6 4T12 4T18 4T24 4T30 4T36 4T42 4T48 4T54 4T60 4T66 4T72 4T78 4T84 4" transform="translate(84 0)" />
    </g>
  </svg>`;

const renderSection = (section: MenuSection) => /* html */ `
  <section class="rm-menu-section">
    <header class="rm-menu-section__head">
      <h3>${section.title}</h3>
      ${wave()}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17c5-1 8-4 11-10 2 6 0 11-6 12M7 7c2 1 3 3 3 6"/></svg>
    </header>
    <div class="rm-menu-section__items">
      ${section.items
        .map(
          ([name, price, description]) => /* html */ `
        <div class="rm-item">
          <div class="rm-item__row">
            <span class="rm-item__name">${name}</span>
            <span class="rm-item__leader" aria-hidden="true"></span>
            <span class="rm-item__price">${price}</span>
          </div>
          ${description ? `<p>${description}</p>` : ""}
        </div>`,
        )
        .join("")}
    </div>
  </section>`;

const brandArtwork = () => /* html */ `
  <svg class="rm-brand-art" viewBox="0 0 360 230" role="img" aria-label="Ilustração de uma mesa posta">
    <defs>
      <linearGradient id="rm-art-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#22d3ee" stop-opacity=".24"/>
        <stop offset="1" stop-color="#00ff88" stop-opacity=".1"/>
      </linearGradient>
    </defs>
    <rect width="360" height="230" fill="url(#rm-art-grad)"/>
    <path class="rm-art-table" d="M0 181c78-24 126 7 196-20 61-24 105-13 164 5v64H0Z" fill="#173247" opacity=".9"/>
    <ellipse class="rm-art-plate" cx="183" cy="142" rx="88" ry="34" fill="#f7f1e5" stroke="#244a63" stroke-width="3"/>
    <ellipse class="rm-art-plate rm-art-plate--inner" cx="183" cy="137" rx="55" ry="19" fill="#dce9e5"/>
    <path class="rm-art-food" d="M142 132c18-14 55-15 82 1-17 13-60 17-82-1Z" fill="#2c6c67"/>
    <path d="M163 127c10 8 24 12 40 9M176 122c-2 9 2 16 9 20" fill="none" stroke="#d5b66f" stroke-width="3" stroke-linecap="round"/>
    <path class="rm-art-plant" d="M80 74c22 20 33 49 30 88M91 96c-19-4-28-14-32-29 18 1 29 10 32 29Zm15 24c17-10 31-9 42-1-11 14-25 14-42 1Z" fill="none" stroke="#2c6c67" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="rm-art-glass" d="M278 87v72M262 87h32l-7 25h-18Z" fill="none" stroke="#244a63" stroke-width="4" stroke-linejoin="round"/>
    <circle class="rm-art-drink" cx="278" cy="99" r="7" fill="#d5b66f"/>
  </svg>`;

export function RestaurantMenu(): string {
  return /* html */ `
    <div class="rm-scene" id="restaurantMenuScene" aria-hidden="true" hidden>
      <button class="rm-scene__backdrop" type="button" data-rm-close tabindex="-1" aria-label="Fechar cardápio"></button>
      <section class="rm-dialog" role="dialog" aria-modal="true" aria-labelledby="restaurantMenuTitle" tabindex="-1">
        <header class="rm-toolbar">
          <span>Modelo demonstrativo · Restaurante</span>
          <button class="rm-close" type="button" data-rm-close aria-label="Fechar cardápio">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>

        <div class="rm-tabs" role="tablist" aria-label="Seções do cardápio">
          <button type="button" role="tab" data-rm-tab="brand" aria-selected="false">A casa</button>
          <button type="button" role="tab" data-rm-tab="menu" aria-selected="true">Cardápio</button>
          <button type="button" role="tab" data-rm-tab="bar" aria-selected="false">Bebidas</button>
        </div>

        <button class="rm-cover" type="button" data-rm-unfold aria-label="Abrir o cardápio demonstrativo">
          <span class="rm-cover__surface">
            <span class="rm-corner rm-corner--tl">Modelo demonstrativo</span>
            <span class="rm-corner rm-corner--br">AMV Web Studio</span>
            ${wave()}
            <span class="rm-cover__title"><span>Seu</span><span>Restaurante</span></span>
            <span class="rm-cover__sub">Cardápio digital personalizado</span>
            <span class="rm-cover__divider" aria-hidden="true"></span>
            <svg class="rm-cover__art" viewBox="0 0 260 210" aria-hidden="true">
              <path d="M34 174c48-24 91-5 125-21 31-15 53-17 75-10"/>
              <ellipse cx="132" cy="129" rx="72" ry="27"/>
              <ellipse cx="132" cy="125" rx="45" ry="15"/>
              <path d="M101 121c17-12 45-12 63 1-16 11-46 12-63-1Zm-38-61c20 20 28 47 25 77M72 80C54 77 45 68 41 54c16 1 27 10 31 26Zm14 25c16-9 29-8 39 0-10 12-23 13-39 0ZM211 67v67m-14-67h28l-6 23h-16Z"/>
            </svg>
            <span class="rm-cover__tagline">Uma apresentação feita para abrir o apetite.</span>
            <span class="rm-cover__hint">
              Clique para abrir
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
            </span>
          </span>
        </button>

        <div class="rm-brochure">
          <article class="rm-panel rm-panel--brand" data-rm-panel="brand">
            <span class="rm-corner rm-corner--tl">Sua marca</span>
            <span class="rm-corner rm-corner--br">Sua cidade · 2026</span>
            <div class="rm-panel__inner rm-brand">
              <header class="rm-brand__head">
                ${wave()}
                <h2 id="restaurantMenuTitle"><span>Seu</span><span>Restaurante</span></h2>
                <p>Identidade e cozinha personalizadas</p>
              </header>
              <blockquote>Ingredientes próximos, fogo aceso e uma mesa feita para ficar.</blockquote>
              <div class="rm-info-strip">
                <span><b>Ter–Sáb</b>18h30–23h</span>
                <span><b>Domingo</b>12h–17h</span>
                <span><b>Reserva</b>Online</span>
              </div>
              ${brandArtwork()}
            </div>
          </article>

          <article class="rm-panel rm-panel--menu is-active" data-rm-panel="menu">
            <span class="rm-corner rm-corner--tl">Menu · Outono</span>
            <span class="rm-corner rm-corner--br">Valores ilustrativos</span>
            <div class="rm-panel__inner rm-menu-list">
              ${FOOD_SECTIONS.map(renderSection).join("")}
              <svg class="rm-botanical" viewBox="0 0 320 56" aria-hidden="true">
                <path d="M8 45c62-37 111 8 161-21 45-27 89-8 143-16M58 30c-8-13-18-18-31-17 5 14 15 20 31 17Zm63 5c8-15 19-22 34-22-3 16-14 23-34 22Zm96-17c-7-11-16-16-28-14 5 12 14 17 28 14Z"/>
              </svg>
            </div>
          </article>

          <article class="rm-panel rm-panel--bar" data-rm-panel="bar">
            <span class="rm-corner rm-corner--tl">Bar & sobremesas</span>
            <span class="rm-corner rm-corner--br">Beba com moderação</span>
            <div class="rm-panel__inner rm-bar-list">
              ${BAR_SECTIONS.map(renderSection).join("")}
              <div class="rm-bar-note">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 5h18l-4 10a6 6 0 0 1-10 0L7 5Zm9 14v8m-6 0h12"/></svg>
                <p>Opções sem álcool e adaptações alimentares disponíveis.</p>
              </div>
              <button class="rm-cta" type="button" data-rm-cta>
                <span>Quero um site assim</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>`;
}

export function initRestaurantMenu(): void {
  const trigger = document.querySelector<HTMLElement>(`[data-demo-scene="${SCENE_ID}"]`);
  const scene = document.getElementById("restaurantMenuScene");
  const dialog = scene?.querySelector<HTMLElement>(".rm-dialog");
  const cover = scene?.querySelector<HTMLButtonElement>(".rm-cover");
  const coverSurface = cover?.querySelector<HTMLElement>(".rm-cover__surface");
  const brochure = scene?.querySelector<HTMLElement>(".rm-brochure");
  const app = document.getElementById("app");
  if (!trigger || !scene || !dialog || !cover || !coverSurface || !brochure || !app) return;

  document.body.appendChild(scene);

  const panels = Array.from(scene.querySelectorAll<HTMLElement>(".rm-panel"));
  const panelContent = Array.from(scene.querySelectorAll<HTMLElement>(".rm-panel__inner > *"));
  const tabs = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-rm-tab]"));
  const reducedMotion = isReducedMotion;
  const desktop = matchMedia("(min-width: 781px)");
  let timeline: gsap.core.Timeline | null = null;
  let isOpen = false;
  let isClosing = false;
  let brochureOpened = false;
  let isUnfolding = false;
  let activeCoverPointer: number | null = null;
  let coverMotionFrame = 0;
  let coverPointerStartX = 0;
  let coverPointerStartY = 0;
  let suppressCoverClick = false;
  let afterClose: (() => void) | null = null;
  let previousFocus: HTMLElement | null = null;

  const resetCoverMotion = (immediate = false) => {
    cancelAnimationFrame(coverMotionFrame);
    coverMotionFrame = 0;
    activeCoverPointer = null;
    cover.classList.remove("is-following");
    cover.style.removeProperty("--rm-light-x");
    cover.style.removeProperty("--rm-light-y");
    coverSurface.style.setProperty("--rm-cover-rx", "0deg");
    coverSurface.style.setProperty("--rm-cover-ry", "0deg");
    if (immediate) {
      gsap.killTweensOf(cover, "x,y,rotationX,rotationY");
      gsap.set(cover, { x: 0, y: 0, rotationX: 0, rotationY: 0 });
      cover.classList.remove("is-resetting");
      return;
    }
    cover.classList.add("is-resetting");
  };

  const moveCover = (clientX: number, clientY: number, pointerType: string) => {
    if (!isOpen || brochureOpened || isClosing || isUnfolding || reducedMotion()) return;
    const rect = cover.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
    const touchFactor = pointerType === "touch" ? 0.68 : 1;

    cover.classList.remove("is-resetting");
    cover.classList.add("is-following");
    cover.style.setProperty("--rm-light-x", `${((px + 1) * 50).toFixed(1)}%`);
    cover.style.setProperty("--rm-light-y", `${((py + 1) * 50).toFixed(1)}%`);
    cancelAnimationFrame(coverMotionFrame);
    coverMotionFrame = requestAnimationFrame(() => {
      coverMotionFrame = 0;
      coverSurface.style.setProperty("--rm-cover-rx", `${(-py * 5.5 * touchFactor).toFixed(2)}deg`);
      coverSurface.style.setProperty("--rm-cover-ry", `${(px * 6.5 * touchFactor).toFixed(2)}deg`);
    });
  };

  const cardTransform = (element: HTMLElement) => {
    const cardRect = trigger.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return {
      x: cardRect.left + cardRect.width / 2 - (elementRect.left + elementRect.width / 2),
      y: cardRect.top + cardRect.height / 2 - (elementRect.top + elementRect.height / 2),
      scaleX: Math.max(0.08, cardRect.width / elementRect.width),
      scaleY: Math.max(0.08, cardRect.height / elementRect.height),
    };
  };

  const setActiveTab = (name: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.rmTab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.rmPanel === name));
  };

  const finishClose = () => {
    timeline?.kill();
    timeline = null;
    gsap.killTweensOf([scene, dialog, cover, brochure, panels, panelContent]);
    gsap.set([scene, dialog, cover, brochure, panels, panelContent], { clearProps: "all" });
    scene.hidden = true;
    scene.classList.remove("is-open", "is-brochure-open");
    scene.setAttribute("aria-hidden", "true");
    document.body.classList.remove("demo-scene-open");
    app.inert = false;
    app.removeAttribute("aria-hidden");
    isOpen = false;
    isClosing = false;
    brochureOpened = false;
    isUnfolding = false;
    activeCoverPointer = null;
    cancelAnimationFrame(coverMotionFrame);
    coverMotionFrame = 0;
    suppressCoverClick = false;
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
    gsap.killTweensOf([scene, dialog, cover, brochure, panels, panelContent]);
    if (immediate || reducedMotion()) {
      finishClose();
      return;
    }

    isClosing = true;
    resetCoverMotion(true);
    const targetElement = brochureOpened ? brochure : cover;
    const target = cardTransform(targetElement);
    timeline = gsap.timeline({ defaults: { overwrite: "auto" }, onComplete: finishClose });

    if (brochureOpened) {
      timeline.to(panelContent, { autoAlpha: 0, y: 10, duration: 0.18, stagger: 0.01 }, 0);
      if (desktop.matches) {
        timeline
          .to(
            panels[0],
            { rotationY: -82, transformOrigin: "right center", duration: 0.38, ease: "power3.in" },
            0.05,
          )
          .to(
            panels[2],
            { rotationY: 82, transformOrigin: "left center", duration: 0.38, ease: "power3.in" },
            0.05,
          );
      }
      timeline.to(brochure, { ...target, autoAlpha: 0, duration: 0.48, ease: "power3.inOut" }, 0.23);
    } else {
      timeline.to(cover, { ...target, autoAlpha: 0, duration: 0.48, ease: "power3.inOut" }, 0);
    }
    timeline.to(scene, { autoAlpha: 0, duration: 0.32 }, brochureOpened ? 0.3 : 0.16);
  };

  const openBrochure = () => {
    if (!isOpen || isClosing || brochureOpened || isUnfolding) return;
    timeline?.kill();
    timeline = null;
    resetCoverMotion(true);
    brochureOpened = true;
    isUnfolding = true;
    scene.classList.add("is-brochure-open");
    setActiveTab("menu");
    gsap.set([brochure, panels, panelContent], { clearProps: "all" });

    if (reducedMotion()) {
      gsap.set(cover, { autoAlpha: 0 });
      gsap.set(brochure, { autoAlpha: 1 });
      isUnfolding = false;
      dialog.focus({ preventScroll: true });
      return;
    }

    timeline = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        isUnfolding = false;
        dialog.focus({ preventScroll: true });
      },
    });

    if (desktop.matches) {
      gsap.set(panels[0], { rotationY: -88, autoAlpha: 0, transformOrigin: "right center" });
      gsap.set(panels[1], { scale: 0.9, z: -70, autoAlpha: 0 });
      gsap.set(panels[2], { rotationY: 88, autoAlpha: 0, transformOrigin: "left center" });
      gsap.set(panelContent, { autoAlpha: 0, y: 16 });
      gsap.set(brochure, { autoAlpha: 0 });
      timeline
        .to(cover, { rotateX: -76, y: -28, scale: 0.96, autoAlpha: 0, duration: 0.72, ease: "power3.inOut" }, 0)
        .to(brochure, { autoAlpha: 1, duration: 0.4 }, 0.18)
        .to(panels[1], { scale: 1, z: 0, autoAlpha: 1, duration: 0.85, ease: "expo.out" }, 0.28)
        .to(panels[0], { rotationY: 0, autoAlpha: 1, duration: 1.05, ease: "expo.out" }, 0.48)
        .to(panels[2], { rotationY: 0, autoAlpha: 1, duration: 1.05, ease: "expo.out" }, 0.58)
        .to(panelContent, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.025 }, 0.72);
    } else {
      gsap.set(brochure, { y: 22, autoAlpha: 0 });
      timeline
        .to(cover, { y: -18, scale: 0.96, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0)
        .to(brochure, { y: 0, autoAlpha: 1, duration: 0.58, ease: "expo.out" }, 0.24);
    }
  };

  const openScene = () => {
    if (isOpen || isClosing) return;
    previousFocus = trigger;
    claimDemoScene({ id: SCENE_ID, deactivate: closeScene });
    isOpen = true;
    brochureOpened = false;
    isUnfolding = false;
    scene.hidden = false;
    scene.classList.add("is-open");
    scene.classList.remove("is-brochure-open");
    scene.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-scene-open");
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    setActiveTab("menu");

    gsap.set([scene, dialog, cover, brochure, panels, panelContent], { clearProps: "all" });
    gsap.set(brochure, { autoAlpha: 0 });
    if (reducedMotion()) {
      gsap.set(scene, { autoAlpha: 1 });
      cover.focus({ preventScroll: true });
      return;
    }

    const origin = cardTransform(cover);
    gsap.set(scene, { autoAlpha: 0 });
    gsap.set(cover, { ...origin, autoAlpha: 0, transformOrigin: "center center" });
    timeline = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        cover.focus({ preventScroll: true });
      },
    });
    timeline.to(scene, { autoAlpha: 1, duration: 0.35 }, 0);
    timeline.to(cover, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.72, ease: "expo.out" }, 0.05);
  };

  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "restaurantMenuScene");
  trigger.setAttribute("aria-label", "Abrir modelo de cardápio para restaurante");
  trigger.addEventListener("click", openScene);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScene();
    }
  });
  cover.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    activeCoverPointer = event.pointerId;
    coverPointerStartX = event.clientX;
    coverPointerStartY = event.clientY;
    suppressCoverClick = false;
    cover.setPointerCapture(event.pointerId);
    moveCover(event.clientX, event.clientY, event.pointerType);
  });
  cover.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse" && activeCoverPointer !== event.pointerId) return;
      if (event.pointerType !== "mouse") {
        const distance = Math.hypot(event.clientX - coverPointerStartX, event.clientY - coverPointerStartY);
        if (distance > 9) suppressCoverClick = true;
      }
      moveCover(event.clientX, event.clientY, event.pointerType);
    },
    { passive: true },
  );
  cover.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") resetCoverMotion();
  });
  const finishCoverPointer = (event: PointerEvent) => {
    if (event.pointerType === "mouse" || activeCoverPointer !== event.pointerId) return;
    if (cover.hasPointerCapture(event.pointerId)) cover.releasePointerCapture(event.pointerId);
    resetCoverMotion();
    if (suppressCoverClick) window.setTimeout(() => (suppressCoverClick = false), 350);
  };
  cover.addEventListener("pointerup", finishCoverPointer);
  cover.addEventListener("pointercancel", finishCoverPointer);
  cover.addEventListener("click", (event) => {
    if (suppressCoverClick) {
      event.preventDefault();
      suppressCoverClick = false;
      return;
    }
    openBrochure();
  });

  scene.querySelectorAll<HTMLElement>("[data-rm-close]").forEach((button) => {
    button.addEventListener("click", () => closeScene());
  });
  tabs.forEach((tab) => tab.addEventListener("click", () => setActiveTab(tab.dataset.rmTab ?? "menu")));
  scene.querySelector<HTMLElement>("[data-rm-cta]")?.addEventListener("click", () => {
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
    const focusable = Array.from(
      scene.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
