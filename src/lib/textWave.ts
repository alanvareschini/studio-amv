type IglooGlyph = {
  el: HTMLElement;
  light: number;
};

type IglooSimulation = {
  width: number;
  height: number;
  field: Float32Array;
  nextField: Float32Array;
  flowX: Float32Array;
  flowY: Float32Array;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  targetVelocity: number;
  velocity: number;
  lastMove: number;
  lastStep: number;
};

const FIELD_SCALE = 5;
const FIELD_DAMPING = 0.985;
const FIELD_STEP_MS = 15;
const LIGHT_START = 0.6;
const LIGHT_END = 0.8;

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));

const smoothstep = (minimum: number, maximum: number, value: number) => {
  const amount = clamp((value - minimum) / (maximum - minimum));
  return amount * amount * (3 - 2 * amount);
};

const hash = (x: number, y: number, seed: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
};

const valueNoise = (x: number, y: number, seed: number) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(0, 1, x - x0);
  const ty = smoothstep(0, 1, y - y0);
  const top = hash(x0, y0, seed) * (1 - tx) + hash(x0 + 1, y0, seed) * tx;
  const bottom = hash(x0, y0 + 1, seed) * (1 - tx) + hash(x0 + 1, y0 + 1, seed) * tx;
  return top * (1 - ty) + bottom * ty;
};

const sampleField = (
  field: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
) => {
  const safeX = clamp(x, 0, width - 1);
  const safeY = clamp(y, 0, height - 1);
  const x0 = Math.floor(safeX);
  const y0 = Math.floor(safeY);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = safeX - x0;
  const ty = safeY - y0;
  const top = field[y0 * width + x0] * (1 - tx) + field[y0 * width + x1] * tx;
  const bottom = field[y1 * width + x0] * (1 - tx) + field[y1 * width + x1] * tx;
  return top * (1 - ty) + bottom * ty;
};

const distanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  aspect: number,
) => {
  const pointX = (px - ax) * aspect;
  const pointY = py - ay;
  const segmentX = (bx - ax) * aspect;
  const segmentY = by - ay;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY || 1;
  const amount = clamp((pointX * segmentX + pointY * segmentY) / lengthSquared);
  return Math.hypot(pointX - segmentX * amount, pointY - segmentY * amount);
};

