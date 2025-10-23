// src/redux/services/categoryPieService.js
const baseRaw =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

// normalize base to always have a trailing slash
const base = baseRaw.endsWith("/") ? baseRaw : `${baseRaw}/`;

/* ---------- mapping helpers ---------- */
const mapItem = (x) => ({
  name: String(x?.category ?? x?.name ?? "Unknown"),
  value: Number(x?.amount ?? x?.value ?? x?.total ?? 0),
  tx_count: Number(x?.tx_count ?? 0),
});

const pickArrayFromSummary = (json) => {
  // expected: { currency, total_amount, total_tx, start_date, end_date, breakdown: [...] }
  if (Array.isArray(json?.breakdown)) return json.breakdown.map(mapItem);
  // permissive fallbacks
  if (Array.isArray(json)) return json.map(mapItem);
  if (Array.isArray(json?.data)) return json.data.map(mapItem);
  if (Array.isArray(json?.results)) return json.results.map(mapItem);
  return [];
};

/**
 * Robust fetch:
 * - 45s timeout
 * - retry once on timeout/5xx/Cloudflare 52x
 */
async function doFetch(url, { signal, timeoutMs = 45000 } = {}) {
  const attempt = async () => {
    const localCtl = new AbortController();
    const onTimeout = setTimeout(() => localCtl.abort(new Error("timeout")), timeoutMs);

    // forward external abort
    if (signal) {
      const forward = () => localCtl.abort(signal.reason);
      if (signal.aborted) forward();
      else signal.addEventListener("abort", forward, { once: true });
    }

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: localCtl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        const err = new Error(`API ${res.status}: ${text}`);
        err.status = res.status;
        try { err.body = JSON.parse(text); } catch {
          err.body = text;
        }
        throw err;
      }
      try { return JSON.parse(text); } catch { return text; }
    } finally {
      clearTimeout(onTimeout);
    }
  };

  try {
    return await attempt();
  } catch (e) {
    const status = e?.status;
    const isTimeout = e?.name === "AbortError" || /timeout/i.test(String(e?.message));
    const isServerish = status >= 500 || [520, 521, 522, 523, 524].includes(status);
    if (isTimeout || isServerish) {
      await new Promise((r) => setTimeout(r, 1500));
      return await attempt();
    }
    throw e;
  }
}

/**
 * Category-only API:
 *   GET /expenses/summary/category?year=YYYY[&month=MM]
 *
 * params: { year: number|string, month?: number|string, signal }
 */
export const fetchCategoryPieAPI = async ({ year, month, signal } = {}) => {
  if (!year) throw new Error("Year is required.");

  const qs = new URLSearchParams();
  qs.set("year", String(year));
  if (month != null) {
    // server accepts numeric month; we normalize to number (3 not "03")
    qs.set("month", String(Number(month)));
  }

  // try without /api first, then with /api
  const urls = [
    `${base}expenses/summary/category?${qs.toString()}`,
    `${base}api/expenses/summary/category?${qs.toString()}`,
  ];

  let lastErr;
  for (const url of urls) {
    try {
      const json = await doFetch(url, { signal });
      return pickArrayFromSummary(json);
    } catch (e) {
      if (e?.name === "AbortError" || /timeout/i.test(String(e?.message))) {
        lastErr = new Error("Request timed out. Server may be sleeping or slow.");
      } else {
        lastErr = e;
      }
      continue;
    }
  }
  throw lastErr || new Error("No working /expenses/summary/category endpoint.");
};
