// src/redux/services/leaveService.js
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
/**
 * Returns array like:
 * [
 *   {
 *     "id": 9,
 *     "code": "CGR",
 *     "name": "Permission",
 *     "unit": "HOUR",
 *     "is_paid": true,
 *     "allow_half_day": false,
 *     "allow_permission_hours": false
 *   },
 *   ...
 * ]
 */
export async function fetchLeaveTypesApi() {
  const res = await fetch(`${API_BASE}/api/leave/types`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to load leave types");
  }

  const body = await res.json();

  // 🔍 Normalize to a plain array no matter what backend sends
  let arr = [];

  if (Array.isArray(body)) {
    arr = body;
  } else if (body && typeof body === "object") {
    if (Array.isArray(body.data)) {
      arr = body.data;
    } else if (Array.isArray(body.results)) {
      arr = body.results;
    } else {
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
/**
 * Map UI record from LeaveForm -> backend payload for /api/leave/apply
 *
 * rec from <LeaveForm />:
 *
 *  // full-day leave
 *  {
 *    type: "EL" | "CL" | "SL",
 *    from: "YYYY-MM-DD",
 *    to:   "YYYY-MM-DD",
 *    days: 1 | 2 | ...,
 *    reason: "string",
 *    attachmentName: "file.ext"
 *  }
 *
 *  // permission (PR)
 *  {
 *    type: "PR",
 *    permissionMode: "FIRST" | "SECOND" | "TIME",
 *    date: "YYYY-MM-DD",
 *    timeFrom: "HH:mm",
 *    timeTo: "HH:mm",
 *    minutes: number,
 *    reasonCode: "LATE" | "EARLY" | "OTHER",
 *    reasonText: "string",
 *    attachmentName: "file.ext"
 *  }
 *
 * Backend wants:
 * {
 *   "leave_type_code": "SL",
 *   "requested_unit": "DAY" | "HOUR",
 *   "start_datetime": "2025-11-27T06:37:22.253Z",
 *   "end_datetime":   "2025-11-27T06:37:22.253Z",
 *   "requested_hours": 8,
 *   "reason": "...",
 * }
 */
export function buildLeaveApplyPayload(rec, leaveTypes = []) {
  const rawType = rec.type || rec.leave_type || "";
  const uiType = String(rawType).trim().toUpperCase();

  if (!uiType) {
    throw new Error("Leave type is required.");
  }

  /* ----------------- 1) Map UI type -> backend leave_type_code ----------------- */

  let leave_type_code = null;

  if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
    // Try direct code match from API (EL, CL, SL, CGR, etc.)
    const matchByCode = leaveTypes.find(
      (t) => String(t.code).trim().toUpperCase() === uiType
    );
    if (matchByCode) {
      leave_type_code = matchByCode.code;
    } else if (uiType === "PR") {
      // For permission (PR), pick first HOUR-type leave from backend (like CGR)
      const hourType = leaveTypes.find(
        (t) => String(t.unit || "").toUpperCase() === "HOUR"
      );
      if (hourType) {
        leave_type_code = hourType.code;
      }
    }
  }

  // Fallback mapping if we couldn't resolve from API
  if (!leave_type_code) {
    if (uiType === "EL") leave_type_code = "EL";
    else if (uiType === "CL") leave_type_code = "CL";
    else if (uiType === "SL") leave_type_code = "SL";
    else if (uiType === "PR") leave_type_code = "CGR"; // permission → CGR hour type
    else throw new Error(`Unknown leave type: ${uiType}`);
  }

  let requested_unit = "DAY";
  let start_datetime = null;
  let end_datetime = null;
  let requested_hours = 0;

  /* ----------------- 2) FULL DAY LEAVES (EL / CL / SL) ----------------- */

  if (uiType === "EL" || uiType === "CL" || uiType === "SL") {
    const from = rec.from || rec.start_date || rec.date_from;
    const to = rec.to || rec.end_date || rec.date_to || from;

    if (!from) {
      throw new Error("Start date is required.");
    }

    const fromD = dayjs(from);
    const toD = dayjs(to || fromD);

    if (!fromD.isValid() || !toD.isValid()) {
      throw new Error("Invalid date range.");
    }

    const daysCount =
      rec.days && rec.days > 0
        ? rec.days
        : Math.max(toD.startOf("day").diff(fromD.startOf("day"), "day") + 1, 1);

    requested_unit = "DAY";
    start_datetime = fromD.startOf("day").toISOString();
    end_datetime = toD.endOf("day").toISOString();

    // default 8 hrs per day
    const hoursPerDay = rec.requested_hours_day ?? 8;
    requested_hours = daysCount * hoursPerDay;
  }

  /* ----------------- 3) PERMISSION / HOUR LEAVE (PR) ----------------- */

  if (uiType === "PR") {
    requested_unit = "HOUR";

    const date =
      rec.date ||
      rec.permission_date ||
      rec.perm_date ||
      rec.from ||
      rec.start_date;

    const fromTime = rec.timeFrom || rec.fromTime || rec.start_time; // "HH:mm"
    const toTime = rec.timeTo || rec.toTime || rec.end_time; // "HH:mm"

    if (!date) {
      throw new Error("Permission date is required.");
    }

    let computedHours = 0;
    let start = null;
    let end = null;

    if (fromTime && toTime) {
      start = dayjs(`${date}T${fromTime}`);
      end = dayjs(`${date}T${toTime}`);

      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
        throw new Error("Invalid permission time range.");
      }

      const minutesDiff = end.diff(start, "minute");
      computedHours = minutesDiff / 60;
    }

    // If form passes minutes directly, prefer that
    let minutes = rec.minutes;
    if (!minutes || minutes <= 0) {
      minutes = computedHours * 60;
    }

    requested_hours = minutes / 60;

    if (!requested_hours || requested_hours <= 0) {
      throw new Error(
        "requested_hours is required and must be > 0 for HOUR requests."
      );
    }

    start_datetime = (start || dayjs(`${date}T00:00`)).toISOString();
    end_datetime =
      end?.toISOString() || dayjs(`${date}T00:00`).add(minutes, "minute").toISOString();
  }

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
/**
 * Apply a leave request for employee.
 *
 * employeeId: "YTPL002MA"
 * rec: form values (type, dates, times, minutes, reason, etc.) from LeaveForm
 */
export async function applyLeaveApi(employeeId, rec, leaveTypes = []) {
  if (!employeeId) {
    throw new Error("Employee ID is required to apply leave.");
  }

  const payload = buildLeaveApplyPayload(rec, leaveTypes);

  const res = await fetch(
    `${API_BASE}/api/leave/apply?employeeId=${encodeURIComponent(employeeId)}`,
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
  } catch (e) {
    body = null;
  }

  if (!res.ok) {
    let msg =
      body?.detail?.[0]?.msg ||
      body?.detail ||
      body?.message ||
      `Failed to apply leave (status ${res.status})`;

    if (res.status === 409 && !body?.message && !body?.detail) {
      // backend sends bare 409 with no JSON sometimes
      msg = "Overlapping request exists (PENDING/APPROVED).";
    }

    const err = new Error(msg);
    err.response = body;
    err.status = res.status;
    throw err;
  }

  // body is raw API leave object
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
  } else {
    // HOUR / permission – treat as 0 days, handled separately in UI
    days = 0;
  }

  const typeCode = (rec.leave_type_code || rec.code || "").toUpperCase();
  const statusRaw = rec.status || "PENDING";

  return {
    id: rec.id ?? rec.request_id ?? String(rec.id ?? ""),
    type: typeCode, // EL, CL, SL, CGR, etc. (PR you handle at UI level)
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
/**
 * Fetch leave history for employee for given range.
 *
 * Returns array mapped for UI:
 * [
 *   { id, type, from, to, days, status, reason, requested_unit, requested_hours }
 * ]
 */
export async function fetchEmployeeLeavesApi(
  employeeId,
  { from, to } = {}
) {
  if (!employeeId) throw new Error("Employee ID is required");

  const params = new URLSearchParams();
  params.set("employeeId", employeeId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const url = `${API_BASE}/api/leave/employee?${params.toString()}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }

  // 404 → backend route not implemented yet
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

  // map each API record -> UI record
  if (!Array.isArray(body)) return [];
  return body.map(mapApiLeaveToUi);
}
