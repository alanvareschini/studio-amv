import "../creative-demos.css";
import gsap from "gsap";
import { claimDemoScene, releaseDemoScene } from "../lib/demoSceneManager";
import { isReducedMotion } from "../lib/motionPreference";

interface SceneControllerOptions {
  id: string;
  elementId: string;
  shellSelector: string;
  onOpen?: () => void;
  onClose?: () => void;
}

interface SceneController {
  isOpen: () => boolean;
  close: (immediate?: boolean, afterClose?: () => void) => void;
}

function bindScene(options: SceneControllerOptions): SceneController | null {
  const trigger = document.querySelector<HTMLElement>(`[data-demo-scene="${options.id}"]`);
  const scene = document.getElementById(options.elementId);
  const shell = scene?.querySelector<HTMLElement>(options.shellSelector);
  const app = document.getElementById("app");
  if (!trigger || !scene || !shell || !app) return null;

  document.body.appendChild(scene);
  let open = false;
  let closing = false;
  let previousFocus: HTMLElement | null = null;
  let timeline: gsap.core.Timeline | null = null;
  let closeCallback: (() => void) | null = null;

  const cardTransform = () => {
    const card = trigger.getBoundingClientRect();
    const panel = shell.getBoundingClientRect();
    return {
      x: card.left + card.width / 2 - (panel.left + panel.width / 2),
      y: card.top + card.height / 2 - (panel.top + panel.height / 2),
      scaleX: Math.max(0.08, card.width / panel.width),
      scaleY: Math.max(0.08, card.height / panel.height),
    };
  };

  const finishClose = () => {
    timeline?.kill();
    timeline = null;
    gsap.killTweensOf([scene, shell]);
    gsap.set([scene, shell], { clearProps: "all" });
    scene.hidden = true;
    scene.classList.remove("is-open", "is-closing");
    scene.setAttribute("aria-hidden", "true");
    document.body.classList.remove("demo-scene-open");
    app.inert = false;
    app.removeAttribute("aria-hidden");
    open = false;
    closing = false;
    options.onClose?.();
    releaseDemoScene(options.id);
    const focusTarget = previousFocus;
    previousFocus = null;
    requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
    const callback = closeCallback;
    closeCallback = null;
    callback?.();
  };

  const close = (immediate = false, afterClose?: () => void) => {
    if ((!open && !closing) || scene.hidden) return;
    closeCallback = afterClose ?? null;
    timeline?.kill();
    timeline = null;
    if (immediate || isReducedMotion()) {
      finishClose();
      return;
    }
    closing = true;
    scene.classList.add("is-closing");
    const target = cardTransform();
    timeline = gsap
      .timeline({ defaults: { overwrite: "auto" }, onComplete: finishClose })
      .to(shell, { ...target, autoAlpha: 0, duration: 0.52, ease: "power3.inOut" }, 0)
      .to(scene, { autoAlpha: 0, duration: 0.28 }, 0.2);
  };

  const openScene = () => {
    if (open || closing) return;
    previousFocus = trigger;
    claimDemoScene({ id: options.id, deactivate: close });
    open = true;
    scene.hidden = false;
    scene.classList.add("is-open");
    scene.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-scene-open");
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    options.onOpen?.();
    gsap.set([scene, shell], { clearProps: "all" });

    if (isReducedMotion()) {
      gsap.set(scene, { autoAlpha: 1 });
      shell.focus({ preventScroll: true });
      return;
    }

    const origin = cardTransform();
    gsap.set(scene, { autoAlpha: 0 });
    gsap.set(shell, { ...origin, autoAlpha: 0, transformOrigin: "center center" });
    timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        timeline = null;
        shell.focus({ preventScroll: true });
      },
    });
    timeline
      .to(scene, { autoAlpha: 1, duration: 0.3 }, 0)
      .to(shell, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.78, ease: "expo.out" }, 0.03);
  };

  trigger.setAttribute("aria-controls", options.elementId);
  trigger.addEventListener("click", openScene);
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openScene();
  });
  scene.querySelectorAll<HTMLElement>("[data-demo-close]").forEach((button) => {
    button.addEventListener("click", () => close());
  });
  scene.querySelectorAll<HTMLButtonElement>("[data-demo-cta]").forEach((button) => {
    button.addEventListener("click", () => {
      close(false, () => {
        document.getElementById("orcamento")?.scrollIntoView({
          behavior: isReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  });
  document.addEventListener("keydown", (event) => {
    if (!open || scene.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      scene.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => element.offsetParent !== null);
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

  return { isOpen: () => open, close };
}

const closeIcon = /* html */ `
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`;

const AESTHETIC_STAGES = [
  {
    title: "Leitura inicial",
    short: "Início",
    note: "Mapeamento de textura, oleosidade e pontos de sensibilidade.",
    image: "/aesthetic-clinic/estetica-01-inicial.webp",
  },
  {
    title: "Plano de cuidado",
    short: "Mapa",
    note: "A estratégia visualiza regiões e organiza o protocolo indicado.",
    image: "/aesthetic-clinic/estetica-02-planejamento.webp",
  },
  {
    title: "Procedimento",
    short: "Ação",
    note: "Aplicação controlada com acompanhamento de cada área tratada.",
    image: "/aesthetic-clinic/estetica-03-pos-procedimento.webp",
  },
  {
    title: "Recuperação",
    short: "Pausa",
    note: "A pele entra na fase de renovação com orientação pós-cuidado.",
    image: "/aesthetic-clinic/estetica-04-recuperacao.webp",
  },
  {
    title: "Resultado",
    short: "Final",
    note: "Textura mais uniforme e evolução registrada de forma transparente.",
    image: "/aesthetic-clinic/estetica-05-resultado.webp",
  },
] as const;

export function AestheticLab(): string {
  const images = AESTHETIC_STAGES.map(
    (stage, index) => /* html */ `
      <img class="ae-portrait__image${index === 0 ? " is-active" : ""}" data-ae-image="${index}"
        src="${stage.image}" alt="" width="1254" height="1254" decoding="async">`,
  ).join("");
  const stages = AESTHETIC_STAGES.map(
    (stage, index) => /* html */ `
      <button class="ae-stage${index === 0 ? " is-active" : ""}" type="button" data-ae-stage="${index}" aria-pressed="${index === 0}">
        <span>0${index + 1}</span><b>${stage.short}</b>
      </button>`,
  ).join("");

  return /* html */ `
    <div class="ae-scene" id="aestheticLabScene" aria-hidden="true" hidden>
      <button class="creative-backdrop" type="button" data-demo-close tabindex="-1" aria-label="Fechar experiência"></button>
      <section class="ae-shell creative-shell" role="dialog" aria-modal="true" aria-labelledby="aestheticLabTitle" tabindex="-1">
        <header class="creative-topbar ae-topbar">
          <a class="ae-brand" href="#" tabindex="-1" aria-label="Lúmina clínica demonstrativa">
            <span></span><b>LÚMINA</b><small>derma studio</small>
          </a>
          <span class="creative-topbar__edition">PROTOCOLO DIGITAL · 01</span>
          <button class="creative-close" type="button" data-demo-close aria-label="Fechar análise">${closeIcon}</button>
        </header>

        <div class="ae-layout">
          <aside class="ae-copy">
            <span class="ae-kicker">Jornada de cuidado</span>
            <h2 id="aestheticLabTitle">Evolução que<br><em>você consegue ver.</em></h2>
            <p>Arraste pelas etapas e acompanhe como uma clínica pode apresentar o processo com clareza, cuidado e confiança.</p>
            <div class="ae-result">
              <span>Leitura atual</span>
              <strong data-ae-title>${AESTHETIC_STAGES[0].title}</strong>
              <p data-ae-note>${AESTHETIC_STAGES[0].note}</p>
            </div>
            <button class="creative-demo-cta ae-demo-cta" type="button" data-demo-cta>
              <span>Quero isso no meu site</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
            </button>
          </aside>

          <figure class="ae-portrait" data-ae-portrait role="button" tabindex="0" aria-label="Mover o scanner e clicar para capturar uma leitura da pele">
            ${images}
            <span class="ae-scanline" aria-hidden="true"></span>
            <span class="ae-lens" aria-hidden="true"><i></i></span>
            <span class="ae-scan-hint" aria-hidden="true">CLIQUE PARA ANALISAR</span>
            <div class="ae-scan-card" data-ae-scan-card hidden aria-live="polite">
              <span>LEITURA CAPTURADA</span>
              <strong data-ae-region>Zona T</strong>
              <dl>
                <div><dt>Textura visual</dt><dd data-ae-texture>72</dd></div>
                <div><dt>Uniformidade</dt><dd><b data-ae-uniformity>48</b>%</dd></div>
                <div><dt>Etapa</dt><dd data-ae-phase>Início</dd></div>
              </dl>
              <small>Leitura ilustrativa da imagem · não é avaliação clínica.</small>
            </div>
            <span class="ae-coordinate ae-coordinate--a">DERMA · 24.7</span>
            <span class="ae-coordinate ae-coordinate--b">ANÁLISE 01—05</span>
            <figcaption>Imagens demonstrativas geradas para esta experiência.</figcaption>
          </figure>

          <div class="ae-control">
            <div class="ae-control__head">
              <span>Etapas do protocolo</span>
              <button type="button" class="ae-play" data-ae-play aria-pressed="false">
                <i></i><span>Reproduzir evolução</span>
              </button>
            </div>
            <div class="ae-stages">${stages}</div>
            <label class="ae-range">
              <span class="sr-only">Escolher etapa do tratamento</span>
              <input type="range" min="0" max="4" step="1" value="0" data-ae-range>
              <i data-ae-progress></i>
            </label>
            <div class="ae-control__current" aria-live="polite">
              <span><b data-ae-mobile-count>01</b> / 05</span>
              <div>
                <strong data-ae-mobile-title>${AESTHETIC_STAGES[0].title}</strong>
                <p data-ae-mobile-note>${AESTHETIC_STAGES[0].note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>`;
}

export function initAestheticLab(): void {
  const scene = document.getElementById("aestheticLabScene");
  if (!scene) return;
  const images = Array.from(scene.querySelectorAll<HTMLElement>("[data-ae-image]"));
  const stages = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-ae-stage]"));
  const range = scene.querySelector<HTMLInputElement>("[data-ae-range]");
  const title = scene.querySelector<HTMLElement>("[data-ae-title]");
  const note = scene.querySelector<HTMLElement>("[data-ae-note]");
  const progress = scene.querySelector<HTMLElement>("[data-ae-progress]");
  const portrait = scene.querySelector<HTMLElement>("[data-ae-portrait]");
  const play = scene.querySelector<HTMLButtonElement>("[data-ae-play]");
  const scanCard = scene.querySelector<HTMLElement>("[data-ae-scan-card]");
  const scanRegion = scene.querySelector<HTMLElement>("[data-ae-region]");
  const scanTexture = scene.querySelector<HTMLElement>("[data-ae-texture]");
  const scanUniformity = scene.querySelector<HTMLElement>("[data-ae-uniformity]");
  const scanPhase = scene.querySelector<HTMLElement>("[data-ae-phase]");
  const mobileCount = scene.querySelector<HTMLElement>("[data-ae-mobile-count]");
  const mobileTitle = scene.querySelector<HTMLElement>("[data-ae-mobile-title]");
  const mobileNote = scene.querySelector<HTMLElement>("[data-ae-mobile-note]");
  if (!range || !title || !note || !progress || !portrait || !play || !scanCard || !scanRegion || !scanTexture || !scanUniformity || !scanPhase || !mobileCount || !mobileTitle || !mobileNote) return;

  let active = 0;
  let playback = 0;
  let controller: SceneController | null = null;

  const stopPlayback = () => {
    window.clearInterval(playback);
    playback = 0;
    play.classList.remove("is-playing");
    play.setAttribute("aria-pressed", "false");
    const label = play.querySelector("span");
    if (label) label.textContent = "Reproduzir evolução";
  };

  const setStage = (next: number, animate = true) => {
    const index = Math.max(0, Math.min(AESTHETIC_STAGES.length - 1, next));
    const previous = active;
    active = index;
    range.value = String(index);
    progress.style.setProperty("--ae-progress", `${(index / (AESTHETIC_STAGES.length - 1)) * 100}%`);
    stages.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle("is-active", selected);
      button.classList.toggle("is-complete", buttonIndex < index);
      button.setAttribute("aria-pressed", String(selected));
    });
    portrait.classList.remove("is-scan-captured", "is-scanning");
    scanCard.hidden = true;
    images.forEach((image, imageIndex) => image.classList.toggle("is-active", imageIndex === index));
    title.textContent = AESTHETIC_STAGES[index].title;
    note.textContent = AESTHETIC_STAGES[index].note;
    mobileCount.textContent = String(index + 1).padStart(2, "0");
    mobileTitle.textContent = AESTHETIC_STAGES[index].title;
    mobileNote.textContent = AESTHETIC_STAGES[index].note;

    gsap.killTweensOf(images);
    const incoming = images[index];
    const outgoing = images[previous];
    const hiddenImages = images.filter((_, imageIndex) => imageIndex !== index && imageIndex !== previous);

    if (!animate || isReducedMotion() || index === previous) {
      gsap.set(images, { autoAlpha: 0, scale: 1, xPercent: 0, zIndex: 0 });
      gsap.set(incoming, { autoAlpha: 1, zIndex: 2 });
      return;
    }

    const direction = index >= previous ? 1 : -1;
    gsap.set(hiddenImages, { autoAlpha: 0, scale: 1, xPercent: 0, zIndex: 0 });
    gsap.set(outgoing, { autoAlpha: 1, scale: 1, xPercent: 0, zIndex: 1 });
    gsap.fromTo(
      incoming,
      { autoAlpha: 0, scale: 1.035, xPercent: direction * 2 },
      { autoAlpha: 1, scale: 1, xPercent: 0, zIndex: 2, duration: 0.72, ease: "power3.out", overwrite: true },
    );
    gsap.to(outgoing, { autoAlpha: 0, duration: 0.42, ease: "power2.out", overwrite: true });
    gsap.fromTo([title, note], { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42, stagger: 0.05 });
  };

  controller = bindScene({
    id: "aesthetic-lab",
    elementId: "aestheticLabScene",
    shellSelector: ".ae-shell",
    onOpen: () => setStage(0, false),
    onClose: stopPlayback,
  });
  if (!controller) return;

  stages.forEach((button) => {
    button.addEventListener("click", () => {
      stopPlayback();
      setStage(Number(button.dataset.aeStage));
    });
  });
  range.addEventListener("input", () => {
    stopPlayback();
    setStage(Number(range.value));
  });
  play.addEventListener("click", () => {
    if (playback) {
      stopPlayback();
      return;
    }
    play.classList.add("is-playing");
    play.setAttribute("aria-pressed", "true");
    const label = play.querySelector("span");
    if (label) label.textContent = "Pausar evolução";
    setStage(active === AESTHETIC_STAGES.length - 1 ? 0 : active + 1);
    playback = window.setInterval(() => {
      if (!controller?.isOpen()) return;
      const next = active + 1;
      if (next >= AESTHETIC_STAGES.length) {
        stopPlayback();
        return;
      }
      setStage(next);
    }, 1450);
  });
  portrait.addEventListener("pointermove", (event) => {
    if (isReducedMotion()) return;
    const rect = portrait.getBoundingClientRect();
    portrait.style.setProperty("--ae-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    portrait.style.setProperty("--ae-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }, { passive: true });
  portrait.addEventListener("pointerleave", () => {
    if (portrait.classList.contains("is-scan-captured")) return;
    portrait.style.removeProperty("--ae-x");
    portrait.style.removeProperty("--ae-y");
  });

  const captureScan = (clientX?: number, clientY?: number) => {
    const rect = portrait.getBoundingClientRect();
    const x = clientX === undefined ? 0.5 : Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = clientY === undefined ? 0.48 : Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    portrait.style.setProperty("--ae-x", `${x * 100}%`);
    portrait.style.setProperty("--ae-y", `${y * 100}%`);

    // Convert the visible cover crop back to normalized coordinates in the square source image.
    const renderedSize = Math.max(rect.width, rect.height);
    const imageX = (x * rect.width + (renderedSize - rect.width) / 2) / renderedSize;
    const imageY = (y * rect.height + (renderedSize - rect.height) / 2) / renderedSize;
    const faceX = (imageX - 0.5) / 0.205;
    const faceY = (imageY - 0.405) / 0.285;
    const insideFace = faceX * faceX + faceY * faceY <= 1;

    let region = "Fora da área facial";
    if (insideFace) {
      if (imageY < 0.27) region = "Região frontal";
      else if (imageY > 0.57) region = "Mandíbula e mento";
      else if (Math.abs(imageX - 0.5) < 0.075) region = "Zona T";
      else region = imageX < 0.5 ? "Região malar direita" : "Região malar esquerda";
    } else if (imageY > 0.62 && imageX > 0.2 && imageX < 0.8) {
      region = "Colo e ombros";
    }

    const positionFactor = Math.round((imageX * 9 + imageY * 7) % 8);
    const texture = Math.max(28, 78 - active * 9 + positionFactor);
    const uniformity = Math.min(94, 46 + active * 10 + Math.round((1 - imageY) * 5));

    scanRegion.textContent = region;
    scanTexture.textContent = String(texture);
    scanUniformity.textContent = String(uniformity);
    scanPhase.textContent = AESTHETIC_STAGES[active].short;
    scanCard.hidden = false;
    portrait.classList.remove("is-scan-captured");
    portrait.classList.add("is-scanning");
    requestAnimationFrame(() => portrait.classList.add("is-scan-captured"));
    window.setTimeout(() => portrait.classList.remove("is-scanning"), 680);
    if (!isReducedMotion()) {
      gsap.fromTo(scanCard, { y: 12, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.48, ease: "back.out(1.45)", overwrite: true });
    }
  };

  portrait.addEventListener("click", (event) => captureScan(event.clientX, event.clientY));
  portrait.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    captureScan();
  });
}

const REACTION_LEVELS = {
  ritmo: { label: "Ritmo", targetSize: 82, duration: 15 },
  agil: { label: "Ágil", targetSize: 66, duration: 15 },
  elite: { label: "Elite", targetSize: 52, duration: 15 },
} as const;

type ReactionLevel = keyof typeof REACTION_LEVELS;

export function TrainingLab(): string {
  return /* html */ `
    <div class="pt-scene" id="trainingLabScene" aria-hidden="true" hidden>
      <button class="creative-backdrop" type="button" data-demo-close tabindex="-1" aria-label="Fechar experiência"></button>
      <section class="pt-shell creative-shell" role="dialog" aria-modal="true" aria-labelledby="trainingLabTitle" tabindex="-1" data-pt-goal="ritmo">
        <header class="creative-topbar pt-topbar">
          <div class="pt-brand"><b>PULSO</b><span>performance lab</span></div>
          <div class="pt-live"><i></i> TESTE DE AGILIDADE</div>
          <button class="creative-close" type="button" data-demo-close aria-label="Fechar treino">${closeIcon}</button>
        </header>

        <div class="pt-reaction-layout">
          <section class="pt-reaction-copy">
            <span class="pt-index">DESAFIO / 15 SEGUNDOS</span>
            <h2 id="trainingLabTitle">Até onde vai<br><em>seu reflexo?</em></h2>
            <p>Toque nos alvos assim que eles aparecerem. A experiência mede sua velocidade de reação em tempo real.</p>
            <div class="pt-levels" role="group" aria-label="Nível do desafio">
              <span>Escolha o nível</span>
              <button type="button" data-pt-level="ritmo" aria-pressed="true">Ritmo</button>
              <button type="button" data-pt-level="agil" aria-pressed="false">Ágil</button>
              <button type="button" data-pt-level="elite" aria-pressed="false">Elite</button>
            </div>
            <button class="pt-challenge-start" type="button" data-pt-start>
              <span data-pt-start-label>Começar desafio</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 10 7-10 7V5Z"/></svg>
            </button>
            <small>Use o mouse ou toque na tela · nenhum dado é armazenado.</small>
            <button class="creative-demo-cta pt-demo-cta" type="button" data-demo-cta>
              <span>Quero isso no meu site</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
            </button>
          </section>

          <section class="pt-court" data-pt-court aria-label="Área do teste de reflexo">
            <header>
              <span>TEMPO <b data-pt-time>15.0</b></span>
              <span>ACERTOS <b data-pt-hits>00</b></span>
            </header>
            <div class="pt-court__field">
              <span class="pt-court__axis pt-court__axis--x"></span>
              <span class="pt-court__axis pt-court__axis--y"></span>
              <span class="pt-court__corner pt-court__corner--a">A</span>
              <span class="pt-court__corner pt-court__corner--b">B</span>
              <span class="pt-court__corner pt-court__corner--c">C</span>
              <span class="pt-court__corner pt-court__corner--d">D</span>
              <button class="pt-target" type="button" data-pt-target aria-label="Atingir alvo" disabled>
                <i></i><i></i><i></i><b>TOQUE</b>
              </button>
              <div class="pt-court__ready" data-pt-ready>
                <span>PRONTO?</span>
                <b>O alvo muda de posição a cada toque.</b>
              </div>
            </div>
          </section>

          <aside class="pt-reaction-stats" aria-live="polite">
            <span class="pt-reaction-stats__eyebrow">LEITURA AO VIVO</span>
            <div class="pt-reaction-score">
              <small>REAÇÃO MÉDIA</small>
              <strong data-pt-average>—</strong>
              <span>ms</span>
            </div>
            <div class="pt-reaction-metrics">
              <span><small>Melhor reação</small><b data-pt-best>—</b><i>ms</i></span>
              <span><small>Precisão</small><b data-pt-accuracy>—</b><i>%</i></span>
            </div>
            <div class="pt-reaction-status">
              <i></i>
              <span data-pt-status>Escolha o nível e comece.</span>
            </div>
            <div class="pt-reaction-result" data-pt-result hidden>
              <span>SEU RESULTADO</span>
              <strong data-pt-result-title>Reflexo afiado.</strong>
              <p data-pt-result-copy>Você concluiu o teste.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>`;
}

export function initTrainingLab(): void {
  const scene = document.getElementById("trainingLabScene");
  const shell = scene?.querySelector<HTMLElement>(".pt-shell");
  if (!scene || !shell) return;
  const levelButtons = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-pt-level]"));
  const court = scene.querySelector<HTMLElement>("[data-pt-court]");
  const target = scene.querySelector<HTMLButtonElement>("[data-pt-target]");
  const ready = scene.querySelector<HTMLElement>("[data-pt-ready]");
  const start = scene.querySelector<HTMLButtonElement>("[data-pt-start]");
  const startLabel = scene.querySelector<HTMLElement>("[data-pt-start-label]");
  const time = scene.querySelector<HTMLElement>("[data-pt-time]");
  const hitsOutput = scene.querySelector<HTMLElement>("[data-pt-hits]");
  const average = scene.querySelector<HTMLElement>("[data-pt-average]");
  const best = scene.querySelector<HTMLElement>("[data-pt-best]");
  const accuracy = scene.querySelector<HTMLElement>("[data-pt-accuracy]");
  const status = scene.querySelector<HTMLElement>("[data-pt-status]");
  const result = scene.querySelector<HTMLElement>("[data-pt-result]");
  const resultTitle = scene.querySelector<HTMLElement>("[data-pt-result-title]");
  const resultCopy = scene.querySelector<HTMLElement>("[data-pt-result-copy]");
  if (!court || !target || !ready || !start || !startLabel || !time || !hitsOutput || !average || !best || !accuracy || !status || !result || !resultTitle || !resultCopy) return;

  let level: ReactionLevel = "ritmo";
  let running = false;
  let timer = 0;
  let startedAt = 0;
  let spawnedAt = 0;
  let hits = 0;
  let reactionTotal = 0;
  let bestReaction = Number.POSITIVE_INFINITY;

  const setTargetPosition = () => {
    const x = 12 + Math.random() * 76;
    const y = 14 + Math.random() * 70;
    target.style.setProperty("--pt-target-x", `${x.toFixed(2)}%`);
    target.style.setProperty("--pt-target-y", `${y.toFixed(2)}%`);
    target.style.setProperty("--pt-target-size", `${REACTION_LEVELS[level].targetSize}px`);
    status.textContent = x < 38 ? "Esquerda!" : x > 62 ? "Direita!" : y < 43 ? "Acima!" : "Centro!";
    spawnedAt = performance.now();
    if (!isReducedMotion()) {
      gsap.fromTo(target, { scale: 0.45, rotate: -16 }, { scale: 1, rotate: 0, duration: 0.3, ease: "back.out(2.4)", overwrite: true });
    }
  };

  const resetChallenge = () => {
    window.clearInterval(timer);
    timer = 0;
    running = false;
    startedAt = 0;
    spawnedAt = 0;
    hits = 0;
    reactionTotal = 0;
    bestReaction = Number.POSITIVE_INFINITY;
    shell.classList.remove("is-challenge-running", "is-challenge-complete");
    target.disabled = true;
    target.classList.remove("is-hit");
    ready.hidden = false;
    result.hidden = true;
    start.disabled = false;
    startLabel.textContent = "Começar desafio";
    time.textContent = REACTION_LEVELS[level].duration.toFixed(1);
    hitsOutput.textContent = "00";
    average.textContent = "—";
    best.textContent = "—";
    accuracy.textContent = "—";
    status.textContent = "Escolha o nível e comece.";
    levelButtons.forEach((button) => { button.disabled = false; });
  };

  const finishChallenge = () => {
    window.clearInterval(timer);
    timer = 0;
    running = false;
    shell.classList.remove("is-challenge-running");
    shell.classList.add("is-challenge-complete");
    target.disabled = true;
    levelButtons.forEach((button) => { button.disabled = false; });
    start.disabled = false;
    startLabel.textContent = "Jogar novamente";
    time.textContent = "0.0";
    result.hidden = false;
    const averageReaction = hits ? Math.round(reactionTotal / hits) : 0;
    resultTitle.textContent = hits >= 18 ? "Reflexo de elite." : hits >= 11 ? "Resposta afiada." : "Boa primeira marca.";
    resultCopy.textContent = `${hits} alvos em 15 segundos · média de ${averageReaction || "—"} ms.`;
    status.textContent = "Teste concluído.";
    if (!isReducedMotion()) {
      gsap.fromTo(result, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" });
    }
  };

  const startChallenge = () => {
    resetChallenge();
    running = true;
    startedAt = performance.now();
    shell.classList.add("is-challenge-running");
    ready.hidden = true;
    target.disabled = false;
    start.disabled = true;
    startLabel.textContent = "Desafio em andamento";
    levelButtons.forEach((button) => { button.disabled = true; });
    setTargetPosition();
    timer = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const remaining = Math.max(0, REACTION_LEVELS[level].duration - elapsed);
      time.textContent = remaining.toFixed(1);
      if (remaining <= 0) finishChallenge();
    }, 50);
  };

  const controller = bindScene({
    id: "training-lab",
    elementId: "trainingLabScene",
    shellSelector: ".pt-shell",
    onOpen: resetChallenge,
    onClose: resetChallenge,
  });
  if (!controller) return;

  levelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running) return;
      level = button.dataset.ptLevel as ReactionLevel;
      shell.dataset.ptGoal = level;
      levelButtons.forEach((levelButton) => levelButton.setAttribute("aria-pressed", String(levelButton === button)));
      resetChallenge();
      if (!isReducedMotion()) {
        gsap.fromTo(court, { scale: 0.985, filter: "brightness(1.45)" }, { scale: 1, filter: "brightness(1)", duration: 0.52, ease: "power3.out", overwrite: true });
      }
    });
  });
  start.addEventListener("click", startChallenge);
  target.addEventListener("click", () => {
    if (!running) return;
    const reaction = Math.max(1, Math.round(performance.now() - spawnedAt));
    hits += 1;
    reactionTotal += reaction;
    bestReaction = Math.min(bestReaction, reaction);
    hitsOutput.textContent = String(hits).padStart(2, "0");
    average.textContent = String(Math.round(reactionTotal / hits));
    best.textContent = String(bestReaction);
    accuracy.textContent = String(Math.min(99, 76 + hits));
    target.classList.add("is-hit");
    requestAnimationFrame(() => {
      target.classList.remove("is-hit");
      setTargetPosition();
    });
  });
}

