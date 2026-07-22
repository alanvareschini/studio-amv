import "../barber-gallery.css";
import gsap from "gsap";
import { claimDemoScene, releaseDemoScene } from "../lib/demoSceneManager";
import { CubeAngleGallery } from "../lib/cubeAngleGallery";
import { KineticCarousel } from "../lib/kineticCarousel";
import { getPerformanceTier, isReducedMotion } from "../lib/motionPreference";

const SCENE_ID = "barber-gallery";
const IMAGE_ROOT = "/barber-gallery";

interface BarberCut {
  id: string;
  number: string;
  name: string;
  description: string;
  finish: string;
  tone: string;
  front: number;
  angles: Array<{ image: number; label: string }>;
}

const CUTS: BarberCut[] = [
  {
    id: "textured-fade",
    number: "01",
    name: "Textured Fade",
    description: "Textura marcada no topo com degradê baixo e acabamento natural.",
    finish: "Baixo · Texturizado",
    tone: "cyan",
    front: 1,
    angles: [
      { image: 1, label: "Frente" },
      { image: 2, label: "Lateral esquerda" },
      { image: 4, label: "Nuca" },
      { image: 3, label: "Lateral direita" },
      { image: 5, label: "Topo" },
    ],
  },
  {
    id: "afro-line",
    number: "02",
    name: "Afro Line",
    description: "Volume natural, linha frontal precisa e transição limpa nas laterais.",
    finish: "Médio · Definido",
    tone: "green",
    front: 18,
    angles: [
      { image: 18, label: "Frente" },
      { image: 6, label: "Lateral" },
      { image: 7, label: "Nuca" },
      { image: 8, label: "Topo" },
    ],
  },
  {
    id: "curly-fade",
    number: "03",
    name: "Curly Fade",
    description: "Cachos definidos, contraste equilibrado e fade suave ao redor.",
    finish: "Médio · Cacheado",
    tone: "purple",
    front: 19,
    angles: [
      { image: 19, label: "Frente" },
      { image: 10, label: "Lateral esquerda" },
      { image: 11, label: "Lateral direita" },
      { image: 12, label: "Topo" },
    ],
  },
  {
    id: "executive",
    number: "04",
    name: "Executive",
    description: "Risco clássico, volume controlado e laterais graduais com elegância.",
    finish: "Clássico · Social",
    tone: "blue",
    front: 13,
    angles: [
      { image: 13, label: "Frente" },
      { image: 14, label: "Lateral esquerda" },
      { image: 16, label: "Nuca" },
      { image: 15, label: "Lateral direita" },
      { image: 17, label: "Topo" },
    ],
  },
];

const imageFileName = (number: number) =>
  `barbearia-corte-${String(number).padStart(2, "0")}.webp`;

const imagePath = (number: number) => `${IMAGE_ROOT}/${imageFileName(number)}`;
const displayImagePath = imagePath;

const CUBE_COLUMNS = 8;
const CUBE_COUNT = CUBE_COLUMNS * CUBE_COLUMNS;

const renderBackgrounds = (count: number, tone: string) => /* html */ `
  <div class="bk-carousel__backgrounds" aria-hidden="true">
    ${Array.from({ length: count }, (_, index) => `<span class="bk-carousel__background bk-tone--${tone}-${(index % 3) + 1}" data-kc-background></span>`).join("")}
  </div>`;

const renderControls = (count: number, label: string) => /* html */ `
  <div class="bk-carousel__controls">
    <button class="bk-carousel__arrow bk-carousel__arrow--prev" type="button" data-kc-prev aria-label="Anterior">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
    </button>
    <div class="bk-carousel__pagination" aria-label="${label}">
      ${Array.from({ length: count }, (_, index) => `<button type="button" data-kc-dot aria-label="Ir para item ${index + 1}"></button>`).join("")}
    </div>
    <span class="bk-carousel__count"><b data-kc-current>01</b> / ${String(count).padStart(2, "0")}</span>
    <button class="bk-carousel__arrow bk-carousel__arrow--next" type="button" data-kc-next aria-label="Próximo">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
    </button>
  </div>`;

const renderCutSlide = (cut: BarberCut, index: number) => /* html */ `
  <div class="bk-slide swiper-slide" data-kc-slide data-cut-index="${index}" role="group" aria-label="${index + 1} de ${CUTS.length}: ${cut.name}">
    <button class="bk-card" type="button" data-kc-card data-bk-open-cut="${index}" aria-label="Abrir ${cut.name}">
      <span class="bk-card__number">${cut.number}</span>
      <span class="bk-card__halo" aria-hidden="true"></span>
      <span class="bk-card__shadow" data-kc-shadow aria-hidden="true"></span>
      <img class="bk-card__portrait" data-kc-media data-bk-src="${imagePath(cut.front)}" width="1254" height="1254" alt="Modelo com o corte ${cut.name}" decoding="async">
      <span class="bk-card__copy">
        <span class="bk-text-mask"><span data-kc-mask>${cut.finish}</span></span>
        <strong>
          <span class="bk-text-mask"><span data-kc-mask>${cut.name}</span></span>
        </strong>
        <span class="bk-text-mask bk-card__description"><span data-kc-mask>${cut.description}</span></span>
        <span class="bk-card__action">Ver todos os ângulos <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg></span>
      </span>
    </button>
  </div>`;

