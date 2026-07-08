// Menu estilo Lusion: botao fixo no canto que abre um menu compacto,
// com links grandes e o blob original de dia/noite dentro.
import { HeroBlob } from "./HeroBlob";

const LINKS: [string, string][] = [
  ["#servicos", "Servi&ccedil;os"],
  ["#pacotes", "Pacotes"],
  ["#processo", "Processo"],
  ["#modelos", "Modelos"],
  ["#faq", "FAQ"],
  ["#orcamento", "Or&ccedil;amento"],
];

export function Menu(): string {
  const links = LINKS.map(
    ([href, label], i) =>
      `<a class="menu-link" href="${href}" style="--i:${i}">${label}</a>`
  ).join("");

  return /* html */ `
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menuOverlay">
      <span class="menu-btn__label">Menu</span>
      <span class="menu-btn__ic" aria-hidden="true"><i></i><i></i></span>
    </button>
    <div class="menu-overlay" id="menuOverlay" aria-hidden="true">
      <nav class="menu-nav" aria-label="Navega&ccedil;&atilde;o">${links}</nav>
      <div class="menu-theme">
        <span class="menu-theme__label">Modo claro / escuro</span>
        <div class="menu-theme__blob">${HeroBlob("hero-blob--menu")}</div>
      </div>
    </div>`;
}

export function initMenu(): void {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("menuOverlay");
  if (!btn || !overlay) return;

  const open = () => {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    btn.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () =>
    overlay.classList.contains("open") ? close() : open()
  );
  overlay.querySelectorAll(".menu-link").forEach((link) =>
    link.addEventListener("click", close)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    const t = e.target as Node;
    if (!overlay.contains(t) && !btn.contains(t)) close();
  });
}
