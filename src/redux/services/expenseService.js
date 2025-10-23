// Tries real API first; falls back to localStorage dummy data.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const EXPENSES_KEY = "dummy_expenses_v1";

// ---- dummy store ----
const seedDummy = () => ([
  {
    id: crypto.randomUUID(),
    title: "Lunch",
    amount: 250,
    category: "Food",
    date: "2025-07-29",
    description: "Team lunch with clients",
    addedBy: "Jana",
  },
  {
    id: crypto.randomUUID(),
    title: "Bus Ticket",
    amount: 50,
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

// ---- HTTP helpers ----
const url = (path) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

async function http(path, opts = {}) {
  const res = await fetch(url(path), {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.detail || res.statusText || "Request failed";
    throw new Error(`${opts.method || "GET"} ${path} → ${res.status} ${msg}`);
  }
  return data;
}

// ---- Public service API ----
// Backend (FastAPI) paths (as in Swagger):
//   GET/POST   /expenses/
//   GET/PUT/DELETE /expenses/{expense_id}
//   GET       /expenses/summary/total
//   GET       /expenses/summary/year
//   GET       /expenses/summary/month

export async function getExpensesService() {
  if (API_BASE) {
    try {
      // returns an array of expenses
      return await http("/expenses/");
    } catch { /* fall back */ }
  }
  return getLocal();
}

export async function addExpenseService(expense) {
  if (API_BASE) {
    try {
      // Map camelCase -> snake_case if your backend expects it
      const payload = {
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,                 // "YYYY-MM-DD"
        description: expense.description ?? "",
        added_by: expense.addedBy ?? expense.added_by ?? null,
      };
      return await http("/expenses/", { method: "POST", body: JSON.stringify(payload) });
    } catch { /* fall back */ }
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
      const payload = {
        ...(updated.title !== undefined && { title: updated.title }),
        ...(updated.amount !== undefined && { amount: Number(updated.amount) }),
        ...(updated.category !== undefined && { category: updated.category }),
        ...(updated.date !== undefined && { date: updated.date }),
        ...(updated.description !== undefined && { description: updated.description }),
        ...(updated.addedBy !== undefined && { added_by: updated.addedBy }),
      };
      return await http(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch { /* fall back */ }
  }
  const list = getLocal();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Expense not found (dummy)");
  list[idx] = { ...list[idx], ...updated };
  setLocal(list);
  return list[idx];
}

export async function deleteExpenseService(id) {
  if (API_BASE) {
    try {
      await http(`/expenses/${id}`, { method: "DELETE" });
      return { id };
    } catch { /* fall back */ }
  }
  setLocal(getLocal().filter((e) => e.id !== id));
  return { id };
}

// ---- summaries (match your Swagger) ----
export async function getSummaryTotal() {
  return http("/expenses/summary/total");
}
export async function getSummaryYear() {
  return http("/expenses/summary/year");
}
export async function getSummaryMonth() {
  return http("/expenses/summary/month");
}
