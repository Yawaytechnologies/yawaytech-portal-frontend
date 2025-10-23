// src/redux/reducer/worklogSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  createWorklog,
  fetchWorklogsByEmployee,
  checkInWorklog,
  checkOutWorklog,
  patchWorklog,
} from "../actions/worklogActions";

const initialState = {
  items: [],
  loading: false,
  error: null,

  lastCreated: null,
  updatingId: null,

  // Keep simple client-side filters if you still want Type/Status filtering in UI
  filters: {
    type: "ALL",    // "ALL" | "Feature" | "Bug Fix" | ...
    status: "ALL",  // "ALL" | "TODO" | "IN_PROGRESS" | "DONE"
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
        if (i >= 0) s.items[i] = { ...s.items[i], ...payload };
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
export const selectWorklogState   = (s) => s.worklog || initialState;
export const selectWorklogs       = (s) => selectWorklogState(s).items;
export const selectWorklogItems   = (s) => selectWorklogState(s).items; // alias
export const selectWorklogLoading = (s) => selectWorklogState(s).loading;
export const selectWorklogError   = (s) => selectWorklogState(s).error;
export const selectUpdatingId     = (s) => selectWorklogState(s).updatingId;
export const selectLastCreated    = (s) => selectWorklogState(s).lastCreated;
export const selectWorklogFilters = (s) => selectWorklogState(s).filters;

/** Totals over ALL items (optionally honor type/status filters) */
export const selectWorklogTotal = (s) => {
  const items = selectWorklogs(s) || [];
  const { type, status } = selectWorklogFilters(s) || {};

  const filtered = items.filter((r) => {
    const byType = !type || type === "ALL" || r.work_type === type;
    const byStatus = !status || status === "ALL" || r.status === status;
    return byType && byStatus;
  });

  const duration = filtered.reduce((sum, r) => {
    let d = Number.isFinite(r?.duration_hours) ? r.duration_hours : 0;
    if (!Number.isFinite(d)) d = 0;
    if ((!d || d === 0) && r?.start_time && r?.end_time) {
      const a = new Date(r.start_time).getTime();
      const b = new Date(r.end_time).getTime();
      if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) d = (b - a) / 36e5;
    }
    return sum + (Number.isFinite(d) ? d : 0);
  }, 0);

  return {
    count: filtered.length,
    duration: Math.round(duration * 100) / 100,
  };
};
