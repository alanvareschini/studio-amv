// Header fixo com blur/glassmorphism, navegação e CTA sempre acessível.
import { site } from "../data/site";
import { quickWhatsappLink } from "../lib/whatsapp";
import { SpinMark } from "./SpinMark";

export function Header(): string {
  const links = [
    ["#servicos", "Serviços"],
    ["#pacotes", "Pacotes"],
    ["#processo", "Processo"],
    ["#modelos", "Modelos"],
    ["#faq", "FAQ"],
  ];

  const wrapLetters = (text: string) => {
    const chars = [...text];
    const n = chars.length;
    return chars
      .map(
        (ch, i) =>
          `<span class="nav-link__l" style="--idx:${i};--n:${n}">${ch}</span>`
      )
      .join("");
  };

  const navItems = links
    .map(
      ([href, label]) =>
        `<a href="${href}" class="nav-link"><span class="nav-link__word">${wrapLetters(label)}</span></a>`
    )
    .join("");

  return /* html */ `
    <header class="header" id="header">
      <div class="container header__inner">
        <a href="#top" class="brand" aria-label="${site.brand} — início">
          ${SpinMark()}
          <span class="brand__name">${site.brand}</span>
        </a>

        <nav class="nav" aria-label="Navegação principal">${navItems}</nav>

        <div class="header__actions">
          <a class="btn btn--primary btn--sm" href="#orcamento">Pedir orçamento</a>
          <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobileMenu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div class="mobile-menu" id="mobileMenu" hidden>
        <nav class="mobile-menu__nav" aria-label="Navegação mobile">
          ${links.map(([href, label]) => `<a href="${href}" class="mobile-menu__link" data-close>${label}</a>`).join("")}
          <a class="btn btn--primary" href="#orcamento" data-close>Pedir orçamento</a>
          <a class="btn btn--ghost" href="${quickWhatsappLink()}" target="_blank" rel="noopener" data-close>Chamar no WhatsApp</a>
        </nav>
      </div>
    </header>
  `;
}

export function initHeader(): void {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  const header = document.getElementById("header");
  if (!toggle || !menu || !header) return;

  const close = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
  };
  const open = () => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
  };

  toggle.addEventListener("click", () => {
    if (menu.hidden) open();
    else close();
  });

  menu.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", close)
  );

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  initNavUnderline();
}

function initNavUnderline(): void {
  const nav = document.querySelector<HTMLElement>(".nav");
  if (!nav) return;
  const links = nav.querySelectorAll<HTMLElement>(".nav-link");

  const moveTo = (el: HTMLElement) => {
    nav.style.setProperty("--x", `${el.offsetLeft}px`);
    nav.style.setProperty("--w", `${el.offsetWidth}px`);
  };

  links.forEach((link) => {
    link.addEventListener("pointerenter", () => moveTo(link));
    link.addEventListener("focus", () => moveTo(link));
  });
}
