// Botão "chaos" com shader WebGL (linhas neon fluidas). Adaptado do pen do CodePen.
// Sem GSAP/tweakpane: a transição resting↔active é feita com lerp no requestAnimationFrame.
// Cores trocadas para a paleta da loja.

import { isReducedMotion } from "../lib/motionPreference";

export function ChaosButton(label: string, href: string): string {
  return /* html */ `
    <a class="chaos-button" href="${href}" draggable="false">
      <canvas class="chaos-canvas" aria-hidden="true" draggable="false"></canvas>
      <span class="chaos-label">${label}</span>
    </a>`;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Shader original, apenas com as cores da loja (roxo, ciano, verde, azul).
const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_tap;
  uniform float u_amplitude;
  uniform float u_pulseMin;
  uniform float u_pulseMax;
  uniform float u_noiseType;
  uniform float u_light;

  float hash(float n) { return fract(sin(n) * 753.5453123); }

  float noiseHash(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 157.0;
    return mix(
      mix(hash(n + 0.0), hash(n + 1.0), f.x),
      mix(hash(n + 157.0), hash(n + 158.0), f.x),
      f.y
    );
  }

  float noiseTrig(vec2 p) {
    float x = p.x;
    float y = p.y;
    float n = sin(x * 1.0 + sin(y * 1.3)) * 0.5;
    n += sin(y * 1.0 + sin(x * 1.1)) * 0.5;
    n += sin((x + y) * 0.5) * 0.25;
    n += sin((x - y) * 0.7) * 0.25;
    return n * 0.5 + 0.5;
  }

  float noise(vec2 p) {
    if (u_noiseType < 0.5) { return noiseHash(p); } else { return noiseTrig(p); }
  }

  float fbm(vec2 p, vec3 a) {
    float v = 0.0;
    v += noise(p * a.x) * 0.50;
    v += noise(p * a.y) * 1.50;
    v += noise(p * a.z) * 0.125 * 0.1;
    return v;
  }

  vec3 drawLines(vec2 uv, vec3 fbmOffset, vec3 color1, float secs) {
    float timeVal = secs * 0.1;
    vec3 finalColor = vec3(0.0);

    // Paleta da loja: roxo #A855F7, ciano #22D3EE, verde #00FF88, azul #3B82F6
    vec3 colorSets[4];
    colorSets[0] = vec3(0.659, 0.333, 0.969);
    colorSets[1] = vec3(0.133, 0.827, 0.933);
    colorSets[2] = vec3(0.000, 1.000, 0.533);
    colorSets[3] = vec3(0.231, 0.510, 0.965);

    for(int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = u_amplitude + (indexAsFloat * 0.0);
      float period = 2.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.4, 0.2, noise(uv * 2.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i];
    }

    for(int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = (u_amplitude * 0.5) + (indexAsFloat * 5.0);
      float period = 9.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.1, 0.1, noise(uv * 12.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i] * color1;
    }

    return finalColor;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.x) * 1.0 - 1.0;
    uv *= 1.5;

    vec3 lineColor1 = vec3(0.659, 0.200, 0.969); // roxo
    vec3 lineColor2 = vec3(0.133, 0.827, 1.400); // ciano (estourado p/ brilho)

    float spread = abs(u_tap);
    vec3 finalColor = vec3(0.0);

    float t = sin(u_time) * 0.5 + 0.5;
    float pulse = mix(u_pulseMin, u_pulseMax, t);

    finalColor = drawLines(uv, vec3(65.2, 40.0, 4.0), lineColor1, u_time) * pulse;
    finalColor += drawLines(uv, vec3(5.0 * spread / 2.0, 2.1 * spread, 1.0), lineColor2, u_time);

    // modo claro: inverte → linhas escuras sobre fundo claro (mesma animação)
    if (u_light > 0.5) finalColor = vec3(1.0) - finalColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface ChaosState {
  speed: number;
  amplitude: number;
  pulseMin: number;
  pulseMax: number;
  tap: number;
}

const RESTING: ChaosState = { speed: 0.35, amplitude: 80, pulseMin: 0.05, pulseMax: 0.2, tap: 1.0 };
const ACTIVE: ChaosState = { speed: 2.8, amplitude: 10, pulseMin: 0.05, pulseMax: 0.4, tap: 1.0 };

class ChaosButtonGL {
  private button: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private cur: ChaosState = { ...RESTING };
  private target: ChaosState = { ...RESTING };
  private tau = 0.9; // suavização (s): pequeno = rápido (active), grande = lento (resting)
  private phase = 0;
  private last = performance.now() / 1000;
  private visible = true;
  private contextLost = false;
  private light = document.documentElement.dataset.theme === "light" ? 1 : 0;
  private raf = 0;

  constructor(button: HTMLElement) {
    this.button = button;
    this.canvas = button.querySelector(".chaos-canvas") as HTMLCanvasElement;

    // Perda/restauração de contexto WebGL (2º plano no mobile, reset de driver):
    // sem tratar, o render segue chamando gl.* sobre um contexto morto. Aqui
    // pausamos e, ao restaurar, recriamos shaders/buffers.
    this.canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.contextLost = true;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
      },
      false
    );
    this.canvas.addEventListener(
      "webglcontextrestored",
      () => {
        if (this.setupWebGL()) {
          this.contextLost = false;
          this.scheduleRender();
        }
      },
      false
    );

    if (!this.setupWebGL()) {
      button.classList.add("is-static"); // fallback: vira botão gradiente
      return;
    }
    window.addEventListener("themechange", (e) => {
      this.light = (e as CustomEvent).detail === "light" ? 1 : 0;
    });
    this.setupEvents();
    this.observeVisibility();
    this.scheduleRender();
  }

  private setupWebGL(): boolean {
    const gl = this.canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) return false;
    this.gl = gl;

    const vs = this.compile(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const name of [
      "resolution",
      "time",
      "tap",
      "amplitude",
      "pulseMin",
      "pulseMax",
      "noiseType",
      "light",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(program, `u_${name}`);
    }

    this.resize();
    return true;
  }

  private compile(type: number, src: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private resize(): void {
    const gl = this.gl!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = this.button.getBoundingClientRect();
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
  }

  private setupEvents(): void {
    const activate = () => {
      this.target = { ...ACTIVE };
      this.tau = 0.09;
    };
    const deactivate = () => {
      this.target = { ...RESTING };
      this.tau = 0.9;
    };
    this.button.addEventListener("pointerdown", activate);
    this.button.addEventListener("pointerup", deactivate);
    this.button.addEventListener("pointerleave", deactivate);
    this.button.addEventListener("pointercancel", deactivate);
    // debounce: evita refazer o canvas em rajada durante zoom/rolagem
    let rzTimer = 0;
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(rzTimer);
        rzTimer = window.setTimeout(() => this.resize(), 200);
      },
      { passive: true }
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
        return;
      }
      this.last = performance.now() / 1000;
      this.scheduleRender();
    });
  }

  private observeVisibility(): void {
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting;
      if (visible === this.visible) return;
      this.visible = visible;
      if (visible) {
        this.last = performance.now() / 1000;
        this.scheduleRender();
      } else {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }).observe(this.button);
  }

  private scheduleRender(): void {
    if (this.raf || !this.gl || !this.visible || this.contextLost || document.hidden) return;
    this.raf = requestAnimationFrame(this.render);
  }

  private render = (): void => {
    this.raf = 0;
    if (!this.gl || !this.visible || this.contextLost || document.hidden) {
      this.last = performance.now() / 1000;
      return;
    }

    const now = performance.now() / 1000;
    const dt = Math.min(now - this.last, 0.05);
    this.last = now;

    // lerp suave (exponencial) rumo ao estado alvo
    const k = 1 - Math.exp(-dt / this.tau);
    this.cur.speed += (this.target.speed - this.cur.speed) * k;
    this.cur.amplitude += (this.target.amplitude - this.cur.amplitude) * k;
    this.cur.pulseMin += (this.target.pulseMin - this.cur.pulseMin) * k;
    this.cur.pulseMax += (this.target.pulseMax - this.cur.pulseMax) * k;
    this.cur.tap += (this.target.tap - this.cur.tap) * k;

    this.phase += dt * this.cur.speed;
    if (this.phase > 1000) this.phase %= 1000;

    const gl = this.gl;
    gl.uniform1f(this.uniforms.time, this.phase);
    gl.uniform1f(this.uniforms.tap, this.cur.tap);
    gl.uniform1f(this.uniforms.amplitude, this.cur.amplitude);
    gl.uniform1f(this.uniforms.pulseMin, this.cur.pulseMin);
    gl.uniform1f(this.uniforms.pulseMax, this.cur.pulseMax);
    gl.uniform1f(this.uniforms.noiseType, 1.0); // trig
    gl.uniform1f(this.uniforms.light, this.light);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.scheduleRender();
  };
}

export function initChaosButtons(): void {
  const reduce = isReducedMotion();
  document.querySelectorAll<HTMLElement>(".chaos-button").forEach((btn) => {
    if (reduce) {
      btn.classList.add("is-static");
      return;
    }
    new ChaosButtonGL(btn);
  });
}
