// Compact day/night control. The complete orbit lives inside one SVG viewBox,
// so neither celestial body can be clipped by narrow mobile compositors.
export function HeroBlob(extraClass = ""): string {
  return /* html */ `
    <div class="hero-blob ${extraClass}" role="button" tabindex="0" aria-label="Alternar modo claro e escuro">
      <svg class="theme-orbit" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <clipPath id="themeOrbitClip">
            <circle cx="32" cy="32" r="28"></circle>
          </clipPath>
          <linearGradient id="themeOrbitRim" x1="8" y1="8" x2="56" y2="56">
            <stop offset="0" stop-color="#a855f7"></stop>
            <stop offset="0.52" stop-color="#22d3ee"></stop>
            <stop offset="1" stop-color="#00ff88"></stop>
          </linearGradient>
        </defs>

        <g clip-path="url(#themeOrbitClip)">
          <circle class="theme-orbit__sky" cx="32" cy="32" r="28" fill="#17213d"></circle>

          <g class="theme-orbit__celestials">
            <g class="theme-orbit__sun" transform="translate(32 14)">
              <g class="theme-orbit__sun-rays">
                <path d="M0-10V-8M0 8V10M-10 0H-8M8 0H10M-7-7-5.6-5.6M7 7 5.6 5.6M7-7 5.6-5.6M-7 7-5.6 5.6"></path>
              </g>
              <circle r="6.2" fill="#ffe45e"></circle>
              <circle cx="-2" cy="-2" r="2.2" fill="#fff8bf" opacity="0.9"></circle>
            </g>

            <g class="theme-orbit__moon" transform="translate(32 50)">
              <path d="M2.2-7A7.3 7.3 0 1 0 6.8 4.7 6.1 6.1 0 0 1 2.2-7Z" fill="#eef4ff"></path>
              <circle cx="-2.1" cy="1.5" r="1.1" fill="#b9c5dd" opacity="0.58"></circle>
            </g>
          </g>

          <path class="theme-orbit__wave theme-orbit__wave--back" d="M-6 39Q9 33 24 39T54 39T84 39V70H-6Z"></path>
          <path class="theme-orbit__wave theme-orbit__wave--mid" d="M-12 46Q3 40 18 46T48 46T78 46V70H-12Z"></path>
          <path class="theme-orbit__wave theme-orbit__wave--front" d="M-4 52Q11 47 26 52T56 52T86 52V70H-4Z"></path>
        </g>

        <circle class="theme-orbit__rim" cx="32" cy="32" r="28.5" fill="none" stroke="url(#themeOrbitRim)"></circle>
      </svg>
    </div>`;
}

export function initHeroBlob(): void {
  document.querySelectorAll<HTMLElement>(".hero-blob").forEach((wrap) => {
    if (wrap.dataset.ready === "1") return;
    wrap.dataset.ready = "1";

    const sky = wrap.querySelector<SVGCircleElement>(".theme-orbit__sky");
    const celestials = wrap.querySelector<SVGGElement>(".theme-orbit__celestials");
    const sun = wrap.querySelector<SVGGElement>(".theme-orbit__sun");
    const moon = wrap.querySelector<SVGGElement>(".theme-orbit__moon");
    const waveBack = wrap.querySelector<SVGPathElement>(".theme-orbit__wave--back");
    const waveMid = wrap.querySelector<SVGPathElement>(".theme-orbit__wave--mid");
    const waveFront = wrap.querySelector<SVGPathElement>(".theme-orbit__wave--front");
    if (!sky || !celestials || !sun || !moon || !waveBack || !waveMid || !waveFront) return;

    const waves = [
      { element: waveBack, night: "#1e3a5f", day: "#3aa0c4" },
      { element: waveMid, night: "#2a4f78", day: "#6dc0d8" },
      { element: waveFront, night: "#3a6490", day: "#a8dde8" },
    ];
    let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    let targetAngle = theme === "light" ? 0 : Math.PI;
    let angle = targetAngle;
    let lastTs: number | null = null;
    let lastShadowIsDaytime = theme === "light";
    let raf = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const hexRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const mixColor = (first: string, second: string, amount: number) => {
      const [r1, g1, b1] = hexRgb(first);
      const [r2, g2, b2] = hexRgb(second);
      return `rgb(${Math.round(lerp(r1, r2, amount))},${Math.round(lerp(g1, g2, amount))},${Math.round(lerp(b1, b2, amount))})`;
    };

    const apply = (currentAngle: number) => {
      const daytime = (1 + Math.cos(currentAngle)) / 2;
      const degrees = (currentAngle * 180) / Math.PI;

      celestials.setAttribute("transform", `rotate(${degrees.toFixed(2)} 32 32)`);
      sky.setAttribute("fill", mixColor("#111a34", "#73cde5", daytime));
      sun.style.opacity = daytime.toFixed(3);
      moon.style.opacity = (1 - daytime).toFixed(3);
      waves.forEach(({ element, night, day }) => {
        element.setAttribute("fill", mixColor(night, day, daytime));
      });

      const isDaytime = daytime > 0.5;
      if (isDaytime !== lastShadowIsDaytime) {
        lastShadowIsDaytime = isDaytime;
        wrap.style.setProperty(
          "--theme-orbit-glow",
          isDaytime ? "rgba(252, 206, 24, 0.34)" : "rgba(119, 48, 236, 0.34)",
        );
      }
    };

    const syncTheme = (nextTheme: "light" | "dark") => {
      theme = nextTheme;
      targetAngle = theme === "light" ? 0 : Math.PI;
    };

    const loop = (timestamp: number) => {
      raf = 0;
      if (document.hidden) {
        lastTs = null;
        return;
      }
      if (lastTs === null) lastTs = timestamp;
      const delta = Math.min(timestamp - lastTs, 50);
      lastTs = timestamp;
      angle += (targetAngle - angle) * (1 - Math.pow(0.986, delta));

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
      document
        .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.setAttribute("content", nextTheme === "light" ? "#eef1f8" : "#070a12");
      document
        .querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
        ?.setAttribute("content", nextTheme === "light" ? "only light" : "dark");
      try {
        localStorage.setItem("theme", nextTheme);
      } catch {
        // Theme still changes when storage is unavailable.
      }
      syncTheme(nextTheme);
      startLoop();
      window.dispatchEvent(new CustomEvent("themechange", { detail: nextTheme }));
    };

    wrap.addEventListener("click", toggle);
    wrap.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
    window.addEventListener("themechange", ((event: CustomEvent<"light" | "dark">) => {
      syncTheme(event.detail === "light" ? "light" : "dark");
      startLoop();
    }) as EventListener);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Math.abs(targetAngle - angle) >= 0.0005) startLoop();
    });

    wrap.style.setProperty(
      "--theme-orbit-glow",
      theme === "light" ? "rgba(252, 206, 24, 0.34)" : "rgba(119, 48, 236, 0.34)",
    );
    apply(angle);
  });
}
