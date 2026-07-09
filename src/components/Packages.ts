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

type LetterBody = {
  el: HTMLElement;
  baseX: number;
  baseY: number;
  w: number;
  h: number;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
};

type RectCollider = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type PhysicsCard = {
  card: HTMLElement;
  bodies: LetterBody[];
  width: number;
  height: number;
  floor: number;
  button?: RectCollider;
  flowX: number;
  flowY: number;
  startedAt: number;
  lastTs: number;
};

const physicsCards = new Map<HTMLElement, PhysicsCard>();
let physicsRaf = 0;

const LIQUID_TILT_MAX = 12;
const clampValue = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function splitPackageLetters(card: HTMLElement): HTMLElement[] {
  if (card.dataset.lettersReady !== "1") {
    const targets = card.querySelectorAll<HTMLElement>(
      ".pkg__badge, .pkg__name, .pkg__value, .pkg__note, .pkg__audience, .pkg__features li"
    );

    targets.forEach((target) => {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node.textContent?.trim()) textNodes.push(node);
      }

      textNodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        const parts = (node.textContent || "").match(/\s+|\S+/g) || [];

        parts.forEach((part) => {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }

          const word = document.createElement("span");
          word.className = "pkg-phys-word";
          Array.from(part).forEach((char) => {
            const span = document.createElement("span");
            span.className = "pkg-phys-char";
            span.textContent = char;
            word.appendChild(span);
          });
          frag.appendChild(word);
        });

        node.replaceWith(frag);
      });
    });

    card.dataset.lettersReady = "1";
  }

  return Array.from(card.querySelectorAll<HTMLElement>(".pkg-phys-char"));
}

function restorePackageLetters(card: HTMLElement): void {
  card.querySelectorAll<HTMLElement>(".pkg-phys-word").forEach((word) => {
    word.replaceWith(document.createTextNode(word.textContent || ""));
  });
  delete card.dataset.lettersReady;
}

function visiblePackageCards(cards: HTMLElement[]): HTMLElement[] {
  const visible = cards.filter((card) => {
    const r = card.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  });
  const viewportCenter = window.innerHeight * 0.5;
  return visible
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.abs((ar.top + ar.bottom) * 0.5 - viewportCenter) - Math.abs((br.top + br.bottom) * 0.5 - viewportCenter);
    })
    .slice(0, 1);
}

function startLetterPhysics(cards: HTMLElement[], impulse: number): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const now = performance.now();
  visiblePackageCards(cards).forEach((card) => {
    if (physicsCards.has(card)) return;

    const cardRect = card.getBoundingClientRect();
    const buttonRect = card.querySelector<HTMLElement>(".btn")?.getBoundingClientRect();
    const button = buttonRect
      ? {
          left: buttonRect.left - cardRect.left - 6,
          right: buttonRect.right - cardRect.left + 6,
          top: buttonRect.top - cardRect.top - 6,
          bottom: buttonRect.bottom - cardRect.top + 6,
        }
      : undefined;
    const floor = cardRect.height - 18;
    const letters = splitPackageLetters(card);
    const bodies = letters.map((el, i) => {
      const r = el.getBoundingClientRect();
      const seed = ((i * 1103515245 + 12345) >>> 0) / 4294967295;
      const side = i % 2 === 0 ? -1 : 1;
      el.classList.add("is-phys");
      el.style.transition = "none";
      return {
        el,
        baseX: r.left - cardRect.left,
        baseY: r.top - cardRect.top,
        w: Math.max(3, r.width),
        h: Math.max(8, r.height),
        r: Math.max(7, Math.min(13, Math.max(r.width, r.height) * 0.58)),
        x: side * (seed * 2.4),
        y: 0,
        vx: impulse * (170 + seed * 135) + side * (18 + seed * 24),
        vy: -18 - seed * 58,
        rot: 0,
        vr: impulse * (45 + seed * 90) + side * seed * 14,
      };
    });

    card.classList.add("pkg--physics-active");
    physicsCards.set(card, {
      card,
      bodies,
      width: cardRect.width,
      height: cardRect.height,
      floor,
      button,
      flowX: 0,
      flowY: 0,
      startedAt: now,
      lastTs: now,
    });
  });

  if (!physicsRaf && physicsCards.size) physicsRaf = requestAnimationFrame(tickLetterPhysics);
}

