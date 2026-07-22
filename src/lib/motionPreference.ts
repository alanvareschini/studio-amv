export type MotionMode = "auto" | "full" | "balanced" | "reduced";
export type PerformanceTier = "high" | "balanced" | "low";

export type PerformanceBudget = {
  tier: PerformanceTier;
  heroPixelRatioMobile: number;
  heroPixelRatioDesktop: number;
  heroSimulationSize: number;
  heroSimulationStrideMobile: number;
  heroSimulationStrideDesktop: number;
  heroFps: number;
  heroBackgroundFps: number;
  headingPixelRatio: number;
  headingFps: number;
  chaosPixelRatioMobile: number;
  chaosPixelRatioDesktop: number;
  chaosFps: number;
  iglooFieldScale: number;
  iglooPixelRatioMobile: number;
  iglooPixelRatioDesktop: number;
  distortionSegmentsX: number;
  distortionSegmentsY: number;
  distortionPixelRatioMobile: number;
  distortionPixelRatioDesktop: number;
  distortionFps: number;
  packagePhysicsFps: number;
  gyroFps: number;
};

const STORAGE_KEY = "amv-motion-mode";
const RUNTIME_STORAGE_KEY = "amv-runtime-performance-tier";
const RUNTIME_TTL_MS = 30 * 60 * 1000;
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const TIER_RANK: Record<PerformanceTier, number> = {
  low: 0,
  balanced: 1,
  high: 2,
};
let detectedHardwareTier: PerformanceTier | null = null;

const BUDGETS: Record<PerformanceTier, PerformanceBudget> = {
  high: {
    tier: "high",
    heroPixelRatioMobile: 1.75,
    heroPixelRatioDesktop: 2,
    heroSimulationSize: 128,
    heroSimulationStrideMobile: 2,
    heroSimulationStrideDesktop: 1,
    heroFps: 60,
    heroBackgroundFps: 45,
    headingPixelRatio: 2,
    headingFps: 60,
    chaosPixelRatioMobile: 1.5,
    chaosPixelRatioDesktop: 2,
    chaosFps: 60,
    iglooFieldScale: 5,
    iglooPixelRatioMobile: 1.25,
    iglooPixelRatioDesktop: 1.5,
    distortionSegmentsX: 96,
    distortionSegmentsY: 54,
    distortionPixelRatioMobile: 1.4,
    distortionPixelRatioDesktop: 1.8,
    distortionFps: 60,
    packagePhysicsFps: 60,
    gyroFps: 60,
  },
  balanced: {
    tier: "balanced",
    heroPixelRatioMobile: 1.35,
    heroPixelRatioDesktop: 1.7,
    heroSimulationSize: 112,
    heroSimulationStrideMobile: 2,
    heroSimulationStrideDesktop: 1,
    heroFps: 45,
    heroBackgroundFps: 36,
    headingPixelRatio: 1.5,
    headingFps: 45,
    chaosPixelRatioMobile: 1.25,
    chaosPixelRatioDesktop: 1.5,
    chaosFps: 45,
    iglooFieldScale: 6,
    iglooPixelRatioMobile: 1,
    iglooPixelRatioDesktop: 1.25,
    distortionSegmentsX: 72,
    distortionSegmentsY: 40,
    distortionPixelRatioMobile: 1.15,
    distortionPixelRatioDesktop: 1.45,
    distortionFps: 45,
    packagePhysicsFps: 45,
    gyroFps: 45,
  },
  low: {
    tier: "low",
    heroPixelRatioMobile: 1,
    heroPixelRatioDesktop: 1.25,
    heroSimulationSize: 88,
    heroSimulationStrideMobile: 2,
    heroSimulationStrideDesktop: 2,
    heroFps: 30,
    heroBackgroundFps: 30,
    headingPixelRatio: 1,
    headingFps: 30,
    chaosPixelRatioMobile: 1,
    chaosPixelRatioDesktop: 1,
    chaosFps: 30,
    iglooFieldScale: 8,
    iglooPixelRatioMobile: 1,
    iglooPixelRatioDesktop: 1,
    distortionSegmentsX: 52,
    distortionSegmentsY: 30,
    distortionPixelRatioMobile: 1,
    distortionPixelRatioDesktop: 1,
    distortionFps: 30,
    packagePhysicsFps: 30,
    gyroFps: 30,
  },
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
  };
};

