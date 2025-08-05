const API_BASE = "https://your-api.com"; // Replace with actual API

// Fallback storage key
const LOCAL_KEY = "yaway-expense-data";

// 1. GET ALL EXPENSES
export const getExpensesService = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/expense`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!res.ok) throw new Error("API fetch failed");

    return await res.json();
  } catch {
    // fallback to localStorage
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    return local;
  }
};

// 2. ADD EXPENSE
export const addExpenseService = async (expense) => {
  try {
    const res = await fetch(`${API_BASE}/api/expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(expense),
    });

    if (!res.ok) throw new Error("API add failed");

    return await res.json();
  } catch {
    const expenses = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    const newExpense = { ...expense, id: Date.now() };
    const updated = [...expenses, newExpense];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return newExpense;
  }
};

// 3. UPDATE EXPENSE
export const updateExpenseService = async (id, updatedData) => {
  try {
    const res = await fetch(`${API_BASE}/api/expense/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error("API update failed");

    return await res.json();
  } catch {
    const expenses = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    const updated = expenses.map((e) =>
      e.id === id ? { ...e, ...updatedData } : e
    );
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return { ...updatedData, id };
  }
};

// 4. DELETE EXPENSE
export const deleteExpenseService = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/api/expense/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("API delete failed");

    return true;
  } catch {
    const expenses = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    const updated = expenses.filter((e) => e.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return true;
  }
};
