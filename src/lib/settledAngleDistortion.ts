import {
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uHover;
  uniform vec2 uTextureSize;
  uniform float uTime;

  varying vec2 vUv;
  varying float vInfluence;

  const float AREA = 300.0;
  const float TAU = 6.28318530718;

  void main() {
    vec3 pos = position;
    float distanceFromPointer = length((uv - uHover.xy) * uTextureSize);
    float influence = max(0.0, 1.0 - distanceFromPointer / AREA);
    float wave = sin(uTime * TAU + distanceFromPointer / 32.0);
    vec2 centered = uv - 0.5;
    float centeredLength = length(centered);
    float cornerMask = smoothstep(0.34, 0.7, centeredLength);
    vec4 cornerWeights = vec4(
      (1.0 - uv.x) * uv.y,
      uv.x * uv.y,
      (1.0 - uv.x) * (1.0 - uv.y),
      uv.x * (1.0 - uv.y)
    );
    vec4 cornerPhases = sin(vec4(
      uTime * TAU,
      uTime * TAU + 1.7,
      uTime * TAU + 3.3,
      uTime * TAU + 4.9
    ));
    float cornerWave = dot(cornerWeights, cornerPhases);
    vec2 cornerDirection = centeredLength > 0.0001
      ? centered / centeredLength
      : vec2(0.0);
    float subjectMask = smoothstep(0.04, 0.72, texture2D(uTexture, uv).a);

    pos.z += wave * 14.0 * influence * uHover.z * subjectMask;
    pos.z += cornerWave * 6.0 * cornerMask * uHover.z * subjectMask;
    pos.xy += cornerDirection * cornerWave * 0.004 * cornerMask * uHover.z * subjectMask;
    vUv = uv;
    vInfluence = max(influence, cornerMask * 0.35) * uHover.z * subjectMask;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uHover;
  uniform vec2 uTextureSize;
  uniform float uTime;

  varying vec2 vUv;
  varying float vInfluence;

  const float TAU = 6.28318530718;

  vec2 mirrored(vec2 value) {
    vec2 wrapped = mod(value, 2.0);
    return mix(wrapped, 2.0 - wrapped, step(1.0, wrapped));
  }

  void main() {
    vec2 delta = vUv - uHover.xy;
    float distanceFromPointer = length(delta * uTextureSize);
    vec2 direction = length(delta) > 0.0001 ? normalize(delta) : vec2(0.0);
    float refraction = sin(uTime * TAU + distanceFromPointer / 32.0)
      * 0.0015
      * vInfluence;
    vec4 color = texture2D(uTexture, mirrored(vUv + direction * refraction));

    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

const MAX_PIXEL_RATIO = 1.6;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const SETTLED_CLASS = "is-distortion-settled";

export class SettledAngleDistortion {
  private readonly root: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 1, 0.1, 5000);
  private readonly geometry = new PlaneGeometry(1, 1, 96, 54);
  private readonly placeholderTexture = new Texture();
  private readonly material: ShaderMaterial;
  private readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly loader = new TextureLoader();
  private readonly texturePromises = new Map<string, Promise<Texture | null>>();
  private readonly loadedTextures = new Set<Texture>();
  private readonly imageUrls: string[];
  private readonly abortController = new AbortController();
  private readonly resizeObserver: ResizeObserver | null;

  private frameId = 0;
  private revealFrameId = 0;
  private activePointerId: number | null = null;
  private desiredIndex = 0;
  private textureIndex = -1;
  private loadToken = 0;
  private desiredSettled = false;
  private sizeReady = false;
  private disposed = false;
  private lastTime = 0;
  private pointerTarget = { x: 0.5, y: 0.5 };
  private pointerCurrent = { x: 0.5, y: 0.5 };
  private strengthTarget = 0;
  private strengthCurrent = 0;

  constructor(root: HTMLElement, stage: HTMLElement, imageUrls: string[]) {
    const canvas = stage.querySelector<HTMLCanvasElement>("[data-cube-distortion]");
    if (!canvas) throw new Error("Canvas de distorcao da galeria ausente");

    this.root = root;
    this.stage = stage;
    this.imageUrls = imageUrls;
    this.placeholderTexture.colorSpace = SRGBColorSpace;

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    const uniforms = {
      uTexture: { value: this.placeholderTexture },
      uHover: { value: new Vector3(0.5, 0.5, 0) },
      uTextureSize: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
    };
    this.material = new ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    const signal = this.abortController.signal;
    stage.addEventListener("pointerenter", this.handlePointerEnter, { signal, passive: true });
    stage.addEventListener("pointermove", this.handlePointerMove, { signal, passive: false });
    stage.addEventListener("pointerleave", this.handlePointerLeave, { signal, passive: true });
    stage.addEventListener("pointerdown", this.handlePointerDown, { signal, passive: true });
    stage.addEventListener("pointerup", this.handlePointerUp, { signal, passive: true });
    stage.addEventListener("pointercancel", this.handlePointerUp, { signal, passive: true });
    canvas.addEventListener("webglcontextlost", this.handleContextLost, { signal });

    const ResizeObserverConstructor = (
      window as unknown as { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver;
    if (ResizeObserverConstructor) {
      this.resizeObserver = new ResizeObserverConstructor(this.resize);
      this.resizeObserver.observe(stage);
    } else {
      this.resizeObserver = null;
      window.addEventListener("resize", this.resize, { signal, passive: true });
    }
    this.resize();
  }

  prepare(index: number): void {
    void this.getTexture(index);
  }

  hideForTransition(): void {
    this.desiredSettled = false;
    this.strengthTarget = 0;
    this.activePointerId = null;
    this.root.classList.remove(SETTLED_CLASS);
    window.cancelAnimationFrame(this.revealFrameId);
    this.revealFrameId = 0;
    this.stopLoop();
  }

  settle(index: number): void {
    this.desiredIndex = index;
    this.desiredSettled = true;
    const token = ++this.loadToken;

    void this.getTexture(index).then((texture) => {
      if (this.disposed || token !== this.loadToken || !texture) return;
      this.material.uniforms.uTexture.value = texture;
      this.textureIndex = index;
      this.presentIfReady();
    });
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.classList.remove(SETTLED_CLASS);
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    this.stopLoop();
    window.cancelAnimationFrame(this.revealFrameId);
    this.revealFrameId = 0;
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.placeholderTexture.dispose();
    this.loadedTextures.forEach((texture) => texture.dispose());
    this.loadedTextures.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readonly resize = (): void => {
    if (this.disposed) return;
    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    this.sizeReady = width > 1 && height > 1;
    if (!this.sizeReady) return;

    const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      mobile ? MAX_MOBILE_PIXEL_RATIO : MAX_PIXEL_RATIO,
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.z = (height / 2) / Math.tan(Math.PI / 6);
    this.camera.updateProjectionMatrix();
    this.mesh.scale.set(width, height, 1);
    this.material.uniforms.uTextureSize.value.set(width, height);
    this.presentIfReady();
  };

  private presentIfReady(): void {
    if (
      this.disposed
      || !this.desiredSettled
      || !this.sizeReady
      || this.textureIndex !== this.desiredIndex
    ) return;

    this.render(performance.now());
    window.cancelAnimationFrame(this.revealFrameId);
    this.revealFrameId = window.requestAnimationFrame(() => {
      this.revealFrameId = 0;
      if (
        !this.disposed
        && this.desiredSettled
        && this.textureIndex === this.desiredIndex
      ) {
        this.root.classList.add(SETTLED_CLASS);
      }
    });
  }

  private getTexture(index: number): Promise<Texture | null> {
    const url = this.imageUrls[index];
    if (!url || this.disposed) return Promise.resolve(null);
    const cached = this.texturePromises.get(url);
    if (cached) return cached;

    const promise = new Promise<Texture | null>((resolve) => {
      this.loader.load(
        url,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            resolve(null);
            return;
          }
          texture.colorSpace = SRGBColorSpace;
          texture.minFilter = LinearFilter;
          texture.magFilter = LinearFilter;
          texture.wrapS = ClampToEdgeWrapping;
          texture.wrapT = ClampToEdgeWrapping;
          texture.generateMipmaps = false;
          this.loadedTextures.add(texture);
          resolve(texture);
        },
        undefined,
        () => resolve(null),
      );
    });
    this.texturePromises.set(url, promise);
    return promise;
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerTarget.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.pointerTarget.y = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  }

  private handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" || !this.desiredSettled) return;
    this.updatePointer(event);
    this.strengthTarget = 1;
    this.startLoop();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    const isMouse = event.pointerType === "mouse";
    if (this.root.classList.contains("is-swipe-tracking")) return;
    const isActiveTouch = this.activePointerId === event.pointerId;
    if (!this.desiredSettled || (!isMouse && !isActiveTouch)) return;
    if (!isMouse) event.preventDefault();
    this.updatePointer(event);
    this.strengthTarget = 1;
    this.startLoop();
  };

  private handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") return;
    this.strengthTarget = 0;
    this.startLoop();
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (
      event.pointerType === "mouse"
      || !this.desiredSettled
      || this.root.classList.contains("is-swipe-tracking")
    ) return;
    this.activePointerId = event.pointerId;
    this.updatePointer(event);
    this.strengthTarget = 1;
    this.stage.setPointerCapture?.(event.pointerId);
    this.startLoop();
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) return;
    this.activePointerId = null;
    this.strengthTarget = 0;
    if (this.stage.hasPointerCapture?.(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }
    this.startLoop();
  };

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.desiredSettled = false;
    this.root.classList.remove(SETTLED_CLASS);
    this.stopLoop();
  };

  private startLoop(): void {
    if (this.frameId || this.disposed || !this.desiredSettled || !this.sizeReady) return;
    this.lastTime = performance.now();
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    window.cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  private readonly tick = (time: number): void => {
    this.frameId = 0;
    if (this.disposed || !this.desiredSettled) return;

    const delta = Math.min(32, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    const pointerEase = 1 - Math.pow(0.86, delta / 16.667);
    const strengthEase = 1 - Math.pow(0.82, delta / 16.667);
    this.pointerCurrent.x += (this.pointerTarget.x - this.pointerCurrent.x) * pointerEase;
    this.pointerCurrent.y += (this.pointerTarget.y - this.pointerCurrent.y) * pointerEase;
    this.strengthCurrent += (this.strengthTarget - this.strengthCurrent) * strengthEase;
    this.render(time);

    const moving =
      Math.abs(this.pointerTarget.x - this.pointerCurrent.x) > 0.0005
      || Math.abs(this.pointerTarget.y - this.pointerCurrent.y) > 0.0005
      || Math.abs(this.strengthTarget - this.strengthCurrent) > 0.001
      || this.strengthCurrent > 0.001;
    if (moving) this.frameId = window.requestAnimationFrame(this.tick);
  };

  private render(time: number): void {
    this.material.uniforms.uTime.value = time / 1000;
    this.material.uniforms.uHover.value.set(
      this.pointerCurrent.x,
      this.pointerCurrent.y,
      this.strengthCurrent,
    );
    this.renderer.render(this.scene, this.camera);
  }
}
