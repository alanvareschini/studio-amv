import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";

interface KineticCarouselOptions {
  initialIndex?: number;
  onChange?: (index: number) => void;
}

type SlideWithProgress = HTMLElement & { progress: number };
type SwiperWithTouchData = Swiper & { touchEventsData: { touchStartTime: number } };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class KineticCarousel {
  private readonly root: HTMLElement;
  private readonly slides: HTMLElement[];
  private readonly backgrounds: HTMLElement[];
  private readonly dots: HTMLButtonElement[];
  private readonly previousButton: HTMLButtonElement | null;
  private readonly nextButton: HTMLButtonElement | null;
  private readonly counter: HTMLElement | null;
  private readonly onChange?: (index: number) => void;
  private readonly swiper: Swiper;
  private dragMoved = false;
  private suppressActivationUntil = 0;

  constructor(root: HTMLElement, options: KineticCarouselOptions = {}) {
    const viewport = root.querySelector<HTMLElement>("[data-kc-viewport]");
    if (!viewport) throw new Error("Estrutura do carrossel incompleta");

    this.root = root;
    this.slides = Array.from(root.querySelectorAll<HTMLElement>("[data-kc-slide]"));
    this.backgrounds = Array.from(root.querySelectorAll<HTMLElement>("[data-kc-background]"));
    this.dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-kc-dot]"));
    this.previousButton = root.querySelector<HTMLButtonElement>("[data-kc-prev]");
    this.nextButton = root.querySelector<HTMLButtonElement>("[data-kc-next]");
    this.counter = root.querySelector<HTMLElement>("[data-kc-current]");
    this.onChange = options.onChange;

    this.swiper = new Swiper(viewport, {
      modules: [Navigation, A11y],
      a11y: {
        slideLabelMessage: "{{index}} de {{slidesLength}}",
      },
      initialSlide: options.initialIndex ?? 0,
      loop: false,
      centeredSlides: true,
      slidesPerView: "auto",
      watchSlidesProgress: true,
      speed: 760,
      grabCursor: true,
      followFinger: true,
      touchRatio: 1.12,
      threshold: 5,
      resistanceRatio: 0.84,
      longSwipesMs: 220,
      longSwipesRatio: 0.1,
      preventClicks: true,
      preventClicksPropagation: true,
      touchStartPreventDefault: true,
      navigation: {
        prevEl: this.previousButton,
        nextEl: this.nextButton,
      },
      breakpoints: {
        0: { spaceBetween: 14 },
        601: { spaceBetween: 24 },
        1000: { spaceBetween: 38 },
      },
      on: {
        init: (swiper) => {
          this.paint(swiper);
          this.updateState(swiper.activeIndex, false);
        },
        progress: (swiper) => this.paint(swiper),
        setTransition: (_swiper, speed) => this.setTransition(speed),
        slideChange: (swiper) => this.updateState(swiper.activeIndex),
        touchStart: () => {
          this.dragMoved = false;
          this.root.classList.add("is-dragging");
          this.setTransition(0);
        },
        sliderMove: (swiper) => {
          if (Math.abs(swiper.touches.diff) > 6) this.dragMoved = true;
          this.paint(swiper);
        },
        touchEnd: (swiper) => {
          this.root.classList.remove("is-dragging");
          if (this.dragMoved) this.suppressActivationUntil = performance.now() + 360;
          const elapsed = Date.now() - (swiper as SwiperWithTouchData).touchEventsData.touchStartTime;
          const velocity = Math.abs(swiper.touches.diff) / Math.max(1, elapsed);
          swiper.params.speed = clamp(760 - velocity * 520, 240, 760);
        },
        transitionEnd: (swiper) => {
          this.root.classList.remove("is-dragging");
          swiper.params.speed = 760;
          this.paint(swiper);
        },
        resize: (swiper) => {
          swiper.slideTo(swiper.activeIndex, 0, false);
          this.paint(swiper);
        },
      },
    });

    this.root.addEventListener("keydown", this.handleKeydown);
    this.dots.forEach((dot, index) => dot.addEventListener("click", () => this.moveTo(index, 620)));
  }

  get activeIndex(): number {
    return this.swiper.activeIndex;
  }

  get canActivate(): boolean {
    return performance.now() >= this.suppressActivationUntil;
  }

  moveTo(index: number, duration = 760): void {
    const target = clamp(index, 0, this.slides.length - 1);
    this.swiper.update();
    this.swiper.slideTo(target, duration);
    if (duration === 0) {
      this.paint(this.swiper);
      this.updateState(target);
    }
  }

  destroy(): void {
    this.root.removeEventListener("keydown", this.handleKeydown);
    this.swiper.destroy(true, true);
  }

  private paint(swiper: Swiper): void {
    swiper.slides.forEach((rawSlide, index) => {
      const slide = rawSlide as SlideWithProgress;
      const progress = clamp(slide.progress, -1.35, 1.35);
      const distance = Math.min(1, Math.abs(progress));
      const card = slide.querySelector<HTMLElement>("[data-kc-card]");
      const media = slide.querySelector<HTMLElement>("[data-kc-media]");
      const shadow = slide.querySelector<HTMLElement>("[data-kc-shadow]");
      const masks = Array.from(slide.querySelectorAll<HTMLElement>("[data-kc-mask]"));

      if (card) card.style.transform = `scale(${1 - distance * 0.2})`;
      if (media) {
        const translateX = progress * -100;
        const rotation = distance * 15 - 15;
        media.style.transform = `translate3d(${translateX}px, 0, 0) rotate(${rotation}deg)`;
      }
      if (shadow) shadow.style.transform = `translate3d(${progress * -50}px, 0, 0) scale(${1 - distance * 0.16})`;
      masks.forEach((mask, maskIndex) => {
        const offset = distance * 5 * Math.min(maskIndex + 1, 2);
        mask.style.transform = `translate3d(0, ${offset}px, 0)`;
        mask.style.opacity = String(1 - distance * 0.18);
      });
      slide.style.zIndex = String(10 - Math.round(distance * 5));

      const background = this.backgrounds[index];
      if (background) background.style.opacity = String(0.58 - distance * 0.58);
    });
  }

  private setTransition(speed: number): void {
    const value = `${speed}ms`;
    const animated = [
      ...this.slides.flatMap((slide) => [
        slide.querySelector<HTMLElement>("[data-kc-card]"),
        slide.querySelector<HTMLElement>("[data-kc-media]"),
        slide.querySelector<HTMLElement>("[data-kc-shadow]"),
        ...Array.from(slide.querySelectorAll<HTMLElement>("[data-kc-mask]")),
      ]),
      ...this.backgrounds,
    ].filter((element): element is HTMLElement => Boolean(element));

    animated.forEach((element) => {
      element.style.transitionDuration = value;
    });
  }

  private updateState(index: number, notify = true): void {
    this.slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.querySelectorAll<HTMLElement>("button, a, [tabindex]").forEach((element) => {
        element.tabIndex = active ? 0 : -1;
      });
    });
    this.dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
    if (this.counter) this.counter.textContent = String(index + 1).padStart(2, "0");
    if (notify) this.onChange?.(index);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.moveTo(this.activeIndex - 1, 620);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.moveTo(this.activeIndex + 1, 620);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.moveTo(0, 620);
    } else if (event.key === "End") {
      event.preventDefault();
      this.moveTo(this.slides.length - 1, 620);
    }
  };
}
