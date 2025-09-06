
// monthStr = "YYYY-MM"
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

function buildDummyMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const date = `${monthStr}-${pad(d)}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0 Sun, 6 Sat
    if (dow === 0 || dow === 6) {
      rows.push({ date, timeIn: "", timeOut: "", status: "Absent" });
    } else {
      const timeIn = `${pad(9 + (d % 2))}:${d % 2 ? "10" : "05"}`;
      const timeOut = `18:${d % 2 ? "05" : "20"}`;
      rows.push({ date, timeIn, timeOut, status: "Present" });
    }
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