const isMotionMode = (value: unknown): value is MotionMode =>
  value === "auto" || value === "full" || value === "balanced" || value === "reduced";

const isPerformanceTier = (value: unknown): value is PerformanceTier =>
  value === "high" || value === "balanced" || value === "low";

function detectGpuClass(): "high" | "balanced" | "low" | "none" {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { powerPreference: "low-power" })
    ?? canvas.getContext("webgl", { powerPreference: "low-power" });
  if (!gl) return "none";

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
  ).toLowerCase();
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const lowGpu = /mali[-_\s]*(?:g31|g35|g51|g52|g57|t\d+)|powervr.*(?:ge8|rogue ge)|adreno.*(?:3\d\d|4\d\d|50\d|51[0-6]|610)/;
  const highGpu = /adreno.*(?:7\d\d|8\d\d|6(?:4\d|5\d|6\d|7\d|8\d))|mali[-_\s]*(?:g7(?:1\d|2\d)|g710|g715|g720)|xclipse|apple gpu/;

  if (lowGpu.test(renderer)) return "low";
  if (highGpu.test(renderer)) return "high";
  return "balanced";
}

function detectHardwareTier(): PerformanceTier {
  if (detectedHardwareTier) return detectedHardwareTier;
  const hints = navigator as NavigatorWithHints;
  const memory = hints.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const mobile = matchMedia("(pointer: coarse), (max-width: 760px)").matches;
  const gpu = detectGpuClass();
  let score = 0;

  if (gpu === "none") {
    detectedHardwareTier = "low";
    return detectedHardwareTier;
  }
  if (gpu === "low") score -= 3;
  if (gpu === "high") score += 2;

  if (typeof memory === "number") {
    if (memory <= 2) score -= 3;
    else if (memory <= 4) score -= 1;
    else if (memory >= 8) score += 1;
  }

  if (typeof cores === "number") {
    if (cores <= 4) score -= 2;
    else if (cores <= 6) score -= 1;
    else if (cores >= 8) score += 0.5;
  }

  if (mobile && typeof memory === "number" && memory <= 4) score -= 0.5;
  if (hints.connection?.saveData) score -= 2;

  if (score <= -2) detectedHardwareTier = "low";
  else if (
    score >= 2.5
    || (!mobile && gpu !== "low" && (memory ?? 8) >= 8 && (cores ?? 8) >= 8)
  ) detectedHardwareTier = "high";
  else detectedHardwareTier = "balanced";
  return detectedHardwareTier;
}

function lowerTier(first: PerformanceTier, second: PerformanceTier): PerformanceTier {
  return TIER_RANK[first] <= TIER_RANK[second] ? first : second;
}

