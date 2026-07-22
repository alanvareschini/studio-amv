export type MotionMode = "auto" | "full" | "reduced";

const STORAGE_KEY = "amv-motion-mode";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const isMotionMode = (value: unknown): value is MotionMode =>
  value === "auto" || value === "full" || value === "reduced";

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
  if (mode !== "auto") return mode;
  return matchMedia(REDUCED_QUERY).matches ? "reduced" : "full";
}

function applyMotionMode(mode: MotionMode): void {
  const root = document.documentElement;
  root.dataset.motionPreference = mode;
  root.dataset.motion = resolveMotion(mode);
}

export function initMotionPreference(): void {
  applyMotionMode(getMotionMode());

  const systemPreference = matchMedia(REDUCED_QUERY);
  const handleSystemChange = () => {
    if (getMotionMode() !== "auto") return;
    const previousMotion = document.documentElement.dataset.motion;
    applyMotionMode("auto");
    if (previousMotion === document.documentElement.dataset.motion) return;
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
  window.dispatchEvent(new CustomEvent("amv:motion-change", { detail: { mode } }));
}

export function isReducedMotion(): boolean {
  const resolved = document.documentElement.dataset.motion;
  if (resolved === "reduced") return true;
  if (resolved === "full") return false;
  return resolveMotion(getMotionMode()) === "reduced";
}
