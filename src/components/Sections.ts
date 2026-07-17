// Seções de conteúdo: prova de valor, serviços, problemas, solução,
// processo, modelos demonstrativos e confiança.
import {
  services,
  problems,
  problemHeadline,
  solutions,
  processSteps,
  processMessage,
  trustPoints,
  proofPoints,
} from "../data/content";
import { portfolio } from "../data/portfolio";
import { renderMotionIcon } from "../lib/motionIcons";

const serviceMotions = [
  "launch",
  "rise",
  "talk",
  "write",
  "pin",
  "scan",
  "tighten",
  "buzz",
] as const;
const problemMotions = ["scan", "buzz", "worry", "tick"] as const;
const solutionMotions = ["orbit", "check", "picture", "pin", "talk", "buzz"] as const;
const trustMotions = ["unlock", "spark", "access", "puzzle"] as const;
const portfolioMotions = ["barber", "sparkle", "serve", "flex", "shop", "chart"] as const;

// Prova de valor rápida (faixa logo abaixo da hero)
export function Proof(): string {
  return /* html */ `
    <section class="proof" aria-label="Diferenciais">
      <div class="container proof__inner" data-reveal>
        ${proofPoints.map((p) => `<span class="proof__item">${p}</span>`).join("")}
      </div>
    </section>
  `;
}

// RF02 — Serviços oferecidos
export function Services(): string {
  return /* html */ `
    <section class="section" id="servicos">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">O que eu faço</span>
          <h2 class="section__title">Tudo que o seu negócio precisa <span class="text-gradient">em um só lugar</span></h2>
          <p class="section__lead">Serviços pensados para pequenos negócios locais venderem mais.</p>
        </header>
        <div class="grid grid--cards">
          ${services
            .map(
              (s, i) => /* html */ `
            <article class="card card--service" data-icon-motion="${serviceMotions[i]}" data-reveal data-reveal-delay="${(i % 4) * 60}">
              <span class="card__icon" aria-hidden="true">${renderMotionIcon(serviceMotions[i], s.icon)}</span>
              <h3 class="card__title">${s.title}</h3>
              <p class="card__text">${s.description}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// Problemas do cliente
export function Problems(): string {
  return /* html */ `
    <section class="section section--alt" id="problemas">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Você se identifica?</span>
          <h2 class="section__title">${problemHeadline}</h2>
        </header>
        <div class="grid grid--problems">
          ${problems
            .map(
              (p, i) => /* html */ `
            <article class="card card--problem" data-icon-motion="${problemMotions[i]}" data-reveal data-reveal-delay="${(i % 4) * 60}">
              <span class="card__icon" aria-hidden="true">${renderMotionIcon(problemMotions[i], p.icon)}</span>
              <p class="card__text">${p.text}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// Solução
export function Solution(): string {
  return /* html */ `
    <section class="section" id="solucao">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">A solução</span>
          <h2 class="section__title">Um site que <span class="text-gradient">resolve de verdade</span></h2>
          <p class="section__lead">Tudo organizado para o cliente decidir comprar de você.</p>
        </header>
        <div class="grid grid--cards">
          ${solutions
            .map(
              (s, i) => /* html */ `
            <article class="card card--service" data-icon-motion="${solutionMotions[i]}" data-reveal data-reveal-delay="${(i % 3) * 60}">
              <span class="card__icon" aria-hidden="true">${renderMotionIcon(solutionMotions[i], s.icon)}</span>
              <h3 class="card__title">${s.title}</h3>
              <p class="card__text">${s.description}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// RF05 — Processo (timeline)
export function Process(): string {
  return /* html */ `
    <section class="section section--alt" id="processo">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Como funciona</span>
          <h2 class="section__title">Um processo <span class="text-gradient">leve e organizado</span></h2>
          <p class="section__lead">${processMessage}</p>
        </header>
        <ol class="timeline">
          ${processSteps
            .map(
              (step, i) => /* html */ `
            <li class="timeline__item" data-reveal data-reveal-delay="${(i % 4) * 50}">
              <span class="timeline__num">${String(i + 1).padStart(2, "0")}</span>
              <div class="timeline__body">
                <h3 class="timeline__title">${step.title}</h3>
                <p class="timeline__text">${step.description}</p>
              </div>
            </li>`
            )
            .join("")}
        </ol>
      </div>
    </section>
  `;
}

// RF09 — Modelos demonstrativos
export function Portfolio(): string {
  return /* html */ `
    <section class="section" id="modelos">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Inspiração</span>
          <h2 class="section__title">Modelos <span class="text-gradient">demonstrativos</span></h2>
          <p class="section__lead">Estilos que posso adaptar para diferentes negócios. (Exemplos ilustrativos, não são clientes reais.)</p>
        </header>
        <div class="grid grid--cards">
          ${portfolio
            .map(
              (item, i) => /* html */ `
            <article class="card card--demo card--accent-${item.accent}" data-icon-motion="${portfolioMotions[i]}" ${item.segment === "Restaurante" ? 'data-demo-scene="restaurant-menu"' : ""} data-reveal data-reveal-delay="${(i % 3) * 60}">
              <div class="card--demo__thumb" aria-hidden="true">${renderMotionIcon(portfolioMotions[i], item.icon)}</div>
              <span class="tag">${item.segment}</span>
              <h3 class="card__title">${item.title}</h3>
              <p class="card__text">${item.description}</p>
              ${
                item.segment === "Restaurante"
                  ? `<span class="card-demo__action">Abrir cardápio <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-4-4 4 4-4 4"/></svg></span>`
                  : ""
              }
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// Organização e segurança (confiança)
export function Trust(): string {
  return /* html */ `
    <section class="section section--alt" id="confianca">
      <div class="container">
        <header class="section__head" data-reveal>
          <span class="eyebrow">Organização e segurança</span>
          <h2 class="section__title">Profissional do começo <span class="text-gradient">ao fim</span></h2>
        </header>
        <div class="grid grid--cards">
          ${trustPoints
            .map(
              (s, i) => /* html */ `
            <article class="card card--service" data-icon-motion="${trustMotions[i]}" data-reveal data-reveal-delay="${(i % 4) * 60}">
              <span class="card__icon" aria-hidden="true">${renderMotionIcon(trustMotions[i], s.icon)}</span>
              <h3 class="card__title">${s.title}</h3>
              <p class="card__text">${s.description}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
