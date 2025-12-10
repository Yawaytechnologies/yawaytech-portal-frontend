import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import svc from "../services/adminLeave.service";

/* ------------------------ Thunks (API calls) ------------------------ */

// GET /api/workweek
export const fetchWorkweek = createAsyncThunk(
  "workweek/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await svc.fetchWorkweek();
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to load workweek");
    }
  }
);

// POST /api/workweek  (create/update rules)
export const saveWorkweek = createAsyncThunk(
  "workweek/save",
  async (cfg, { rejectWithValue }) => {
    try {
      return await svc.saveWorkweek(cfg);
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to save workweek");
    }
  }
);

// POST /api/workweek/publish  (if backend supports it)
export const publishWorkweek = createAsyncThunk(
  "workweek/publish",
  async (_, { rejectWithValue }) => {
    try {
      return await svc.publishWorkweek();
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to publish workweek");
    }
  }
);

/* -------------------------- Local helpers --------------------------- */

const DEFAULT_CFG = {
  region: "IN-TN",
  weeklyOff: [],            // ["SAT", "SUN"]
  altSaturday: "NONE",      // "NONE" | "SECOND_FOURTH" | "FIRST_THIRD" | "CUSTOM"
  customOffDays: [],        // ["2025-12-27", ...]
  effectiveFrom: "",
  status: "draft",          // "draft" | "published"
};

/* ------------------------------ Slice ------------------------------- */

const slice = createSlice({
  name: "workweek",
  initialState: {
    cfg: null,
    loading: false,
    error: null,
  },
  reducers: {
    // shallow-merge into cfg
    setLocal(state, { payload }) {
      if (!state.cfg) state.cfg = { ...DEFAULT_CFG };
      state.cfg = { ...state.cfg, ...payload };
    },
    // toggle a day in weeklyOff
    toggleWeekly(state, { payload: dayId }) {
      if (!state.cfg) state.cfg = { ...DEFAULT_CFG };
      const set = new Set(state.cfg.weeklyOff || []);
      if (set.has(dayId)) set.delete(dayId);
      else set.add(dayId);
      state.cfg.weeklyOff = Array.from(set);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkweek
      .addCase(fetchWorkweek.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkweek.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.cfg = payload || { ...DEFAULT_CFG };
      })
      .addCase(fetchWorkweek.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to load workweek";
        // fallback to a default config so UI still works
        if (!state.cfg) state.cfg = { ...DEFAULT_CFG };
      })

      // saveWorkweek
      .addCase(saveWorkweek.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveWorkweek.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload) state.cfg = payload;
      })
      .addCase(saveWorkweek.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to save workweek";
      })

      // publishWorkweek – just track errors; cfg stays same
      .addCase(publishWorkweek.pending, (state) => {
        state.error = null;
      })
      .addCase(publishWorkweek.rejected, (state, { payload }) => {
        state.error = payload || "Failed to publish workweek";
      });
  },
});

export const { setLocal, toggleWeekly } = slice.actions;
export default slice.reducer;
