// /src/redux/services/employeeSideAttendanceService.js
import axios from "axios";
import dayjs from "dayjs";

const BASE = (
  import.meta.env.VITE_API_URL ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({ baseURL: BASE });
const unwrap = (res) => res.data;

/* ---------------- AUTH HANDLER ----------------
   - check-in / check-out / attendance active -> NO token
   - month-report -> token (your screenshot shows it needs token)
------------------------------------------------ */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth.token");
  const url = config.url || "";

  const isNoAuthAttendance =
    url.includes("/api/check-in") ||
    url.includes("/api/check-out") ||
    url.includes("/api/attendance/active");

  if (!isNoAuthAttendance && token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  config.headers.Accept = "application/json";
  return config;
});

/* ---------------- HELPERS ---------------- */
const safeJson = (v) => {
  try {
    return JSON.parse(v ?? "null");
  } catch {
    return null;
  }
};

const getEmployeeId = () => {
  const u =
    safeJson(localStorage.getItem("auth.user")) ||
    safeJson(localStorage.getItem("user"));

  return (
    u?.employeeId || u?.employee_id || u?.empId || u?.emp_id || u?.id || null
  );
};

const todayKey = () => dayjs().format("YYYY-MM-DD");

/* ---------------- LOCAL STORAGE (PER EMPLOYEE) ---------------- */
const empKey = (employeeId) => employeeId || getEmployeeId() || "unknown";

const LS = {
  running: (id) => `attendance.${empKey(id)}.running`,
  start: (id) => `attendance.${empKey(id)}.start`,
  date: (id) => `attendance.${empKey(id)}.date`,
  records: (id) => `attendance.${empKey(id)}.records.v1`,
};

const readRecords = (employeeId) => {
  try {
    return (
      JSON.parse(localStorage.getItem(LS.records(employeeId)) || "{}") || {}
    );
  } catch {
    return {};
  }
};

const writeRecords = (employeeId, obj) => {
  localStorage.setItem(LS.records(employeeId), JSON.stringify(obj || {}));
};

const upsertDayRecord = (employeeId, key, patch) => {
  const all = readRecords(employeeId);
  all[key] = { ...(all[key] || {}), ...(patch || {}) };
  writeRecords(employeeId, all);
  return all[key];
};

const setLocalRun = (employeeId, iso) => {
  localStorage.setItem(LS.start(employeeId), iso);
  localStorage.setItem(LS.running(employeeId), "true");
  localStorage.setItem(LS.date(employeeId), todayKey());
};

const clearLocalRun = (employeeId) => {
  localStorage.removeItem(LS.start(employeeId));
  localStorage.removeItem(LS.date(employeeId));
  localStorage.setItem(LS.running(employeeId), "false");
};

const localIsRunningToday = (employeeId) => {
  return (
    localStorage.getItem(LS.running(employeeId)) === "true" &&
    localStorage.getItem(LS.date(employeeId)) === todayKey() &&
    !!localStorage.getItem(LS.start(employeeId))
  );
};

/* ---------- time parser (handles microseconds) ---------- */
const toMs = (iso) => {
  if (!iso) return NaN;
  const fixed = String(iso).replace(/\.(\d{3})\d+Z$/, ".$1Z");
  const t = new Date(fixed).getTime();
  return Number.isFinite(t) ? t : NaN;
};

