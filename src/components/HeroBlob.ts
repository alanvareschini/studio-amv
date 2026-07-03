// Blob dia/noite interativo (adaptado de um pen): sol e lua orbitam dentro de um
// blob que "respira"; o mar muda de cor; clicar dá um impulso na órbita.
export function HeroBlob(): string {
  return /* html */ `
    <div id="wrap" class="hero-blob" role="button" tabindex="0" aria-label="Alternar dia e noite">
      <div id="blobOuter">
        <div id="blobFill"></div>
        <div class="cel" id="sun"></div>
        <div class="cel" id="moon"></div>
        <svg id="wave" viewBox="0 0 264 132" preserveAspectRatio="none" aria-hidden="true">
          <path id="w1" d="M0 58 Q 66 40 132 58 T 264 58 V132 H0 Z" fill="#1e3a5f"/>
          <path id="w2" d="M0 74 Q 66 58 132 74 T 264 74 V132 H0 Z" fill="#2a4f78"/>
          <path id="w3" d="M0 90 Q 66 74 132 90 T 264 90 V132 H0 Z" fill="#3a6490"/>
        </svg>
      </div>
      <div class="label-wrap">
        <span class="lbl" id="lNight">NOITE</span>
        <span class="lbl" id="lDay">DIA</span>
      </div>
    </div>`;
}

export function initHeroBlob(): void {
  const blobFill = document.getElementById("blobFill");
  const sun = document.getElementById("sun");
  const moon = document.getElementById("moon");
  const lN = document.getElementById("lNight");
  const lD = document.getElementById("lDay");
  const wrap = document.getElementById("wrap");
  const w1 = document.getElementById("w1");
  const w2 = document.getElementById("w2");
  const w3 = document.getElementById("w3");
  if (!blobFill || !sun || !moon || !lN || !lD || !wrap || !w1 || !w2 || !w3) return;

  const WAVE = [
    { night: "#1e3a5f", day: "#3aa0c4" },
    { night: "#2a4f78", day: "#6dc0d8" },
    { night: "#3a6490", day: "#a8dde8" },
  ];

  const R = 68;

  let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  let targetAngle = theme === "light" ? 0 : Math.PI; // 0 = dia (claro), π = noite (escuro)
  let angle = targetAngle;
  let lastTs: number | null = null;
  let lastShadowIsDaytime = theme === "light";

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const hexRgb = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const mixColor = (h1: string, h2: string, t: number) => {
    const [r1, g1, b1] = hexRgb(h1);
    const [r2, g2, b2] = hexRgb(h2);
    return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
  };

  function apply(a: number) {
    const cp = (1 + Math.cos(a)) / 2; // 1 = dia, 0 = noite
    blobFill!.style.background = mixColor("#7730ec", "#fcce18", cp);

    const sx = R * Math.sin(a);
    const sy = -R * Math.cos(a);
    sun!.style.transform = `translate(${sx - 13}px, ${sy - 13}px)`;
    moon!.style.transform = `translate(${-sx - 12}px, ${-sy - 12}px)`;

    const HORIZON = 20, FADE = 22;
    sun!.style.opacity = String(Math.max(0, Math.min(1, (HORIZON + FADE - sy) / FADE)));
    moon!.style.opacity = String(Math.max(0, Math.min(1, (HORIZON + FADE + sy) / FADE)));

    lN!.style.opacity = String(1 - cp);
    lD!.style.opacity = String(cp);

    w1!.setAttribute("fill", mixColor(WAVE[0].night, WAVE[0].day, cp));
    w2!.setAttribute("fill", mixColor(WAVE[1].night, WAVE[1].day, cp));
    w3!.setAttribute("fill", mixColor(WAVE[2].night, WAVE[2].day, cp));

    const isDaytime = cp > 0.5;
    if (isDaytime !== lastShadowIsDaytime) {
      lastShadowIsDaytime = isDaytime;
      wrap!.style.filter = isDaytime
        ? "drop-shadow(0 6px 28px rgba(252,206,24,0.42))"
        : "drop-shadow(0 6px 28px rgba(119,48,236,0.38))";
    }
  }

  function loop(ts: number) {
    if (lastTs !== null) {
      const dt = Math.min(ts - lastTs, 50);
      // suaviza a órbita até o alvo (dia/noite) conforme o tema
      angle += (targetAngle - angle) * (1 - Math.pow(0.986, dt));
      apply(angle);
    }
    lastTs = ts;
    requestAnimationFrame(loop);
  }

  const toggle = () => {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* ignora */
    }
    targetAngle = theme === "light" ? 0 : Math.PI;
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  };
  wrap.addEventListener("click", toggle);
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  apply(angle);
  requestAnimationFrame(loop);
}
