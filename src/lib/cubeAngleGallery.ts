import { SettledAngleDistortion } from "./settledAngleDistortion";

interface CubeAngleGalleryOptions {
  labels: string[];
  images: string[];
  initialIndex?: number;
}

const ROTATIONS = [
  { x: 0, y: 0 },
  { x: 0, y: -90 },
  { x: 0, y: 180 },
  { x: 0, y: 90 },
  { x: 90, y: 0 },
  { x: -90, y: 0 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class CubeAngleGallery {
  private readonly root: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly cubes: HTMLElement[];
  private readonly dots: HTMLButtonElement[];
  private readonly previousButton: HTMLButtonElement | null;
  private readonly nextButton: HTMLButtonElement | null;
  private readonly counter: HTMLElement | null;
  private readonly label: HTMLElement | null;
  private readonly labels: string[];
  private readonly abortController = new AbortController();
  private readonly distortion: SettledAngleDistortion | null;
  private activeIndex = 0;
  private transitionTimer = 0;

  constructor(root: HTMLElement, options: CubeAngleGalleryOptions) {
    const stage = root.querySelector<HTMLElement>("[data-cube-stage]");
    if (!stage) throw new Error("Estrutura da galeria cubica incompleta");

    this.root = root;
    this.stage = stage;
    this.cubes = Array.from(root.querySelectorAll<HTMLElement>("[data-cube]"));
    this.dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-cube-dot]"));
    this.previousButton = root.querySelector<HTMLButtonElement>("[data-cube-prev]");
    this.nextButton = root.querySelector<HTMLButtonElement>("[data-cube-next]");
    this.counter = root.querySelector<HTMLElement>("[data-cube-current]");
    this.label = root.querySelector<HTMLElement>("[data-cube-label]");
    this.labels = options.labels;
    this.distortion = this.createDistortion(options.images);

    const signal = this.abortController.signal;
    this.previousButton?.addEventListener("click", () => this.moveTo(this.activeIndex - 1), { signal });
    this.nextButton?.addEventListener("click", () => this.moveTo(this.activeIndex + 1), { signal });
    this.dots.forEach((dot, index) => dot.addEventListener("click", () => this.moveTo(index), { signal }));
    this.root.addEventListener("keydown", this.handleKeydown, { signal });

    this.moveTo(options.initialIndex ?? 0, false);
  }

  moveTo(index: number, animate = true): void {
    const target = clamp(index, 0, this.labels.length - 1);
    const rotation = ROTATIONS[target] ?? ROTATIONS[0];
    const changed = target !== this.activeIndex;
    this.activeIndex = target;
    this.distortion?.prepare(target);

    if (animate && changed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.clearTimeout(this.transitionTimer);
      this.distortion?.hideForTransition();
      this.root.classList.remove("is-changing");
      void this.root.offsetWidth;
      this.root.classList.add("is-changing");
      this.transitionTimer = window.setTimeout(() => {
        this.root.classList.remove("is-changing");
        this.distortion?.settle(target);
      }, 2000);
    } else {
      window.clearTimeout(this.transitionTimer);
      this.root.classList.remove("is-changing");
      this.distortion?.settle(target);
    }

    this.cubes.forEach((cube) => {
      cube.style.setProperty("--bk-cube-rx", `${rotation.x}deg`);
      cube.style.setProperty("--bk-cube-ry", `${rotation.y}deg`);
    });
    this.updateState();
  }

  destroy(): void {
    window.clearTimeout(this.transitionTimer);
    this.abortController.abort();
    this.distortion?.destroy();
  }

  private createDistortion(images: string[]): SettledAngleDistortion | null {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    try {
      return new SettledAngleDistortion(this.root, this.stage, images);
    } catch {
      return null;
    }
  }

  private updateState(): void {
    this.dots.forEach((dot, index) => {
      const active = index === this.activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
    if (this.previousButton) this.previousButton.disabled = this.activeIndex === 0;
    if (this.nextButton) this.nextButton.disabled = this.activeIndex === this.labels.length - 1;
    if (this.counter) this.counter.textContent = String(this.activeIndex + 1).padStart(2, "0");
    if (this.label) this.label.textContent = this.labels[this.activeIndex] ?? "";
    this.stage.setAttribute("aria-label", `${this.labels[this.activeIndex]}, angulo ${this.activeIndex + 1} de ${this.labels.length}`);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.moveTo(this.activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.moveTo(this.activeIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      this.moveTo(this.labels.length - 1);
    }
  };
}
