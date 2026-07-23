// Ponto de entrada: monta a landing page na ordem recomendada e inicializa
// as interações (menu, accordion, formulário, animações).
import "./style.css";
import "./emoji-motion.css";

import { Hero } from "./components/Hero";
import {
  Services,
  Problems,
  Solution,
  Process,
  Portfolio,
  Trust,
} from "./components/Sections";
import { Packages, initPackages } from "./components/Packages";
import { FAQ, initFAQ } from "./components/FAQ";
import { Contact, initContact } from "./components/Contact";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { initReveal } from "./lib/reveal";
import { initCardTilt } from "./lib/tilt";
import { initTextWave } from "./lib/textWave";
import { initEmojiMotion } from "./lib/emojiMotion";
import { initChaosButtons } from "./components/ChaosButton";
import { initLusionButtons } from "./components/LusionButton";
import { initHeroScroll } from "./lib/heroScroll";
import { initHeroBlob } from "./components/HeroBlob";
import { FlowLines, initFlowLines } from "./components/FlowLines";
import { ModalShell, initModal } from "./components/Modal";
import { Menu, initMenu } from "./components/Menu";
import { WhatsAppFab } from "./components/WhatsAppFab";
import { initAnalytics } from "./lib/analytics";
import { initHeroIntro } from "./lib/heroIntro";
import { initLazyDemo } from "./lib/lazyDemo";
import { initSecretAccess } from "./lib/secretAccess";
import {
  getPerformanceTier,
  initMotionPreference,
  isReducedMotion,
} from "./lib/motionPreference";
import { initRuntimePerformanceMonitor } from "./lib/runtimePerformance";
import { initRenderActivity } from "./lib/renderActivity";

initMotionPreference();

const supportsRegisteredProperties =
  typeof CSS !== "undefined" && typeof CSS.registerProperty === "function";
document.body.classList.add(
  supportsRegisteredProperties
    ? "registerProperty-supported"
    : "registerProperty-not-supported",
);

// Ordem das seções conforme a especificação (item 5).
const app = document.getElementById("app");
if (app) {
  app.innerHTML = [
    FlowLines(),
    `<main id="conteudo">`,
    Hero(),
    Problems(),
    Solution(),
    Services(),
    Packages(),
    Process(),
    Portfolio(),
    Trust(),
    FAQ(),
    Contact(),
    CTA(),
    `</main>`,
    Footer(),
    ModalShell(),
    Menu(),
    WhatsAppFab(),
  ].join("");

  initHeroIntro();

  // Cada init é isolado: se um efeito falhar, NÃO derruba os outros.
  const safe = (label: string, fn: () => void) => {
    try {
      fn();
    } catch (e) {
      console.error(`[init] falhou: ${label}`, e);
    }
  };

  // Analytics anônimo (invisível ao usuário) — nunca deve quebrar o site.
  safe("analytics", initAnalytics);
  // Acesso secreto ao painel (palavra no teclado ou 5 toques na marca).
  safe("secret", initSecretAccess);
  safe("renderActivity", initRenderActivity);

  // Leves e essenciais rodam já (menu, tema, formulário, etc.).
  safe("menu", initMenu);
  safe("heroBlob", initHeroBlob);
  safe("modal", initModal);
  safe("restaurantMenuLoader", () => initLazyDemo({
    scene: "restaurant-menu",
    sceneElementId: "restaurantMenuScene",
    label: "Abrir cardápio demonstrativo de restaurante",
    load: () => import("./components/RestaurantMenu").then((module) => ({
      render: module.RestaurantMenu,
      init: module.initRestaurantMenu,
    })),
  }));
  safe("storefrontDemoLoader", () => initLazyDemo({
    scene: "storefront-demo",
    sceneElementId: "storefrontDemoScene",
    label: "Abrir vitrine demonstrativa de loja",
    load: () => import("./components/StorefrontDemo").then((module) => ({
      render: module.StorefrontDemo,
      init: module.initStorefrontDemo,
    })),
  }));
  safe("barberGalleryLoader", () => initLazyDemo({
    scene: "barber-gallery",
    sceneElementId: "barberGalleryScene",
    label: "Abrir catálogo demonstrativo de cortes de cabelo",
    load: () => import("./components/BarberGallery").then((module) => ({
      render: module.BarberGallery,
      init: module.initBarberGallery,
    })),
  }));
  safe("packages", initPackages);
  safe("faq", initFAQ);
  safe("contact", initContact);
  safe("reveal", initReveal);
  safe("chaosButtons", initChaosButtons);
  safe("lusionButtons", initLusionButtons);
  safe("heroScroll", initHeroScroll);
  safe("cardTilt", () => initCardTilt(".card", 12));
  // tilt (segue o cursor) no chaos e nos botões do CTA — NÃO nos botões dos pacotes
  safe("btnTilt", () => initCardTilt(".chaos-button, .cta-final .btn", 16, 0, 420));
  safe("textWave", () =>
    initTextWave(".card__text, .pkg__audience, .faq__title-text, .faq__q-text, .faq__a-text"),
  );
  safe("emojiMotion", initEmojiMotion);
  safe("flowLines", initFlowLines);
  safe("runtimePerformance", initRuntimePerformanceMonitor);

  const whenIdle = (fn: () => void) => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    };
    if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(fn, { timeout: 1500 });
    else window.setTimeout(fn, 200);
  };
  const afterIntro = (fn: () => void) => {
    if (!document.body.classList.contains("ci-site-hidden")) {
      window.setTimeout(fn, 1200);
      return;
    }
    window.addEventListener(
      "amv:intro-complete",
      () => window.setTimeout(fn, 1200),
      { once: true },
    );
  };

  // -------------------------------------------------------------------------
  // Efeitos pesados (Three.js): carregam num chunk separado, depois da primeira
  // pintura, pra não travar o carregamento. O "A" 3D é a identidade da hero.
  const signalVisualsReady = () =>
    window.dispatchEvent(new CustomEvent("amv:visuals-ready"));
  const loadHero3D = () =>
    import("./components/Hero3D")
      .then((m) => m.initHero3D())
      .catch((e) => {
        document.querySelector<HTMLElement>(".hero3d")?.classList.add("is-static");
        console.error("[init] Hero3D não carregou", e);
      });

  if (getPerformanceTier() === "minimal") {
    // No Essencial, a cortina ganha a thread principal sozinha. O placeholder
    // do A cobre a hero até o WebGL carregar após a abertura.
    requestAnimationFrame(signalVisualsReady);
    afterIntro(() => whenIdle(() => void loadHero3D()));
  } else {
    void loadHero3D().finally(signalVisualsReady);
  }

  // Fluido dos títulos — decorativo; carrega ocioso e pula em reduced-motion.
  afterIntro(() => {
    whenIdle(() => {
      if (isReducedMotion()) return;
      import("./lib/headingFluidLocal")
        .then((m) => safe("headingFluid", m.initHeadingFluid))
        .catch((e) => console.error("[init] headingFluid não carregou", e));
    });
  });
}