const STRATEGIES = {
  vendas: {
    name: "Motor comercial",
    description: "Organizar a jornada para transformar atenção em conversas qualificadas.",
    score: "82",
    pillars: ["Oferta central", "Prova de valor", "Rota de conversão"],
    roadmap: ["Reescrever a oferta principal", "Publicar três provas de valor", "Simplificar o caminho até o contato"],
  },
  marca: {
    name: "Território de marca",
    description: "Criar uma presença reconhecível antes de acelerar aquisição.",
    score: "76",
    pillars: ["Posicionamento", "Narrativa própria", "Sistema visual"],
    roadmap: ["Definir um território de marca", "Criar uma narrativa reconhecível", "Aplicar o sistema nos pontos de contato"],
  },
  operacao: {
    name: "Sistema de escala",
    description: "Reduzir atrito interno para crescer com clareza e consistência.",
    score: "88",
    pillars: ["Processos-chave", "Automação leve", "Ritmo de gestão"],
    roadmap: ["Mapear o processo mais crítico", "Automatizar uma tarefa repetitiva", "Criar um ritual semanal de decisão"],
  },
} as const;

type StrategyKey = keyof typeof STRATEGIES;

export function StrategyLab(): string {
  return /* html */ `
    <div class="st-scene" id="strategyLabScene" aria-hidden="true" hidden>
      <button class="creative-backdrop" type="button" data-demo-close tabindex="-1" aria-label="Fechar experiência"></button>
      <section class="st-shell creative-shell" role="dialog" aria-modal="true" aria-labelledby="strategyLabTitle" tabindex="-1" data-st-strategy="vendas">
        <header class="creative-topbar st-topbar">
          <div class="st-brand"><i>AMV</i><span>STRATEGY OFFICE</span></div>
          <span class="creative-topbar__edition">DIAGNÓSTICO VIVO · SESSÃO 01</span>
          <button class="creative-close" type="button" data-demo-close aria-label="Fechar diagnóstico">${closeIcon}</button>
        </header>

        <div class="st-layout">
          <section class="st-question">
            <span class="st-overline">Uma pergunta para começar</span>
            <h2 id="strategyLabTitle">O que precisa<br><em>destravar agora?</em></h2>
            <p>Escolha o foco. O mapa reorganiza prioridades e revela uma direção possível para o negócio.</p>
            <div class="st-options" role="group" aria-label="Foco do diagnóstico">
              <button type="button" data-st-choice="vendas" aria-pressed="true"><span>01</span><b>Vender com clareza</b></button>
              <button type="button" data-st-choice="marca" aria-pressed="false"><span>02</span><b>Ser mais lembrado</b></button>
              <button type="button" data-st-choice="operacao" aria-pressed="false"><span>03</span><b>Crescer sem caos</b></button>
            </div>
          </section>

          <section class="st-map" aria-label="Mapa estratégico interativo">
            <svg viewBox="0 0 600 560" aria-hidden="true">
              <path class="st-map__orbit" d="M102 285C104 119 286 49 439 116c139 62 121 262 8 353-116 93-336 18-345-184Z"/>
              <path class="st-map__route st-map__route--a" d="M120 370 245 190 464 254 385 430 120 370Z"/>
              <path class="st-map__route st-map__route--b" d="M154 156 344 120 488 345 260 466 154 156Z"/>
            </svg>
            <span class="st-node st-node--core"><i></i><b>NEGÓCIO</b></span>
            <span class="st-node st-node--one"><i></i><b>OFERTA</b></span>
            <span class="st-node st-node--two"><i></i><b>MARCA</b></span>
            <span class="st-node st-node--three"><i></i><b>CANAL</b></span>
            <span class="st-node st-node--four"><i></i><b>RITMO</b></span>
            <div class="st-pulse" aria-hidden="true"><i></i><i></i><i></i></div>
            <span class="st-map__caption">MAPA / EM CONSTRUÇÃO</span>
          </section>

          <aside class="st-result">
            <header><span>Direção sugerida</span><b data-st-score>${STRATEGIES.vendas.score}%</b></header>
            <h3 data-st-name>${STRATEGIES.vendas.name}</h3>
            <p data-st-description>${STRATEGIES.vendas.description}</p>
            <div class="st-pillars" data-st-pillars>
              ${STRATEGIES.vendas.pillars.map((pillar, index) => `<span><i>0${index + 1}</i>${pillar}</span>`).join("")}
            </div>
            <button type="button" class="st-report" data-st-report aria-expanded="false">
              <span>Gerar plano de 30 dias</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
            </button>
            <button class="creative-demo-cta st-demo-cta" type="button" data-demo-cta>
              <span>Quero isso no meu site</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
            </button>
            <small data-st-status>HIPÓTESE INICIAL · NÃO É UMA CONSULTORIA REAL</small>
            <section class="st-plan" data-st-plan hidden aria-label="Plano estratégico de 30 dias">
              <header>
                <span>ROTA / 30 DIAS</span>
                <button type="button" data-st-plan-close aria-label="Voltar ao diagnóstico">${closeIcon}</button>
              </header>
              <small>PLANO GERADO PARA</small>
              <h3 data-st-plan-title>${STRATEGIES.vendas.name}</h3>
              <ol data-st-roadmap>
                ${STRATEGIES.vendas.roadmap.map((step, index) => `<li><b>0${index + 1}</b><span>${step}</span><i>${(index + 1) * 10}D</i></li>`).join("")}
              </ol>
              <div class="st-plan__finish">
                <span>Próxima revisão</span>
                <b>EM 30 DIAS</b>
              </div>
              <button class="creative-demo-cta st-plan__cta" type="button" data-demo-cta>
                <span>Quero isso no meu site</span>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg>
              </button>
            </section>
          </aside>
        </div>
      </section>
    </div>`;
}

