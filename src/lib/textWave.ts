type IglooGlyph = {
  el: HTMLElement;
  energy: number;
  target: number;
  seed: number;
};

const IGLOO_RADIUS = 132;
const IGLOO_RAF_ALPHA = 0.28;
const IGLOO_TARGET_DECAY = 0.78;
const IGLOO_IDLE_CUTOFF = 0.012;

// Texto interativo leve. O modo padrao usa uma camada CSS simples; a variante
// .txt-wave--igloo transforma o texto em glifos estaveis com onda de brilho.
export function initTextWave(selector: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const items: HTMLElement[] = [];
  const iglooItems = new Set<HTMLElement>();
  const iglooGlyphs = new WeakMap<HTMLElement, IglooGlyph[]>();
  let activeTouchItem: HTMLElement | null = null;
  let isTouchActive = false;
  let touchX = 0;
  let touchY = 0;
  let loopRaf = 0;
  let iglooRaf = 0;

  const seededValue = (value: number) => {
    const result = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return result - Math.floor(result);
  };

  const updateFromPoint = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    const mx = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const my = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${my.toFixed(1)}%`);
  };

  const isBlocked = (el: HTMLElement) => Boolean(el.closest(".pkg--physics-active"));

  const renderIgloo = () => {
    let keepAlive = false;

    iglooItems.forEach((item) => {
      const glyphs = iglooGlyphs.get(item) ?? [];

      glyphs.forEach((glyph) => {
        glyph.energy += (glyph.target - glyph.energy) * IGLOO_RAF_ALPHA;
        glyph.target *= IGLOO_TARGET_DECAY;

        const flicker = 0.9 + Math.sin(performance.now() * 0.016 + glyph.seed * 9.7) * 0.1;
        const energy = Math.max(0, Math.min(1, glyph.energy * flicker));

        glyph.el.style.setProperty("--igloo-a", energy.toFixed(3));
        glyph.el.style.setProperty("--igloo-glow", (energy * 18).toFixed(2));
        glyph.el.style.setProperty("--igloo-blur", (energy * 0.46).toFixed(2));

        if (glyph.energy > IGLOO_IDLE_CUTOFF || glyph.target > IGLOO_IDLE_CUTOFF) {
          keepAlive = true;
        }
      });
    });

    iglooRaf = keepAlive ? requestAnimationFrame(renderIgloo) : 0;
  };

  const wakeIgloo = () => {
    if (!iglooRaf) iglooRaf = requestAnimationFrame(renderIgloo);
  };

  const feedIgloo = (el: HTMLElement, clientX: number, clientY: number) => {
    const glyphs = iglooGlyphs.get(el);
    if (!glyphs?.length) return;

    glyphs.forEach((glyph) => {
      const rect = glyph.el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const x = rect.left + rect.width * 0.5;
      const y = rect.top + rect.height * 0.54;
      const distance = Math.hypot(clientX - x, clientY - y);
      const amount = Math.max(0, 1 - distance / IGLOO_RADIUS);

      if (amount > 0) {
        const rim = Math.pow(amount, 2.4);
        glyph.target = Math.max(glyph.target, rim);
      }
    });

    wakeIgloo();
  };

  const wrapTextNode = (node: Text, glyphs: IglooGlyph[], seedOffset: number) => {
    const text = node.textContent ?? "";
    const fragment = document.createDocumentFragment();
    let index = seedOffset;

    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;

      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        index += part.length;
        return;
      }

      const word = document.createElement("span");
      word.className = "igloo-word";

      [...part].forEach((char) => {
        const glyph = document.createElement("span");
        glyph.className = "igloo-glyph";
        glyph.textContent = char;
        glyph.dataset.char = char;
        glyph.style.setProperty("--igloo-a", "0");
        glyph.style.setProperty("--igloo-seed", seededValue(index).toFixed(4));
        word.append(glyph);
        glyphs.push({ el: glyph, energy: 0, target: 0, seed: seededValue(index) });
        index += 1;
      });

      fragment.append(word);
    });

    node.replaceWith(fragment);
    return index;
  };

  const setupIglooText = (el: HTMLElement) => {
    if (!el.classList.contains("txt-wave--igloo") || el.dataset.iglooGlyphs === "1") {
      return;
    }

    const glyphs: IglooGlyph[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let seedOffset = 1;

    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if ((current.textContent ?? "").trim()) textNodes.push(current);
    }

    textNodes.forEach((node) => {
      seedOffset = wrapTextNode(node, glyphs, seedOffset) ?? seedOffset;
    });

    el.dataset.iglooGlyphs = "1";
    iglooItems.add(el);
    iglooGlyphs.set(el, glyphs);
  };

  const findTouchItem = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const direct = hit?.closest<HTMLElement>(selector);
    if (direct?.classList.contains("txt-wave") && !isBlocked(direct)) return direct;

    return (
      items.find((item) => {
        if (isBlocked(item)) return false;
        const r = item.getBoundingClientRect();
        return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
      }) ?? null
    );
  };

  const updateTouchTarget = () => {
    const item = findTouchItem(touchX, touchY);
    if (!item) {
      activeTouchItem?.classList.remove("is-touching");
      activeTouchItem = null;
      return;
    }

    if (activeTouchItem && activeTouchItem !== item) {
      activeTouchItem.classList.remove("is-touching");
    }

    activeTouchItem = item;
    updateFromPoint(item, touchX, touchY);
    if (iglooItems.has(item)) feedIgloo(item, touchX, touchY);
    item.classList.add("is-touching");
  };

  const loopTouch = () => {
    if (!isTouchActive) return;
    updateTouchTarget();
    loopRaf = requestAnimationFrame(loopTouch);
  };

  const startTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
    isTouchActive = true;
    if (!loopRaf) loopRaf = requestAnimationFrame(loopTouch);
  };

  const moveTouch = (touch: Touch) => {
    touchX = touch.clientX;
    touchY = touch.clientY;
  };

  const settleTouch = () => {
    isTouchActive = false;
    cancelAnimationFrame(loopRaf);
    loopRaf = 0;
    activeTouchItem?.classList.remove("is-touching");
    activeTouchItem = null;
  };

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;

    el.setAttribute("data-text", text);
    el.classList.add("txt-wave");
    setupIglooText(el);
    if (!hasHover) el.classList.add("txt-wave--touch");
    items.push(el);

    el.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse" && !hasHover) return;
        if (isBlocked(el)) {
          el.classList.remove("is-touching");
          return;
        }
        updateFromPoint(el, e.clientX, e.clientY);
        if (iglooItems.has(el)) feedIgloo(el, e.clientX, e.clientY);
      },
      { passive: true }
    );
  });

  if (!items.length) return;

  window.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (touch) startTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch) moveTouch(touch);
    },
    { passive: true }
  );

  window.addEventListener("touchend", settleTouch, { passive: true });
  window.addEventListener("touchcancel", settleTouch, { passive: true });
}