const renderMainCarousel = () => /* html */ `
  <div class="bk-carousel bk-carousel--cuts" data-bk-main-carousel tabindex="0" role="region" aria-label="Cortes disponíveis">
    ${CUTS.map((cut) => `<span class="bk-carousel__background bk-tone--${cut.tone}" data-kc-background aria-hidden="true"></span>`).join("")}
    <div class="bk-carousel__viewport swiper" data-kc-viewport>
      <div class="bk-carousel__track swiper-wrapper" data-kc-track>
        ${CUTS.map(renderCutSlide).join("")}
      </div>
    </div>
    ${renderControls(CUTS.length, "Selecionar corte")}
  </div>`;

const renderCubeFaces = (cut: BarberCut) => {
  const images = cut.angles.map((angle) => displayImagePath(angle.image));
  const faces = [images[5] ?? images[0], images[0], images[1] ?? images[0], images[2] ?? images[0], images[3] ?? images[0], images[4] ?? images[0]];
  return faces.map((source) => `<i style="--bk-cube-image:url('${source}')"></i>`).join("");
};

const renderAngleCarousel = (cut: BarberCut) => {
  const useCubes = getPerformanceTier() === "high";
  const initialImage = displayImagePath(cut.angles[0]?.image ?? cut.front);
  const nextImage = cut.angles[1] ? displayImagePath(cut.angles[1].image) : "";
  const visual = useCubes
    ? /* html */ `
        <div class="bk-cube-grid" aria-hidden="true">
          ${Array.from({ length: CUBE_COUNT }, (_, index) => {
            const x = index % CUBE_COLUMNS;
            const y = Math.floor(index / CUBE_COLUMNS);
            const position = 100 / CUBE_COLUMNS;
            const backgroundPosition = 100 / (CUBE_COLUMNS - 1);
            return `<span class="bk-cube" data-cube style="left:${x * position}%;top:${y * position}%;--bk-cube-bg-x:${x * backgroundPosition}%;--bk-cube-bg-y:${y * backgroundPosition}%;--bk-cube-delay:${index * 15}ms;--bk-cube-mobile-delay:${index * 6}ms"><span class="bk-cube__body">${renderCubeFaces(cut)}</span></span>`;
          }).join("")}
        </div>
        <canvas class="bk-angle-distortion" data-cube-distortion aria-hidden="true"></canvas>`
    : /* html */ `
        <div class="bk-angle-simple" aria-hidden="true">
          <img class="bk-angle-simple__image is-active" data-angle-simple-image src="${initialImage}" alt="" draggable="false" decoding="async">
          <img class="bk-angle-simple__image" data-angle-simple-image${nextImage ? ` src="${nextImage}"` : ""} alt="" draggable="false" decoding="async">
        </div>`;

  return /* html */ `
  <div class="bk-cube-gallery" data-bk-angle-cube data-bk-renderer="${useCubes ? "cube" : "simple"}" tabindex="0" role="region" aria-label="Ângulos do corte ${cut.name}">
    ${renderBackgrounds(cut.angles.length, cut.tone)}
    <div class="bk-cube-gallery__body">
      <div class="bk-cube-stage" data-cube-stage role="img" aria-label="${cut.angles[0]?.label ?? "Frente"}, ângulo 1 de ${cut.angles.length}">
        ${visual}
      </div>
    </div>
    <div class="bk-carousel__controls bk-cube-controls">
      <button class="bk-carousel__arrow bk-carousel__arrow--prev" type="button" data-cube-prev aria-label="Ângulo anterior">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
      </button>
      <div class="bk-carousel__pagination" aria-label="Selecionar ângulo de ${cut.name}">
        ${cut.angles.map((angle, index) => `<button type="button" data-cube-dot aria-label="Ver ${angle.label}"${index === 0 ? ' class="is-active" aria-current="true"' : ""}></button>`).join("")}
      </div>
      <span class="bk-carousel__count bk-cube-count"><b data-cube-current>01</b> / ${String(cut.angles.length).padStart(2, "0")}<em data-cube-label>${cut.angles[0]?.label ?? "Frente"}</em></span>
      <button class="bk-carousel__arrow bk-carousel__arrow--next" type="button" data-cube-next aria-label="Próximo ângulo">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
      </button>
    </div>
  </div>`;
};

