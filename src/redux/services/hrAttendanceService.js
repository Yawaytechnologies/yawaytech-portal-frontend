// monthStr = "YYYY-MM"
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

function nthSaturday(dayOfMonth) {
  // 1–7:1st, 8–14:2nd, 15–21:3rd, 22–28:4th, 29–31:5th
  return Math.floor((dayOfMonth - 1) / 7) + 1;
}

export function buildDummyMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const rows = [];

  for (let d = 1; d <= days; d++) {
    const date = `${monthStr}-${pad(d)}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0 Sun, 6 Sat

    if (dow === 0) {
      // Sunday: Weekend
      rows.push({ date, timeIn: "", timeOut: "", status: "Weekend" });
      continue;
    }

    if (dow === 6) {
      // Saturday
      const nth = nthSaturday(d);
      if (nth === 1 || nth === 3) {
        // Half-day present
        rows.push({ date, timeIn: "10:00", timeOut: "14:00", status: "Present" });
      } else {
        // Other Saturdays: Weekend
        rows.push({ date, timeIn: "", timeOut: "", status: "Weekend" });
      }
      continue;
    }

    // Weekdays: Present (dummy times)
    const timeIn = `${pad(9 + (d % 2))}:${d % 2 ? "10" : "05"}`;
    const timeOut = `18:${d % 2 ? "05" : "20"}`;
    rows.push({ date, timeIn, timeOut, status: "Present" });
  }

  return rows;
}



export const fetchAttendanceByMonthAPI = async (employeeId, monthStr) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const id = encodeURIComponent((employeeId || "").trim());
  const month = (monthStr || "").trim();

  try {
    const res = await fetch(`${baseUrl}/attendance/${id}?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return (data || []).map((r) => ({
      date: r.date,
      timeIn: r.timeIn || r.checkIn || "",
      timeOut: r.timeOut || r.checkOut || "",
      status: (r.status || "").trim(), // "Present" / "Absent"
    }));
  } catch (err) {
    console.warn("Using dummy attendance:", err.message);
    await new Promise((r) => setTimeout(r, 250));
    return buildDummyMonth(month);
  }
};
