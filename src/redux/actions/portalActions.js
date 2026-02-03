import { createAsyncThunk } from "@reduxjs/toolkit";
import dayjs from "dayjs";
import { portalService } from "../services/portalService";

/* ---------------- helpers ---------------- */
const errMsg = (e) =>
  e?.response?.data?.detail ||
  e?.response?.data?.message ||
  e?.message ||
  "Request failed";

const upper = (v) => String(v || "").toUpperCase();
const lower = (v) => String(v || "").toLowerCase();

const normLeave = (x) => {
  if (!x) return null;

  const type = upper(
    x.type ||
      x.code ||
      x.leave_type ||
      x.leaveType ||
      x.type_code ||
      x.leave_code,
  );

  const status = lower(x.status || x.approval_status || x.state || "pending");

  const from =
    x.from ||
    x.start ||
    x.start_date ||
    x.date_from ||
    x.date ||
    x.permission_date;

  const to =
    x.to || x.end || x.end_date || x.date_to || x.date || x.permission_date;

  const reason = x.reason || x.note || x.remarks || "";

  // Permission detection (some backends use PR or HOUR unit)
  const isPermission =
    type === "PR" ||
    type === "PERMISSION" ||
    upper(x.unit) === "HOUR" ||
    x.allow_permission_hours === true;

  const fromD = dayjs(from);
  const toD = dayjs(to || from);

  const days = isPermission ? 0 : Math.max(toD.diff(fromD, "day") + 1, 1);

  return {
    id: x.id ?? x.request_id ?? x.leave_id ?? `${type}-${from}-${to}`,
    type: isPermission ? "PR" : type,
    status,
    from: fromD.isValid() ? fromD.format("YYYY-MM-DD") : null,
    to: toD.isValid() ? toD.format("YYYY-MM-DD") : null,
    days,
    minutes: x.minutes ?? x.permission_minutes ?? 0,
    reason,
    raw: x,
  };
};

const normHoliday = (h) => {
  if (!h) return null;
  const date = h.date || h.holiday_date || h.day || h.on;
  const kind = upper(
    h.kind || h.type || h.category || (h.is_govt ? "GOVT" : "COMPANY"),
  );

  return {
    date: date ? dayjs(date).format("YYYY-MM-DD") : null,
    kind: kind.includes("GOV") ? "GOVT" : "COMPANY",
    name: h.name || h.title || h.holiday_name || "",
    raw: h,
  };
};

const buildMonthParams = ({ monthISO }) => {
  const m = dayjs(monthISO).startOf("month");
  return {
    year: m.year(),
    month: m.month() + 1,
    // calendar endpoint wants ISO datetime strings
    startISO: m.format("YYYY-MM-DDT00:00:00"),
    endISO: m.endOf("month").format("YYYY-MM-DDT23:59:59"),
    // admin holiday endpoint wants YYYY-MM-DD
    startDate: m.format("YYYY-MM-DD"),
    endDate: m.endOf("month").format("YYYY-MM-DD"),
  };
};

const computeOverview = ({ leaves = [], holidays = [] }) => {
  let totalLeaveDays = 0;
  let approvedLeaveDays = 0;
  let permissionCount = 0;

  const typeDays = { EL: 0, CL: 0, SL: 0 };

  for (const l of leaves) {
    if (!l) continue;
    if (l.type === "PR") {
      // count permissions (ignore rejected)
      if (l.status !== "rejected") permissionCount += 1;
      continue;
    }

    // ignore rejected in totals (you can change if you want)
    if (l.status === "rejected") continue;

    totalLeaveDays += l.days;

    if (l.type === "EL" || l.type === "CL" || l.type === "SL") {
      typeDays[l.type] += l.days;
    }

    if (l.status === "approved") {
      approvedLeaveDays += l.days;
    }
  }

  let companyHolidays = 0;
  let govtHolidays = 0;

  for (const h of holidays) {
    if (!h?.date) continue;
    if (h.kind === "GOVT") govtHolidays += 1;
    else companyHolidays += 1;
  }

  return {
    totalLeaveDays,
    approvedLeaveDays,
    companyHolidays,
    govtHolidays,
    typeDays,
    permissionCount,
  };
};

