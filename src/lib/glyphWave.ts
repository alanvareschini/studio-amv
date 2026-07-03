// Efeito "glyph simulation" (adaptado do Overpass) para TÍTULOS de card.
// Desenha o título num <canvas> sobreposto; o cursor cria uma onda que dá glitch
// e clareia os glifos. O texto real fica por baixo (transparente) p/ SEO/seleção.

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Glyph {
  ch: string;
  x: number;
  y: number;
  w: number;
  size: number;
  font: string;
  color: [number, number, number];
  seed: number;
}

function seeded(v: number): number {
  const r = Math.sin(v * 12.9898 + 78.233) * 43758.5453;
  return r - Math.floor(r);
}
function smoothstep(a: number, b: number, v: number): number {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax, aby = by - ay;
  const l = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / l));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

class GlyphWave {
  private el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private color: [number, number, number] = [200, 210, 224];
  private font = "";
  private size = 16;
  private lineHeight = 20;
  private text = "";
  private glyphs: Glyph[] = [];
  private cache = new Map<string, HTMLCanvasElement>();
  private W = 0;
  private H = 0;
  private fw = 1;
  private fh = 1;
  private field!: Float32Array;
  private next!: Float32Array;
  private rim!: Float32Array;
  private ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, inside: false, vel: 0, tvel: 0, last: 0 };
  private running = false;
  private visible = true;

  constructor(el: HTMLElement) {
    this.el = el;
    this.text = (el.textContent || "").trim();
    if (!this.text) throw new Error("sem texto");

    const cs = getComputedStyle(el);
    this.size = parseFloat(cs.fontSize) || 16;
    this.lineHeight = parseFloat(cs.lineHeight) || this.size * 1.25;
    this.font = `${cs.fontWeight} ${this.size}px ${cs.fontFamily}`;
    const m = cs.color.match(/\d+/g);
    if (m) this.color = [Number(m[0]), Number(m[1]), Number(m[2])];

    if (cs.position === "static") el.style.position = "relative";
    el.style.color = "transparent";

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    el.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;

    el.addEventListener("pointermove", this.onMove, { passive: true });
    el.addEventListener("pointerenter", this.onMove, { passive: true });
    el.addEventListener("pointerleave", () => (this.ptr.inside = false), { passive: true });

    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.ensureRunning();
    }, { threshold: 0.01 }).observe(el);
    new ResizeObserver(() => this.resize()).observe(el);

    this.resize();
  }

  private resize(): void {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.W = w; this.H = h;
    const dpr = Math.min(devicePixelRatio, 1.5);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fw = Math.max(24, Math.round(w / 3));
    this.fh = Math.max(12, Math.round(h / 3));
    this.field = new Float32Array(this.fw * this.fh);
    this.next = new Float32Array(this.fw * this.fh);
    this.rim = new Float32Array(this.fw * this.fh);
    this.cache.clear();
    this.layout();
    this.draw();
  }

  private layout(): void {
    this.glyphs = [];
    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = this.font;
    const spaceW = measure.measureText(" ").width;
    let x = 0;
    let line = 0;
    const baseTop = Math.max(0, (this.lineHeight - this.size) / 2);
    this.text.split(" ").forEach((word, wi) => {
      const ww = measure.measureText(word).width;
      if (wi > 0 && x + ww > this.W) {
        x = 0; line++;
      } else if (wi > 0) {
        x += spaceW;
      }
      [...word].forEach((ch, ci) => {
        const w = measure.measureText(ch).width;
        this.glyphs.push({
          ch, x, y: line * this.lineHeight + baseTop, w,
          size: this.size, font: this.font, color: this.color,
          seed: seeded(wi * 71 + ci),
        });
        x += w;
      });
    });
  }

  private frameCanvas(g: Glyph, frame: number): HTMLCanvasElement {
    const key = `${g.ch}|${frame}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const scale = 2;
    const w = Math.max(10, Math.ceil(g.w + 8));
    const h = Math.ceil(g.size * 1.6);
    const base = document.createElement("canvas");
    base.width = w * scale; base.height = h * scale;
    const bc = base.getContext("2d")!;
    bc.scale(scale, scale);
    bc.font = g.font;
    bc.textBaseline = "top";
    bc.fillStyle = `rgb(${g.color.join(",")})`;
    bc.fillText(g.ch, 4, 2);
    if (frame === 0) { this.cache.set(key, base); return base; }

    const out = document.createElement("canvas");
    out.width = base.width; out.height = base.height;
    const oc = out.getContext("2d")!;
    const strip = 3 * scale;
    for (let y = 0; y < out.height; y += strip) {
      const hash = seeded(g.ch.charCodeAt(0) * 31 + frame * 109 + (y / strip) * 17);
      const shift = Math.round((hash - 0.5) * Math.min(6, frame + 1)) * scale;
      if (hash > 0.12 + frame * 0.012) {
        oc.drawImage(base, 0, y, base.width, strip, shift, y, base.width, strip);
      }
    }
    oc.globalCompositeOperation = "screen";
    oc.globalAlpha = 0.12 + frame * 0.025;
    oc.drawImage(base, frame % 2 === 0 ? scale : -scale, 0);
    this.cache.set(key, out);
    return out;
  }

  private onMove = (e: PointerEvent): void => {
    const b = this.canvas.getBoundingClientRect();
    this.ptr.x = (e.clientX - b.left) / b.width;
    this.ptr.y = (e.clientY - b.top) / b.height;
    this.ptr.inside = this.ptr.x >= 0 && this.ptr.x <= 1 && this.ptr.y >= 0 && this.ptr.y <= 1;
    this.ensureRunning();
  };

  private updateSim(time: number): number {
    let dist = Math.hypot(this.ptr.x - this.ptr.px, this.ptr.y - this.ptr.py);
    if (dist > 0) this.ptr.last = time;
    if (time - this.ptr.last > 150 || !this.ptr.inside || dist > 0.3) {
      this.ptr.px = this.ptr.x; this.ptr.py = this.ptr.y; this.ptr.tvel = 0; dist = 0;
    }
    this.ptr.tvel = Math.max(0, Math.min(1, (this.ptr.tvel + dist * 6) * 0.88));
    const eased = 1 - Math.pow(1 - this.ptr.tvel, 4);
    this.ptr.vel += (eased - this.ptr.vel) * 0.1;
    const radius = 0.05 * smoothstep(0.1, 1, this.ptr.vel) * this.fh;
    const fw = this.fw, fh = this.fh;
    let energy = 0;
    for (let y = 1; y < fh - 1; y++) {
      for (let x = 1; x < fw - 1; x++) {
        const i = y * fw + x;
        const drift = Math.sin(x * 0.093 + y * 0.071 + time * 0.00072) > 0 ? 1 : -1;
        const sx = Math.max(1, Math.min(fw - 2, x + drift));
        const previous = this.field[y * fw + sx];
        let nv = Math.max(this.field[i - 1], this.field[i + 1], this.field[i - fw], this.field[i + fw]);
        if (this.ptr.inside && radius > 0.1) {
          const ld = segDist(x, y, this.ptr.px * fw, this.ptr.py * fh, this.ptr.x * fw, this.ptr.y * fh);
          nv += Math.pow(Math.max(0, 1 - ld / radius), 3);
        }
        nv = Math.min(1, Math.max(previous * 0.12, nv) * 0.985);
        this.next[i] = nv;
        this.rim[i] = nv - this.field[i];
        if (nv > energy) energy = nv;
      }
    }
    this.field.set(this.next);
    this.next.fill(0);
    this.ptr.px = this.ptr.x; this.ptr.py = this.ptr.y;
    return energy;
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.W, this.H);
    for (const g of this.glyphs) {
      const u = Math.max(0, Math.min(0.999, (g.x + g.w * 0.5) / this.W));
      const v = Math.max(0, Math.min(0.999, (g.y + g.size * 0.5) / this.H));
      const idx = Math.floor(v * this.fh) * this.fw + Math.floor(u * this.fw);
      const intensity = this.field[idx] || 0;
      const rim = Math.max(0, Math.min(1, (this.rim[idx] || 0) * 18));
      const frame = Math.floor(Math.max(0, Math.min(5, (rim / 0.99) * 5)) * 5.654) % 8;
      const fc = this.frameCanvas(g, frame);
      const dw = fc.width * 0.5, dh = fc.height * 0.5;
      this.ctx.globalAlpha = 1;
      this.ctx.filter = "none";
      this.ctx.drawImage(fc, g.x - 4, g.y - 2, dw, dh);
      const hl = smoothstep(0.6, 0.8, intensity);
      if (hl > 0) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = "screen";
        this.ctx.globalAlpha = hl * 0.7;
        this.ctx.filter = "brightness(1.4)";
        this.ctx.drawImage(fc, g.x - 4, g.y - 2, dw, dh);
        this.ctx.restore();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  private ensureRunning(): void {
    if (this.running || !this.visible || reduce()) return;
    this.running = true;
    requestAnimationFrame(this.loop);
  }

  private rest(): void {
    this.field.fill(0);
    this.next.fill(0);
    this.rim.fill(0);
    this.ptr.vel = 0;
    this.ptr.tvel = 0;
    this.draw();
    this.running = false;
  }

  private loop = (time: number): void => {
    if (!this.visible) { this.rest(); return; }
    const energy = this.updateSim(time);
    this.draw();
    if (!this.ptr.inside && energy < 0.01 && this.ptr.vel < 0.01) {
      this.rest();
      return;
    }
    requestAnimationFrame(this.loop);
  };
}

export function initGlyphWave(selector: string): void {
  if (reduce()) return;
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    try {
      new GlyphWave(el);
    } catch {
      /* ignora títulos vazios */
    }
  });
}