function finishLetterPhysics(state: PhysicsCard): void {
  state.card.classList.remove("pkg--physics-active");
  state.bodies.forEach((body) => {
    body.el.style.transition = "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)";
    body.el.style.transform = "";
    window.setTimeout(() => {
      body.el.classList.remove("is-phys");
      body.el.style.transition = "";
    }, 950);
  });
  window.setTimeout(() => restorePackageLetters(state.card), 980);
  physicsCards.delete(state.card);
}

function tickLetterPhysics(ts: number): void {
  physicsRaf = 0;
  physicsCards.forEach((state) => {
    const dt = Math.min(0.032, Math.max(0.001, (ts - state.lastTs) / 1000));
    state.lastTs = ts;

    const alive = ts - state.startedAt < 10000;
    const pull = alive ? 0 : 24;
    const ry = parseFloat(state.card.style.getPropertyValue("--ry")) || 0;
    const rx = parseFloat(state.card.style.getPropertyValue("--rx")) || 0;
    const targetFlowX = clampValue(ry / LIQUID_TILT_MAX, -1, 1);
    const targetFlowY = clampValue(-rx / LIQUID_TILT_MAX, -1, 1);
    const flowEase = Math.min(1, dt * 7.5);
    state.flowX += (targetFlowX - state.flowX) * flowEase;
    state.flowY += (targetFlowY - state.flowY) * flowEase;
    const liquidAx = state.flowX * 820;
    const liquidAy = 420 + state.flowY * 900;
    const wall = 14;
    const floor = state.floor;

    state.bodies.forEach((body) => {
      const depth = clampValue((body.baseY + body.y) / state.height, 0, 1);
      const edgePressureX = state.flowX * depth * 140;
      const edgePressureY = state.flowY * (0.5 + depth) * 120;
      body.vx += (liquidAx + edgePressureX - body.x * pull - body.vx * 0.52) * dt;
      body.vy += (liquidAy + edgePressureY - body.y * pull - body.vy * 0.2) * dt;

      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.rot += body.vr * dt;
      body.vx *= 0.986;
      body.vy *= 0.992;
      body.vr *= 0.986;

      const left = body.baseX + body.x;
      const right = left + body.w;
      const top = body.baseY + body.y;
      const bottom = top + body.h;

      if (left < wall) {
        body.x += wall - left;
        body.vx = Math.abs(body.vx) * 0.42;
        body.vr += body.vx * 0.04;
      } else if (right > state.width - wall) {
        body.x -= right - (state.width - wall);
        body.vx = -Math.abs(body.vx) * 0.42;
        body.vr += body.vx * 0.04;
      }

      if (bottom > floor) {
        body.y -= bottom - floor;
        body.vy = -Math.abs(body.vy) * 0.24;
        body.vx *= 0.76;
        body.vr *= 0.74;
      } else if (top < wall) {
        body.y += wall - top;
        body.vy = Math.abs(body.vy) * 0.28;
      }

      if (state.button) {
        const l = body.baseX + body.x;
        const r = l + body.w;
        const t = body.baseY + body.y;
        const b = t + body.h;
        const c = state.button;
        if (r > c.left && l < c.right && b > c.top && t < c.bottom) {
          const pushLeft = r - c.left;
          const pushRight = c.right - l;
          const pushTop = b - c.top;
          const pushBottom = c.bottom - t;
          const pushX = Math.min(pushLeft, pushRight);
          const pushY = Math.min(pushTop, pushBottom);

          if (pushY <= pushX || b <= c.top + body.h * 1.4) {
            if (pushTop < pushBottom) {
              body.y -= pushTop;
              body.vy = -Math.abs(body.vy) * 0.28;
            } else {
              body.y += pushBottom;
              body.vy = Math.abs(body.vy) * 0.18;
            }
            body.vx *= 0.72;
            body.vr += body.vx * 0.035;
          } else if (pushLeft < pushRight) {
            body.x -= pushLeft;
            body.vx = -Math.abs(body.vx) * 0.34;
          } else {
            body.x += pushRight;
            body.vx = Math.abs(body.vx) * 0.34;
          }
        }
      }
    });

    const grid = new Map<string, LetterBody[]>();
    const cell = 28;
    for (let i = 0; i < state.bodies.length; i++) {
      const a = state.bodies[i];
      const ax = a.baseX + a.x + a.w * 0.5;
      const ay = a.baseY + a.y + a.h * 0.5;
      const gx = Math.floor(ax / cell);
      const gy = Math.floor(ay / cell);

      for (let yy = gy - 1; yy <= gy + 1; yy++) {
        for (let xx = gx - 1; xx <= gx + 1; xx++) {
          const bucket = grid.get(`${xx}:${yy}`);
          if (!bucket) continue;
          bucket.forEach((b) => {
            const bx = b.baseX + b.x + b.w * 0.5;
            const by = b.baseY + b.y + b.h * 0.5;
            const dx = bx - ax;
            const dy = by - ay;
            if (Math.abs(dx) > cell || Math.abs(dy) > cell) return;
            const dist = Math.hypot(dx, dy) || 1;
            const min = Math.min(22, a.r + b.r + 4);
            if (dist >= min) return;
            const push = (min - dist) * 0.34;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            const avx = a.vx;
            const avy = a.vy;
            a.vx = a.vx * 0.9 - nx * 12;
            a.vy = a.vy * 0.9 - ny * 8;
            b.vx = b.vx * 0.9 + nx * 12 + avx * 0.012;
            b.vy = b.vy * 0.9 + ny * 8 + avy * 0.012;
          });
        }
      }

      const key = `${gx}:${gy}`;
      const bucket = grid.get(key);
      if (bucket) bucket.push(a);
      else grid.set(key, [a]);
    }

    state.bodies.forEach((body) => {
      body.el.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0) rotate(${body.rot.toFixed(2)}deg)`;
    });

    if (!alive && ts - state.startedAt > 10900) finishLetterPhysics(state);
  });

  if (physicsCards.size) physicsRaf = requestAnimationFrame(tickLetterPhysics);
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

  const SENS = 0.62;
  const SMOOTH = 0.12;
  const DEAD = 0.85;
  const clamp = (v: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, v));
  const deadzone = (v: number) => (Math.abs(v) < DEAD ? 0 : v);
  let base: { beta: number; gamma: number } | null = null;
  let raf = 0;
  let ry = 0;
  let rx = 0;
  let targetRy = 0;
  let targetRx = 0;
  let lastGamma: number | null = null;
  let lastGammaTs = 0;
  let lastBurstSign = 0;
  let lastBurstAt = 0;
  let physicsCooldownUntil = 0;
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
    cards.forEach((card) => {
      card.classList.add("is-touching");
      card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--hx", `${(50 + (ry / MAX_ANGLE) * 45).toFixed(1)}%`);
      card.style.setProperty("--hy", `${(50 - (rx / MAX_ANGLE) * 45).toFixed(1)}%`);
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
    const now = performance.now();
    if (lastGamma !== null && lastGammaTs) {
      const dt = Math.max(16, now - lastGammaTs) / 1000;
      const velocity = (e.gamma - lastGamma) / dt;
      const sign = Math.sign(velocity);
      const strongLateralSnap = Math.abs(velocity) > 360 && Math.abs(e.gamma - base.gamma) > 12;

      if (strongLateralSnap && sign !== 0) {
        const reversedFast = lastBurstSign !== 0 && sign !== lastBurstSign && now - lastBurstAt < 520;
        if (reversedFast && now > physicsCooldownUntil) {
          const impulse = Math.max(-1, Math.min(1, velocity / 520));
          startLetterPhysics(cards, impulse);
          physicsCooldownUntil = now + 14000;
          lastBurstSign = 0;
        } else {
          lastBurstSign = sign;
          lastBurstAt = now;
        }
      }
    }
    lastGamma = e.gamma;
    lastGammaTs = now;
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