/* ---------------- thunks ---------------- */

export const fetchPortalTypes = createAsyncThunk(
  "portal/fetchTypes",
  async (_, thunkAPI) => {
    try {
      // try employee types first
      return await portalService.getLeaveTypes();
    } catch (e1) {
      // fallback admin types
      try {
        return await portalService.getAdminLeaveTypes();
      } catch (e2) {
        return thunkAPI.rejectWithValue(errMsg(e2) || errMsg(e1));
      }
    }
  },
);

export const fetchPortalBalances = createAsyncThunk(
  "portal/fetchBalances",
  async ({ employeeId, year, month }, thunkAPI) => {
    try {
      return await portalService.getLeaveBalances({ employeeId, year, month });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

export const fetchPortalSummary = createAsyncThunk(
  "portal/fetchSummary",
  async ({ employeeId, year, month }, thunkAPI) => {
    try {
      return await portalService.getLeaveSummary({ employeeId, year, month });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

export const fetchPortalCalendar = createAsyncThunk(
  "portal/fetchCalendar",
  async ({ employeeId, start, end }, thunkAPI) => {
    try {
      return await portalService.getLeaveCalendar({ employeeId, start, end });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

export const fetchPortalHolidays = createAsyncThunk(
  "portal/fetchHolidays",
  async ({ start, end, region = "TN" }, thunkAPI) => {
    try {
      return await portalService.getAdminHolidays({ start, end, region });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

export const fetchPortalRequests = createAsyncThunk(
  "portal/fetchRequests",
  async ({ employeeId }, thunkAPI) => {
    try {
      return await portalService.getLeaveRequests({ employeeId });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

export const applyPortalLeave = createAsyncThunk(
  "portal/applyLeave",
  async ({ employeeId, rec }, thunkAPI) => {
    try {
      // keep your form payload as-is
      const payload = rec || {};
      return await portalService.applyLeave({ employeeId, payload });
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);

/**
 * ✅ ONE CALL for Calendar + Monthly Overview (uses multiple APIs)
 * Use this when month changes (Prev/Next/Today) and when Apply succeeds.
 */
export const fetchPortalMonthData = createAsyncThunk(
  "portal/fetchMonthData",
  async ({ employeeId, monthISO, region = "TN" }, thunkAPI) => {
    try {
      const { year, month, startISO, endISO, startDate, endDate } =
        buildMonthParams({ monthISO });

      const [calendarRaw, holidaysRaw, summaryRaw, balancesRaw] =
        await Promise.all([
          portalService
            .getLeaveCalendar({ employeeId, start: startISO, end: endISO })
            .catch(() => ({ holidays: [], leaves: [] })),

          portalService
            .getAdminHolidays({ start: startDate, end: endDate, region })
            .catch(() => []),

          portalService
            .getLeaveSummary({ employeeId, year, month })
            .catch(() => null),

          portalService
            .getLeaveBalances({ employeeId, year, month })
            .catch(() => []),
        ]);

      const leaves = Array.isArray(calendarRaw?.leaves)
        ? calendarRaw.leaves.map(normLeave).filter(Boolean)
        : [];

      const holidays = Array.isArray(holidaysRaw)
        ? holidaysRaw.map(normHoliday).filter(Boolean)
        : [];

      const overview = computeOverview({ leaves, holidays });

      return {
        meta: {
          employeeId,
          year,
          month,
          region,
          startISO,
          endISO,
          startDate,
          endDate,
        },
        raw: {
          calendar: calendarRaw,
          holidays: holidaysRaw,
          summary: summaryRaw,
          balances: balancesRaw,
        },
        data: {
          leaves,
          holidays,
          summary: summaryRaw,
          balances: balancesRaw,
          overview,
        },
      };
    } catch (e) {
      return thunkAPI.rejectWithValue(errMsg(e));
    }
  },
);
