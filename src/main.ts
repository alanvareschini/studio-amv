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
import { initSecretAccess } from "./lib/secretAccess";

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

  // Leves e essenciais rodam já (menu, tema, formulário, etc.).
  safe("menu", initMenu);
  safe("heroBlob", initHeroBlob);
  safe("modal", initModal);
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
  safe("textWave", () => initTextWave(".card__text, .pkg__audience, .faq__q-text"));
  safe("emojiMotion", initEmojiMotion);
  safe("flowLines", initFlowLines);

  // -------------------------------------------------------------------------
  // Efeitos pesados (Three.js): carregam num chunk separado, depois da primeira
  // pintura, pra não travar o carregamento. O "A" 3D é a identidade da hero.
  import("./components/Hero3D")
    .then((m) => safe("hero3d", m.initHero3D))
    .catch((e) => console.error("[init] Hero3D não carregou", e));

  // Fluido dos títulos — decorativo; carrega ocioso e pula em reduced-motion.
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

  afterIntro(() => {
    whenIdle(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      import("./lib/headingFluidLocal")
        .then((m) => safe("headingFluid", m.initHeadingFluid))
        .catch((e) => console.error("[init] headingFluid não carregou", e));
    });
  });
}
