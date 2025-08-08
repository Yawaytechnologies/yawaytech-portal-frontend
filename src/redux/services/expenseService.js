// Tries real API first; falls back to localStorage dummy data.

const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // e.g. http://localhost:5001
const EXPENSES_KEY = "dummy_expenses_v1";

// Default dummy seed (with ids)
const seedDummy = () => ([
  {
    id: crypto.randomUUID(),
    title: "Lunch",
    amount: "250",
    category: "Food",
    date: "2025-07-29",
    description: "Team lunch with clients",
    addedBy: "Jana",
  },
  {
    id: crypto.randomUUID(),
    title: "Bus Ticket",
    amount: "50",
    category: "Transport",
    date: "2025-07-28",
    description: "Office commute",
    addedBy: "Kumar",
  },
]);

function getLocal() {
  const raw = localStorage.getItem(EXPENSES_KEY);
  if (!raw) {
    const seeded = seedDummy();
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) || [];
  } catch {
    const seeded = seedDummy();
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function setLocal(list) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
  return list;
}

// --- Real API helpers (optional) ---
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} failed ${res.status}`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed ${res.status}`);
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed ${res.status}`);
  return res.json();
}
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed ${res.status}`);
  return res.json();
}

// --- Public service API ---
// If API_BASE is empty or fetch fails, use localStorage dummy methods.

export async function getExpensesService() {
  // Try real API if base provided
  if (API_BASE) {
    try {
      // Expecting shape: {success, data: []} OR plain array
      const data = await apiGet("/api/expenses");
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch {
      // fall through to dummy
    }
  }
  return getLocal();
}

export async function addExpenseService(expense) {
  if (API_BASE) {
    try {
      const data = await apiPost("/api/expenses", expense);
      // Expect a created object from backend
      return data?.data ?? data;
    } catch {
      // fall back
    }
  }
  const list = getLocal();
  const withId = { ...expense, id: crypto.randomUUID() };
  list.push(withId);
  setLocal(list);
  return withId;
}

export async function updateExpenseService(id, updated) {
  if (API_BASE) {
    try {
      const data = await apiPut(`/api/expenses/${id}`, updated);
      return data?.data ?? data;
    } catch {
      // fall back
    }
  }
  const list = getLocal();
  const idx = list.findIndex((e) => e.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updated };
    setLocal(list);
    return list[idx];
  }
  throw new Error("Expense not found (dummy)");
}

export async function deleteExpenseService(id) {
  if (API_BASE) {
    try {
      const data = await apiDelete(`/api/expenses/${id}`);
      return data?.data ?? { id };
    } catch {
      // fall back
    }
  }
  const list = getLocal().filter((e) => e.id !== id);
  setLocal(list);
  return { id };
}
