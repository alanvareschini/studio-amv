// RF03 / RF04 — Seção de pacotes com destaque no "Profissional".
import { packages, type Package } from "../data/packages";
import { openModal, closeModal } from "./Modal";
import { quickWhatsappLink } from "../lib/whatsapp";
import gsap from "gsap";

// conteúdo do modal de detalhe do pacote
function packageModal(pkg: Package): string {
  const msg = `Olá! Tenho interesse no pacote ${pkg.name}. Pode me passar mais detalhes?`;
  return /* html */ `
    <div class="pkg-modal ${pkg.featured ? "is-featured" : ""}">
      ${pkg.badge ? `<span class="pkg-modal__badge">${pkg.badge}</span>` : ""}
      <h3 class="pkg-modal__name">${pkg.name}</h3>
      <div class="pkg-modal__price">
        <span class="pkg__value">${pkg.price}</span>
        ${pkg.priceNote ? `<span class="pkg__note">${pkg.priceNote}</span>` : ""}
      </div>
      <p class="pkg-modal__audience">${pkg.audience}</p>
      <ul class="pkg__features">
        ${pkg.features.map((f) => `<li><span class="pkg__check" aria-hidden="true">✓</span>${f}</li>`).join("")}
      </ul>
      <a class="btn btn--primary btn--block" href="${quickWhatsappLink(msg)}" target="_blank" rel="noopener">Falar no WhatsApp</a>
      <button class="btn btn--ghost btn--block" type="button" data-goform="${pkg.name}">Pedir orçamento pelo formulário</button>
    </div>`;
}

