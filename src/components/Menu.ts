// Menu estilo Lusion: botao fixo no canto que abre um menu compacto,
// com links grandes e toggle de tema proprio para mobile.

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
        <button class="menu-theme-toggle" id="menuThemeToggle" type="button" aria-label="Alternar modo claro e escuro" aria-pressed="false">
          <span class="menu-theme-toggle__orb" aria-hidden="true">
            <span class="menu-theme-toggle__sun"></span>
            <span class="menu-theme-toggle__moon"></span>
            <span class="menu-theme-toggle__wave menu-theme-toggle__wave--one"></span>
            <span class="menu-theme-toggle__wave menu-theme-toggle__wave--two"></span>
          </span>
        </button>
      </div>
    </div>`;
}

export function initMenu(): void {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("menuOverlay");
  if (!btn || !overlay) return;

  const themeToggle = document.getElementById("menuThemeToggle");
  const currentTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const syncThemeToggle = () => {
    if (!themeToggle) return;
    const isLight = currentTheme() === "light";
    themeToggle.classList.toggle("is-light", isLight);
    themeToggle.setAttribute("aria-pressed", String(isLight));
  };
  const setTheme = (theme: "light" | "dark") => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* ignora */
    }
    syncThemeToggle();
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  };

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
  themeToggle?.addEventListener("click", () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  });
  window.addEventListener("themechange", syncThemeToggle as EventListener);
  syncThemeToggle();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    const t = e.target as Node;
    if (!overlay.contains(t) && !btn.contains(t)) close();
  });
}
