// Modal reutilizável: zoom+fade no desktop, slide de baixo (bottom sheet) no mobile.
let overlay: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;
let previousFocus: HTMLElement | null = null;
let previousOverflow = "";

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function ModalShell(): string {
  return /* html */ `
    <div class="modal-overlay" id="modal" aria-hidden="true" inert>
      <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
        <button class="modal__close" id="modalClose" type="button" aria-label="Fechar">×</button>
        <div class="modal__content" id="modalContent"></div>
      </div>
    </div>`;
}

export function initModal(): void {
  overlay = document.getElementById("modal");
  contentEl = document.getElementById("modalContent");
  const closeBtn = document.getElementById("modalClose");
  if (!overlay || !contentEl || !closeBtn) return;

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay?.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key !== "Tab") return;

    const focusable = [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
    if (!focusable.length) {
      e.preventDefault();
      overlay.querySelector<HTMLElement>(".modal")?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

export function openModal(html: string, afterOpen?: (content: HTMLElement) => void): void {
  if (!overlay || !contentEl) return;
  previousFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  previousOverflow = document.body.style.overflow;
  contentEl.innerHTML = html;
  const dialog = overlay.querySelector<HTMLElement>(".modal");
  const title = contentEl.querySelector<HTMLElement>(".pkg-modal__name");
  dialog?.setAttribute("aria-label", title?.textContent?.trim() || "Detalhes do pacote");
  overlay.removeAttribute("inert");
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  afterOpen?.(contentEl);
  requestAnimationFrame(() => {
    overlay?.querySelector<HTMLElement>("#modalClose")?.focus();
  });
}

export function closeModal(): void {
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  document.body.style.overflow = previousOverflow;
  previousFocus?.focus();
  previousFocus = null;
}
