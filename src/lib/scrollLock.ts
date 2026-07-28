const owners = new Set<string>();
let previousOverflow = "";
let previousPaddingRight = "";

export function acquireScrollLock(owner: string): void {
  if (owners.has(owner)) return;
  if (!owners.size) {
    previousOverflow = document.body.style.overflow;
    previousPaddingRight = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.body.style.overflow = "hidden";
  }
  owners.add(owner);
}

export function releaseScrollLock(owner: string): void {
  owners.delete(owner);
  if (owners.size) return;
  document.body.style.overflow = previousOverflow;
  document.body.style.paddingRight = previousPaddingRight;
}
