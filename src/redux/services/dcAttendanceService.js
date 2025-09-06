// src/redux/services/dcAttendanceService.js

// ---------- helpers ----------
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nthSaturday = (day) => Math.floor((day - 1) / 7) + 1;

/**
 * Build dummy rows for a given month (YYYY-MM).
 * - Sunday => Weekend
 * - Saturday => 1st & 3rd = half-day Present (10:00–14:00); others Weekend
 * - Weekdays => Present with dummy times
 */
export function buildDummyMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const rows = [];

  for (let d = 1; d <= days; d++) {
    const date = `${monthStr}-${pad(d)}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0 Sun, 6 Sat

    if (dow === 0) {
      rows.push({ date, timeIn: "", timeOut: "", status: "Weekend" });
      continue;
    }
    if (dow === 6) {
      const nth = nthSaturday(d);
      if (nth === 1 || nth === 3) {
        rows.push({ date, timeIn: "10:00", timeOut: "14:00", status: "Present" }); // half-day
      } else {
        rows.push({ date, timeIn: "", timeOut: "", status: "Weekend" });
      }
      continue;
    }

    // Weekday
    const timeIn = `${pad(9 + (d % 2))}:${d % 2 ? "10" : "05"}`;
    const timeOut = `18:${d % 2 ? "05" : "20"}`;
    rows.push({ date, timeIn, timeOut, status: "Present" });
  }

  return rows;
}

const inferStatus = (r) => {
  const tin = r.timeIn || r.checkIn || r.in;
  const tout = r.timeOut || r.checkOut || r.out;
  return tin && tout ? "Present" : "Absent";
};

/**
 * Fetch attendance for an employee & month.
 * Normalizes fields and falls back to dummy data if API fails.
 */
export async function fetchAttendanceByMonthAPI(employeeId, monthStr) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const id = encodeURIComponent(String(employeeId || "").trim());
  const month = String(monthStr || "").trim();

  try {
    const res = await fetch(`${baseUrl}/attendance/${id}?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    return (Array.isArray(data) ? data : []).map((r) => {
      const date = r.date || r.day || r.attDate || "";
      const timeIn = r.timeIn || r.checkIn || r.in || "";
      const timeOut = r.timeOut || r.checkOut || r.out || "";
      const status = (r.status && String(r.status).trim()) || inferStatus(r);
      return { date, timeIn, timeOut, status };
    });
  } catch (err) {
    console.warn("Using DC dummy attendance due to API error:", err.message);
    await sleep(250);
    return buildDummyMonth(month);
  }
}
