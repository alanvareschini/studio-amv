import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  type IUniform,
  Vector2,
  Vector4,
  WebGLRenderer,
} from "three";
import { isReducedMotion } from "./motionPreference";

const TARGET_SELECTOR =
  "h1.hero__brand, h2.section__title, h2.cta-final__title";
const EXCLUDED_SELECTOR =
  ".card, .pkg, .pkg-modal, .timeline, #faq, [role='dialog']";
const MAX_PIXEL_RATIO = 2;

interface HeadingLayer {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: CanvasTexture;
  ready: boolean;
}

interface FluidUniforms {
  [uniform: string]: IUniform;
  uTime: { value: number };
  uRes: { value: Vector2 };
  uViewRes: { value: Vector2 };
  uOrigin: { value: Vector2 };
  uMask: { value: CanvasTexture };
  uR0: { value: Vector4 };
  uR1: { value: Vector4 };
  uR2: { value: Vector4 };
  uR3: { value: Vector4 };
}

function fontFromStyle(style: CSSStyleDeclaration): string {
  return [
    style.fontStyle,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ].join(" ");
}

function isGradientRun(node: HTMLElement, heading: HTMLElement): boolean {
  if (heading.classList.contains("hero__brand")) return true;
  const gradientNode = node.closest<HTMLElement>(".text-gradient");
  if (gradientNode && heading.contains(gradientNode)) return true;
  return (
    getComputedStyle(node).backgroundImage !== "none" ||
    getComputedStyle(heading).backgroundImage !== "none"
  );
}

function wrapHeadingSource(element: HTMLElement): void {
  if (element.querySelector(":scope > .heading-fluid-local-source")) return;
  const source = document.createElement("span");
  source.className = "heading-fluid-local-source";
  while (element.firstChild) source.appendChild(element.firstChild);
  element.appendChild(source);
}

function rasterizeHeading(
  element: HTMLElement,
  pixelRatio: number,
): HTMLCanvasElement {
  const bounds = element.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(bounds.height * pixelRatio));
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  context.scale(pixelRatio, pixelRatio);
  context.textBaseline = "alphabetic";
  const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height);
  gradient.addColorStop(0, "#a855f7");
  gradient.addColorStop(0.5, "#22d3ee");
  gradient.addColorStop(1, "#00ff88");

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode() as Text | null;

  while (textNode) {
    const parent = textNode.parentElement;
    const value = textNode.textContent ?? "";

    if (parent && value) {
      const style = getComputedStyle(parent);
      context.font = fontFromStyle(style);
      // gradiente continua gradiente; as demais ficam pretas no claro / brancas no escuro
      const light = document.documentElement.dataset.theme === "light";
      context.fillStyle = isGradientRun(parent, element)
        ? gradient
        : light
          ? "#0b1020"
          : style.color;
      const metrics = context.measureText("Mg");
      const descent =
        metrics.actualBoundingBoxDescent ||
        Number.parseFloat(style.fontSize) * 0.2;

      for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (/\s/.test(character)) continue;

        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;

        const x = rect.left - bounds.left;
        const baseline = rect.top - bounds.top + rect.height - descent;
        context.fillText(character, x, baseline);
      }
    }

    textNode = walker.nextNode() as Text | null;
  }

  return canvas;
}

