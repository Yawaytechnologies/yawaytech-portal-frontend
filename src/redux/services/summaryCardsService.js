// src/redux/services/summaryCardsService.js

// ------------ Base URL (Vite) ------------
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

const BASE = API_BASE.replace(/\/+$/, "");
const ROOT = BASE ? `${BASE}/expenses/summary` : "";

// ------------ Utils ------------
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

function toMonthNumber(m) {
  if (m == null) return null;
  if (typeof m === "number" && m >= 1 && m <= 12) return m;
  const idx = MONTHS.indexOf(String(m));
  return idx >= 0 ? idx + 1 : null; // 1..12
}

function dummyTotals({ year, month }) {
  const monthIdx = Math.max(0, MONTHS.indexOf(month ?? "Jan"));
  const seedBase = Number(String(year ?? 2025) + String(monthIdx).padStart(2, "0"));
  const r1 = mulberry32(seedBase)();
  const r2 = mulberry32(seedBase + 17)();
  const r3 = mulberry32(seedBase + 33)();

  const monthTotal = Math.round(5000 + r1 * 15000);        // 5k..20k
  const yearTotal  = Math.round(120000 + r2 * 180000);     // 120k..300k
  const allTotal   = Math.round(yearTotal * (2.4 + r3));   // ~year * 2.4..3.4
  return { total: allTotal, month: monthTotal, year: yearTotal };
}

async function getJson(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 6500);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ------------ Public API ------------
/** Fetches cards totals from:
 *  - GET /expenses/summary/total           -> { total_expenses_all_time: number }
 *  - GET /expenses/summary/year?year=YYYY  -> { year, total_expenses_this_year: number }
 *  - GET /expenses/summary/month?year=YYYY&month=M -> { year, month, total_expenses_this_month: number }
 *
 * Returns: { data: { total, month, year }, source: "api" | "dummy" }
 */
export async function getSummaryCards({ year, month }) {
  if (!ROOT) return { data: dummyTotals({ year, month }), source: "dummy" };

  // Build query strings (backend also works without these if not provided)
  const qsYear = new URLSearchParams();
  if (year != null && String(year) !== "") qsYear.set("year", String(year));

  const qsMonth = new URLSearchParams(qsYear);
  const mNum = toMonthNumber(month);
  if (mNum != null) qsMonth.set("month", String(mNum));

  const uTotal = `${ROOT}/total`;                                     // no params needed
  const uYear  = `${ROOT}/year${qsYear.toString() ? `?${qsYear}` : ""}`;
  const uMonth = `${ROOT}/month${qsMonth.toString() ? `?${qsMonth}` : ""}`;

  const [jTotal, jYear, jMonth] = await Promise.all([
    getJson(uTotal),
    getJson(uYear),
    getJson(uMonth),
  ]);

  // Read EXACT keys from your backend
  const total = jTotal ? num(jTotal.total_expenses_all_time) : null;
  const yearT = jYear  ? num(jYear.total_expenses_this_year) : null;
  const monthT= jMonth ? num(jMonth.total_expenses_this_month) : null;

  if (total != null || yearT != null || monthT != null) {
    return {
      data: {
        total: total ?? 0,
        month: monthT ?? 0,
        year : yearT ?? 0,
      },
      source: "api",
    };
  }

  // Fallback if API not reachable or keys missing
  return { data: dummyTotals({ year, month }), source: "dummy" };
}
