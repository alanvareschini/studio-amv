// RF01 — Hero imersiva: a letra "A" em 3D ao fundo (controlada pelo scroll) e
// um texto mínimo + CTA por cima. Sem menu. Cena em components/Hero3D.ts.
import { site } from "../data/site";
import { ChaosButton } from "./ChaosButton";
import { LusionButton } from "./LusionButton";

export function Hero(): string {
  return /* html */ `
    <section class="hero hero--a" id="top">
      <!-- Cena 3D fixa ao fundo (fallback estático em .hero3d.is-static) -->
      <div class="hero3d" aria-hidden="true">
        <canvas class="hero3d-canvas"></canvas>
      </div>

      <div class="container hero__inner hero__inner--center">
        <div class="hero__content">
          <h1 class="hero__brand">${site.brand}</h1>
          <p class="hero__subtitle">
            Sites profissionais que fazem seu negócio
            <span class="text-gradient">vender mais.</span>
          </p>
          <div class="hero__actions">
            ${ChaosButton("Pedir orçamento", "#orcamento")}
            ${LusionButton("Ver pacotes", "#pacotes")}
          </div>
        </div>
      </div>
    </section>
  `;
}