export function initHeadingFluid(): void {
  if (isReducedMotion()) return;

  const targets = [...document.querySelectorAll<HTMLElement>(TARGET_SELECTOR)]
    .filter((element) => !element.closest(EXCLUDED_SELECTOR));
  if (!targets.length) return;
  targets.forEach(wrapHeadingSource);

  const overlay = document.createElement("canvas");
  overlay.className = "heading-fluid-local-canvas";
  overlay.setAttribute("aria-hidden", "true");

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas: overlay,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false, // evita fio nas bordas ao copiar p/ canvas 2D
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch {
    return;
  }

  const maskCanvas = document.createElement("canvas");
  const maskContext = maskCanvas.getContext("2d");
  if (!maskContext) {
    renderer.dispose();
    return;
  }

  const maskTexture = new CanvasTexture(maskCanvas);
  maskTexture.minFilter = LinearFilter;
  maskTexture.magFilter = LinearFilter;
  maskTexture.generateMipmaps = false;

  const uniforms: FluidUniforms = {
    uTime: { value: 0 },
    uLight: { value: document.documentElement.dataset.theme === "light" ? 1 : 0 },
    uRes: { value: new Vector2(1, 1) },
    uViewRes: { value: new Vector2(1, 1) },
    uOrigin: { value: new Vector2(0, 0) },
    uMask: { value: maskTexture },
    uR0: { value: new Vector4(0, 0, -1, 0) },
    uR1: { value: new Vector4(0, 0, -1, 0) },
    uR2: { value: new Vector4(0, 0, -1, 0) },
    uR3: { value: new Vector4(0, 0, -1, 0) },
  };

  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms,
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uLight;
      uniform vec2 uRes;
      uniform vec2 uViewRes;
      uniform vec2 uOrigin;
      uniform sampler2D uMask;
      uniform vec4 uR0;
      uniform vec4 uR1;
      uniform vec4 uR2;
      uniform vec4 uR3;

      float tri(float value) {
        return abs(fract(value + 0.5) - 0.5) * 2.0;
      }

      float ripple(vec4 source, vec2 uv, float time) {
        if (source.z < 0.0) return 0.0;
        float age = time - source.z;
        float decay = exp(-age * 1.1);
        vec2 delta = (uv - source.xy) * vec2(uViewRes.x / uViewRes.y, 1.0);
        float distance = length(delta);
        return decay
          * sin(distance * 7.0 - age * 2.52)
          * exp(-distance * 2.2)
          * 1.8;
      }

      void main() {
        vec2 localUv = gl_FragCoord.xy / uRes;
        vec4 mask = texture2D(uMask, localUv);
        if (mask.a < 0.01) discard;

        vec2 screen = uOrigin + gl_FragCoord.xy;
        vec2 uv = screen / uViewRes;
        float aspect = uViewRes.x / uViewRes.y;
        vec2 point = vec2(uv.x * aspect, uv.y) * 2.2;
        float time = uTime;
        float height = 0.0;

        height += 1.0  * sin( 2.4 * point.x + 0.9 * point.y + time * 1.15);
        height += 0.82 * sin(-1.3 * point.x + 2.6 * point.y - time * 0.87 + 1.5708);
        height += 0.65 * sin( 1.7 * point.x - 2.0 * point.y + time * 1.41 + 3.1416);
        height += 0.70 * sin(-2.8 * point.x - 1.2 * point.y - time * 0.66 + 0.8);
        height += 0.50 * sin( 0.9 * point.x + 3.1 * point.y + time * 1.05 + 2.3);
        height += 0.38 * sin( 3.2 * point.x + 0.7 * point.y - time * 1.23 + 4.7);
        height += 0.30 * sin(-1.0 * point.x - 2.4 * point.y + time * 1.56 + 5.5);
        height += 0.28 * sin( 2.1 * point.x + 1.7 * point.y + time * 0.54 + 1.1);

        height += 0.45 * 0.35 * sin(5.6 * point.x + 4.4 * point.y + time * 1.1 + height * 0.8);
        height += 0.45 * 0.18 * sin(8.3 * point.x - 7.0 * point.y - time * 0.9 + height * 1.3);
        height += 0.45 * 0.10 * sin(12.0 * point.x + 9.5 * point.y + time * 1.6 + height * 1.8);

        height += ripple(uR0, uv, uTime);
        height += ripple(uR1, uv, uTime);
        height += ripple(uR2, uv, uTime);
        height += ripple(uR3, uv, uTime);

        // mesma lógica nos dois temas — a cor da letra (preta no claro,
        // gradiente/branca no escuro) já define o resultado (listras brancas).
        float bands = tri(height * 4.5);
        float lightLine = 1.0 - smoothstep(0.18, 0.26, bands);
        float darkLine = 1.0 - smoothstep(0.018, 0.045, bands);
        vec3 base = mask.rgb;
        vec3 highlight = mix(base, vec3(1.0), 0.78);
        vec3 color = mix(base, highlight, lightLine * 0.94);
        float maxChannel = max(base.r, max(base.g, base.b));
        float minChannel = min(base.r, min(base.g, base.b));
        float luminance = dot(base, vec3(0.2126, 0.7152, 0.0722));
        float whiteAmount =
          smoothstep(0.72, 0.94, luminance)
          * (1.0 - smoothstep(0.05, 0.18, maxChannel - minChannel));
        vec3 blackWave = mix(base, vec3(0.004, 0.006, 0.012), darkLine * 0.88);
        color = mix(color, blackWave, whiteAmount);

        gl_FragColor = vec4(color, mask.a);
      }
    `,
  });

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new PlaneGeometry(2, 2);
  scene.add(new Mesh(geometry, material));

  let animationFrame = 0;
  let lastTime = performance.now();
  let flowTime = 0;
  let hover = 0;
  let touchPressed = false;
  let fontsReady = false;
  let rippleIndex = 0;
  const hasHover = matchMedia("(hover: hover)").matches;
  const rippleSlots = [uniforms.uR0, uniforms.uR1, uniforms.uR2, uniforms.uR3];

  const createLayer = (element: HTMLElement): HeadingLayer | null => {
    const canvas = document.createElement("canvas");
    canvas.className = "heading-fluid-local-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d");
    if (!context) return null;

    const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
    const source = rasterizeHeading(element, ratio);
    const texture = new CanvasTexture(source);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    canvas.width = source.width;
    canvas.height = source.height;
    element.appendChild(canvas);

    return { element, canvas, context, texture, ready: false };
  };

  const layers = targets
    .map(createLayer)
    .filter((layer): layer is HeadingLayer => layer !== null);
  if (!layers.length) {
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    maskTexture.dispose();
    return;
  }

  const layerByElement = new Map(
    layers.map((layer) => [layer.element, layer] as const),
  );
  const visibleElements = new Set<HTMLElement>();
  layers.forEach((layer) => {
    layer.canvas.dataset.renderState = "paused";
  });
  const rebuildLayer = (layer: HeadingLayer) => {
    const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
    const source = rasterizeHeading(layer.element, ratio);
    layer.texture.dispose();
    layer.texture = new CanvasTexture(source);
    layer.texture.minFilter = LinearFilter;
    layer.texture.magFilter = LinearFilter;
    layer.texture.generateMipmaps = false;
    layer.canvas.width = source.width;
    layer.canvas.height = source.height;
    layer.ready = false;
  };

  const renderLayer = (layer: HeadingLayer, rect: DOMRect) => {
    const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
    renderer.setPixelRatio(ratio);
    renderer.setSize(
      Math.max(1, rect.width),
      Math.max(1, rect.height),
      false,
    );
    uniforms.uRes.value.set(overlay.width, overlay.height);
    uniforms.uViewRes.value.set(innerWidth * ratio, innerHeight * ratio);
    uniforms.uOrigin.value.set(
      rect.left * ratio,
      (innerHeight - rect.bottom) * ratio,
    );
    uniforms.uMask.value = layer.texture;
    renderer.render(scene, camera);

    layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.context.drawImage(
      overlay,
      0,
      0,
      layer.canvas.width,
      layer.canvas.height,
    );
    if (!layer.ready) {
      layer.ready = true;
      layer.element.classList.add("heading-fluid-local-active");
    }
  };

  const visibleLayers = () => {
    return layers
      .filter((layer) => visibleElements.has(layer.element))
      .map((layer) => ({ layer, rect: layer.element.getBoundingClientRect() }))
      .filter(({ rect }) => (
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        rect.right > 0 &&
        rect.left < innerWidth
      ));
  };

  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(TARGET_SELECTOR)
      : null;
    touchPressed = Boolean(target && layerByElement.has(target));
    if (touchPressed) startRender();
  };

  const pointerUp = () => {
    touchPressed = false;
  };

  const click = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>(TARGET_SELECTOR)
      : null;
    if (!target || !layerByElement.has(target)) return;

    rippleSlots[rippleIndex % rippleSlots.length].value.set(
      event.clientX / innerWidth,
      1 - event.clientY / innerHeight,
      uniforms.uTime.value,
      1,
    );
    rippleIndex += 1;
    startRender();
  };

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const layer = layerByElement.get(entry.target as HTMLElement);
      if (layer) {
        rebuildLayer(layer);
        startRender();
      }
    }
  });
  targets.forEach((target) => resizeObserver.observe(target));

  const mutationObserver = new MutationObserver((records) => {
    const changedLayers = new Set<HeadingLayer>();
    records.forEach((record) => {
      const origin = record.target instanceof Element
        ? record.target
        : record.target.parentElement;
      const heading = origin?.closest<HTMLElement>(TARGET_SELECTOR);
      const layer = heading ? layerByElement.get(heading) : undefined;
      if (layer) changedLayers.add(layer);
    });
    changedLayers.forEach(rebuildLayer);
    if (changedLayers.size) startRender();
  });
  targets.forEach((target) => {
    mutationObserver.observe(target, {
      characterData: true,
      subtree: true,
    });
  });

  // Rasterizar o texto é pesado; no zoom/rolagem o resize dispara em rajada.
  // Só refaz a largura mudar de fato, e com debounce (quando o usuário para).
  let lastRw = window.innerWidth;
  let rzTimer = 0;
  addEventListener(
    "resize",
    () => {
      if (window.innerWidth === lastRw) return; // só altura (barra do navegador) → ignora
      window.clearTimeout(rzTimer);
      rzTimer = window.setTimeout(() => {
        lastRw = window.innerWidth;
        layers.forEach(rebuildLayer);
        startRender();
      }, 220);
    },
    { passive: true }
  );
  // Ao trocar de tema, re-rasteriza os títulos com a cor nova. A cor tem uma
  // transição CSS de 0.5s (body), então rasterizar SÓ na hora captura a cor do
  // tema ANTERIOR (preto no claro) e deixa o shader com "listras grandes" ao
  // voltar pro escuro. Por isso refazemos também DEPOIS da transição terminar.
  addEventListener(
    "themechange",
    () => {
      layers.forEach(rebuildLayer);
      startRender();
      window.setTimeout(() => {
        layers.forEach(rebuildLayer);
        startRender();
      }, 560);
    },
    { passive: true }
  );
  addEventListener("pointerdown", pointerDown, { passive: true });
  addEventListener("pointerup", pointerUp, { passive: true });
  addEventListener("pointercancel", pointerUp, { passive: true });
  addEventListener("click", click, { passive: true });

  function render(time: number) {
    animationFrame = 0;
    if (document.hidden || visibleElements.size === 0) {
      lastTime = time;
      return;
    }

    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    uniforms.uLight.value = document.documentElement.dataset.theme === "light" ? 1 : 0;
    const hoverTarget =
      touchPressed ||
      (
        hasHover &&
        layers.some((layer) => layer.element.matches(":hover"))
      )
        ? 1
        : 0;
    hover += (hoverTarget - hover) * (1 - Math.exp(-10 * delta));
    flowTime += delta * (0.28 + hover * 1.72);
    uniforms.uTime.value = flowTime;
    visibleLayers().forEach(({ layer, rect }) => renderLayer(layer, rect));
    animationFrame = requestAnimationFrame(render);
  }

  function startRender() {
    if (
      animationFrame
      || !fontsReady
      || document.hidden
      || visibleElements.size === 0
    ) return;
    layers.forEach((layer) => {
      layer.canvas.dataset.renderState = "running";
    });
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(render);
  }

  function stopRender() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    layers.forEach((layer) => {
      layer.canvas.dataset.renderState = "paused";
    });
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting) visibleElements.add(element);
      else visibleElements.delete(element);
    });
    if (visibleElements.size) startRender();
    else stopRender();
  }, { rootMargin: "48px 0px", threshold: 0.01 });
  layers.forEach((layer) => intersectionObserver.observe(layer.element));

  const visibilityChanged = () => {
    if (document.hidden) stopRender();
    else startRender();
  };
  document.addEventListener("visibilitychange", visibilityChanged, { passive: true });

  document.fonts.ready.then(() => {
    fontsReady = true;
    startRender();
  });

  // Perda de contexto WebGL (voltar de 2º plano no mobile, reset de driver):
  // sem tratar, o canvas fica preto e o rAF chama render() sobre um contexto
  // morto por quadro. Aqui pausamos e mostramos o TEXTO NORMAL (remove a classe
  // "active", que reexibe o heading original); ao restaurar, refazemos tudo.
  overlay.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      stopRender();
      layers.forEach((layer) => {
        layer.ready = false;
        layer.element.classList.remove("heading-fluid-local-active");
      });
    },
    false
  );
  overlay.addEventListener("webglcontextrestored", () => {
    layers.forEach(rebuildLayer);
    startRender();
  });

  addEventListener("pagehide", () => {
    stopRender();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    maskTexture.dispose();
    layers.forEach((layer) => layer.texture.dispose());
  }, { once: true });
}
