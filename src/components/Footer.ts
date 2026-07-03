// Footer com marca, navegação e contatos.
import { site } from "../data/site";
import { quickWhatsappLink } from "../lib/whatsapp";

export function Footer(): string {
  const year = new Date().getFullYear();
  return /* html */ `
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <a href="#top" class="brand">
            <span class="brand__dot" aria-hidden="true"></span>
            <span class="brand__name">${site.brand}</span>
          </a>
          <p class="footer__tagline">${site.tagline}.</p>
          <p class="footer__location">${site.location}</p>
        </div>

        <nav class="footer__nav" aria-label="Rodapé">
          <a href="#servicos">Serviços</a>
          <a href="#pacotes">Pacotes</a>
          <a href="#processo">Processo</a>
          <a href="#faq">FAQ</a>
          <a href="#orcamento">Orçamento</a>
        </nav>

        <div class="footer__contact">
          <a class="btn btn--primary btn--sm" href="${quickWhatsappLink()}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
          <a class="footer__link" href="${site.instagramUrl}" target="_blank" rel="noopener">${site.instagram}</a>
          <a class="footer__link" href="mailto:${site.email}">${site.email}</a>
        </div>
      </div>
      <div class="footer__bottom">
        <p>© ${year} ${site.brand}. Todos os direitos reservados.</p>
      </div>
    </footer>
  `;
}
