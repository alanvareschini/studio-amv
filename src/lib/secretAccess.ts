// Acesso secreto ao painel (sem link visível no site):
//  1) no teclado: digitar a palavra secreta em qualquer lugar (fora de campos).
//  2) no clique/toque: tocar 5x rápido na marca "AMV Web Studio" da hero.
// Um visitante comum não descobre; o dono entra fácil.

const SECRET_WORD = "amvpainel"; // digite em qualquer lugar do site
const TAP_TARGET = ".hero__brand, [data-secret]";
const TAP_COUNT = 5;
const TAP_WINDOW = 700; // ms entre toques

export function initSecretAccess(): void {
  const go = () => {
    window.location.href = "/dashboard";
  };

  // 1) sequência de teclado
  let buf = "";
  window.addEventListener("keydown", (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key && e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-SECRET_WORD.length);
      if (buf === SECRET_WORD) go();
    }
  });

  // 2) toques rápidos na marca
  let taps = 0;
  let last = 0;
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest(TAP_TARGET);
      const now = Date.now();
      if (el && now - last < TAP_WINDOW) taps += 1;
      else if (el) taps = 1;
      else taps = 0;
      last = now;
      if (taps >= TAP_COUNT) {
        taps = 0;
        go();
      }
    },
    { passive: true }
  );
}
