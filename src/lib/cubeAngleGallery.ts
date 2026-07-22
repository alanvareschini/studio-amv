import { SettledAngleDistortion } from "./settledAngleDistortion";
import { isReducedMotion } from "./motionPreference";

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
  private swipePointerId: number | null = null;
  private swipeAxis: "pending" | "horizontal" | "vertical" = "pending";
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeStartTime = 0;
  private swipeDistance = 0;
  private swipeWidth = 1;

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

    const signal = this.abortController.signal;
    this.previousButton?.addEventListener("click", () => this.moveTo(this.activeIndex - 1), { signal });
    this.nextButton?.addEventListener("click", () => this.moveTo(this.activeIndex + 1), { signal });
    this.dots.forEach((dot, index) => dot.addEventListener("click", () => this.moveTo(index), { signal }));
    this.root.addEventListener("keydown", this.handleKeydown, { signal });
    this.stage.addEventListener("pointerdown", this.handleSwipeStart, { signal, passive: true });
    this.stage.addEventListener("pointermove", this.handleSwipeMove, { signal, passive: false });
    this.stage.addEventListener("pointerup", this.handleSwipeEnd, { signal, passive: true });
    this.stage.addEventListener("pointercancel", this.handleSwipeCancel, { signal, passive: true });
    this.distortion = this.createDistortion(options.images);

    this.moveTo(options.initialIndex ?? 0, false);
  }

  moveTo(index: number, animate = true): void {
    const target = clamp(index, 0, this.labels.length - 1);
    const rotation = ROTATIONS[target] ?? ROTATIONS[0];
    const changed = target !== this.activeIndex;
    this.activeIndex = target;
    this.distortion?.prepare(target);

    if (animate && changed && !isReducedMotion()) {
      window.clearTimeout(this.transitionTimer);
      this.distortion?.hideForTransition();
      this.root.classList.remove("is-changing");
      void this.root.offsetWidth;
      this.root.classList.add("is-changing");
      this.transitionTimer = window.setTimeout(() => {
        this.root.classList.remove("is-changing");
        this.distortion?.settle(target);
      }, this.transitionDuration);
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
    this.resetSwipe();
    this.abortController.abort();
    this.distortion?.destroy();
  }

  private get transitionDuration(): number {
    return matchMedia("(max-width: 600px), (pointer: coarse)").matches ? 1050 : 2000;
  }

  private createDistortion(images: string[]): SettledAngleDistortion | null {
    if (isReducedMotion()) return null;
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

  private handleSwipeStart = (event: PointerEvent): void => {
    if (
      event.pointerType !== "mouse"
      || !event.isPrimary
      || event.button !== 0
      || this.swipePointerId !== null
      || this.root.classList.contains("is-changing")
      || this.labels.length < 2
    ) return;

    this.swipePointerId = event.pointerId;
    this.swipeAxis = "pending";
    this.swipeStartX = event.clientX;
    this.swipeStartY = event.clientY;
    this.swipeStartTime = performance.now();
    this.swipeDistance = 0;
    this.swipeWidth = Math.max(1, this.stage.clientWidth);
    this.root.classList.add("is-swipe-tracking");
    if (event.pointerType === "mouse") this.stage.setPointerCapture?.(event.pointerId);
  };

  private handleSwipeMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.swipePointerId || this.swipeAxis === "vertical") return;

    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = event.clientY - this.swipeStartY;
    if (this.swipeAxis === "pending") {
      if (Math.hypot(deltaX, deltaY) < 7) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.12) {
        this.swipeAxis = "vertical";
        this.root.classList.remove("is-swipe-tracking");
        return;
      }
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
      this.swipeAxis = "horizontal";
      this.root.classList.add("is-swipe-dragging");
      this.stage.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    const atStart = this.activeIndex === 0 && deltaX > 0;
    const atEnd = this.activeIndex === this.labels.length - 1 && deltaX < 0;
    const resistedDistance = (atStart || atEnd) ? deltaX * 0.28 : deltaX;
    const limitedDistance = clamp(resistedDistance, -this.swipeWidth * 0.48, this.swipeWidth * 0.48);
    const progress = Math.min(1, Math.abs(limitedDistance) / (this.swipeWidth * 0.34));
    this.swipeDistance = deltaX;
    this.stage.style.setProperty("--bk-swipe-x", `${limitedDistance * 0.58}px`);
    this.stage.style.setProperty("--bk-swipe-rotate", `${clamp(limitedDistance / this.swipeWidth * 5, -3.5, 3.5)}deg`);
    this.stage.style.setProperty("--bk-swipe-scale", String(1 - progress * 0.018));
  };

  private handleSwipeEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.swipePointerId) return;
    const wasHorizontal = this.swipeAxis === "horizontal";
    const elapsed = Math.max(1, performance.now() - this.swipeStartTime);
    const velocity = this.swipeDistance / elapsed;
    const direction = this.swipeDistance < 0 ? 1 : -1;
    const target = this.activeIndex + direction;
    const canMove = target >= 0 && target < this.labels.length;
    const passedDistance = Math.abs(this.swipeDistance) >= Math.max(42, this.swipeWidth * 0.16);
    const passedVelocity = Math.abs(velocity) >= 0.46 && Math.abs(this.swipeDistance) >= 18;

    this.resetSwipe(event.pointerId);
    if (wasHorizontal && canMove && (passedDistance || passedVelocity)) this.moveTo(target);
  };

  private handleSwipeCancel = (event: PointerEvent): void => {
    if (event.pointerId === this.swipePointerId) this.resetSwipe(event.pointerId);
  };

  private resetSwipe(pointerId = this.swipePointerId): void {
    if (pointerId !== null && this.stage.hasPointerCapture?.(pointerId)) {
      this.stage.releasePointerCapture(pointerId);
    }
    this.swipePointerId = null;
    this.swipeAxis = "pending";
    this.swipeDistance = 0;
    this.root.classList.remove("is-swipe-tracking", "is-swipe-dragging");
    this.stage.style.setProperty("--bk-swipe-x", "0px");
    this.stage.style.setProperty("--bk-swipe-rotate", "0deg");
    this.stage.style.setProperty("--bk-swipe-scale", "1");
  }
}
