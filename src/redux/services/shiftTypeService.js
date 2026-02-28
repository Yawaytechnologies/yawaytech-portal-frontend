import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://yawaytech-portal-backend-python-2.onrender.com",
});

// Swagger shows: POST /shifts/
const SHIFT_URL = "/shifts/";
const LOCAL_KEY = "rv_shift_types_local"; // local cache (since no GET)

export const shiftTypeService = {
  // ✅ LOCAL: read list (no dummy)
  getLocalList() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  // ✅ LOCAL: save list
  setLocalList(list) {
    try {
      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify(Array.isArray(list) ? list : []),
      );
    } catch {}
  },

  // ✅ LOCAL: add one item
  addLocal(item) {
    const list = shiftTypeService.getLocalList();
    const next = [item, ...list];
    shiftTypeService.setLocalList(next);
    return next;
  },

  // ✅ POST create shift
  async createShift(payload, token) {
    const res = await api.post(SHIFT_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  },
};
