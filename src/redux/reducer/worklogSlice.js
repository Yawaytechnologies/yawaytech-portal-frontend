import { createSlice } from "@reduxjs/toolkit";
import {
  createWorklog,
  fetchWorklogsByEmployee,
  checkInWorklog,
  checkOutWorklog,
  patchWorklog,
} from "../actions/worklogActions";

/* ---- helper: time-only => join with work_date ---- */
const isTimeOnly = (s) =>
  typeof s === "string" &&
  /^\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?Z?$/.test(s.trim());

const hasTZ = (s) => /[zZ]|[+-]\d{2}:?\d{2}$/.test(s || "");

const toISOWithDateCtx = (value, dateCtx) => {
  if (!value) return null;
  let s = String(value).trim();
  if (!s) return null;

  // "11:58:17.919Z" => "2026-02-22T11:58:17.919Z"
  if (isTimeOnly(s)) {
    const d = dateCtx || new Date().toISOString().slice(0, 10);
    if (!hasTZ(s)) s += "Z";
    return `${d}T${s}`;
  }

  // "YYYY-MM-DD HH:mm:ss" => ISO
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
  if (s.includes("T") && !hasTZ(s)) s += "Z";
  return s;
};

const calcDurationHours = (r) => {
  const server = r?.duration_hours;
  if (Number.isFinite(server) && server > 0) return server;

  const aIso = toISOWithDateCtx(r?.start_time, r?.work_date);
  const bIso = toISOWithDateCtx(r?.end_time, r?.work_date);
  const a = aIso ? Date.parse(aIso) : NaN;
  const b = bIso ? Date.parse(bIso) : NaN;

  if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) {
    return Math.round(((b - a) / 36e5) * 100) / 100;
  }
  return 0;
};

const initialState = {
  items: [],
  loading: false,
  error: null,
  lastCreated: null,
  updatingId: null,
  filters: {
    type: "ALL",
    status: "ALL",
  },
};

const worklogSlice = createSlice({
  name: "worklog",
  initialState,
  reducers: {
    resetWorklogState: () => initialState,
    upsertOne: (state, { payload }) => {
      if (!payload?.id) return;
      const i = state.items.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.items[i] = { ...state.items[i], ...payload };
      else state.items.unshift(payload);
    },
    setWorklogFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    resetWorklogFilters: (state) => {
      state.filters = { type: "ALL", status: "ALL" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorklogsByEmployee.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchWorklogsByEmployee.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchWorklogsByEmployee.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload?.message || "Failed to load worklogs";
      });

    builder
      .addCase(createWorklog.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createWorklog.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.lastCreated = payload || null;
        if (payload) s.items.unshift(payload);
      })
      .addCase(createWorklog.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload?.message || "Failed to create worklog";
      });

    builder
      .addCase(checkInWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.error = null;
      })
      .addCase(checkInWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;
        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) s.items[i] = { ...s.items[i], ...payload };
      })
      .addCase(checkInWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.error = payload?.message || "Failed to check in";
      });

    builder
      .addCase(checkOutWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.error = null;
      })
      .addCase(checkOutWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;

        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) {
          const merged = { ...s.items[i], ...payload };

          // ✅ if backend returns duration_hours=0 but times exist, compute
          if (
            !Number.isFinite(merged.duration_hours) ||
            merged.duration_hours === 0
          ) {
            merged.duration_hours = calcDurationHours(merged);
          }

          s.items[i] = merged;
        }
      })
      .addCase(checkOutWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.error = payload?.message || "Failed to check out";
      });

    builder
      .addCase(patchWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.error = null;
      })
      .addCase(patchWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;
        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) s.items[i] = { ...s.items[i], ...payload };
      })
      .addCase(patchWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.error = payload?.message || "Failed to update worklog";
      });
  },
});

export const {
  resetWorklogState,
  upsertOne,
  setWorklogFilters,
  resetWorklogFilters,
} = worklogSlice.actions;

export default worklogSlice.reducer;

/* Selectors */
export const selectWorklogState = (s) => s.worklog || initialState;
export const selectWorklogs = (s) => selectWorklogState(s).items;
export const selectWorklogItems = (s) => selectWorklogState(s).items;
export const selectWorklogLoading = (s) => selectWorklogState(s).loading;
export const selectWorklogError = (s) => selectWorklogState(s).error;
export const selectUpdatingId = (s) => selectWorklogState(s).updatingId;
export const selectLastCreated = (s) => selectWorklogState(s).lastCreated;
export const selectWorklogFilters = (s) => selectWorklogState(s).filters;

/** Totals (fixed: supports time-only start/end) */
export const selectWorklogTotal = (s) => {
  const items = selectWorklogs(s) || [];
  const { type, status } = selectWorklogFilters(s) || {};

  const filtered = items.filter((r) => {
    const byType = !type || type === "ALL" || r.work_type === type;
    const byStatus = !status || status === "ALL" || r.status === status;
    return byType && byStatus;
  });

  const duration = filtered.reduce((sum, r) => sum + calcDurationHours(r), 0);

  return {
    count: filtered.length,
    duration: Math.round(duration * 100) / 100,
  };
};
