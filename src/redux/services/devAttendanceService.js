// src/redux/services/devAttendanceService.js
// Identical month-report adapter as HR, with a DEV export name.
// Includes an alias so old imports like `fetchAttendanceByMonthAPI` still work.

const base =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

const fmtHM = (mins) =>
  Number.isFinite(mins) && mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "—";

const toLocalHM = (iso) => {
  if (!iso) return "";
  const d = new Date(iso); // ISO in UTC; rendered as local
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

/** Main month-report fetch for DEV attendance */
export const fetchDevAttendanceByMonthAPI = async (employeeId, monthStr) => {
  const [y, m] = String(monthStr || "").split("-");
  const year = Number(y);
  const month = Number(m); // 1..12

  const id = encodeURIComponent(String(employeeId || "").trim());
  const url =
    `${base}api/attendance/${id}/month-report` +
    `?year=${year}&month=${month}` +
    `&include_absent=true&working_days_only=false&cap_to_today=true`;

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const payload = await res.json();

  const rows = (payload.items || [])
    .map((it) => {
      const mins = Math.round((it.seconds_worked || 0) / 60);
      const label =
        it.status === "PRESENT" ? "Present" :
        it.status === "WEEKEND" ? "Weekend" : "Absent";

      return {
        date: it.work_date_local,                 // "YYYY-MM-DD"
        timeIn: toLocalHM(it.first_check_in_utc), // "HH:MM" or ""
        timeOut: toLocalHM(it.last_check_out_utc),
        label,
        hours: label === "Present" ? fmtHM(mins) : "—",
        _mins: mins,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return rows;
};

// 🔁 Alias to avoid named-export mismatches
export { fetchDevAttendanceByMonthAPI as fetchAttendanceByMonthAPI };

export default { fetchDevAttendanceByMonthAPI };