export function Packages(): string {
  return /* html */ `
    <section class="section" id="pacotes">
      <svg width="0" height="0" aria-hidden="true" style="position:absolute">
        <defs>
          <linearGradient id="pkgCheckGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#a855f7" />
            <stop offset="50%" stop-color="#22d3ee" />
            <stop offset="100%" stop-color="#00ff88" />
          </linearGradient>
        </defs>
      </svg>
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Pacotes</span>
          <h2 class="section__title">Escolha o plano <span class="text-gradient">ideal pro seu negócio</span></h2>
          <p class="section__lead">Preços aproximados. O valor final depende do escopo combinado no WhatsApp.</p>
          <button class="gyro-btn" id="gyroBtn" type="button">Ativar movimento 3D</button>
        </header>

        <div class="scene-3d">
          <div class="grid grid--packages">
          ${packages
            .map(
              (pkg) => /* html */ `
            <div class="pkg-wrap">
            <article
              class="pkg ${pkg.featured ? "pkg--featured" : ""}"
            >
              <span class="pkg__holo" aria-hidden="true"></span>
              ${pkg.badge ? `<span class="pkg__badge">${pkg.badge}</span>` : ""}
              <h3 class="pkg__name">${pkg.name}</h3>
              <div class="pkg__price">
                <span class="pkg__value">${pkg.price}</span>
                ${pkg.priceNote ? `<span class="pkg__note">${pkg.priceNote}</span>` : ""}
              </div>
              <p class="pkg__audience">${pkg.audience}</p>
              <ul class="pkg__features">
                ${pkg.features
                  .map(
                    (f) => `<li class="pkg__feat">
                    <svg class="pkg-check" viewBox="0 0 24 24" aria-hidden="true">
                      <path class="pkg-check__mark" d="M6.5 12.5 l3.4 3.4 L17.5 8" />
                      <path class="pkg-check__draw" d="M6.5 12.5 l3.4 3.4 L17.5 8" />
                    </svg>${f}</li>`
                  )
                  .join("")}
              </ul>
              <button
                class="btn ${pkg.featured ? "btn--primary" : "btn--ghost"} btn--block"
                type="button"
                data-pacote="${pkg.name}"
              >${pkg.cta}</button>
            </article>
            </div>`
            )
            .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Detecção de toque CONFIÁVEL. Não usamos só "(hover: none)" porque vários
// Android/Chrome reportam "hover: hover" por engano, desligando tudo no celular.
function isTouchDevice(): boolean {
  return (
    (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window
  );
}

// pré-seleciona o pacote no formulário e rola até ele
function goToForm(pacote: string): void {
  const select = document.getElementById("f-pacote") as HTMLSelectElement | null;
  if (select) {
    const match = Array.from(select.options).find((o) => o.value === pacote);
    if (match) select.value = pacote;
  }
  document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Clicar num pacote abre o modal com os detalhes.
export function initPackages(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-pacote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pkg = packages.find((p) => p.name === btn.dataset.pacote);
      if (!pkg) return;
      openModal(packageModal(pkg), (content) => {
        const form = content.querySelector<HTMLButtonElement>("[data-goform]");
        form?.addEventListener("click", () => {
          closeModal();
          goToForm(pkg.name);
        });
      });
    });
  });

  // marca o documento como "toque" pra o CSS ligar os efeitos de celular
  // (botão de giro, holo automático, balanço, borda animada etc.)
  if (isTouchDevice()) document.documentElement.classList.add("amv-touch");

  initTilt();
  initCheckFx();
  initPriceCount();
  initFeatStagger();
}

// preço "conta" de 0 até o valor quando o card entra na tela
function initPriceCount(): void {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const target = parseInt((el.textContent || "").replace(/\D/g, ""), 10);
        if (!target) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = "R$ " + Math.round(obj.v).toLocaleString("pt-BR");
          },
        });
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll<HTMLElement>(".pkg__value").forEach((el) => io.observe(el));
}

// itens do checklist entram em sequência quando o card aparece
function initFeatStagger(): void {
  document.querySelectorAll<HTMLElement>(".pkg").forEach((pkg) => {
    const feats = pkg.querySelectorAll(".pkg__feat");
    if (!feats.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          gsap.from(feats, {
            autoAlpha: 0,
            x: -10,
            stagger: 0.06,
            duration: 0.45,
            ease: "power2.out",
          });
        });
      },
      { threshold: 0.3 }
    );
    io.observe(pkg);
  });
}

// Ao clicar num item do checklist, o próprio "v" se redesenha em GRADIENTE
// (elástico) — só naquele item. Clicar de novo desfaz.
function initCheckFx(): void {
  const isTouch = isTouchDevice();

  document.querySelectorAll<HTMLElement>(".pkg__feat").forEach((li) => {
    const draw = li.querySelector<SVGPathElement>(".pkg-check__draw");
    if (!draw) return;
    const len = draw.getTotalLength();
    draw.style.strokeDasharray = `${len}`;
    draw.style.strokeDashoffset = `${len}`;
    let on = false;
    li.addEventListener("click", () => {
      on = !on;
      gsap.killTweensOf(draw);
      gsap.to(draw, {
        strokeDashoffset: on ? 0 : len,
        duration: on ? 1.2 : 0.25,
        ease: on ? "elastic.out(1.2, 0.25)" : "power2.inOut",
      });
    });
  });

  // No mobile não há hover pra convidar o clique: os checks se colorem sozinhos
  // (em cascata) quando o card entra na tela — mostra o efeito de gradiente.
  if (!isTouch) return;
  document.querySelectorAll<HTMLElement>(".pkg").forEach((card) => {
    const draws = card.querySelectorAll<SVGPathElement>(".pkg-check__draw");
    if (!draws.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          draws.forEach((d, i) => {
            gsap.to(d, {
              strokeDashoffset: 0,
              duration: 1,
              delay: 0.35 + i * 0.12,
              ease: "elastic.out(1.1, 0.3)",
            });
          });
        });
      },
      { threshold: 0.35 }
    );
    io.observe(card);
  });
}

// Inclinação 3D que segue o cursor (eixos X e Y, para todos os lados).
// Card fica reto por padrão; só inclina enquanto o mouse está sobre ele.
function initTilt(): void {
  // Só respeita a preferência de menos movimento (aí fica tudo parado).
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MAX_ANGLE = 12; // graus máximos de inclinação
  const isTouch = isTouchDevice();

  // No celular/tablet não há cursor: os cards inclinam com o GIRO do aparelho
  // (giroscópio). Não briga com a rolagem, ao contrário do "seguir o dedo".
  if (isTouch) {
    initGyroTiltV2(MAX_ANGLE);
    return;
  }

  document.querySelectorAll<HTMLElement>(".pkg").forEach((card) => {
    let raf = 0;

    const move = (clientX: number, clientY: number) => {
      const rect = card.getBoundingClientRect();
      // posição do cursor relativa ao centro do card (-1 a 1)
      const px = ((clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((clientY - rect.top) / rect.height) * 2 - 1;

      // posição 0–100% para o brilho holográfico seguir o cursor
      const hx = (((clientX - rect.left) / rect.width) * 100).toFixed(1);
      const hy = (((clientY - rect.top) / rect.height) * 100).toFixed(1);

      card.classList.remove("is-resetting");
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty("--ry", `${(px * MAX_ANGLE).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * MAX_ANGLE).toFixed(2)}deg`);
        card.style.setProperty("--hx", `${hx}%`);
        card.style.setProperty("--hy", `${hy}%`);
      });
    };

    card.addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      card.classList.add("is-resetting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

// Inclinação dos cards pelo giroscópio (mobile). A primeira posição do aparelho
// vira o "neutro"; girar o telefone inclina todos os cards juntos, como se
// reagissem à gravidade. No iOS 13+ é preciso pedir permissão num gesto.
function initGyroTilt(MAX_ANGLE: number): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".pkg"));
  if (!cards.length) return;
  const btn = document.getElementById("gyroBtn");

  const SENS = 0.6; // graus de inclinação do card por grau de giro
  const clamp = (v: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, v));
  let base: { beta: number; gamma: number } | null = null;
  let raf = 0;
  let ry = 0;
  let rx = 0;
  let gotEvent = false;

  const setBtn = (txt: string, cls?: "ok" | "err") => {
    if (!btn) return;
    btn.textContent = txt;
    btn.classList.remove("is-ok", "is-err");
    if (cls === "ok") btn.classList.add("is-ok");
    if (cls === "err") btn.classList.add("is-err");
  };

  const apply = () => {
    raf = 0;
    cards.forEach((card) => {
      // classe is-touching: usa o transform pelas variáveis e pausa o balanço
      card.classList.add("is-touching");
      card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      // brilho holo acompanha a inclinação (mapeia -MAX..MAX → 0..100%)
      card.style.setProperty("--hx", `${(50 + (ry / MAX_ANGLE) * 45).toFixed(1)}%`);
      card.style.setProperty("--hy", `${(50 - (rx / MAX_ANGLE) * 45).toFixed(1)}%`);
    });
  };

  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    if (!gotEvent) {
      gotEvent = true;
      setBtn("Movimento 3D ativo", "ok");
      window.setTimeout(() => btn?.classList.add("is-gone"), 2500);
    }
    if (!base) base = { beta: e.beta, gamma: e.gamma };
    ry = clamp((e.gamma - base.gamma) * SENS); // esquerda-direita
    rx = clamp(-(e.beta - base.beta) * SENS); // frente-trás
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const start = () =>
    window.addEventListener("deviceorientation", onOrient, { passive: true });

  const DOE = window.DeviceOrientationEvent as unknown as
    | { requestPermission?: () => Promise<"granted" | "denied"> }
    | undefined;
  const needsPermission = !!DOE && typeof DOE.requestPermission === "function";

  const activate = () => {
    if (gotEvent) return;
    setBtn("Ativando…");
    if (needsPermission) {
      DOE!.requestPermission!()
        .then((r) => {
          if (r === "granted") start();
          else setBtn("Permissão negada", "err");
        })
        .catch(() => setBtn("Não suportado neste aparelho", "err"));
    } else if (typeof window.DeviceOrientationEvent !== "undefined") {
      start();
    } else {
      setBtn("Aparelho sem sensor de movimento", "err");
      return;
    }
    // se em 2,5s nenhum dado chegou, o sensor não está respondendo → avisa
    window.setTimeout(() => {
      if (!gotEvent) setBtn("Sensor não respondeu neste aparelho", "err");
    }, 2500);
  };

  btn?.addEventListener("click", activate);
  // Android e afins não exigem permissão: já tenta ligar sozinho no carregamento.
  if (!needsPermission) activate();
}

void initGyroTilt;

function initGyroTiltV2(MAX_ANGLE: number): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".pkg"));
  if (!cards.length) return;
  const btn = document.getElementById("gyroBtn");

  const SENS = 0.85;
  const SMOOTH = 0.16;
  const DEAD = 0.35;
  const clamp = (v: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, v));
  const deadzone = (v: number) => (Math.abs(v) < DEAD ? 0 : v);
  let base: { beta: number; gamma: number } | null = null;
  let raf = 0;
  let ry = 0;
  let rx = 0;
  let targetRy = 0;
  let targetRx = 0;
  let lastGamma: number | null = null;
  let spillUntil = 0;
  let spillTimer = 0;
  let gotEvent = false;
  let started = false;

  const setBtn = (txt: string, cls?: "ok" | "err") => {
    if (!btn) return;
    btn.textContent = txt;
    btn.classList.remove("is-ok", "is-err");
    if (cls === "ok") btn.classList.add("is-ok");
    if (cls === "err") btn.classList.add("is-err");
  };

  const apply = () => {
    raf = 0;
    ry += (targetRy - ry) * SMOOTH;
    rx += (targetRx - rx) * SMOOTH;
    const spilling = performance.now() < spillUntil;
    const spillX = spilling ? (ry / MAX_ANGLE) * 34 : 0;
    const spillY = spilling ? (-rx / MAX_ANGLE) * 10 : 0;
    cards.forEach((card) => {
      card.classList.add("is-touching");
      card.classList.toggle("is-gyro-spill", spilling);
      card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--hx", `${(50 + (ry / MAX_ANGLE) * 45).toFixed(1)}%`);
      card.style.setProperty("--hy", `${(50 - (rx / MAX_ANGLE) * 45).toFixed(1)}%`);
      card.style.setProperty("--spill-x", spillX.toFixed(2));
      card.style.setProperty("--spill-y", spillY.toFixed(2));
    });
    window.dispatchEvent(
      new CustomEvent("amv:gyrotilt", {
        detail: { rx, ry, max: MAX_ANGLE },
      })
    );
  };

  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    if (!gotEvent) {
      gotEvent = true;
      setBtn("Movimento 3D ativo", "ok");
      window.setTimeout(() => btn?.classList.add("is-gone"), 1800);
    }
    if (!base) base = { beta: e.beta, gamma: e.gamma };
    if (lastGamma !== null && Math.abs(e.gamma - lastGamma) > 6.5) {
      spillUntil = performance.now() + 10000;
      window.clearTimeout(spillTimer);
      spillTimer = window.setTimeout(() => {
        cards.forEach((card) => {
          card.classList.remove("is-gyro-spill");
          card.style.setProperty("--spill-x", "0");
          card.style.setProperty("--spill-y", "0");
        });
      }, 10200);
    }
    lastGamma = e.gamma;
    targetRy = clamp(deadzone((e.gamma - base.gamma) * SENS));
    targetRx = clamp(deadzone(-(e.beta - base.beta) * SENS));
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const start = () => {
    if (started) return;
    started = true;
    window.addEventListener("deviceorientation", onOrient, { passive: true });
  };

  const DOE = window.DeviceOrientationEvent as unknown as
    | { requestPermission?: () => Promise<"granted" | "denied"> }
    | undefined;
  const needsPermission = !!DOE && typeof DOE.requestPermission === "function";

  const activate = () => {
    if (started) return;
    setBtn("Ativando...");
    if (needsPermission) {
      DOE!.requestPermission!()
        .then((r) => {
          if (r === "granted") start();
          else setBtn("Permissao negada", "err");
        })
        .catch(() => setBtn("Nao suportado neste aparelho", "err"));
    } else if (typeof window.DeviceOrientationEvent !== "undefined") {
      start();
    } else {
      setBtn("Aparelho sem sensor de movimento", "err");
      return;
    }
    window.setTimeout(() => {
      if (!gotEvent) setBtn("Sensor nao respondeu neste aparelho", "err");
    }, 2500);
  };

  btn?.addEventListener("click", activate);
  if (!needsPermission) activate();
}
