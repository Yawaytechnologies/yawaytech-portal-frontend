// src/redux/services/hrAttendanceService.js
import dayjs from "dayjs";

/* --------------------------- base + helpers --------------------------- */
const rawBase =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  "/";

const base = rawBase.endsWith("/") ? rawBase : rawBase + "/";

const join = (a, b) =>
  (a.endsWith("/") ? a : a + "/") + (b.startsWith("/") ? b.slice(1) : b);

const fmtHM = (mins) =>
  Number.isFinite(mins) && mins > 0
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : "—";

/** Robustly format time-like values to HH:mm, or "—" if not a real time. */
const toHM = (v) => {
  if (v == null || v === "") return "—";
  const s = String(v);

  // Pure date => not a time
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  // Sentinel midnight → treat as unknown if the source string looks like midnight
  const looksMidnight = /T00:00(:00(\.\d+)?)?(Z)?$/.test(s);
  if (looksMidnight && hh === "00" && mm === "00") return "—";

  return `${hh}:${mm}`;
};

export const monthStr = (d = dayjs()) => dayjs(d).format("YYYY-MM");

/* ---------------------- GET: month report by employee ---------------------- */
export async function fetchAttendanceByMonthAPI(employeeId, monthStrArg) {
  const [y, m] = String(monthStrArg || "").split("-");
  const year = Number(y);
  const month = Number(m);

  const id = encodeURIComponent(String(employeeId || "").trim());
  const url =
    join(base, `api/attendance/${id}/month-report`) +
    `?year=${year}&month=${month}` +
    `&include_absent=true&working_days_only=false&cap_to_today=true`;

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const payload = await res.json();

  const rows = (payload.items || [])
    .map((it) => {
      // Prefer local fields → utc → fallbacks
      const inRaw =
        it.first_check_in_local ??
        it.firstCheckInLocal ??
        it.first_check_in_utc ??
        it.firstCheckInUtc ??
        it.check_in_utc ??
        it.in ??
        null;

      const outRaw =
        it.last_check_out_local ??
        it.lastCheckOutLocal ??
        it.last_check_out_utc ??
        it.lastCheckOutUtc ??
        it.check_out_utc ??
        it.out ??
        null;

      const mins = Math.round((it.seconds_worked || 0) / 60);
      const label =
        it.status === "PRESENT"
          ? "Present"
          : it.status === "WEEKEND"
          ? "Weekend"
          : "Absent";

      return {
        date: it.work_date_local,          // "YYYY-MM-DD"
        timeIn: toHM(inRaw),               // "HH:mm" or "—"
        timeOut: toHM(outRaw),             // "HH:mm" or "—"
        label,
        hours: label === "Present" ? fmtHM(mins) : "—",
        _mins: mins,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const meta = {
    employeeName: payload.employee_name || payload.employeeName || "",
    employeeCode: payload.employee_id   || payload.employeeId   || "",
  };

  return { rows, meta };
}

/* ------------------ POST: admin check-in / check-out APIs ------------------ */
export async function checkInEmployeeAPI(employeeId) {
  const id = encodeURIComponent(String(employeeId || "").trim());
  const url = join(base, `api/attendance/check-in`) + `?employeeId=${id}`;

  // Try curl-style (no body)
  let res = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json" },
  });

  // Fallback: empty JSON body
  if (!res.ok) {
    res = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: "{}",
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Check-in failed (${res.status})`);
    err.detail = body;
    throw err;
  }

  const payload = await res.json(); // { sessionId, employeeId, checkInUtc, workDateLocal }
  return {
    ...payload,
    key: (payload.workDateLocal ? dayjs(payload.workDateLocal) : dayjs()).format("YYYY-MM-DD"),
  };
}

export async function checkOutEmployeeAPI(employeeId) {
  const id = encodeURIComponent(String(employeeId || "").trim());
  const url = join(base, `api/attendance/check-out`) + `?employeeId=${id}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: "{}", // empty JSON is fine
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Check-out failed (${res.status})`);
    err.detail = body;
    throw err;
  }

  const payload = await res.json(); // e.g. { checkOutUtc, totalMs?, workDateLocal? }
  return {
    ...payload,
    key: (payload.workDateLocal ? dayjs(payload.workDateLocal) : dayjs()).format("YYYY-MM-DD"),
  };
}

/* ----------------------- Convenience: today’s snapshot ---------------------- */
export async function fetchTodayForEmployee(employeeId) {
  const { rows, meta } = await fetchAttendanceByMonthAPI(employeeId, monthStr());
  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = rows.find((r) => r.date === todayKey) || null;
  return { today, meta };
}

/* --------------------------- default export bundle -------------------------- */
const hrAttendanceService = {
  monthStr,
  fetchAttendanceByMonthAPI,
  fetchTodayForEmployee,
  checkInEmployeeAPI,
  checkOutEmployeeAPI,
};

export default hrAttendanceService;