export function BarberGallery(): string {
  return /* html */ `
    <div class="bk-scene" id="barberGalleryScene" aria-hidden="true" hidden>
      <button class="bk-scene__backdrop" type="button" data-bk-close tabindex="-1" aria-label="Fechar catálogo de cortes"></button>
      <section class="bk-shell" role="dialog" aria-modal="true" aria-labelledby="barberGalleryTitle" tabindex="-1">
        <header class="bk-topbar">
          <a class="bk-brand" href="#" tabindex="-1" aria-label="Brava Barber">
            <span class="bk-brand__mark">B</span>
            <span>BRAVA <b>BARBER</b></span>
          </a>
          <span class="bk-topbar__edition">Coleção de cortes · 2026</span>
          <button class="bk-close" type="button" data-bk-close aria-label="Fechar catálogo de cortes">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>

        <div class="bk-view bk-view--collection is-active" data-bk-view="collection">
          <header class="bk-intro">
            <span class="bk-eyebrow">Escolha sua próxima versão</span>
            <h2 id="barberGalleryTitle">Cortes vistos<br><em>por todos os lados.</em></h2>
            <p>Arraste para explorar. Toque em um corte para entrar.</p>
          </header>
          ${renderMainCarousel()}
        </div>

        <div class="bk-view bk-view--detail" data-bk-view="detail" aria-hidden="true">
          <header class="bk-detail-head">
            <button type="button" class="bk-back" data-bk-back>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
              Todos os cortes
            </button>
            <div>
              <span data-bk-detail-finish></span>
              <h2 data-bk-detail-title></h2>
              <p data-bk-detail-description></p>
            </div>
            <button class="bk-detail-cta" type="button" data-bk-cta>Quero um catálogo assim</button>
          </header>
          <div data-bk-detail-carousel></div>
        </div>
      </section>
    </div>`;
}

