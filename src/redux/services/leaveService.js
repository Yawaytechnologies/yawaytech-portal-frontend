import dayjs from "dayjs";

/* --------------------- Base URL (env or hard-coded) --------------------- */

const rawBase =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL)) ||
  "https://yawaytech-portal-backend-python-2.onrender.com";

const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

export const getLeaveApiBase = () => API_BASE;

/* ------------------------------------------------------------------ */
/*  GET /api/leave/types                                              */
/* ------------------------------------------------------------------ */

export async function fetchLeaveTypesApi() {
  const res = await fetch(`${API_BASE}/api/leave/types`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) throw new Error("Failed to load leave types");

  const body = await res.json();
  let arr = [];

  if (Array.isArray(body)) arr = body;
  else if (body && typeof body === "object") {
    if (Array.isArray(body.data)) arr = body.data;
    else if (Array.isArray(body.results)) arr = body.results;
    else {
      const firstArray = Object.values(body).find((v) => Array.isArray(v));
      if (firstArray) arr = firstArray;
    }
  }

  console.log("[fetchLeaveTypesApi] normalized types =", arr);
  return arr;
}

/* ------------------------------------------------------------------ */
/*  Payload builder for POST /api/leave/apply                         */
/* ------------------------------------------------------------------ */

export function buildLeaveApplyPayload(rec, leaveTypes = []) {
  if (!rec || typeof rec !== "object") {
    throw new Error("Invalid leave record supplied to payload builder");
  }

  const rawType = rec.type || rec.leave_type || "";
  const uiType = String(rawType).trim().toUpperCase();
  if (!uiType) throw new Error("Leave type is required.");

  // 1️⃣ Map UI type → backend code
  let leave_type_code = null;
  let backendType = null;

  if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
    backendType = leaveTypes.find(
      (t) => String(t.code).trim().toUpperCase() === uiType
    );

    if (!backendType && uiType === "PR") {
      backendType = leaveTypes.find(
        (t) => String(t.unit || "").toUpperCase() === "HOUR"
      );
    }
  }

  leave_type_code = backendType?.code || (uiType === "PR" ? "CGR" : uiType);

  // 👇 Fix: default PR to HOUR even if backend didn't set unit
  const backendUnit = String(
    backendType?.unit || (uiType === "PR" ? "HOUR" : "DAY")
  ).toUpperCase();

  // ✅ FIX HERE — treat CGR/PR with unit=HOUR as permission automatically
  const allowsPermission =
    backendType?.allow_permission_hours === true ||
    (uiType === "PR" && backendUnit === "HOUR");

  let requested_unit = backendUnit;
  let start_datetime = null;
  let end_datetime = null;
  let requested_hours = 0;

  // 2️⃣ Full-day leaves (EL / CL / SL / PR without permission hours)
  if (backendUnit === "DAY" || (uiType === "PR" && !allowsPermission)) {
    const from = rec.from || rec.start_date || rec.date_from;
    const to = rec.to || rec.end_date || rec.date_to || from;
    if (!from) throw new Error("Start date is required.");

    const fromD = dayjs(from);
    const toD = dayjs(to || fromD);
    if (!fromD.isValid() || !toD.isValid())
      throw new Error("Invalid date range.");

    const daysCount =
      rec.days && rec.days > 0
        ? rec.days
        : Math.max(toD.startOf("day").diff(fromD.startOf("day"), "day") + 1, 1);

    requested_unit = "DAY";
    start_datetime = fromD.startOf("day").toISOString();
    end_datetime = toD.endOf("day").toISOString();
    requested_hours = daysCount * (rec.requested_hours_day ?? 8);
  }

  // 3️⃣ Permission (hour-based)
  else if (backendUnit === "HOUR" && uiType === "PR" && allowsPermission) {
    requested_unit = "HOUR";

    const date =
      rec.date ||
      rec.permission_date ||
      rec.perm_date ||
      rec.from ||
      rec.start_date;
    const fromTime = rec.timeFrom || rec.fromTime || rec.start_time;
    const toTime = rec.timeTo || rec.toTime || rec.end_time;
    if (!date) throw new Error("Permission date is required.");

    let computedMinutes = rec.minutes ?? 0;

    if (fromTime && toTime) {
      const start = dayjs(`${date}T${fromTime}`);
      const end = dayjs(`${date}T${toTime}`);
      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
        throw new Error("Invalid permission time range.");
      }
      computedMinutes = end.diff(start, "minute");
      start_datetime = start.toISOString();
      end_datetime = end.toISOString();
    } else {
      // fallback 4-hour block
      start_datetime = dayjs(`${date}T14:00`).toISOString();
      end_datetime = dayjs(`${date}T18:00`).toISOString();
      computedMinutes = 240;
    }

    requested_hours = computedMinutes / 60;
    if (requested_hours <= 0)
      throw new Error("Permission duration must be greater than zero.");
  }

  // 4️⃣ Return unified payload
  return {
    leave_type_code,
    requested_unit,
    start_datetime,
    end_datetime,
    requested_hours,
    reason: rec.reason || rec.reasonText || rec.note || "",
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/leave/apply                                             */
/* ------------------------------------------------------------------ */

export async function applyLeaveApi(employeeId, rec, leaveTypes = []) {
  if (!employeeId) throw new Error("Employee ID is required to apply leave.");

  const payload = buildLeaveApplyPayload(rec, leaveTypes);
  console.log("🟢 Final leave apply payload →", payload);

  const res = await fetch(
    `${API_BASE}/api/leave/apply?employeeId=${employeeId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    let msg =
      body?.detail?.[0]?.msg ||
      body?.detail ||
      body?.message ||
      `Failed to apply leave (status ${res.status})`;

    if (res.status === 409 && !body?.message && !body?.detail) {
      msg = "Overlapping request exists (PENDING/APPROVED).";
    }

    const err = new Error(msg);
    err.response = body;
    err.status = res.status;
    throw err;
  }

  return body;
}

/* ------------------------------------------------------------------ */
/*  Helper: map API leave record -> UI shape                          */
/* ------------------------------------------------------------------ */
function mapApiLeaveToUi(rec) {
  const start = dayjs(rec.start_datetime || rec.from || rec.startDate);
  const end = dayjs(rec.end_datetime || rec.to || rec.endDate || start);

  const unit = (rec.requested_unit || "DAY").toUpperCase();
  let days = 0;

  if (unit === "DAY") {
    days = end.startOf("day").diff(start.startOf("day"), "day") + 1;
  }

  const typeCode = (rec.leave_type_code || rec.code || "").toUpperCase();
  const statusRaw = rec.status || "PENDING";

  return {
    id: rec.id ?? rec.request_id ?? String(rec.id ?? ""),
    type: typeCode,
    from: start.isValid() ? start.format("YYYY-MM-DD") : null,
    to: end.isValid() ? end.format("YYYY-MM-DD") : null,
    days,
    status: typeof statusRaw === "string" ? statusRaw.toLowerCase() : statusRaw,
    reason: rec.reason || "",
    requested_unit: unit,
    requested_hours: rec.requested_hours ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  GET /api/leave/employee?employeeId=&from=&to=                     */
/* ------------------------------------------------------------------ */
export async function fetchEmployeeLeavesApi(employeeId, { from, to } = {}) {
  if (!employeeId) throw new Error("Employee ID is required");

  const params = new URLSearchParams();
  params.set("employeeId", employeeId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const url = `${API_BASE}/api/leave/employee?${params.toString()}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.status === 404) {
    console.warn(
      "fetchEmployeeLeavesApi:",
      "endpoint /api/leave/employee not implemented yet on backend. Returning empty list."
    );
    return [];
  }

  if (!res.ok) {
    const msg =
      body?.detail?.[0]?.msg ||
      body?.detail ||
      body?.message ||
      `Failed to fetch employee leaves (status ${res.status})`;

    const err = new Error(msg);
    err.response = body;
    err.status = res.status;
    throw err;
  }

  if (!Array.isArray(body)) return [];
  return body.map(mapApiLeaveToUi);
}

export async function fetchLeaveRequestsApi(employeeId, { status } = {}) {
  if (!employeeId) throw new Error("Employee ID is required");

  const params = new URLSearchParams();
  params.set("employeeId", employeeId);
  if (status) params.set("status", String(status).toUpperCase());

  const url = `${API_BASE}/api/leave/requests?${params.toString()}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      body?.detail?.[0]?.msg ||
      body?.detail ||
      body?.message ||
      `Failed to fetch leave requests (status ${res.status})`;
    const err = new Error(msg);
    err.response = body;
    err.status = res.status;
    throw err;
  }

  if (!Array.isArray(body)) return [];
  return body.map(mapApiLeaveToUi);
}
