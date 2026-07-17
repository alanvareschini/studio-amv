import gsap from "gsap";
import { claimDemoScene, releaseDemoScene } from "../lib/demoSceneManager";

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
      ["Orla tônica", "R$ 32", "Gin, cambuci, tônica e alecrim"],
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
    <path d="M0 4Q3 0 6 4T12 4T18 4T24 4T30 4T36 4T42 4T48 4T54 4T60 4T66 4T72 4T78 4T84 4" />
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
    <path d="M0 181c78-24 126 7 196-20 61-24 105-13 164 5v64H0Z" fill="#173247" opacity=".9"/>
    <ellipse cx="183" cy="142" rx="88" ry="34" fill="#f7f1e5" stroke="#244a63" stroke-width="3"/>
    <ellipse cx="183" cy="137" rx="55" ry="19" fill="#dce9e5"/>
    <path d="M142 132c18-14 55-15 82 1-17 13-60 17-82-1Z" fill="#2c6c67"/>
    <path d="M163 127c10 8 24 12 40 9M176 122c-2 9 2 16 9 20" fill="none" stroke="#d5b66f" stroke-width="3" stroke-linecap="round"/>
    <path d="M80 74c22 20 33 49 30 88M91 96c-19-4-28-14-32-29 18 1 29 10 32 29Zm15 24c17-10 31-9 42-1-11 14-25 14-42 1Z" fill="none" stroke="#2c6c67" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M278 87v72M262 87h32l-7 25h-18Z" fill="none" stroke="#244a63" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="278" cy="99" r="7" fill="#d5b66f"/>
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

        <div class="rm-brochure">
          <article class="rm-panel rm-panel--brand" data-rm-panel="brand">
            <span class="rm-corner rm-corner--tl">Casa Orla</span>
            <span class="rm-corner rm-corner--br">São Paulo · 2026</span>
            <div class="rm-panel__inner rm-brand">
              <header class="rm-brand__head">
                ${wave()}
                <h2 id="restaurantMenuTitle"><span>Casa</span><span>Orla</span></h2>
                <p>Cozinha brasileira contemporânea</p>
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
  const brochure = scene?.querySelector<HTMLElement>(".rm-brochure");
  const app = document.getElementById("app");
  if (!trigger || !scene || !dialog || !brochure || !app) return;

  document.body.appendChild(scene);

  const panels = Array.from(scene.querySelectorAll<HTMLElement>(".rm-panel"));
  const panelContent = Array.from(scene.querySelectorAll<HTMLElement>(".rm-panel__inner > *"));
  const tabs = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-rm-tab]"));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 781px)");
  let timeline: gsap.core.Timeline | null = null;
  let isOpen = false;
  let isClosing = false;
  let afterClose: (() => void) | null = null;
  let previousFocus: HTMLElement | null = null;

  const cardTransform = () => {
    const cardRect = trigger.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    return {
      x: cardRect.left + cardRect.width / 2 - (dialogRect.left + dialogRect.width / 2),
      y: cardRect.top + cardRect.height / 2 - (dialogRect.top + dialogRect.height / 2),
      scaleX: Math.max(0.08, cardRect.width / dialogRect.width),
      scaleY: Math.max(0.08, cardRect.height / dialogRect.height),
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
    gsap.killTweensOf([scene, dialog, brochure, panels, panelContent]);
    gsap.set([scene, dialog, brochure, panels, panelContent], { clearProps: "all" });
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
    gsap.killTweensOf([scene, dialog, brochure, panels, panelContent]);
    if (immediate || reducedMotion.matches) {
      finishClose();
      return;
    }

    isClosing = true;
    const target = cardTransform();
    timeline = gsap
      .timeline({ defaults: { overwrite: "auto" }, onComplete: finishClose })
      .to(panelContent, { autoAlpha: 0, y: 10, duration: 0.18, stagger: 0.01 }, 0)
      .to(
        panels[0],
        { rotationY: -82, transformOrigin: "right center", duration: 0.38, ease: "power3.in" },
        0.05,
      )
      .to(
        panels[2],
        { rotationY: 82, transformOrigin: "left center", duration: 0.38, ease: "power3.in" },
        0.05,
      )
      .to(dialog, { ...target, autoAlpha: 0, duration: 0.48, ease: "power3.inOut" }, 0.23)
      .to(scene, { autoAlpha: 0, duration: 0.32 }, 0.3);
  };

  const openScene = () => {
    if (isOpen || isClosing) return;
    previousFocus = trigger;
    claimDemoScene({ id: SCENE_ID, deactivate: closeScene });
    isOpen = true;
    scene.hidden = false;
    scene.classList.add("is-open");
    scene.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-scene-open");
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    setActiveTab("menu");

    gsap.set([scene, dialog, brochure, panels, panelContent], { clearProps: "all" });
    if (reducedMotion.matches) {
      gsap.set(scene, { autoAlpha: 1 });
      dialog.focus({ preventScroll: true });
      return;
    }

    const origin = cardTransform();
    gsap.set(scene, { autoAlpha: 0 });
    gsap.set(dialog, { ...origin, autoAlpha: 0, transformOrigin: "center center" });

    timeline = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        dialog.focus({ preventScroll: true });
      },
    });
    timeline.to(scene, { autoAlpha: 1, duration: 0.35 }, 0);
    timeline.to(dialog, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.72, ease: "expo.out" }, 0.05);

    if (desktop.matches) {
      gsap.set(panels[0], { rotationY: -88, autoAlpha: 0, transformOrigin: "right center" });
      gsap.set(panels[1], { scale: 0.9, z: -70, autoAlpha: 0 });
      gsap.set(panels[2], { rotationY: 88, autoAlpha: 0, transformOrigin: "left center" });
      gsap.set(panelContent, { autoAlpha: 0, y: 16 });
      timeline
        .to(panels[1], { scale: 1, z: 0, autoAlpha: 1, duration: 0.85, ease: "expo.out" }, 0.3)
        .to(panels[0], { rotationY: 0, autoAlpha: 1, duration: 1.05, ease: "expo.out" }, 0.48)
        .to(panels[2], { rotationY: 0, autoAlpha: 1, duration: 1.05, ease: "expo.out" }, 0.58)
        .to(panelContent, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.025 }, 0.72);
    } else {
      timeline.fromTo(brochure, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.52 }, 0.3);
    }
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