/* ---------------- SERVICES ---------------- */
const employeeSideAttendanceService = {
  /* ------- CHECK IN ------- */
  async checkIn({ employeeId } = {}) {
    const empId = employeeId || getEmployeeId();
    if (!empId) throw new Error("Missing employeeId");

    // already running locally -> don't hit backend
    if (localIsRunningToday(empId)) {
      const start = localStorage.getItem(LS.start(empId));
      upsertDayRecord(empId, todayKey(), { in: start, out: null, totalMs: 0 });
      return {
        key: todayKey(),
        record: { in: start, out: null, totalMs: 0 },
        already: true,
        source: "local",
      };
    }

    try {
      const res = await api.post(
        "/api/check-in",
        {},
        {
          params: { employeeId: empId },
          headers: { "Content-Type": "application/json" },
        },
      );

      const inIso =
        res?.data?.checkInUtc ||
        res?.data?.check_in_utc ||
        res?.data?.checkInUTC ||
        new Date().toISOString();

      setLocalRun(empId, inIso);
      upsertDayRecord(empId, todayKey(), { in: inIso, out: null, totalMs: 0 });

      return { key: todayKey(), record: { in: inIso, out: null, totalMs: 0 } };
    } catch (err) {
      const detail = String(err?.response?.data?.detail || "");
      const msg = detail.toLowerCase();
      const status = err?.response?.status;

      // YOUR BACKEND RETURNS 400 for "already checked in"
      const isAlready =
        status === 400 ||
        status === 409 ||
        msg.includes("already") ||
        msg.includes("active") ||
        msg.includes("checked in");

      if (isAlready) {
        // IMPORTANT: don't start from "now". Pull correct in-time from month-report.
        const merged = await employeeSideAttendanceService.fetchMonth({
          employeeId: empId,
          monthISO: dayjs().startOf("month").format("YYYY-MM-01"), // ✅ NO timezone shift
        });

        const rec = merged?.[todayKey()] || null;

        if (rec?.in && !rec?.out) {
          setLocalRun(empId, rec.in);
          upsertDayRecord(empId, todayKey(), {
            in: rec.in,
            out: null,
            totalMs: 0,
          });
          return {
            key: todayKey(),
            record: { in: rec.in, out: null, totalMs: 0 },
            already: true,
            source: "server-sync",
          };
        }

        // month-report didn't show open session -> still allow UI to show "Check Out"
        const key = todayKey();
        setLocalRun(empId, new Date().toISOString());
        upsertDayRecord(empId, key, {
          in: null,
          out: null,
          totalMs: 0,
          start_unknown: true,
        });

        return {
          key,
          record: { in: null, out: null, totalMs: 0, start_unknown: true },
          already: true,
          source: "server-no-start",
        };
      }

      throw new Error(detail || "Check-in failed");
    }
  },

  /* ------- CHECK OUT ------- */
  async checkOut({ employeeId, existingInIso } = {}) {
    const empId = employeeId || getEmployeeId();
    if (!empId) throw new Error("Missing employeeId");

    try {
      const res = await api.post(
        "/api/check-out",
        {},
        {
          params: { employeeId: empId },
          headers: { "Content-Type": "application/json" },
        },
      );

      const outIso =
        res?.data?.checkOutUtc ||
        res?.data?.check_out_utc ||
        res?.data?.checkOutUTC ||
        new Date().toISOString();

      const worked =
        Number(res?.data?.workedSeconds || res?.data?.worked_seconds || 0) *
        1000;

      const key = todayKey();
      const dayRec = readRecords(empId)?.[key] || {};
      const startUnknown = !!dayRec.start_unknown;

      const startIso = startUnknown
        ? null
        : dayRec.in ||
          existingInIso ||
          localStorage.getItem(LS.start(empId)) ||
          null;

      clearLocalRun(empId);

      upsertDayRecord(empId, key, {
        in: startIso,
        out: outIso,
        totalMs: worked,
        start_unknown: false,
      });

      // ✅ return full record (includes in)
      return { key, record: { in: startIso, out: outIso, totalMs: worked } };
    } catch (err) {
      throw new Error(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Check-out failed",
      );
    }
  },

  /* ------- ACTIVE SESSION (OPTIONAL) ------- */
  async fetchActiveSession({ employeeId } = {}) {
    const empId = employeeId || getEmployeeId();
    if (!empId) return null;

    try {
      const res = await api.get("/api/attendance/active", {
        params: { employeeId: empId },
      });
      return res.data;
    } catch {
      return null;
    }
  },

  /* ------- MONTH REPORT -> records map ------- */
  async fetchMonth({ employeeId, monthISO }) {
    const empId = employeeId || getEmployeeId();
    if (!empId) throw new Error("Missing employeeId");

    const m = monthISO ? dayjs(monthISO) : dayjs();
    const year = m.year();
    const month = m.month() + 1;

    const report = await api
      .get(`/api/${empId}/month-report`, {
        params: {
          year,
          month,
          include_absent: true,
          working_days_only: false,
          cap_to_today: false,
        },
      })
      .then(unwrap);

    const items = Array.isArray(report?.items) ? report.items : [];
    const existing = readRecords(empId);
    const monthMap = {};

    for (const it of items) {
      const rawKey =
        it.work_date_local ||
        it.work_date ||
        it.date ||
        it.day ||
        it.work_date_utc;

      if (!rawKey) continue;

      const key = dayjs(rawKey).format("YYYY-MM-DD");
      if (!key) continue;

      const seconds = Number(
        it.seconds_worked ?? it.worked_seconds ?? it.total_seconds_worked ?? 0,
      );

      const apiTotalMs = Number(it.totalMs ?? it.total_ms ?? seconds * 1000);

      const inIso =
        it.first_check_in_utc ||
        it.first_check_in_local ||
        it.check_in_utc ||
        it.check_in_local ||
        it.start_time ||
        null;

      const outIso =
        it.last_check_out_utc ||
        it.last_check_out_local ||
        it.check_out_utc ||
        it.check_out_local ||
        it.end_time ||
        null;

      const prev = existing[key] || {};
      const isToday = key === todayKey();
      const runningToday = isToday && localIsRunningToday(empId);

      const statusTxt = String(it.status || "")
        .trim()
        .toLowerCase();
      const isAbsent =
        statusTxt === "absent" &&
        !inIso &&
        !outIso &&
        Number(seconds || 0) <= 0;

      // if backend says Absent, wipe old local values (fix dots)
      const finalIn = isAbsent ? null : (inIso ?? prev.in ?? null);
      const finalOut = isAbsent ? null : (outIso ?? prev.out ?? null);
      let finalTotal = isAbsent ? 0 : Number(apiTotalMs || 0);

      const a = toMs(finalIn);
      const b = toMs(finalOut);

      if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
        finalTotal = b - a;
      } else if (runningToday && !finalOut) {
        finalTotal = Number(prev.totalMs || 0);
      }

      monthMap[key] = {
        ...prev,
        ...it,
        in: finalIn,
        out: finalOut,
        totalMs: Number(finalTotal || 0),
      };
    }

    const merged = { ...existing, ...monthMap };
    writeRecords(empId, merged);
    return merged;
  },
};

export default employeeSideAttendanceService;
export { employeeSideAttendanceService };
