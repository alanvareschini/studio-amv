// Cena 3D: o "A" extrudado. O cursor deixa um RASTRO (efeito "frost" adaptado do
// Overpass) que acende a superfície no gradiente da loja (roxo→ciano→verde).
// Mantém: giro/flip + movimento pelo scroll, reação ao cursor e esmaecer no conteúdo.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SIM = 128;

class LetterScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private group = new THREE.Group();
  private spinner = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2(4, 4);
  private mouse = new THREE.Vector2(0, 0);
  private gyroTilt = { rx: 0, ry: 0, active: false, last: 0 };
  private scrollT = 0;
  private isMobile: boolean;
  private clock = new THREE.Clock();
  private mat: THREE.MeshStandardMaterial | null = null;
  private bgTex: THREE.Texture | null = null;
  private lastW = window.innerWidth;
  private lastH = window.innerHeight;
  private lastDPR = window.devicePixelRatio || 1;
  private lastBufferW = 0;
  private lastBufferH = 0;
  private resizeTimer = 0;
  private resizeFrame = 0;
  private frostIdle = 999; // quadros sem interação (pula a simulação do rastro)
  private autoFrame = 0; // contador para dividir a simulação por 2 no mobile
  private contextLost = false; // pausa o render enquanto o contexto WebGL está perdido
  // referência de zoom capturada no carregamento (por aparelho).
  private baseDPR = window.devicePixelRatio || 1;
  private composerPixelRatio = 1;
  private drawingBufferSize = new THREE.Vector2();

  // Faz o "A" acompanhar o zoom da página (Ctrl +/-): sem isso, o A fica
  // gigante ao dar zoom-out porque o resto do conteúdo encolhe e ele não.
  // Reage só ao zoom (variação do devicePixelRatio), não ao tamanho do monitor.
  private applyZoomScale(): void {
    const ratio = (window.devicePixelRatio || 1) / this.baseDPR;
    const s = Math.max(0.55, Math.min(1.6, ratio));
    this.group.scale.setScalar(s);
  }

  // Fundo em degradê radial: um foco de luz suave atrás do "A" que escurece
  // para as bordas (vinheta natural) — dá profundidade sem parecer chapado.
  private makeBgTexture(inner: string, outer: string): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(256, 210, 30, 256, 256, 400);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private applyTheme(theme: "light" | "dark"): void {
    // fundo da cena acompanha o tema → degradê com profundidade (sem branco chapado)
    const prev = this.bgTex;
    this.bgTex =
      theme === "light"
        ? this.makeBgTexture("#f3f6fe", "#c4d0ea")
        : this.makeBgTexture("#0b1326", "#04060c");
    this.scene.background = this.bgTex;
    if (prev) prev.dispose();

    if (!this.mat) return;
    if (theme === "light") {
      // no fundo claro o "A" fica azul-marinho (visível/contrastado)
      this.mat.color.setHex(0x24356b);
      this.mat.emissive.setHex(0x2a4a8c);
      this.mat.emissiveIntensity = 0.5;
      this.mat.envMapIntensity = 0.85;
    } else {
      this.mat.color.setHex(0x1d2c4d);
      this.mat.emissive.setHex(0x12384a);
      this.mat.emissiveIntensity = 0.9;
      this.mat.envMapIntensity = 1.1;
    }
  }

  // simulação do rastro (frost)
  private field = new Float32Array(SIM * SIM);
  private nextField = new Float32Array(SIM * SIM);
  private frostPixels = new Uint8Array(SIM * SIM * 4);
  private frostTexture: THREE.DataTexture;
  private frostU = {
    tMouseFrost: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
  };
  private ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, inside: false };
  private overA = false;
  private targetVel = 0;
  private splatVel = 0;
  private lastMove = 0;

  constructor(canvas: HTMLCanvasElement, onReady: () => void, onError: () => void) {
    this.isMobile = window.matchMedia("(max-width: 760px)").matches;
    const w = window.innerWidth, h = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.composerPixelRatio = Math.min(this.baseDPR, this.isMobile ? 1.5 : 2);
    this.renderer.setDrawingBufferSize(w, h, this.composerPixelRatio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    this.lastBufferW = canvas.width;
    this.lastBufferH = canvas.height;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.z = this.isMobile ? 7.5 : 6.2;

    this.scene.add(this.group);
    this.group.add(this.spinner);
    this.addLights();

    // Environment map: dá reflexos reais ao "A" (aspecto de vidro/metal polido,
    // em vez de plástico chapado). Gerado uma vez a partir de um ambiente neutro.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // fundo em degradê já no início (evita flash de cor chapada)
    this.applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");

    this.frostTexture = new THREE.DataTexture(this.frostPixels, SIM, SIM, THREE.RGBAFormat);
    this.frostTexture.minFilter = THREE.LinearFilter;
    this.frostTexture.magFilter = THREE.LinearFilter;
    this.frostTexture.needsUpdate = true;
    this.frostU.tMouseFrost.value = this.frostTexture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // threshold alto (0.8): só os brilhos mais fortes (reflexos + rastro) fazem
    // bloom → o fundo claro NÃO é "lavado".
    this.composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(w, h), this.isMobile ? 0.38 : 0.55, 0.6, 0.8)
    );

    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerleave", () => (this.ptr.inside = false), { passive: true });
    window.addEventListener("amv:gyrotilt", this.onGyroTilt as EventListener, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });

    // Perda/restauração de contexto WebGL (voltar de 2º plano no mobile, reset
    // de driver): sem tratar, o "A" fica preto e o tick() renderiza sobre um
    // contexto morto por quadro. preventDefault permite ao three restaurar.
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.contextLost = true;
    }, false);
    canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      this.frostTexture.needsUpdate = true;
      if (this.bgTex) this.bgTex.needsUpdate = true;
    }, false);

    this.updateResolution();

    new FontLoader().load(
      "/font.json",
      (font) => {
        this.build(font);
        requestAnimationFrame(onReady);
      },
      undefined,
      (error) => {
        console.error("Fonte da cena 3D não carregou:", error);
        onError();
      },
    );
    this.tick();
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(3, 4, 5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc08bff, 1.6);
    fill.position.set(-4, 2, 4);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0x46e0ff, 1.2);
    rim.position.set(4, -2, 4);
    this.scene.add(rim);
    const front = new THREE.DirectionalLight(0xffffff, 1.0);
    front.position.set(0, 0, 6);
    this.scene.add(front);
  }

  private build(font: Font): void {
    const geo = new TextGeometry("A", {
      font,
      size: this.isMobile ? 3 : 3.4,
      depth: 0.7,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 1,
    });
    geo.computeVertexNormals();
    geo.center();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1d2c4d,
      metalness: 0.62,
      roughness: 0.26,
      emissive: 0x12384a,
      emissiveIntensity: 0.9,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.tMouseFrost = this.frostU.tMouseFrost;
      shader.uniforms.uResolution = this.frostU.uResolution;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vLpos;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLpos = transformed;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vLpos;\nuniform sampler2D tMouseFrost;\nuniform vec2 uResolution;"
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           roughnessFactor *= 1.0 - texture2D(tMouseFrost, gl_FragCoord.xy / uResolution).r * 0.85;`
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          {
            vec3 c1 = vec3(0.659, 0.333, 0.969); // roxo
            vec3 c2 = vec3(0.133, 0.827, 0.933); // ciano
            vec3 c3 = vec3(0.10, 1.0, 0.40);     // verde neon
            float gy = clamp(vLpos.y / 3.6 + 0.5, 0.0, 1.0);
            vec3 gradCol = gy < 0.5 ? mix(c1, c2, gy * 2.0) : mix(c2, c3, (gy - 0.5) * 2.0);
            vec2 fd = texture2D(tMouseFrost, gl_FragCoord.xy / uResolution).rg;
            totalEmissiveRadiance += gradCol * fd.g * 2.4;          // crista do rastro (brilho)
            totalEmissiveRadiance += gradCol * pow(fd.r, 2.0) * 0.5; // brilho suave na trilha
          }`
        );
    };
    mat.customProgramCacheKey = () => "a-frost-v1";
    this.mat = mat;
    this.applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    window.addEventListener("themechange", (e) =>
      this.applyTheme((e as CustomEvent).detail === "light" ? "light" : "dark")
    );

    this.mesh = new THREE.Mesh(geo, mat);
    this.spinner.add(this.mesh);
    this.applyZoomScale(); // respeita zoom já ativo no carregamento

    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => (this.scrollT = self.progress),
    });
    gsap.fromTo(
      ".hero3d",
      { opacity: 1 },
      { opacity: 0.4, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "22% top", scrub: true } }
    );
  }

  private onPointer = (e: PointerEvent): void => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    this.mouse.set(x * 2 - 1, -(y * 2 - 1));
    this.ndc.set(x * 2 - 1, -(y * 2 - 1));
    this.ptr.x = x;
    this.ptr.y = 1 - y; // flip para casar com gl_FragCoord
    this.ptr.inside = true;
  };

  private onGyroTilt = (e: CustomEvent<{ rx: number; ry: number; max: number }>): void => {
    const max = e.detail.max || 12;
    this.gyroTilt.rx = Math.max(-1, Math.min(1, e.detail.rx / max));
    this.gyroTilt.ry = Math.max(-1, Math.min(1, e.detail.ry / max));
    this.gyroTilt.active = true;
    this.gyroTilt.last = performance.now();
  };

  // Redimensiona com "debounce" e ignora mudanças que não são reais.
  // Zoom e a barra de endereço do celular disparam resize em rajada; refazer
  // a cena a cada evento trava tudo. Aqui só refazemos quando o usuário PARA
  // de mexer, e ignoramos variações só de altura (barra do navegador).
  private zoomPixelRatio(): number {
    return this.composerPixelRatio * ((window.devicePixelRatio || 1) / this.baseDPR);
  }

  private syncViewport(resizeBuffers: boolean): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    this.lastW = width;
    this.lastH = height;
    this.lastDPR = dpr;
    this.renderer.domElement.style.width = `${width}px`;
    this.renderer.domElement.style.height = `${height}px`;

    const nextAspect = width / Math.max(1, height);
    if (Math.abs(this.camera.aspect - nextAspect) > 0.0001) {
      this.camera.aspect = nextAspect;
      this.camera.updateProjectionMatrix();
    }
    this.applyZoomScale();

    if (!resizeBuffers) return;

    const pixelRatio = this.zoomPixelRatio();
    const targetBufferW = Math.max(1, Math.floor(width * pixelRatio));
    const targetBufferH = Math.max(1, Math.floor(height * pixelRatio));
    const bufferChanged =
      Math.abs(targetBufferW - this.lastBufferW) > 2 ||
      Math.abs(targetBufferH - this.lastBufferH) > 2;
    if (!bufferChanged) return;

    this.renderer.setDrawingBufferSize(width, height, pixelRatio);
    this.composer.setSize(
      targetBufferW / this.composerPixelRatio,
      targetBufferH / this.composerPixelRatio,
    );
    this.lastBufferW = this.renderer.domElement.width;
    this.lastBufferH = this.renderer.domElement.height;
    this.updateResolution();
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const dw = Math.abs(w - this.lastW);
    const dh = Math.abs(h - this.lastH);
    // largura igual + pequena mudança de altura = barra do navegador → ignora
    if (dw === 0 && dh < 130 && Math.abs(dpr - this.lastDPR) < 0.001) {
      this.lastH = h;
      return;
    }

    if (!this.resizeFrame) {
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = 0;
        this.syncViewport(false);
      });
    }

    if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = 0;
      this.syncViewport(true);
    }, 200);
  };

  private updateResolution(): void {
    this.renderer.getDrawingBufferSize(this.drawingBufferSize);
    this.frostU.uResolution.value.copy(this.drawingBufferSize);
  }

  private static smoothstep(a: number, b: number, v: number): number {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  private static segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const abx = bx - ax, aby = by - ay;
    const l = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / l));
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }

  private updateFrost(elapsed: number): void {
    let dist = Math.hypot(this.ptr.x - this.ptr.px, this.ptr.y - this.ptr.py);
    if (dist > 0) this.lastMove = elapsed;
    if (elapsed - this.lastMove > 0.15 || !this.overA || dist > 0.3) {
      this.ptr.px = this.ptr.x;
      this.ptr.py = this.ptr.y;
      this.targetVel = 0;
      dist = 0;
    }
    this.targetVel = Math.max(0, Math.min(1, (this.targetVel + dist * 6) * 0.88));
    const eased = 1 - Math.pow(1 - this.targetVel, 4);
    this.splatVel += (eased - this.splatVel) * 0.1;
    const radius = 0.05 * LetterScene.smoothstep(0.1, 1, this.splatVel) * SIM;

    for (let y = 1; y < SIM - 1; y++) {
      for (let x = 1; x < SIM - 1; x++) {
        const i = y * SIM + x;
        const drift = Math.sin(x * 0.093 + y * 0.071 + elapsed * 0.72) > 0 ? 1 : -1;
        const sx = Math.max(1, Math.min(SIM - 2, x + drift));
        const prev = this.field[y * SIM + sx];
        let nv = Math.max(this.field[i - 1], this.field[i + 1], this.field[i - SIM], this.field[i + SIM]);
        if (this.overA && radius > 0.1) {
          const ld = LetterScene.segDist(x, y, this.ptr.px * SIM, this.ptr.py * SIM, this.ptr.x * SIM, this.ptr.y * SIM);
          nv += Math.pow(Math.max(0, 1 - ld / radius), 3);
        }
        nv = Math.min(1, Math.max(prev * 0.12, nv) * 0.985);
        this.nextField[i] = nv;
        const o = i * 4;
        this.frostPixels[o] = Math.round(nv * 255);
        this.frostPixels[o + 1] = Math.round(Math.max(0, nv - this.field[i]) * 255);
        this.frostPixels[o + 2] = 0;
        this.frostPixels[o + 3] = 255;
      }
    }
    this.field.set(this.nextField);
    this.nextField.fill(0);
    this.frostTexture.needsUpdate = true;
    this.ptr.px = this.ptr.x;
    this.ptr.py = this.ptr.y;
  }

  private tick = (): void => {
    requestAnimationFrame(this.tick);
    // pausa quando a aba está oculta ou o contexto WebGL foi perdido
    if (document.hidden || this.contextLost) return;
    const elapsed = this.clock.getElapsedTime();
    const s = this.scrollT;

    // No MOBILE não existe cursor: uma luz automática atravessa o A em curva,
    // acendendo a superfície no gradiente (substitui o rastro do cursor).
    // Só enquanto o A está em cena (economiza bateria ao rolar a página).
    const autoSurface = this.isMobile && s < 0.3;

    // rastro só onde está sobre o A
    if (autoSurface) {
      const t = elapsed * 0.5;
      this.ptr.x = 0.5 + Math.cos(t * 1.3) * 0.24;
      this.ptr.y = 0.5 + Math.sin(t * 1.7) * 0.28;
      this.ptr.inside = true;
      this.overA = true;
    } else if (this.mesh && this.ptr.inside) {
      this.raycaster.setFromCamera(this.ndc, this.camera);
      this.overA = this.raycaster.intersectObject(this.mesh, false).length > 0;
    } else {
      this.overA = false;
    }
    // Só roda a simulação do rastro (loop de 16k células) quando há interação
    // ou logo depois (enquanto o rastro some). Parado = pula, economiza CPU.
    // No mobile roda em quadros alternados (metade do custo).
    this.frostIdle = this.overA ? 0 : this.frostIdle + 1;
    const doFrost = this.frostIdle < 100 && (!this.isMobile || (this.autoFrame++ & 1) === 0);
    if (doFrost) this.updateFrost(elapsed);

    // coreografia pelo scroll
    const active = LetterScene.smoothstep(0, 0.14, s) * (1 - LetterScene.smoothstep(0.84, 1, s));
    this.spinner.rotation.y = LetterScene.smoothstep(0.12, 0.95, s) * Math.PI * 2 * 3;
    this.spinner.rotation.x = Math.sin(s * Math.PI * 2) * Math.PI * active;

    const reach = this.isMobile ? 1.4 : 2.8;
    const tx = Math.sin(s * Math.PI * 3) * reach;
    const ty = Math.sin(s * Math.PI * 2) * 0.7;
    this.group.position.x += (tx - this.group.position.x) * 0.07;
    this.group.position.y += (ty - this.group.position.y) * 0.07;

    // Desktop: inclina seguindo o cursor. Mobile: balanço automático suave,
    // pra o A nunca ficar congelado em repouso (não há cursor no toque).
    let tiltY = this.mouse.x * 0.38;
    let tiltX = -this.mouse.y * 0.3;
    if (this.isMobile) {
      const gyroFresh = this.gyroTilt.active && performance.now() - this.gyroTilt.last < 900;
      tiltY = gyroFresh ? this.gyroTilt.ry * 0.42 : Math.sin(elapsed * 0.55) * 0.34;
      tiltX = gyroFresh ? this.gyroTilt.rx * 0.28 : Math.sin(elapsed * 0.4) * 0.16;
    }
    this.group.rotation.y += (tiltY - this.group.rotation.y) * 0.06;
    this.group.rotation.x += (tiltX - this.group.rotation.x) * 0.06;

    this.composer.render();
  };
}

export function initHero3D(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>(".hero3d-canvas");
  const host = document.querySelector<HTMLElement>(".hero3d");
  if (!canvas || !host) return Promise.resolve();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    host.classList.add("is-static");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const fallback = () => {
      host.classList.add("is-static");
      resolve();
    };
    try {
      new LetterScene(canvas, resolve, fallback);
    } catch (err) {
      console.error("Cena 3D falhou, usando fallback:", err);
      fallback();
    }
  });
}
