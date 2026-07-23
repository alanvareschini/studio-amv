// Blob dia/noite interativo: sol e lua orbitam dentro do blob; o mar muda de
// cor; clicar alterna tema com a mesma coreografia.
export function HeroBlob(extraClass = ""): string {
  return /* html */ `
    <div class="hero-blob ${extraClass}" role="button" tabindex="0" aria-label="Alternar dia e noite">
      <div class="blobOuter">
        <div class="blobClip">
          <div class="blobFill"></div>
          <svg class="wave" viewBox="0 0 264 132" preserveAspectRatio="none" aria-hidden="true">
            <path class="waveOne" d="M0 58 Q 66 40 132 58 T 264 58 V132 H0 Z" fill="#1e3a5f"/>
            <path class="waveTwo" d="M0 74 Q 66 58 132 74 T 264 74 V132 H0 Z" fill="#2a4f78"/>
            <path class="waveThree" d="M0 90 Q 66 74 132 90 T 264 90 V132 H0 Z" fill="#3a6490"/>
          </svg>
        </div>
        <div class="cel sun"></div>
        <div class="cel moon"></div>
      </div>
      <div class="label-wrap">
        <span class="lbl labelNight">NOITE</span>
        <span class="lbl labelDay">DIA</span>
      </div>
    </div>`;
}

export function initHeroBlob(): void {
  document.querySelectorAll<HTMLElement>(".hero-blob").forEach((wrap) => {
    if (wrap.dataset.ready === "1") return;
    wrap.dataset.ready = "1";

    const blobFill = wrap.querySelector<HTMLElement>(".blobFill");
    const sun = wrap.querySelector<HTMLElement>(".sun");
    const moon = wrap.querySelector<HTMLElement>(".moon");
    const lN = wrap.querySelector<HTMLElement>(".labelNight");
    const lD = wrap.querySelector<HTMLElement>(".labelDay");
    const w1 = wrap.querySelector<SVGPathElement>(".waveOne");
    const w2 = wrap.querySelector<SVGPathElement>(".waveTwo");
    const w3 = wrap.querySelector<SVGPathElement>(".waveThree");
    if (!blobFill || !sun || !moon || !lN || !lD || !w1 || !w2 || !w3) return;

    const wave = [
      { night: "#1e3a5f", day: "#3aa0c4" },
      { night: "#2a4f78", day: "#6dc0d8" },
      { night: "#3a6490", day: "#a8dde8" },
    ];

    const isCompactMenu = () =>
      wrap.classList.contains("hero-blob--menu") &&
      window.matchMedia("(max-width: 1024px), (pointer: coarse)").matches;
    let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    let targetAngle = theme === "light" ? 0 : Math.PI;
    let angle = targetAngle;
    let lastTs: number | null = null;
    let lastShadowIsDaytime = theme === "light";
    let raf = 0;

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

    const apply = (a: number) => {
      const cp = (1 + Math.cos(a)) / 2; // 1 = dia, 0 = noite
      blobFill.style.background = mixColor("#7730ec", "#fcce18", cp);

      const compact = isCompactMenu();
      const radius = compact ? 19 : 68;
      const sunOffset = compact ? 9 : 13;
      const moonOffset = compact ? 9 : 12;
      const horizon = compact ? 4 : 20;
      const fade = compact ? 18 : 22;
      const sx = radius * Math.sin(a);
      const sy = -radius * Math.cos(a);
      sun.style.transform = `translate(${sx - sunOffset}px, ${sy - sunOffset}px)`;
      moon.style.transform = `translate(${-sx - moonOffset}px, ${-sy - moonOffset}px)`;

      sun.style.opacity = String(Math.max(0, Math.min(1, (horizon + fade - sy) / fade)));
      moon.style.opacity = String(Math.max(0, Math.min(1, (horizon + fade + sy) / fade)));

      lN.style.opacity = String(1 - cp);
      lD.style.opacity = String(cp);

      w1.setAttribute("fill", mixColor(wave[0].night, wave[0].day, cp));
      w2.setAttribute("fill", mixColor(wave[1].night, wave[1].day, cp));
      w3.setAttribute("fill", mixColor(wave[2].night, wave[2].day, cp));

      const isDaytime = cp > 0.5;
      if (isDaytime !== lastShadowIsDaytime) {
        lastShadowIsDaytime = isDaytime;
        wrap.style.filter = isDaytime
          ? "drop-shadow(0 6px 28px rgba(252,206,24,0.42))"
          : "drop-shadow(0 6px 28px rgba(119,48,236,0.38))";
      }
    };

    const syncTheme = (nextTheme: "light" | "dark") => {
      theme = nextTheme;
      targetAngle = theme === "light" ? 0 : Math.PI;
    };

    const loop = (ts: number) => {
      raf = 0;
      // aba oculta: não anima (economiza CPU/bateria); ao voltar não dá salto
      if (document.hidden) {
        lastTs = null;
        return;
      }
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;
      angle += (targetAngle - angle) * (1 - Math.pow(0.986, dt));
      if (Math.abs(targetAngle - angle) < 0.0005) {
        angle = targetAngle;
        apply(angle);
        lastTs = null;
        return;
      }
      apply(angle);
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (raf || document.hidden) return;
      lastTs = null;
      raf = requestAnimationFrame(loop);
    };

    const toggle = () => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem("theme", nextTheme);
      } catch (e) {
        /* ignora */
      }
      syncTheme(nextTheme);
      startLoop();
      window.dispatchEvent(new CustomEvent("themechange", { detail: nextTheme }));
    };

    wrap.addEventListener("click", toggle);
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
    window.addEventListener("themechange", ((e: CustomEvent<"light" | "dark">) => {
      syncTheme(e.detail === "light" ? "light" : "dark");
      startLoop();
    }) as EventListener);
    window.addEventListener("resize", () => apply(angle), { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Math.abs(targetAngle - angle) >= 0.0005) startLoop();
    });

    apply(angle);
  });
}