function initIglooWave(elements: HTMLElement[]): void {
  if (!elements.length) return;

  const glyphs: IglooGlyph[] = [];
  const simulation: IglooSimulation = {
    width: 2,
    height: 2,
    field: new Float32Array(4),
    nextField: new Float32Array(4),
    flowX: new Float32Array(4),
    flowY: new Float32Array(4),
    x: 0.5,
    y: 0.5,
    previousX: 0.5,
    previousY: 0.5,
    targetVelocity: 0,
    velocity: 0,
    lastMove: 0,
    lastStep: 0,
  };
  let raf = 0;

  const wrapTextNode = (node: Text) => {
    const text = node.textContent ?? "";
    const fragment = document.createDocumentFragment();

    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }

      const word = document.createElement("span");
      word.className = "igloo-word";
      [...part].forEach((character) => {
        const glyph = document.createElement("span");
        glyph.className = "igloo-glyph";
        glyph.textContent = character;
        glyph.dataset.char = character;
        glyph.style.setProperty("--igloo-light", "0");
        word.append(glyph);
        glyphs.push({ el: glyph, light: 0 });
      });
      fragment.append(word);
    });

    node.replaceWith(fragment);
  };

  elements.forEach((element) => {
    if (element.dataset.iglooGlyphs === "1") return;
    const originalText = (element.textContent ?? "").trim();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if ((current.textContent ?? "").trim()) textNodes.push(current);
    }

    textNodes.forEach(wrapTextNode);
    if (originalText && !element.hasAttribute("aria-label")) {
      element.setAttribute("aria-label", originalText);
    }
    element.dataset.iglooGlyphs = "1";
  });

  const resize = () => {
    const width = Math.max(2, Math.floor(window.innerWidth / FIELD_SCALE));
    const height = Math.max(2, Math.floor(window.innerHeight / FIELD_SCALE));
    if (width === simulation.width && height === simulation.height) return;

    simulation.width = width;
    simulation.height = height;
    simulation.field = new Float32Array(width * height);
    simulation.nextField = new Float32Array(width * height);
    simulation.flowX = new Float32Array(width * height);
    simulation.flowY = new Float32Array(width * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const noiseX = (x / width) * 24;
        const noiseY = (y / height) * 24;
        simulation.flowX[index] = valueNoise(noiseX, noiseY, 1) * 2 - 1;
        simulation.flowY[index] = valueNoise(noiseX, noiseY, 2) * 2 - 1;
      }
    }

    simulation.previousX = simulation.x;
    simulation.previousY = simulation.y;
    simulation.targetVelocity = 0;
    simulation.velocity = 0;
  };

  const updateSimulation = (time: number) => {
    const { width, height, field, nextField, flowX, flowY } = simulation;
    let pointerDistance = Math.hypot(
      simulation.x - simulation.previousX,
      simulation.y - simulation.previousY,
    );

    if (pointerDistance > 0) simulation.lastMove = time;
    if (time - simulation.lastMove > 150 || pointerDistance > 0.3) {
      simulation.previousX = simulation.x;
      simulation.previousY = simulation.y;
      simulation.targetVelocity = 0;
      pointerDistance = 0;
    }

    simulation.targetVelocity = clamp(
      (simulation.targetVelocity + pointerDistance * 6) * 0.88,
    );
    const easedVelocity = 1 - Math.pow(1 - simulation.targetVelocity, 5);
    simulation.velocity += (easedVelocity - simulation.velocity) * 0.1;
    const radius = 0.05 * smoothstep(0.1, 1, simulation.velocity);
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    let maximum = 0;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const advectedX = x + flowX[index];
        const advectedY = y + flowY[index];
        const previous = sampleField(field, width, height, advectedX, advectedY);
        let nextValue = Math.max(
          sampleField(field, width, height, advectedX - 1, advectedY),
          sampleField(field, width, height, advectedX + 1, advectedY),
          sampleField(field, width, height, advectedX, advectedY - 1),
          sampleField(field, width, height, advectedX, advectedY + 1),
        );

        if (radius > 0) {
          const distance = distanceToSegment(
            x / width,
            y / height,
            simulation.previousX,
            simulation.previousY,
            simulation.x,
            simulation.y,
            aspect,
          );
          nextValue += Math.pow(clamp(1 - distance / radius), 3);
        }

        nextValue = Math.min(1, Math.max(previous * 0.12, nextValue) * FIELD_DAMPING);
        nextField[index] = nextValue;
        maximum = Math.max(maximum, nextValue);
      }
    }

    simulation.field = nextField;
    simulation.nextField = field;
    simulation.nextField.fill(0);
    simulation.previousX = simulation.x;
    simulation.previousY = simulation.y;
    return maximum;
  };

  const updateGlyphs = () => {
    const { width, height, field } = simulation;
    glyphs.forEach((glyph) => {
      const bounds = glyph.el.getBoundingClientRect();
      let light = 0;

      if (
        bounds.bottom >= 0 &&
        bounds.top <= window.innerHeight &&
        bounds.right >= 0 &&
        bounds.left <= window.innerWidth
      ) {
        const x = ((bounds.left + bounds.width * 0.5) / window.innerWidth) * (width - 1);
        const y = ((bounds.top + bounds.height * 0.5) / window.innerHeight) * (height - 1);
        const intensity = sampleField(field, width, height, x, y);
        light = clamp((intensity - LIGHT_START) / (LIGHT_END - LIGHT_START));
      }

      if (Math.abs(light - glyph.light) > 0.004 || (light === 0 && glyph.light !== 0)) {
        glyph.el.style.setProperty("--igloo-light", light.toFixed(3));
        glyph.light = light;
      }
    });
  };

  const frame = (time: number) => {
    if (document.hidden) {
      raf = requestAnimationFrame(frame);
      return;
    }

    let maximum = 0;
    if (time - simulation.lastStep >= FIELD_STEP_MS) {
      simulation.lastStep = time;
      maximum = updateSimulation(time);
      updateGlyphs();
    }

    const active =
      maximum > 0.002 ||
      simulation.velocity > 0.002 ||
      simulation.targetVelocity > 0.002 ||
      time - simulation.lastMove < 180;
    raf = active ? requestAnimationFrame(frame) : 0;
  };

  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const setPointer = (clientX: number, clientY: number) => {
    simulation.x = clamp(clientX / Math.max(window.innerWidth, 1));
    simulation.y = clamp(clientY / Math.max(window.innerHeight, 1));
    wake();
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => setPointer(event.clientX, event.clientY),
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) setPointer(touch.clientX, touch.clientY);
    },
    { passive: true },
  );
}

