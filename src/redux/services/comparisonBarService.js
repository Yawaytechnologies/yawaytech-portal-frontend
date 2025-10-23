// Base URL (strip trailing slash)
const API_BASE = (() => {
  const v =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "";
  return String(v).replace(/\/+$/, "");
})();

const MONTHWISE_URL = API_BASE ? `${API_BASE}/expenses/summary/monthwise` : "";
const WEEK_URL      = API_BASE ? `${API_BASE}/expenses/summary/week`      : "";
const MONTH_URL     = API_BASE ? `${API_BASE}/expenses/summary/month`     : "";

/* month label -> numeric (1..12) */
export const monthLabelToNumber = (m) => {
  if (typeof m === "number") return m;
  const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const i = labels.indexOf(String(m).slice(0,3));
  return i >= 0 ? i + 1 : undefined;
};

/* fetch with timeout */
const fetchJSON = async (url, timeoutMs = 10000) => {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort("timeout"), timeoutMs);
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
};

/** Year or Month (weekly) chart — returns { data, xKey, source } */
export const getComparisonBarByPeriod = async (period, { year, month }) => {
  if (!API_BASE) throw new Error("API base url missing");

  if (period === "Year") {
    // Normalize to dense 12-month series
    const url = `${MONTHWISE_URL}?year=${encodeURIComponent(year)}`;
    const json = await fetchJSON(url);

    const sparse = new Map(); // month(1..12) -> total
    (json?.monthly_totals || []).forEach(({ month, total }) => {
      sparse.set(Number(month), Number(total || 0));
    });

    const LABELS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { label: LABELS[m], month: m, value: sparse.get(m) ?? 0 };
    });

    return { data, xKey: "label", source: "api" };
  }

  // Month (weekly) — normalize to W1..W4 with zeros
  const m = monthLabelToNumber(month);
  if (!m) throw new Error("Invalid month");
  const url = `${WEEK_URL}?year=${encodeURIComponent(year)}&month=${encodeURIComponent(m)}`;
  const json = await fetchJSON(url);

  const base = Array.from({ length: 4 }, (_, i) => ({ week: `W${i + 1}`, value: 0 }));
  (json?.weekly_totals || []).forEach((row) => {
    const w = Number(row.week);
    const v = Number(row.total || 0);
    if (w >= 1 && w <= 4) base[w - 1].value = v;
  });

  return { data: base, xKey: "week", source: "api" };
};

/** Month total for pill (Month tab) */
export const getMonthTotal = async (year, month /* label or number */) => {
  const m = monthLabelToNumber(month);
  if (!API_BASE || !m) throw new Error("API base url missing or invalid month");
  const json = await fetchJSON(`${MONTH_URL}?year=${encodeURIComponent(year)}&month=${encodeURIComponent(m)}`);
  return Number(json?.total_expenses_this_month || 0);
};
