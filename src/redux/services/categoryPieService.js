// src/redux/services/categoryPieService.js

// Safely read env vars (Vite or CRA) without touching `process` unless it exists
const API_BASE = (() => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;      // Vite
  }
  return ""; // empty => force dummy
})();

const ENDPOINT = API_BASE ? `${API_BASE}/v1/dashboard/pie` : "";

/** ---- Dummy data ---- */
const DUMMY = {
  Year: [
    { name: "Food", value: 12000 },
    { name: "Transport", value: 5000 },
    { name: "Stationary", value: 3200 },
    { name: "Shopping", value: 7000 },
    { name: "Health", value: 3400 },
    { name: "Others", value: 4500 },
  ],
  Month: [
    { name: "Food", value: 1400 },
    { name: "Transport", value: 400 },
    { name: "Stationary", value: 250 },
    { name: "Shopping", value: 1100 },
    { name: "Health", value: 350 },
    { name: "Others", value: 100 },
  ],
  Week: [
    { name: "Food", value: 350 },
    { name: "Transport", value: 100 },
    { name: "Stationary", value: 80 },
    { name: "Shopping", value: 200 },
    { name: "Health", value: 90 },
    { name: "Others", value: 40 },
  ],
};

const normalize = (arr = []) =>
  arr.map((x) => ({
    name: String(x?.name ?? ""),
    value: typeof x?.value === "number" ? x.value : Number(x?.amount ?? 0),
  }));

const isValid = (arr) =>
  Array.isArray(arr) &&
  arr.every((x) => x && typeof x.name === "string" && typeof x.value === "number");

const fetchWithTimeout = (url, options = {}, timeoutMs = 6000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
  ]);

/** Returns { data, source: "api" | "dummy" } */
export const getCategoryPieByPeriod = async (period) => {
  if (ENDPOINT) {
    try {
      const res = await fetchWithTimeout(
        `${ENDPOINT}?period=${encodeURIComponent(period)}`,
        { headers: { Accept: "application/json" } },
        6000
      );
      if (res.ok) {
        const json = await res.json();
        const raw = Array.isArray(json) ? json : json?.data;
        const data = normalize(raw);
        if (isValid(data)) return { data, source: "api" };
      }
    } catch {
      /* fall back to dummy */
    }
  }
  return { data: DUMMY[period] ?? [], source: "dummy" };
};