// Brilho de texto leve. A variante .txt-wave--igloo usa a simulacao global
// observada no efeito original e mantem os glifos completamente estaveis.
export function initTextWave(selector: string): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hasHover = window.matchMedia("(hover: hover)").matches;
  const items: HTMLElement[] = [];
  let activeTouchItem: HTMLElement | null = null;
  let isTouchActive = false;
  let touchX = 0;
  let touchY = 0;
  let touchRaf = 0;

  const updateFromPoint = (element: HTMLElement, clientX: number, clientY: number) => {
    const bounds = element.getBoundingClientRect();
    const x = clamp((clientX - bounds.left) / Math.max(bounds.width, 1)) * 100;
    const y = clamp((clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
    element.style.setProperty("--mx", `${x.toFixed(1)}%`);
    element.style.setProperty("--my", `${y.toFixed(1)}%`);
  };

  const isBlocked = (element: HTMLElement) => Boolean(element.closest(".pkg--physics-active"));

  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    const text = (element.textContent || "").trim();
    if (!text) return;

    element.setAttribute("data-text", text);
    element.classList.add("txt-wave");
    if (!hasHover) element.classList.add("txt-wave--touch");
    items.push(element);

    element.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse" && !hasHover) return;
        if (isBlocked(element)) {
          element.classList.remove("is-touching");
          return;
        }
        updateFromPoint(element, event.clientX, event.clientY);
      },
      { passive: true },
    );
  });

  if (!items.length) return;
  initIglooWave(items.filter((element) => element.classList.contains("txt-wave--igloo")));

  const findTouchItem = (clientX: number, clientY: number) => {
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const direct = hit?.closest<HTMLElement>(selector);
    if (direct?.classList.contains("txt-wave") && !isBlocked(direct)) return direct;

    return (
      items.find((item) => {
        if (isBlocked(item)) return false;
        const bounds = item.getBoundingClientRect();
        return (
          clientX >= bounds.left &&
          clientX <= bounds.right &&
          clientY >= bounds.top &&
          clientY <= bounds.bottom
        );
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
    item.classList.add("is-touching");
  };

  const touchLoop = () => {
    if (!isTouchActive) return;
    updateTouchTarget();
    touchRaf = requestAnimationFrame(touchLoop);
  };

  const settleTouch = () => {
    isTouchActive = false;
    cancelAnimationFrame(touchRaf);
    touchRaf = 0;
    activeTouchItem?.classList.remove("is-touching");
    activeTouchItem = null;
  };

  window.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchX = touch.clientX;
      touchY = touch.clientY;
      isTouchActive = true;
      if (!touchRaf) touchRaf = requestAnimationFrame(touchLoop);
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchX = touch.clientX;
      touchY = touch.clientY;
    },
    { passive: true },
  );
  window.addEventListener("touchend", settleTouch, { passive: true });
  window.addEventListener("touchcancel", settleTouch, { passive: true });
}
