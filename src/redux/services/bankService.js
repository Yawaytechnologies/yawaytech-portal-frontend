// src/redux/services/bankService.js

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

  // try both "/api" and without
  const urls = [`${API_BASE}/api${path}`, `${API_BASE}${path}`];

  let lastErr = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { ...options, headers });

      // 404 -> try next url (api vs non-api)
      if (res.status === 404) {
        lastErr = new Error(`404 Not Found: ${url}`);
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

      return data;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Request failed");
}

export function getBankDetail(detailId) {
  return smartRequest(`/bank-details/${encodeURIComponent(detailId)}`, {
    method: "GET",
  });
}

export function createBankDetail(payload) {
  const empId = Number(payload.employee_id);
  if (!Number.isFinite(empId)) {
    throw new Error("employee_id must be numeric (DB id)");
  }

  return smartRequest(`/bank-details/`, {
    method: "POST",
    body: JSON.stringify({
      employee_id: empId,
      bank_name: payload.bank_name,
      account_number: String(payload.account_number),
      ifsc_code: payload.ifsc_code,
      branch_name: payload.branch_name,
    }),
  });
}

export function updateBankDetail(detailId, payload) {
  return smartRequest(`/bank-details/${encodeURIComponent(detailId)}`, {
    method: "PUT",
    body: JSON.stringify({
      bank_name: payload.bank_name,
      account_number: String(payload.account_number),
      ifsc_code: payload.ifsc_code,
      branch_name: payload.branch_name,
    }),
  });
}

export function deleteBankDetail(detailId) {
  return smartRequest(`/bank-details/${encodeURIComponent(detailId)}`, {
    method: "DELETE",
  });
}