function getRuntimeTier(): PerformanceTier | null {
  try {
    const raw = sessionStorage.getItem(RUNTIME_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { tier?: unknown; at?: unknown };
    if (
      !isPerformanceTier(saved.tier)
      || typeof saved.at !== "number"
      || Date.now() - saved.at > RUNTIME_TTL_MS
    ) {
      sessionStorage.removeItem(RUNTIME_STORAGE_KEY);
      return null;
    }
    return saved.tier;
  } catch {
    return null;
  }
}

function resolveAutoTier(): PerformanceTier {
  if (matchMedia(REDUCED_QUERY).matches) return "low";
  const hardwareTier = detectHardwareTier();
  const runtimeTier = getRuntimeTier();
  return runtimeTier ? lowerTier(hardwareTier, runtimeTier) : hardwareTier;
}

export function getMotionMode(): MotionMode {
  const datasetMode = document.documentElement.dataset.motionPreference;
  if (isMotionMode(datasetMode)) return datasetMode;

  try {
    const storedMode = localStorage.getItem(STORAGE_KEY);
    if (isMotionMode(storedMode)) return storedMode;
  } catch {
    // Storage can be unavailable in private browsing; Auto remains a safe default.
  }

  return "auto";
}

function resolveMotion(mode: MotionMode): "full" | "reduced" {
  // "Leve" lowers rendering quality but keeps the interactive experience.
  // Motion is removed only for the operating-system accessibility preference.
  const followsSystemPreference = mode === "auto" || mode === "reduced";
  if (followsSystemPreference && matchMedia(REDUCED_QUERY).matches) return "reduced";
  return "full";
}

function resolveTier(mode: MotionMode): PerformanceTier {
  if (mode === "full") return "high";
  if (mode === "balanced") return "balanced";
  if (mode === "reduced") return "low";
  return resolveAutoTier();
}

function applyMotionMode(mode: MotionMode): void {
  const root = document.documentElement;
  root.dataset.motionPreference = mode;
  root.dataset.motion = resolveMotion(mode);
  root.dataset.performanceTier = resolveTier(mode);
  if (mode === "auto") {
    root.dataset.hardwareTier = detectHardwareTier();
    root.dataset.performanceSource = getRuntimeTier() ? "runtime" : "detected";
  } else {
    root.dataset.performanceSource = "manual";
  }
}

export function initMotionPreference(): void {
  applyMotionMode(getMotionMode());

  const systemPreference = matchMedia(REDUCED_QUERY);
  const handleSystemChange = () => {
    if (getMotionMode() !== "auto") return;
    const previousMotion = document.documentElement.dataset.motion;
    const previousTier = document.documentElement.dataset.performanceTier;
    applyMotionMode("auto");
    if (
      previousMotion === document.documentElement.dataset.motion
      && previousTier === document.documentElement.dataset.performanceTier
    ) return;
    try {
      sessionStorage.setItem("amv-skip-intro-once", "1");
    } catch {
      // Reloading still reapplies the system preference without sessionStorage.
    }
    window.location.reload();
  };

  if (typeof systemPreference.addEventListener === "function") {
    systemPreference.addEventListener("change", handleSystemChange);
  } else {
    systemPreference.addListener(handleSystemChange);
  }
}

export function setMotionMode(mode: MotionMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // The setting still applies to the current document when storage is blocked.
  }
  applyMotionMode(mode);
  window.dispatchEvent(new CustomEvent("amv:motion-change", {
    detail: { mode, tier: getPerformanceTier() },
  }));
}

export function getPerformanceTier(): PerformanceTier {
  const tier = document.documentElement.dataset.performanceTier;
  if (isPerformanceTier(tier)) return tier;
  return resolveTier(getMotionMode());
}

export function getHardwarePerformanceTier(): PerformanceTier {
  return detectHardwareTier();
}

export function setRuntimePerformanceTier(tier: PerformanceTier): PerformanceTier {
  if (getMotionMode() !== "auto") return getPerformanceTier();
  const nextTier = lowerTier(getHardwarePerformanceTier(), tier);
  try {
    sessionStorage.setItem(RUNTIME_STORAGE_KEY, JSON.stringify({
      tier: nextTier,
      at: Date.now(),
    }));
  } catch {
    // Runtime adaptation still applies to the current page without storage.
  }

  const root = document.documentElement;
  const previousTier = getPerformanceTier();
  root.dataset.performanceTier = nextTier;
  root.dataset.performanceSource = "runtime";
  if (previousTier !== nextTier) {
    window.dispatchEvent(new CustomEvent("amv:performance-tier-change", {
      detail: { tier: nextTier, previousTier },
    }));
  }
  return nextTier;
}

export function getPerformanceBudget(): PerformanceBudget {
  return BUDGETS[getPerformanceTier()];
}

export function isReducedMotion(): boolean {
  const resolved = document.documentElement.dataset.motion;
  if (resolved === "reduced") return true;
  if (resolved === "full") return false;
  return resolveMotion(getMotionMode()) === "reduced";
}
