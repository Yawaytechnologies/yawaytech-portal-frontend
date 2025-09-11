// src/redux/services/hrAttendanceService.js
const base =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

const fmtHM = (mins) =>
  Number.isFinite(mins) && mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "—";

const toLocalHM = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const fetchAttendanceByMonthAPI = async (employeeId, monthStr) => {
  const [y, m] = String(monthStr || "").split("-");
  const year = Number(y);
  const month = Number(m);

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
        date: it.work_date_local,
        timeIn: toLocalHM(it.first_check_in_utc),
        timeOut: toLocalHM(it.last_check_out_utc),
        label,
        hours: label === "Present" ? fmtHM(mins) : "—",
        _mins: mins,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // NEW: pass name/code up for the UI
  const meta = {
    employeeName: payload.employee_name || payload.employeeName || "",
    employeeCode: payload.employee_id   || payload.employeeId   || "",
  };

  return { rows, meta };
};

export default { fetchAttendanceByMonthAPI };
