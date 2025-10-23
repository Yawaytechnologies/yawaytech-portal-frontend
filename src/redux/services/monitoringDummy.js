/** Deterministic PRNG so the same employee/day shows the same dummy data */
function seedPRNG(seedStr = "") {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATS = ["chrome", "code", "terminal", "docs", "figma"];

/** Pad number -> "02" */
const pad = (n) => String(n).padStart(2, "0");

/** Round to nearest N seconds */
const roundTo = (n, step) => Math.round(n / step) * step;

/** Build a 24-slot hourly timeline for the day. */
function buildTimeline(rand) {
  const timeline = [];
  let lastCat = CATS[Math.floor(rand() * CATS.length)];

  for (let hour = 0; hour < 24; hour++) {
    if (rand() < 0.35) {
      lastCat = CATS[Math.floor(rand() * CATS.length)];
    }
    const isIdle = rand() < 0.20;
    let secs = isIdle ? 0 : 60 * (6 + Math.floor(rand() * 36)) + Math.floor(rand() * 30);
    secs = roundTo(secs, 30);
    timeline.push({
      time: `${pad(hour)}:00`,
      category: lastCat,
      seconds: secs,
      label: lastCat.toUpperCase(),
    });
  }
  return timeline;
}

/** Aggregate top from timeline into {key,total_seconds} pairs. */
function buildDailyTopFromTimeline(timeline) {
  const keyMap = {
    chrome: ["github.com", "stackoverflow.com", "google.com", "vitejs.dev", "react.dev"],
    code: ["code.visualstudio.com", "extensions", "tsserver", "eslint"],
    terminal: ["zsh", "npm", "yarn", "git", "pm2"],
    docs: ["docs.google.com", "confluence", "readme", "swagger"],
    figma: ["figma.com", "design-system", "components", "prototypes"],
  };

  const buckets = new Map();
  for (const slot of timeline) {
    const keys = keyMap[slot.category] || ["other"];
    const key = (keys[(parseInt(slot.time.slice(0, 2), 10)) % keys.length] || "other").toLowerCase();
    const prev = buckets.get(key) || 0;
    buckets.set(key, prev + (slot.seconds || 0));
  }

  const arr = [...buckets.entries()]
    .map(([key, total]) => ({ key, total_seconds: total }))
    .filter((r) => r.total_seconds > 0)
    .sort((a, b) => b.total_seconds - a.total_seconds);

  return arr.slice(0, 12);
}

/** === Public API (dummy) === */
export function makeDailyDummy(employeeId, dayISO) {
  const rand = seedPRNG(`daily:${employeeId}:${dayISO}`);
  const timeline = buildTimeline(rand);
  const top = buildDailyTopFromTimeline(timeline);

  return {
    day: dayISO,
    employeeId,
    timeline,
    top, // [{ key, total_seconds }]
    __source: "dummy",
  };
}

export function makeLiveDummy(employeeId) {
  const now = new Date();
  const rand = seedPRNG(`live:${employeeId}:${now.toDateString()}:${now.getHours()}`);
  const apps = [
    { app_name: "Visual Studio Code", hostname: "github.com", window_title: "yawaytech-portal — monitoringSlice.js" },
    { app_name: "Google Chrome", hostname: "react.dev", window_title: "Hooks — React" },
    { app_name: "Terminal", hostname: "git", window_title: "git status — yawaytech-portal" },
    { app_name: "Google Chrome", hostname: "stackoverflow.com", window_title: "How to fix CORS in Vite" },
  ];
  const pick = apps[Math.floor(rand() * apps.length)];

  return {
    employeeId,
    current: {
      app_name: pick.app_name,
      hostname: pick.hostname,
      window_title: pick.window_title,
      timestamp: new Date().toISOString(),
    },
    apps: [pick.app_name],
    sites: [
      { url: `https://${pick.hostname}`, title: pick.hostname, host: pick.hostname, visited_at: new Date().toISOString() },
    ],
    metrics: { cpu_percent: Math.round(20 + rand() * 60), memory_percent: Math.round(30 + rand() * 50) },
    __source: "dummy",
  };
}

/** Range top */
export function makeTopRangeDummy(employeeId, fromISO, toISO) {
  const rand = seedPRNG(`range:${employeeId}:${fromISO}:${toISO}`);
  const base = 5 * 3600 + Math.floor(rand() * 3 * 3600); // 5–8 hours total
  const keys = [
    "code.visualstudio.com",
    "github.com",
    "docs.google.com",
    "vitejs.dev",
    "react.dev",
    "zsh",
    "pm2",
  ];

  const weights = keys.map(() => 0.8 + rand() * 1.6);
  const sumW = weights.reduce((a, b) => a + b, 0);
  const items = keys
    .map((k, i) => ({
      key: k.toLowerCase(),
      seconds: Math.floor((weights[i] / sumW) * base + rand() * 600),
    }))
    .filter((r) => r.seconds > 120)
    .sort((a, b) => b.seconds - a.seconds);

  return {
    employeeId,
    from: fromISO,
    to: toISO,
    items, // [{ key, seconds }]
    __source: "dummy",
  };
}
