// src/redux/services/dcAttendanceService.js
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

const p2 = (n) => String(n).padStart(2, "0");
const nthSaturday = (day) => Math.floor((day - 1) / 7) + 1;
const HALF_IN = "10:00";
const HALF_OUT = "14:00";
const HALF_MINS = 4 * 60;

function applyOrgPolicy(mappedRows, monthStr) {
  const [yStr, mStr] = String(monthStr || "").split("-");
  const y = Number(yStr), m = Number(mStr);
  const daysInMonth = new Date(y, m, 0).getDate();

  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const cd = now.getDate();

  const isCurrentMonth = y === cy && m === cm;
  const isFutureMonth  = y > cy || (y === cy && m > cm);
  const lastDay = isCurrentMonth ? cd : daysInMonth;

  if (isFutureMonth) {
    return [...mappedRows].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  const byDate = new Map(mappedRows.map(r => [r.date, r]));
  const out = [];

  for (let d = 1; d <= lastDay; d++) {
    const date = `${yStr}-${p2(m)}-${p2(d)}`;
    const dow = new Date(y, m - 1, d).getDay();
    const existing = byDate.get(date);

    const mins = existing?._mins ?? 0;
    const hasWork = Number.isFinite(mins) && mins > 0;

    if (dow === 0) {
      if (!existing || (!hasWork && !existing.timeIn && !existing.timeOut)) {
        out.push({ date, timeIn: "", timeOut: "", label: "Weekend", hours: "—", _mins: 0 });
      } else {
        out.push(existing);
      }
      continue;
    }

    if (dow === 6) {
      const nth = nthSaturday(d);
      const isHalfDay = nth === 1 || nth === 3;

      if (isHalfDay) {
        if (!existing || (!hasWork && !existing.timeIn && !existing.timeOut && existing.label !== "Present")) {
          out.push({ date, timeIn: HALF_IN, timeOut: HALF_OUT, label: "Present", hours: fmtHM(HALF_MINS), _mins: HALF_MINS });
        } else {
          out.push(existing);
        }
      } else {
        if (!existing || (!hasWork && !existing.timeIn && !existing.timeOut)) {
          out.push({ date, timeIn: "", timeOut: "", label: "Weekend", hours: "—", _mins: 0 });
        } else {
          out.push(existing);
        }
      }
      continue;
    }

    if (existing) {
      if (!hasWork && !existing.timeIn && !existing.timeOut) {
        out.push({ ...existing, label: "Absent", hours: "—", _mins: 0 });
      } else {
        out.push(existing);
      }
    } else {
      out.push({ date, timeIn: "", timeOut: "", label: "Absent", hours: "—", _mins: 0 });
    }
  }

  out.sort((a, b) => new Date(b.date) - new Date(a.date));
  return out;
}

export const fetchDcAttendanceByMonthAPI = async (employeeId, monthStr) => {
  const [y, m] = String(monthStr || "").split("-");
  const year = Number(y), month = Number(m);

  const id = encodeURIComponent(String(employeeId || "").trim());
  const url =
    `${base}api/attendance/${id}/month-report` +
    `?year=${year}&month=${month}` +
    `&include_absent=true&working_days_only=false&cap_to_today=true`;

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const payload = await res.json();

  const mapped = (payload.items || []).map((it) => {
    const mins = Math.round((it.seconds_worked || 0) / 60);
    return {
      date: it.work_date_local,
      timeIn: toLocalHM(it.first_check_in_utc),
      timeOut: toLocalHM(it.last_check_out_utc),
      label: it.status === "PRESENT" ? "Present"
            : it.status === "WEEKEND" ? "Weekend"
            : "Absent",
      hours: mins > 0 ? fmtHM(mins) : "—",
      _mins: mins,
    };
  });

  return applyOrgPolicy(mapped, monthStr);
};

// Back-compat alias
export { fetchDcAttendanceByMonthAPI as fetchAttendanceByMonthAPI };

export default { fetchDcAttendanceByMonthAPI };