export function initStrategyLab(): void {
  const scene = document.getElementById("strategyLabScene");
  const shell = scene?.querySelector<HTMLElement>(".st-shell");
  if (!scene || !shell) return;
  const choices = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-st-choice]"));
  const nodes = Array.from(scene.querySelectorAll<HTMLElement>(".st-node"));
  const routes = Array.from(scene.querySelectorAll<SVGPathElement>(".st-map__route"));
  const name = scene.querySelector<HTMLElement>("[data-st-name]");
  const description = scene.querySelector<HTMLElement>("[data-st-description]");
  const score = scene.querySelector<HTMLElement>("[data-st-score]");
  const pillars = scene.querySelector<HTMLElement>("[data-st-pillars]");
  const report = scene.querySelector<HTMLButtonElement>("[data-st-report]");
  const status = scene.querySelector<HTMLElement>("[data-st-status]");
  const plan = scene.querySelector<HTMLElement>("[data-st-plan]");
  const planClose = scene.querySelector<HTMLButtonElement>("[data-st-plan-close]");
  const planTitle = scene.querySelector<HTMLElement>("[data-st-plan-title]");
  const roadmap = scene.querySelector<HTMLOListElement>("[data-st-roadmap]");
  if (!name || !description || !score || !pillars || !report || !status || !plan || !planClose || !planTitle || !roadmap) return;

  let currentStrategy: StrategyKey = "vendas";

  const closePlan = (immediate = false) => {
    if (plan.hidden) return;
    shell.classList.remove("is-report-open");
    report.setAttribute("aria-expanded", "false");
    if (immediate || isReducedMotion()) {
      plan.hidden = true;
      return;
    }
    gsap.to(plan, {
      xPercent: 105,
      autoAlpha: 0,
      duration: 0.42,
      ease: "power3.in",
      onComplete: () => {
        plan.hidden = true;
        gsap.set(plan, { clearProps: "all" });
        report.focus({ preventScroll: true });
      },
    });
  };

  const setStrategy = (key: StrategyKey) => {
    closePlan(true);
    currentStrategy = key;
    const data = STRATEGIES[key];
    shell.dataset.stStrategy = key;
    choices.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.stChoice === key)));
    name.textContent = data.name;
    description.textContent = data.description;
    score.textContent = `${data.score}%`;
    pillars.innerHTML = data.pillars.map((pillar, index) => `<span><i>0${index + 1}</i>${pillar}</span>`).join("");
    status.textContent = "HIPÓTESE INICIAL · NÃO É UMA CONSULTORIA REAL";
    report.classList.remove("is-ready");
    const index = key === "vendas" ? 0 : key === "marca" ? 1 : 2;
    if (!isReducedMotion()) {
      const positions = [
        [[-10, 12], [20, -16], [8, 20], [-18, -6], [16, 8]],
        [[14, -16], [-16, 8], [18, 15], [-8, 18], [10, -12]],
        [[0, 18], [16, 12], [-14, -16], [20, -8], [-18, 10]],
      ][index];
      nodes.forEach((node, nodeIndex) => {
        gsap.to(node, { x: positions[nodeIndex][0], y: positions[nodeIndex][1], duration: 0.85, ease: "elastic.out(1, 0.7)" });
      });
      gsap.fromTo(routes, { strokeDashoffset: 220 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08, ease: "power2.out" });
      gsap.fromTo([name, description, ...pillars.children], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.46, stagger: 0.045 });
    }
  };

  const controller = bindScene({
    id: "strategy-lab",
    elementId: "strategyLabScene",
    shellSelector: ".st-shell",
    onOpen: () => setStrategy("vendas"),
    onClose: () => closePlan(true),
  });
  if (!controller) return;

  choices.forEach((button) => {
    button.addEventListener("click", () => setStrategy(button.dataset.stChoice as StrategyKey));
  });
  report.addEventListener("click", () => {
    const data = STRATEGIES[currentStrategy];
    planTitle.textContent = data.name;
    roadmap.innerHTML = data.roadmap.map((step, index) => `<li><b>0${index + 1}</b><span>${step}</span><i>${(index + 1) * 10}D</i></li>`).join("");
    plan.hidden = false;
    shell.classList.add("is-report-open");
    report.setAttribute("aria-expanded", "true");
    report.classList.add("is-ready");
    status.textContent = "PLANO DE 30 DIAS GERADO";
    if (!isReducedMotion()) {
      gsap.fromTo(plan, { xPercent: 105, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.58, ease: "expo.out" });
    }
  });
  planClose.addEventListener("click", () => closePlan());
}
