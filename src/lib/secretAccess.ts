// Acesso secreto ao painel (sem link visível no site):
//  1) no teclado: digitar a palavra secreta em qualquer lugar (fora de campos).
//  2) no clique/toque: tocar 5x rápido na marca "AMV Web Studio" da hero.
//
// A palavra NÃO aparece no código: guardamos só o hash (SHA-256) dela e
// comparamos com o hash do que foi digitado. De qualquer forma, o que protege
// os dados é a SENHA do painel (no servidor) — isto aqui só esconde a "porta".

const SECRET_HASH = "f6e65d43cd616d003063c5be8ff95a5525bdd3e41963bbbccfc6fe6da5cd9e31";
const SECRET_LEN = 9;
const TAP_TARGET = ".hero__brand, [data-secret]";
const TAP_COUNT = 5;
const TAP_WINDOW = 700; // ms entre toques

async function sha256(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function initSecretAccess(): void {
  const go = () => {
    window.location.href = "/dashboard";
  };

  // 1) sequência de teclado (compara o HASH do que foi digitado)
  let buf = "";
  window.addEventListener("keydown", (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key && e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-SECRET_LEN);
      if (buf.length === SECRET_LEN && crypto?.subtle) {
        sha256(buf)
          .then((h) => {
            if (h === SECRET_HASH) go();
          })
          .catch(() => {});
      }
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
