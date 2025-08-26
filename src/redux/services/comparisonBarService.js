// Same env handling style as your category service
const API_BASE = (() => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return ""; // empty => force dummy
})();
const ENDPOINT = API_BASE ? `${API_BASE}/expenses/trend` : "";

/* Utilities */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// deterministic-ish numbers so UI is stable (seed by year/month)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededMonthly(year) {
  const rand = mulberry32(Number(year));
  return MONTHS.map((m, i) => ({
    month: m,
    value: Math.round(500 + rand() * 800 + i * 20), // 500..~1300 with slight incline
  }));
}
function seededWeekly(year, month) {
  const seed = Number(String(year) + String(MONTHS.indexOf(month)).padStart(2, "0"));
  const rand = mulberry32(seed);
  return ["Week 1","Week 2","Week 3","Week 4"].map((w, i) => ({
    week: w,
    value: Math.round(420 + rand() * 350 + i * 25),
  }));
}

/* Normalizers (accept flexible API shapes) */
const normMonthly = (arr = []) =>
  arr.map((x, i) => ({
    month: String(x?.month ?? x?.label ?? MONTHS[i] ?? ""),
    value: typeof x?.value === "number" ? x.value : Number(x?.amount ?? 0),
  }));

const normWeekly = (arr = []) =>
  arr.map((x, i) => ({
    week: String(x?.week ?? x?.label ?? `Week ${i + 1}`),
    value: typeof x?.value === "number" ? x.value : Number(x?.amount ?? 0),
  }));

const isMonthly = (arr) =>
  Array.isArray(arr) && arr.every((x) => x && typeof x.month === "string" && typeof x.value === "number");
const isWeekly = (arr) =>
  Array.isArray(arr) && arr.every((x) => x && typeof x.week === "string" && typeof x.value === "number");

const fetchWithTimeout = (url, options = {}, timeoutMs = 6000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
  ]);

/** Returns { data, source: "api" | "dummy" } */
export const getComparisonBarByPeriod = async (period, { year, month }) => {
  if (ENDPOINT) {
    try {
      const qs = new URLSearchParams({ period, year: String(year), ...(month ? { month } : {}) });
      const res = await fetchWithTimeout(`${ENDPOINT}?${qs.toString()}`, { headers: { Accept: "application/json" } }, 6500);
      if (res.ok) {
        const json = await res.json();
        const raw = Array.isArray(json) ? json : json?.data;

        if (period === "Year") {
          const data = normMonthly(raw);
          if (isMonthly(data) && data.length) return { data, source: "api" };
        } else {
          const data = normWeekly(raw);
          if (isWeekly(data) && data.length) return { data, source: "api" };
        }
      }
    } catch {
      /* fall through to dummy */
    }
  }

  // Dummy fallback (deterministic)
  if (period === "Year") {
    return { data: seededMonthly(year), source: "dummy" };
  }
  return { data: seededWeekly(year, month), source: "dummy" };
};
