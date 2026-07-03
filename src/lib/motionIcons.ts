const svg = (motion: string, body: string): string => `
  <span class="emoji-motion-target emoji-motion-target--svg">
    <svg class="motion-svg motion-svg--${motion}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      ${body}
    </svg>
  </span>`;

const icons: Record<string, string> = {
  launch: svg("launch", `
    <g class="motion-part motion-part--rocket">
      <path d="M32 7c9 7 13 18 11 31L32 47 21 38C19 25 23 14 32 7Z" fill="#eefcff" stroke="#22d3ee" stroke-width="2"/>
      <circle cx="32" cy="24" r="5" fill="#60a5fa"/>
      <path d="M22 33 14 43l9-1M42 33l8 10-9-1" fill="#a855f7"/>
    </g>
    <path class="motion-part motion-part--flame" d="M27 44c0 8 5 14 5 14s5-6 5-14Z" fill="#facc15"/>
  `),
  rise: svg("rise", `
    <rect x="14" y="15" width="36" height="42" rx="4" fill="
    #3b82f6" stroke="#93c5fd" stroke-width="2"/>
    <g class="motion-part motion-part--floors" fill="#dffaff">
      <rect x="20" y="22" width="8" height="6" rx="1"/><rect x="36" y="22" width="8" height="6" rx="1"/>
      <rect x="20" y="33" width="8" height="6" rx="1"/><rect x="36" y="33" width="8" height="6" rx="1"/>
      <rect x="20" y="44" width="8" height="6" rx="1"/><rect x="36" y="44" width="8" height="6" rx="1"/>
    </g>
  `),
  talk: svg("talk", `
    <path d="M10 12h44v33H31L20 54v-9H10Z" fill="#d7fbff" stroke="#22d3ee" stroke-width="2.5" stroke-linejoin="round"/>
    <g class="motion-part motion-part--dots" fill="#07111c">
      <circle cx="23" cy="29" r="3"/><circle cx="32" cy="29" r="3"/><circle cx="41" cy="29" r="3"/>
    </g>
  `),
  write: svg("write", `
    <rect x="11" y="9" width="35" height="46" rx="4" fill="#fff" stroke="#a855f7" stroke-width="2"/>
    <g stroke="#94a3b8" stroke-width="2"><path d="M18 20h20M18 28h17M18 36h13"/></g>
    <g class="motion-part motion-part--pen"><path d="m27 48 22-25 6 5-22 25-8 2Z" fill="#22d3ee"/><path d="m49 23 3-4 6 5-3 4Z" fill="#facc15"/></g>
  `),
  pin: svg("pin", `
    <path class="motion-part motion-part--pin" d="M32 6c-11 0-20 9-20 20 0 15 20 32 20 32s20-17 20-32C52 15 43 6 32 6Z" fill="#fb7185" stroke="#fecdd3" stroke-width="2"/>
    <circle cx="32" cy="26" r="8" fill="#fff"/>
    <circle class="motion-part motion-part--pin-core" cx="32" cy="26" r="4" fill="#22d3ee"/>
  `),
  scan: svg("scan", `
    <circle cx="27" cy="27" r="17" fill="#dffaff" stroke="#22d3ee" stroke-width="4"/>
    <path d="m39 40 14 14" stroke="#60a5fa" stroke-width="7" stroke-linecap="round"/>
    <path class="motion-part motion-part--scan-beam" d="M15 27h24" stroke="#00ff88" stroke-width="2"/>
  `),
  tighten: svg("tighten", `
    <defs>
      <linearGradient id="motion-wrench-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8fafc"/><stop offset="0.48" stop-color="#94a3b8"/><stop offset="1" stop-color="#475569"/>
      </linearGradient>
    </defs>
    <g class="motion-part motion-part--wrench">
      <path d="M54 7a14 14 0 0 0-17 17L18 43l8 8 19-19A14 14 0 0 0 58 14l-10 9-7-7Z" fill="url(#motion-wrench-metal)" stroke="#e2e8f0" stroke-width="2" stroke-linejoin="round"/>
      <path d="m18 43-7 7a6 6 0 1 0 8 8l7-7Z" fill="#64748b" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="15" cy="54" r="3" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
      <path d="M31 39 43 27" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" opacity=".75"/>
    </g>
    <g class="motion-part motion-part--bolt">
      <path d="m49 11 8 5v9l-8 5-8-5v-9Z" fill="#22d3ee" stroke="#a5f3fc" stroke-width="2"/>
      <circle cx="49" cy="20" r="4" fill="#0f172a"/>
      <path d="M46 20h6M49 17v6" stroke="#dffaff" stroke-width="1.7" stroke-linecap="round"/>
    </g>
  `),
  buzz: svg("buzz", `
    <rect x="18" y="6" width="28" height="52" rx="7" fill="#334155" stroke="#93c5fd" stroke-width="2"/>
    <rect x="22" y="13" width="20" height="34" rx="2" fill="#dffaff"/>
    <g class="motion-part motion-part--notification">
      <circle cx="38" cy="17" r="6" fill="#fb7185"/><path d="M36 17h4M38 15v4" stroke="#fff" stroke-width="1.5"/>
    </g>
    <circle cx="32" cy="52" r="2" fill="#22d3ee"/>
  `),
  worry: svg("worry", `
    <circle cx="32" cy="32" r="25" fill="#facc15" stroke="#fde68a" stroke-width="2"/>
    <g class="motion-part motion-part--face" stroke="#422006" stroke-width="3" stroke-linecap="round">
      <path d="m20 25 8-2M44 25l-8-2"/><circle cx="24" cy="31" r="1" fill="#422006"/><circle cx="40" cy="31" r="1" fill="#422006"/>
      <path d="M24 46c4-6 12-6 16 0"/>
    </g>
    <path class="motion-part motion-part--sweat" d="M52 16c5 7 4 11 0 11s-5-4 0-11Z" fill="#22d3ee"/>
  `),
  tick: svg("tick", `
    <circle cx="32" cy="34" r="23" fill="#eefcff" stroke="#a855f7" stroke-width="3"/>
    <path d="M26 7h12M32 7v5" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
    <g class="motion-part motion-part--clock-hand" stroke="#07111c" stroke-width="3" stroke-linecap="round"><path d="M32 34V20M32 34l10 6"/></g>
    <circle cx="32" cy="34" r="3" fill="#22d3ee"/>
  `),
  orbit: svg("orbit", `
    <circle cx="32" cy="32" r="22" fill="#3b82f6" stroke="#bfdbfe" stroke-width="2"/>
    <g stroke="#dffaff" stroke-width="1.5" fill="none"><ellipse cx="32" cy="32" rx="10" ry="22"/><path d="M10 32h44M14 22h36M14 42h36"/></g>
    <ellipse class="motion-part motion-part--orbit" cx="32" cy="32" rx="29" ry="12" fill="none" stroke="#00ff88" stroke-width="2"/>
    <circle class="motion-part motion-part--satellite" cx="57" cy="27" r="3" fill="#facc15"/>
  `),
  check: svg("check", `
    <rect x="13" y="10" width="38" height="47" rx="5" fill="#fff" stroke="#a855f7" stroke-width="2"/>
    <rect x="23" y="6" width="18" height="9" rx="4" fill="#94a3b8"/>
    <path class="motion-part motion-part--check" d="m21 34 8 8 16-19" fill="none" stroke="#00d977" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  picture: svg("picture", `
    <rect x="7" y="10" width="50" height="44" rx="5" fill="#dffaff" stroke="#22d3ee" stroke-width="2"/>
    <circle class="motion-part motion-part--sun" cx="43" cy="23" r="6" fill="#facc15"/>
    <path class="motion-part motion-part--mountains" d="m11 49 14-17 9 10 7-8 12 15Z" fill="#00d977"/>
  `),
  unlock: svg("unlock", `
    <rect x="13" y="28" width="38" height="29" rx="6" fill="#facc15" stroke="#fde68a" stroke-width="2"/>
    <path class="motion-part motion-part--shackle" d="M22 29V20c0-10 7-15 15-15 7 0 12 4 14 9" fill="none" stroke="#94a3b8" stroke-width="7" stroke-linecap="round"/>
    <circle cx="32" cy="41" r="4" fill="#422006"/><path d="M32 44v7" stroke="#422006" stroke-width="3"/>
  `),
  spark: svg("spark", `
    <path class="motion-part motion-part--bolt" d="M36 4 14 36h15l-3 24 24-36H35Z" fill="#facc15" stroke="#fff4ad" stroke-width="2" stroke-linejoin="round"/>
    <path class="motion-part motion-part--bolt-core" d="m35 15-10 17h9l-2 13 10-16h-9Z" fill="#fff"/>
  `),
  access: svg("access", `
    <circle class="motion-part motion-part--access-head" cx="32" cy="10" r="6" fill="#22d3ee"/>
    <g class="motion-part motion-part--access-body" fill="none" stroke="#60a5fa" stroke-width="6" stroke-linecap="round">
      <path d="M13 23h38M32 18v20M32 38 20 56M32 38l12 18"/>
    </g>
    <circle cx="32" cy="33" r="24" fill="none" stroke="#a855f7" stroke-width="2"/>
  `),
  puzzle: svg("puzzle", `
    <path class="motion-part motion-part--puzzle" d="M8 13h16a7 7 0 1 1 12 0h15v15a7 7 0 1 0 0 12v16H36a7 7 0 1 0-12 0H8V40a7 7 0 1 0 0-12Z" fill="#a855f7" stroke="#d8b4fe" stroke-width="2"/>
  `),
  barber: svg("barber", `
    <rect x="19" y="8" width="26" height="48" rx="10" fill="#22d3ee"/>
    <svg x="20" y="9" width="24" height="46" viewBox="0 0 24 46" overflow="hidden">
      <rect width="24" height="46" rx="9" fill="#22d3ee"/>
      <g class="motion-part motion-part--barber-stripes" stroke-width="8">
        <path d="m-18-16 60 28M-18 0l60 28M-18 16l60 28M-18 32l60 28M-18 48l60 28M-18 64l60 28" stroke="#fb7185"/>
      </g>
    </svg>
    <rect x="19" y="8" width="26" height="48" rx="10" fill="none" stroke="#67e8f9" stroke-width="3"/>
    <rect x="15" y="4" width="34" height="8" rx="4" fill="#475569" stroke="#67e8f9" stroke-width="1.5"/>
    <rect x="15" y="52" width="34" height="8" rx="4" fill="#475569" stroke="#67e8f9" stroke-width="1.5"/>
  `),
  sparkle: svg("sparkle", `
    <path class="motion-part motion-part--star-main" d="M32 4c2 16 8 23 24 25-16 2-22 9-24 27-2-18-8-25-24-27C24 27 30 20 32 4Z" fill="#facc15"/>
    <path class="motion-part motion-part--star-small" d="M50 8c1 7 4 10 10 11-6 1-9 4-10 11-1-7-4-10-10-11 6-1 9-4 10-11Z" fill="#d8b4fe"/>
  `),
  serve: svg("serve", `
    <path d="M9 42h46c-2 10-10 15-23 15S11 52 9 42Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <path d="M13 42c2-14 9-21 19-21s17 7 19 21Z" fill="#facc15"/>
    <g class="motion-part motion-part--steam" fill="none" stroke="#dffaff" stroke-width="3" stroke-linecap="round"><path d="M22 19c-5-6 5-8 0-14M32 18c-5-6 5-8 0-14M42 19c-5-6 5-8 0-14"/></g>
  `),
  flex: `
    <span class="emoji-motion-target emoji-motion-target--native-arm">&#x1F4AA;</span>
  `,
  shop: svg("shop", `
    <path d="M12 21h40l-3 36H15Z" fill="#60a5fa" stroke="#bfdbfe" stroke-width="2"/>
    <path class="motion-part motion-part--handle" d="M22 24V17c0-8 20-8 20 0v7" fill="none" stroke="#dffaff" stroke-width="5" stroke-linecap="round"/>
    <path class="motion-part motion-part--shop-star" d="m32 31 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#facc15"/>
  `),
  chart: svg("chart", `
    <path d="M8 55h49" stroke="#94a3b8" stroke-width="3"/>
    <g class="motion-part motion-part--bars">
      <rect x="13" y="38" width="9" height="17" rx="2" fill="#60a5fa"/>
      <rect x="28" y="27" width="9" height="28" rx="2" fill="#22d3ee"/>
      <rect x="43" y="13" width="9" height="42" rx="2" fill="#00d977"/>
    </g>
    <path class="motion-part motion-part--trend" d="m14 34 16-12 9 4 14-15" fill="none" stroke="#facc15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  `),
};

export function renderMotionIcon(motion: string, fallback: string): string {
  return icons[motion] ?? `<span class="emoji-motion-target">${fallback}</span>`;
}
