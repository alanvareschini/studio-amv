export type IglooAtlasGlyph = {
  el: HTMLElement;
  character: string;
  atlasAmount: number;
  atlasFrame: number;
  atlasFont: string;
  atlasAdvance: number;
  atlasAscent: number;
  atlasDescent: number;
  atlasVisible: boolean;
  atlasLeft: number;
  atlasTop: number;
  atlasWidth: number;
  atlasHeight: number;
};

type AtlasSlice = readonly [x: number, y: number, width: number, height: number, alpha: number];

// O original troca oito celulas de um atlas. Estes oito estados sao mascaras
// proprias, sem deslocamento: apenas a cobertura do glifo muda entre os quadros.
const ATLAS_FRAMES: readonly (readonly AtlasSlice[])[] = [
  [
    [0, 0, 1, 1, 0.14],
    [0, 0.08, 1, 0.18, 0.56],
    [0.08, 0.58, 0.84, 0.16, 0.38],
  ],
  [
    [0, 0.02, 0.72, 0.24, 0.74],
    [0.24, 0.32, 0.76, 0.18, 0.3],
    [0, 0.68, 0.88, 0.28, 0.58],
  ],
  [
    [0.08, 0, 0.92, 0.12, 0.7],
    [0, 0.2, 0.64, 0.12, 0.34],
    [0.34, 0.4, 0.66, 0.14, 0.76],
    [0, 0.62, 0.78, 0.1, 0.28],
    [0.18, 0.82, 0.82, 0.16, 0.62],
  ],
  [
    [0, 0.04, 0.52, 0.3, 0.28],
    [0.16, 0.34, 0.84, 0.2, 0.78],
    [0, 0.6, 0.66, 0.12, 0.46],
    [0.42, 0.76, 0.58, 0.2, 0.68],
  ],
  [
    [0.04, 0.06, 0.42, 0.13, 0.62],
    [0.48, 0.22, 0.52, 0.12, 0.3],
    [0, 0.42, 0.7, 0.1, 0.82],
    [0.28, 0.6, 0.72, 0.12, 0.34],
    [0.08, 0.82, 0.58, 0.14, 0.72],
  ],
  [
    [0, 0, 1, 1, 0.1],
    [0.16, 0.12, 0.84, 0.16, 0.42],
    [0, 0.38, 0.74, 0.2, 0.72],
    [0.34, 0.7, 0.66, 0.22, 0.5],
  ],
  [
    [0, 0.02, 0.78, 0.22, 0.4],
    [0.3, 0.28, 0.7, 0.12, 0.76],
    [0.04, 0.48, 0.9, 0.16, 0.32],
    [0, 0.74, 0.62, 0.24, 0.7],
  ],
  [
    [0, 0, 1, 1, 0.18],
    [0, 0.18, 0.86, 0.18, 0.58],
    [0.2, 0.52, 0.8, 0.12, 0.82],
    [0, 0.78, 0.74, 0.16, 0.44],
  ],
];

export type IglooGlyphAtlas = {
  resize(): void;
  measure(glyphs: IglooAtlasGlyph[]): void;
  render(glyphs: IglooAtlasGlyph[]): number;
  clear(): void;
};

export function createIglooGlyphAtlas(host: HTMLElement): IglooGlyphAtlas | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;

  canvas.className = "igloo-glyph-atlas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.hidden = true;
  host.append(canvas);
  document.documentElement.classList.add("igloo-atlas-enabled");

  let dpr = 1;
  let width = 1;
  let height = 1;
  let lastFont = "";

  const resize = () => {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.25 : 1.5);
    const hostBounds = host.getBoundingClientRect();
    width = Math.max(1, Math.round(hostBounds.width));
    height = Math.max(1, Math.round(host.scrollHeight || hostBounds.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    lastFont = "";
  };

  const measure = (glyphs: IglooAtlasGlyph[]) => {
    glyphs.forEach((glyph) => {
      const style = getComputedStyle(glyph.el);
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      glyph.atlasFont =
        style.font ||
        `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.font = glyph.atlasFont;
      const metrics = context.measureText(glyph.character);
      glyph.atlasAdvance = metrics.width;
      glyph.atlasAscent = metrics.fontBoundingBoxAscent || fontSize * 0.8;
      glyph.atlasDescent = metrics.fontBoundingBoxDescent || fontSize * 0.2;
    });
    lastFont = "";
  };

  const clear = () => {
    context.clearRect(0, 0, width, height);
    canvas.hidden = true;
  };

  const render = (glyphs: IglooAtlasGlyph[]) => {
    const currentBounds = host.getBoundingClientRect();
    const currentWidth = Math.max(1, Math.round(currentBounds.width));
    const currentHeight = Math.max(1, Math.round(host.scrollHeight || currentBounds.height));
    if (currentWidth !== width || currentHeight !== height) resize();

    const hostBounds = host.getBoundingClientRect();
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.shadowBlur = 0;
    context.clearRect(0, 0, width, height);
    let activeGlyphs = 0;
    const lightTheme = document.documentElement.dataset.theme === "light";
    const fill = lightTheme ? "rgb(118 128 141)" : "rgb(214 222 226)";
    const shadow = lightTheme ? "rgb(112 132 150 / 0.22)" : "rgb(178 224 238 / 0.34)";

    for (let index = 0; index < glyphs.length; index += 1) {
      const glyph = glyphs[index];
      if (glyph.atlasAmount < 0.012) continue;

      if (!glyph.atlasVisible || glyph.atlasWidth <= 0 || glyph.atlasHeight <= 0) continue;

      activeGlyphs += 1;
      if (glyph.atlasFont !== lastFont) {
        context.font = glyph.atlasFont;
        lastFont = glyph.atlasFont;
      }

      const localLeft = glyph.atlasLeft - hostBounds.left;
      const localTop = glyph.atlasTop - hostBounds.top;
      const textHeight = glyph.atlasAscent + glyph.atlasDescent;
      const textX = localLeft + (glyph.atlasWidth - glyph.atlasAdvance) * 0.5;
      const baseline = localTop + (glyph.atlasHeight - textHeight) * 0.5 + glyph.atlasAscent;
      const frame = ATLAS_FRAMES[glyph.atlasFrame] || ATLAS_FRAMES[0];
      context.fillStyle = fill;
      context.shadowColor = shadow;
      context.shadowBlur = Math.min(6, glyph.atlasHeight * 0.16);

      for (let sliceIndex = 0; sliceIndex < frame.length; sliceIndex += 1) {
        const [x, y, sliceWidth, sliceHeight, alpha] = frame[sliceIndex];
        context.save();
        context.beginPath();
        context.rect(
          localLeft + glyph.atlasWidth * x - 1,
          localTop + glyph.atlasHeight * y - 1,
          glyph.atlasWidth * sliceWidth + 2,
          glyph.atlasHeight * sliceHeight + 2,
        );
        context.clip();
        context.globalAlpha = Math.min(0.9, glyph.atlasAmount * alpha);
        context.fillText(glyph.character, textX, baseline);
        context.restore();
      }
    }

    canvas.hidden = activeGlyphs === 0;
    return activeGlyphs;
  };

  resize();
  return { resize, measure, render, clear };
}
