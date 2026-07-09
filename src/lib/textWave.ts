type IglooGlyph = {
  el: HTMLElement;
  energy: number;
  heat: number;
  target: number;
  heatTarget: number;
  seed: number;
};

type IglooField = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  field: Float32Array;
  nextField: Float32Array;
  rim: Float32Array;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  inside: boolean;
  targetVelocity: number;
  velocity: number;
  lastMove: number;
  resizedAt: number;
};

const IGLOO_RADIUS = 132;
const IGLOO_RAF_ALPHA = 0.28;
const IGLOO_TARGET_DECAY = 0.78;
const IGLOO_IDLE_CUTOFF = 0.012;
const IGLOO_FIELD_SCALE = 5;
const IGLOO_FIELD_DAMPING = 0.985;

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
  const iglooFields = new WeakMap<HTMLElement, IglooField>();
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

  const smoothstep = (minimum: number, maximum: number, value: number) => {
    const amount = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
    return amount * amount * (3 - 2 * amount);
  };

  const distanceToSegment = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ) => {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby || 1;
    const amount = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
    return Math.hypot(px - (ax + abx * amount), py - (ay + aby * amount));
  };

  const updateFromPoint = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    const mx = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const my = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${my.toFixed(1)}%`);
  };

  const isBlocked = (el: HTMLElement) => Boolean(el.closest(".pkg--physics-active"));

  const createIglooField = (el: HTMLElement): IglooField | null => {
    const canvas = document.createElement("canvas");
    canvas.className = "igloo-heat-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return null;

    el.append(canvas);

    const state: IglooField = {
      canvas,
      context,
      width: 2,
      height: 2,
      field: new Float32Array(4),
      nextField: new Float32Array(4),
      rim: new Float32Array(4),
      x: 0.5,
      y: 0.5,
      previousX: 0.5,
      previousY: 0.5,
      inside: false,
      targetVelocity: 0,
      velocity: 0,
      lastMove: 0,
      resizedAt: 0,
    };

    iglooFields.set(el, state);
    return state;
  };

  const resizeIglooField = (el: HTMLElement, state: IglooField) => {
    const bounds = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(12, Math.round(bounds.width / IGLOO_FIELD_SCALE));
    const height = Math.max(8, Math.round(bounds.height / IGLOO_FIELD_SCALE));
    const now = performance.now();

    if (state.width === width && state.height === height && now - state.resizedAt < 500) return;

    state.width = width;
    state.height = height;
    state.field = new Float32Array(width * height);
    state.nextField = new Float32Array(width * height);
    state.rim = new Float32Array(width * height);
    state.canvas.width = Math.round(bounds.width * dpr);
    state.canvas.height = Math.round(bounds.height * dpr);
    state.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.resizedAt = now;
  };

  const feedIglooField = (el: HTMLElement, clientX: number, clientY: number) => {
    const state = iglooFields.get(el);
    if (!state) return;

    resizeIglooField(el, state);
    const bounds = el.getBoundingClientRect();
    state.x = Math.max(0, Math.min(1, (clientX - bounds.left) / Math.max(bounds.width, 1)));
    state.y = Math.max(0, Math.min(1, (clientY - bounds.top) / Math.max(bounds.height, 1)));
    state.inside = true;
  };

  const updateIglooField = (state: IglooField, time: number) => {
    const { width, height } = state;
    let distance = Math.hypot(state.x - state.previousX, state.y - state.previousY);
    if (distance > 0) state.lastMove = time;

    if (time - state.lastMove > 150 || !state.inside || distance > 0.3) {
      state.previousX = state.x;
      state.previousY = state.y;
      state.targetVelocity = 0;
      distance = 0;
    }

    state.targetVelocity = Math.max(0, Math.min(1, (state.targetVelocity + distance * 6) * 0.88));
    const easedVelocity = 1 - Math.pow(1 - state.targetVelocity, 4);
    state.velocity += (easedVelocity - state.velocity) * 0.1;
    const radius = 0.05 * smoothstep(0.1, 1, state.velocity) * height;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const drift = Math.sin(x * 0.093 + y * 0.071 + time * 0.00072) > 0 ? 1 : -1;
        const sampleX = Math.max(1, Math.min(width - 2, x + drift));
        const previous = state.field[y * width + sampleX];
        let nextValue = Math.max(
          state.field[index - 1],
          state.field[index + 1],
          state.field[index - width],
          state.field[index + width]
        );

        if (state.inside && radius > 0.1) {
          const lineDistance = distanceToSegment(
            x,
            y,
            state.previousX * width,
            state.previousY * height,
            state.x * width,
            state.y * height
          );
          nextValue += Math.pow(Math.max(0, 1 - lineDistance / radius), 3);
        }

        nextValue = Math.min(1, Math.max(previous * 0.12, nextValue) * IGLOO_FIELD_DAMPING);
        state.nextField[index] = nextValue;
        state.rim[index] = nextValue - state.field[index];
      }
    }

    state.field.set(state.nextField);
    state.nextField.fill(0);
    state.previousX = state.x;
    state.previousY = state.y;
  };

  const drawIglooField = (el: HTMLElement, state: IglooField) => {
    const bounds = el.getBoundingClientRect();
    const context = state.context;
    const cellW = bounds.width / state.width;
    const cellH = bounds.height / state.height;
    let active = false;

    context.clearRect(0, 0, bounds.width, bounds.height);
    context.save();
    context.globalCompositeOperation = "screen";

    for (let y = 1; y < state.height - 1; y += 1) {
      for (let x = 1; x < state.width - 1; x += 1) {
        const index = y * state.width + x;
        const intensity = state.field[index];
        const rim = Math.max(0, Math.min(1, state.rim[index] * 18));
        const alpha = Math.max(rim * 0.48, smoothstep(0.55, 0.82, intensity) * 0.14);

        if (alpha < 0.012) continue;
        active = true;

        const px = x * cellW;
        const py = y * cellH;
        const radius = Math.max(cellW, cellH) * (2.4 + rim * 4.2);
        const gradient = context.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`);
        gradient.addColorStop(0.36, `rgba(205,225,245,${(alpha * 0.42).toFixed(3)})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.fillRect(px - radius, py - radius, radius * 2, radius * 2);
      }
    }

    context.restore();
    return active;
  };

  const renderIgloo = () => {
    let keepAlive = false;

    iglooItems.forEach((item) => {
      const glyphs = iglooGlyphs.get(item) ?? [];
      const field = iglooFields.get(item);
      let fieldActive = false;

      if (field) {
        resizeIglooField(item, field);
        updateIglooField(field, performance.now());
        fieldActive = drawIglooField(item, field);
      }

      glyphs.forEach((glyph) => {
        glyph.energy += (glyph.target - glyph.energy) * IGLOO_RAF_ALPHA;
        glyph.heat += (glyph.heatTarget - glyph.heat) * 0.22;
        glyph.target *= IGLOO_TARGET_DECAY;
        glyph.heatTarget *= 0.86;

        const flicker = 0.9 + Math.sin(performance.now() * 0.016 + glyph.seed * 9.7) * 0.1;
        const energy = Math.max(0, Math.min(1, glyph.energy * flicker));
        const heat = Math.max(0, Math.min(1, glyph.heat));
        const shimmer = Math.sin(performance.now() * 0.011 + glyph.seed * 18.4);

        glyph.el.style.setProperty("--igloo-a", energy.toFixed(3));
        glyph.el.style.setProperty("--igloo-glow", (energy * 18).toFixed(2));
        glyph.el.style.setProperty("--igloo-blur", (energy * 0.46).toFixed(2));
        glyph.el.style.setProperty("--igloo-heat", heat.toFixed(3));
        glyph.el.style.setProperty("--igloo-shift-x", (shimmer * heat * 1.8).toFixed(2));
        glyph.el.style.setProperty("--igloo-shift-y", ((1 - Math.abs(shimmer)) * heat * -1.1).toFixed(2));

        if (
          glyph.energy > IGLOO_IDLE_CUTOFF ||
          glyph.target > IGLOO_IDLE_CUTOFF ||
          glyph.heat > IGLOO_IDLE_CUTOFF ||
          glyph.heatTarget > IGLOO_IDLE_CUTOFF ||
          fieldActive
        ) {
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
    feedIglooField(el, clientX, clientY);
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
        const heatRing = Math.max(0, 1 - Math.abs(distance - 42) / 78);
        glyph.target = Math.max(glyph.target, rim);
        glyph.heatTarget = Math.max(glyph.heatTarget, Math.pow(heatRing, 1.35) * 0.9);
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
        glyph.style.setProperty("--igloo-heat", "0");
        glyph.style.setProperty("--igloo-seed", seededValue(index).toFixed(4));
        word.append(glyph);
        glyphs.push({
          el: glyph,
          energy: 0,
          heat: 0,
          target: 0,
          heatTarget: 0,
          seed: seededValue(index),
        });
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
    createIglooField(el);
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
