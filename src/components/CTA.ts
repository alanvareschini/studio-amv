// CTA final — leva o visitante para o formulário ou WhatsApp.
import { quickWhatsappLink } from "../lib/whatsapp";

export function CTA(): string {
  return /* html */ `
    <section class="cta-final" id="contato">
      <div class="cta-final__bg" aria-hidden="true"></div>
      <div class="container cta-final__inner" data-reveal>
        <h2 class="cta-final__title">Quer uma página profissional <span class="text-gradient">para o seu negócio?</span></h2>
        <p class="cta-final__text">Vamos conversar. Em poucos minutos eu entendo o que você precisa e monto uma proposta.</p>
        <div class="cta-final__actions">
          <a class="btn btn--primary btn--lg" href="#orcamento">Preencher briefing rápido</a>
          <a class="btn btn--ghost btn--lg" href="${quickWhatsappLink()}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
        </div>
      </div>
    </section>
  `;
}