export function initBarberGallery(): void {
  const trigger = document.querySelector<HTMLElement>(`[data-demo-scene="${SCENE_ID}"]`);
  const scene = document.getElementById("barberGalleryScene");
  const shell = scene?.querySelector<HTMLElement>(".bk-shell");
  const collection = scene?.querySelector<HTMLElement>('[data-bk-view="collection"]');
  const detail = scene?.querySelector<HTMLElement>('[data-bk-view="detail"]');
  const detailHost = scene?.querySelector<HTMLElement>("[data-bk-detail-carousel]");
  const app = document.getElementById("app");
  if (!trigger || !scene || !shell || !collection || !detail || !detailHost || !app) return;

  document.body.appendChild(scene);
  const reducedMotion = isReducedMotion;
  const mainRoot = scene.querySelector<HTMLElement>("[data-bk-main-carousel]");
  if (!mainRoot) return;

  const hydrateImages = (scope: ParentNode) => {
    scope.querySelectorAll<HTMLImageElement>("[data-bk-src]").forEach((image) => {
      if (image.src) return;
      image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
      image.src = image.dataset.bkSrc ?? "";
    });
  };

  const mainCarousel = new KineticCarousel(mainRoot);
  let detailGallery: CubeAngleGallery | null = null;
  let timeline: gsap.core.Timeline | null = null;
  let previousFocus: HTMLElement | null = null;
  let afterClose: (() => void) | null = null;
  let isOpen = false;
  let isClosing = false;
  let isDetailOpen = false;
  let selectTimer = 0;

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

  const showCollection = (animate = true) => {
    window.clearTimeout(selectTimer);
    if (!isDetailOpen) return;
    isDetailOpen = false;
    detailGallery?.destroy();
    detailGallery = null;
    if (!animate || reducedMotion()) {
      detail.classList.remove("is-active");
      detail.setAttribute("aria-hidden", "true");
      collection.classList.add("is-active");
      collection.setAttribute("aria-hidden", "false");
      mainCarousel.moveTo(mainCarousel.activeIndex, 0);
      return;
    }
    gsap.timeline({ defaults: { overwrite: "auto" } })
      .to(detail, { autoAlpha: 0, x: 36, duration: 0.3, ease: "power2.in" })
      .set(detail, { clearProps: "all" })
      .call(() => {
        detail.classList.remove("is-active");
        detail.setAttribute("aria-hidden", "true");
        collection.classList.add("is-active");
        collection.setAttribute("aria-hidden", "false");
        mainCarousel.moveTo(mainCarousel.activeIndex, 0);
      })
      .fromTo(collection, { autoAlpha: 0, x: -36 }, { autoAlpha: 1, x: 0, duration: 0.48, ease: "expo.out" });
  };

  const openCut = (index: number) => {
    if (!isOpen || isClosing || isDetailOpen) return;
    const cut = CUTS[index];
    if (!cut) return;
    isDetailOpen = true;
    scene.querySelector<HTMLElement>("[data-bk-detail-finish]")!.textContent = cut.finish;
    scene.querySelector<HTMLElement>("[data-bk-detail-title]")!.textContent = cut.name;
    scene.querySelector<HTMLElement>("[data-bk-detail-description]")!.textContent = cut.description;
    detailHost.innerHTML = renderAngleCarousel(cut);
    hydrateImages(detailHost);
    const galleryRoot = detailHost.querySelector<HTMLElement>("[data-bk-angle-cube]");
    if (galleryRoot) {
      detailGallery = new CubeAngleGallery(galleryRoot, {
        labels: cut.angles.map((angle) => angle.label),
        images: cut.angles.map((angle) => displayImagePath(angle.image)),
      });
    }

    const reveal = () => {
      collection.classList.remove("is-active");
      collection.setAttribute("aria-hidden", "true");
      detail.classList.add("is-active");
      detail.setAttribute("aria-hidden", "false");
      detailGallery?.moveTo(0, false);
    };
    if (reducedMotion()) {
      reveal();
      return;
    }
    gsap.timeline({ defaults: { overwrite: "auto" } })
      .to(collection, { autoAlpha: 0, x: -42, duration: 0.34, ease: "power2.in" })
      .call(reveal)
      .fromTo(detail, { autoAlpha: 0, x: 42 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "expo.out" });
  };

  const finishClose = () => {
    timeline?.kill();
    timeline = null;
    window.clearTimeout(selectTimer);
    showCollection(false);
    gsap.killTweensOf([scene, shell, collection, detail]);
    gsap.set([scene, shell, collection, detail], { clearProps: "all" });
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
    if (immediate || reducedMotion()) {
      finishClose();
      return;
    }
    isClosing = true;
    const target = cardTransform();
    timeline = gsap.timeline({ defaults: { overwrite: "auto" }, onComplete: finishClose })
      .to(shell, { ...target, autoAlpha: 0, duration: 0.54, ease: "power3.inOut" }, 0)
      .to(scene, { autoAlpha: 0, duration: 0.34 }, 0.22);
  };

  const openScene = () => {
    if (isOpen || isClosing) return;
    hydrateImages(mainRoot);
    previousFocus = trigger;
    claimDemoScene({ id: SCENE_ID, deactivate: closeScene });
    isOpen = true;
    scene.hidden = false;
    scene.classList.add("is-open");
    scene.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-scene-open");
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    showCollection(false);
    mainCarousel.moveTo(0, 0);
    gsap.set([scene, shell], { clearProps: "all" });

    if (reducedMotion()) {
      gsap.set(scene, { autoAlpha: 1 });
      shell.focus({ preventScroll: true });
      return;
    }
    const origin = cardTransform();
    gsap.set(scene, { autoAlpha: 0 });
    gsap.set(shell, { ...origin, autoAlpha: 0, transformOrigin: "center center" });
    timeline = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        shell.focus({ preventScroll: true });
      },
    });
    timeline
      .to(scene, { autoAlpha: 1, duration: 0.32 }, 0)
      .to(shell, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.78, ease: "expo.out" }, 0.04)
      .fromTo(".bk-intro > *", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0.4);
  };

  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "barberGalleryScene");
  trigger.setAttribute("aria-label", "Abrir catálogo demonstrativo de cortes de cabelo");
  trigger.addEventListener("pointerenter", () => hydrateImages(mainRoot), { passive: true });
  trigger.addEventListener("focus", () => hydrateImages(mainRoot));
  trigger.addEventListener("click", openScene);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScene();
    }
  });

  mainRoot.querySelectorAll<HTMLButtonElement>("[data-bk-open-cut]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!mainCarousel.canActivate) {
        event.preventDefault();
        return;
      }
      const index = Number(button.dataset.bkOpenCut ?? 0);
      window.clearTimeout(selectTimer);
      if (mainCarousel.activeIndex !== index) {
        mainCarousel.moveTo(index, 460);
        selectTimer = window.setTimeout(() => openCut(index), 390);
      } else {
        openCut(index);
      }
    });
  });
  scene.querySelectorAll<HTMLElement>("[data-bk-close]").forEach((button) => {
    button.addEventListener("click", () => closeScene());
  });
  scene.querySelector<HTMLElement>("[data-bk-back]")?.addEventListener("click", () => showCollection());
  scene.querySelector<HTMLElement>("[data-bk-cta]")?.addEventListener("click", () => {
    closeScene(false, () => document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth" }));
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen || scene.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (isDetailOpen) showCollection();
      else closeScene();
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
