const API_BASE = (
  import.meta?.env?.VITE_API_BASE_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/$/, "");

function token() {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("ytp_token") ||
    ""
  );
}

async function smartRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    ...(options.headers || {}),
  };

  const urls = [`${API_BASE}/api${path}`, `${API_BASE}${path}`];
  let lastErr = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { ...options, headers });

      // ❌ 404 — not found, try next url
      if (res.status === 404) {
        lastErr = new Error(`404 Not Found: ${url}`);
        continue;
      }

      // ❌ 500 — server error
      if (res.status === 500) {
        lastErr = new Error(`500 Server Error: ${url}`);
        continue;
      }

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        const msg =
          data?.detail ||
          data?.message ||
          (typeof data === "string" ? data : "") ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // ✅ 200 — return data
      return data;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Request failed");
}

// ✅ GET — fetch full list and filter by employee_id
// (single-item endpoint GET /bank-details/{id} is unstable on the backend)
export async function getBankDetail(employeeId) {
  const raw = await smartRequest(`/bank-details/`, { method: "GET" });
  const list = Array.isArray(raw)
    ? raw
    : raw?.data || raw?.items || raw?.results || [];
  const found = list.find(
    (r) => r?.employee_id === employeeId || r?.employeeId === employeeId,
  );
  return found ?? null;
}

// ✅ ADD THIS — POST create  ← THIS IS THE MISSING FUNCTION
export function createBankDetail(payload) {
  return smartRequest(`/bank-details/`, {
    method: "POST",
    body: JSON.stringify({
      employee_id: payload.employee_id,
      bank_name: payload.bank_name,
      account_number: String(payload.account_number),
      ifsc_code: payload.ifsc_code,
      branch_name: payload.branch_name,
    }),
  });
}
