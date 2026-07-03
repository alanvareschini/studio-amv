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
}

// Inclinação 3D que segue o cursor (eixos X e Y, para todos os lados).
// Card fica reto por padrão; só inclina enquanto o mouse está sobre ele.
function initTilt(): void {
  // Pula em telas de toque ou quando o usuário prefere menos movimento.
  if (
    !window.matchMedia("(hover: hover)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const MAX_ANGLE = 12; // graus máximos de inclinação

  document.querySelectorAll<HTMLElement>(".pkg").forEach((card) => {
    let raf = 0;

    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      // posição do cursor relativa ao centro do card (-1 a 1)
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      // posição 0–100% para o brilho holográfico seguir o cursor
      const hx = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
      const hy = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);

      card.classList.remove("is-resetting");
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty("--ry", `${(px * MAX_ANGLE).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * MAX_ANGLE).toFixed(2)}deg`);
        card.style.setProperty("--hx", `${hx}%`);
        card.style.setProperty("--hy", `${hy}%`);
      });
    });

    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      // volta ao reto com transição mais suave
      card.classList.add("is-resetting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}
