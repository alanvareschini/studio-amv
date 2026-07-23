import {
  getHardwarePerformanceTier,
  getMotionMode,
  getPerformanceTier,
  isReducedMotion,
  isSystemMotionReduced,
  setRuntimePerformanceTier,
  type PerformanceTier,
} from "./motionPreference";

const SAMPLE_WINDOW_MS = 2000;
const MAX_WINDOWS = 12;
const BAD_WINDOWS_REQUIRED = 3;
const GOOD_WINDOWS_REQUIRED = 4;
const START_DELAY_MS = 3200;
const TIER_ORDER: PerformanceTier[] = ["minimal", "low", "balanced", "high"];

const percentile = (values: number[], amount: number): number => {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * amount))];
};

const adjacentTier = (tier: PerformanceTier, direction: -1 | 1): PerformanceTier => {
  const index = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, Math.min(TIER_ORDER.length - 1, index + direction))];
};

export function initRuntimePerformanceMonitor(): void {
  if (getMotionMode() !== "auto" || isReducedMotion()) return;

  let raf = 0;
  let fallbackTimer = 0;
  let startTimer = 0;
  let frameSamples: number[] = [];
  let windowStartedAt = 0;
  let lastFrameAt = 0;
  let longTasks = 0;
  let measuredWindows = 0;
  let badWindows = 0;
  let goodWindows = 0;
  let cooldownWindows = 0;
  let downgradedThisRun = false;
  let started = false;
  let stopped = false;
  let longTaskObserver: PerformanceObserver | null = null;

  const stop = () => {
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.clearTimeout(fallbackTimer);
    window.clearTimeout(startTimer);
    raf = 0;
    longTaskObserver?.disconnect();
    longTaskObserver = null;
  };

  const resetWindow = (time: number) => {
    frameSamples = [];
    windowStartedAt = time;
    lastFrameAt = time;
    longTasks = 0;
  };

  const evaluateWindow = (time: number) => {
    if (frameSamples.length < 30) {
      resetWindow(time);
      return;
    }

    const p75 = percentile(frameSamples, 0.75);
    const p95 = percentile(frameSamples, 0.95);
    const slowFrames = frameSamples.filter((delta) => delta > 34).length / frameSamples.length;
    const average = frameSamples.reduce((total, delta) => total + delta, 0) / frameSamples.length;
    const fps = Math.min(120, 1000 / Math.max(average, 1));
    const bad = p75 > 25 || slowFrames > 0.22 || (p95 > 55 && slowFrames > 0.08) || longTasks >= 3;
    const good = p75 < 19.5 && p95 < 32 && slowFrames < 0.06 && longTasks === 0;

    document.documentElement.dataset.performanceFps = String(Math.round(fps));
    measuredWindows += 1;

    if (cooldownWindows > 0) {
      cooldownWindows -= 1;
      badWindows = 0;
      goodWindows = 0;
      resetWindow(time);
      return;
    }

    badWindows = bad ? badWindows + 1 : 0;
    goodWindows = good ? goodWindows + 1 : 0;

    const currentTier = getPerformanceTier();
    const hardwareTier = getHardwarePerformanceTier();
    const maximumMeasuredTier = isSystemMotionReduced()
      ? "low"
      : adjacentTier(hardwareTier, 1);
    if (badWindows >= BAD_WINDOWS_REQUIRED && currentTier !== "minimal") {
      setRuntimePerformanceTier(adjacentTier(currentTier, -1));
      downgradedThisRun = true;
      cooldownWindows = 1;
      badWindows = 0;
      goodWindows = 0;
    } else if (
      goodWindows >= GOOD_WINDOWS_REQUIRED
      && !downgradedThisRun
      && TIER_ORDER.indexOf(currentTier) < TIER_ORDER.indexOf(maximumMeasuredTier)
    ) {
      setRuntimePerformanceTier(adjacentTier(currentTier, 1));
      cooldownWindows = 2;
      badWindows = 0;
      goodWindows = 0;
    }

    resetWindow(time);
    if (measuredWindows >= MAX_WINDOWS) stop();
  };

  const tick = (time: number) => {
    raf = 0;
    if (stopped) return;
    if (document.hidden || document.body.classList.contains("ci-site-hidden")) {
      resetWindow(time);
      raf = window.requestAnimationFrame(tick);
      return;
    }

    if (!windowStartedAt) resetWindow(time);
    const delta = time - lastFrameAt;
    lastFrameAt = time;
    if (delta > 0 && delta < 250) frameSamples.push(delta);
    if (time - windowStartedAt >= SAMPLE_WINDOW_MS) evaluateWindow(time);
    if (!stopped) raf = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (started || stopped || getMotionMode() !== "auto") return;
    started = true;
    if (
      typeof PerformanceObserver !== "undefined"
      && PerformanceObserver.supportedEntryTypes?.includes("longtask")
    ) {
      longTaskObserver = new PerformanceObserver((list) => {
        longTasks += list.getEntries().length;
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    }
    raf = window.requestAnimationFrame(tick);
  };

  const scheduleStart = () => {
    if (started || startTimer) return;
    startTimer = window.setTimeout(start, START_DELAY_MS);
  };

  window.addEventListener("amv:intro-complete", scheduleStart, { once: true });
  window.addEventListener("amv:visuals-ready", () => {
    if (!document.body.classList.contains("ci-site-hidden")) scheduleStart();
  }, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && started) resetWindow(performance.now());
  }, { passive: true });
  window.addEventListener("pagehide", stop, { once: true });

  if (!document.body.classList.contains("ci-site-hidden")) scheduleStart();
  fallbackTimer = window.setTimeout(() => {
    if (!document.body.classList.contains("ci-site-hidden")) scheduleStart();
  }, 5000);
}
