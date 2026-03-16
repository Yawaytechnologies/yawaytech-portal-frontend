const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("ytp_token") ||
    ""
  );
}

async function request(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || data || `HTTP ${res.status}`);
  }
  return data;
}

// ⚠️ If you still get 404, THIS is the only line to change:
// "/shifts/employee/" -> whatever your swagger shows.
export async function getCurrentShift(employeeId, targetDate) {
  const q = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : "";
  return request(`/shifts/employee/${encodeURIComponent(employeeId)}${q}`, {
    method: "GET",
  });
}