import { createSlice } from "@reduxjs/toolkit";
import {
  createWorklog,
  fetchWorklogsByEmployee,
  checkInWorklog,
  checkOutWorklog,
  updateWorklog,
  updateWorklogTimes,
  deleteWorklog,
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

  if (isTimeOnly(s)) {
    const d = dateCtx || new Date().toISOString().slice(0, 10);
    if (!hasTZ(s)) s += "Z";
    return `${d}T${s}`;
  }

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

  // ✅ loadError is ONLY for fetching the page list
  loadError: null,

  // ✅ actionError is for edit/delete/checkin/checkout errors (won't block UI)
  actionError: null,

  lastCreated: null,
  updatingId: null,
  filters: { type: "ALL", status: "ALL" },
};

const worklogSlice = createSlice({
  name: "worklog",
  initialState,
  reducers: {
    resetWorklogState: () => initialState,
    setWorklogFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
    },
    resetWorklogFilters: (state) => {
      state.filters = { type: "ALL", status: "ALL" };
    },
    clearActionError: (state) => {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // ===================== LOAD LIST =====================
    builder
      .addCase(fetchWorklogsByEmployee.pending, (s) => {
        s.loading = true;
        s.loadError = null;
      })
      .addCase(fetchWorklogsByEmployee.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchWorklogsByEmployee.rejected, (s, { payload }) => {
        s.loading = false;
        s.loadError = payload?.message || "Failed to load worklogs";
      });

    // ===================== CREATE =====================
    builder
      .addCase(createWorklog.pending, (s) => {
        s.loading = true;
        s.actionError = null;
      })
      .addCase(createWorklog.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.lastCreated = payload || null;
        if (payload) s.items.unshift(payload);
      })
      .addCase(createWorklog.rejected, (s, { payload }) => {
        s.loading = false;
        s.actionError = payload?.message || "Failed to create worklog";
      });

    // ===================== CHECKIN / CHECKOUT =====================
    builder
      .addCase(checkInWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.actionError = null;
      })
      .addCase(checkInWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;
        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) s.items[i] = { ...s.items[i], ...payload };
      })
      .addCase(checkInWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.actionError = payload?.message || "Failed to check in";
      });

    builder
      .addCase(checkOutWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.actionError = null;
      })
      .addCase(checkOutWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;

        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) {
          const merged = { ...s.items[i], ...payload };
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
        s.actionError = payload?.message || "Failed to check out";
      });

    // ===================== UPDATE FIELDS =====================
    builder
      .addCase(updateWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.actionError = null;
      })
      .addCase(updateWorklog.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;
        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) s.items[i] = { ...s.items[i], ...payload };
      })
      .addCase(updateWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        // ✅ DO NOT touch loadError here
        s.actionError = payload?.message || "Failed to update worklog";
      });

    // ===================== UPDATE TIMES =====================
    builder
      .addCase(updateWorklogTimes.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.actionError = null;
      })
      .addCase(updateWorklogTimes.fulfilled, (s, { payload }) => {
        s.updatingId = null;
        if (!payload?.id) return;

        const i = s.items.findIndex((x) => x.id === payload.id);
        if (i >= 0) {
          const merged = { ...s.items[i], ...payload };
          if (
            !Number.isFinite(merged.duration_hours) ||
            merged.duration_hours === 0
          ) {
            merged.duration_hours = calcDurationHours(merged);
          }
          s.items[i] = merged;
        }
      })
      .addCase(updateWorklogTimes.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.actionError = payload?.message || "Failed to update work times";
      });

    // ===================== DELETE =====================
    builder
      .addCase(deleteWorklog.pending, (s, { meta }) => {
        s.updatingId = meta?.arg?.worklogId ?? null;
        s.actionError = null;
      })
      .addCase(deleteWorklog.fulfilled, (s, { payload: worklogId }) => {
        s.updatingId = null;
        s.items = s.items.filter((x) => x.id !== worklogId);
      })
      .addCase(deleteWorklog.rejected, (s, { payload }) => {
        s.updatingId = null;
        s.actionError = payload?.message || "Failed to delete worklog";
      });
  },
});

export const {
  resetWorklogState,
  setWorklogFilters,
  resetWorklogFilters,
  clearActionError,
} = worklogSlice.actions;

export default worklogSlice.reducer;

/* Selectors */
export const selectWorklogState = (s) => s.worklog || initialState;
export const selectWorklogs = (s) => selectWorklogState(s).items;
export const selectWorklogItems = (s) => selectWorklogs(s); // keep your old import working
export const selectWorklogLoading = (s) => selectWorklogState(s).loading;

// ✅ page list error
export const selectWorklogError = (s) => selectWorklogState(s).loadError;

// ✅ action errors (edit/delete/checkin/checkout)
export const selectWorklogActionError = (s) =>
  selectWorklogState(s).actionError;

export const selectUpdatingId = (s) => selectWorklogState(s).updatingId;
export const selectWorklogFilters = (s) => selectWorklogState(s).filters;

export const selectWorklogTotal = (s) => {
  const items = selectWorklogs(s) || [];
  const { type, status } = selectWorklogFilters(s) || {};

  const filtered = items.filter((r) => {
    const byType = !type || type === "ALL" || r.work_type === type;
    const byStatus = !status || status === "ALL" || r.status === status;
    return byType && byStatus;
  });

  const duration = filtered.reduce((sum, r) => sum + calcDurationHours(r), 0);

  return { count: filtered.length, duration: Math.round(duration * 100) / 100 };
};
