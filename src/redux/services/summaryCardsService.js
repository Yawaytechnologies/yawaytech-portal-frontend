// src/redux/services/summaryCardsService.js

// Read base URL like your other services (Vite)
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

const ENDPOINT = API_BASE ? `${API_BASE}/expenses/summary` : "";

/* ---------- utils ---------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fetchWithTimeout = (url, options = {}, timeoutMs = 6000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
  ]);

function normalize(json) {
  if (!json) return null;
  // Accept flexible shapes
  const total = Number(json.total ?? json.totalAmount ?? json.overall ?? 0);
  const month = Number(json.month ?? json.monthTotal ?? json.currentMonth ?? 0);
  const year  = Number(json.year  ?? json.yearTotal  ?? json.currentYear  ?? 0);
  return { total, month, year };
}

function dummyTotals({ year, month }) {
  const monthIdx = Math.max(0, MONTHS.indexOf(month ?? "Jan"));
  const seedBase = Number(String(year) + String(monthIdx).padStart(2, "0"));
  const r1 = mulberry32(seedBase)();
  const r2 = mulberry32(seedBase + 17)();
  const r3 = mulberry32(seedBase + 33)();

  const monthTotal = Math.round(5000 + r1 * 15000);        // 5k..20k
  const yearTotal  = Math.round(120000 + r2 * 180000);     // 120k..300k
  const allTotal   = Math.round(yearTotal * (2.4 + r3));   // ~year * 2.4..3.4

  return { total: allTotal, month: monthTotal, year: yearTotal };
}

/** Returns { data: {total,month,year}, source: "api" | "dummy" } */
export async function getSummaryCards({ year, month }) {
  if (ENDPOINT) {
    try {
      const qs = new URLSearchParams({
        year: String(year ?? ""),
        month: String(month ?? ""),
      });
      const res = await fetchWithTimeout(`${ENDPOINT}?${qs.toString()}`, {
        headers: { Accept: "application/json" },
      }, 6500);

      if (res.ok) {
        const json = await res.json();
        const data = normalize(Array.isArray(json) ? json[0] : json);
        if (data && (data.total || data.month || data.year)) {
          return { data, source: "api" };
        }
      }
    } catch {
      /* fall through */
    }
  }
  return { data: dummyTotals({ year, month }), source: "dummy" };
}
