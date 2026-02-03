import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPortalTypes,
  fetchPortalBalances,
  fetchPortalSummary,
  fetchPortalCalendar,
  fetchPortalHolidays,
  fetchPortalRequests,
  applyPortalLeave,
  fetchPortalMonthData,
} from "../actions/portalActions";

const initialState = {
  // Types (Apply modal)
  types: [],
  typesStatus: "idle",
  typesError: null,

  // Status tab
  requests: [],
  requestsStatus: "idle",
  requestsError: null,

  // Apply
  applyStatus: "idle",
  applyError: null,

  // Month pack (Calendar + Monthly Overview)
  monthMeta: null,
  monthLeaves: [],
  monthHolidays: [],
  monthSummary: null,
  monthBalances: [],
  monthOverview: {
    totalLeaveDays: 0,
    approvedLeaveDays: 0,
    companyHolidays: 0,
    govtHolidays: 0,
    typeDays: { EL: 0, CL: 0, SL: 0 },
    permissionCount: 0,
  },
  monthStatus: "idle",
  monthError: null,
};

const portalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    clearPortalErrors: (state) => {
      state.typesError = null;
      state.requestsError = null;
      state.applyError = null;
      state.monthError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /** ---------------- Types ---------------- */
      .addCase(fetchPortalTypes.pending, (state) => {
        state.typesStatus = "loading";
        state.typesError = null;
      })
      .addCase(fetchPortalTypes.fulfilled, (state, action) => {
        state.typesStatus = "succeeded";
        state.types = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPortalTypes.rejected, (state, action) => {
        state.typesStatus = "failed";
        state.typesError = action.payload || "Failed to load leave types";
      })

      /** ---------------- Requests (Status) ---------------- */
      .addCase(fetchPortalRequests.pending, (state) => {
        state.requestsStatus = "loading";
        state.requestsError = null;
      })
      .addCase(fetchPortalRequests.fulfilled, (state, action) => {
        state.requestsStatus = "succeeded";
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPortalRequests.rejected, (state, action) => {
        state.requestsStatus = "failed";
        state.requestsError = action.payload || "Failed to load requests";
      })

      /** ---------------- Apply ---------------- */
      .addCase(applyPortalLeave.pending, (state) => {
        state.applyStatus = "loading";
        state.applyError = null;
      })
      .addCase(applyPortalLeave.fulfilled, (state) => {
        state.applyStatus = "succeeded";
      })
      .addCase(applyPortalLeave.rejected, (state, action) => {
        state.applyStatus = "failed";
        state.applyError = action.payload || "Failed to apply leave";
      })

      /** ---------------- Month Pack (Calendar + Monthly Overview) ---------------- */
      .addCase(fetchPortalMonthData.pending, (state) => {
        state.monthStatus = "loading";
        state.monthError = null;
      })
      .addCase(fetchPortalMonthData.fulfilled, (state, action) => {
        state.monthStatus = "succeeded";
        const p = action.payload || {};
        state.monthMeta = p.meta || null;
        state.monthLeaves = p.data?.leaves || [];
        state.monthHolidays = p.data?.holidays || [];
        state.monthSummary = p.data?.summary || null;
        state.monthBalances = p.data?.balances || [];
        state.monthOverview = p.data?.overview || state.monthOverview;
      })
      .addCase(fetchPortalMonthData.rejected, (state, action) => {
        state.monthStatus = "failed";
        state.monthError = action.payload || "Failed to load month data";
      })

      /** (optional) keep these if you want single calls too */
      .addCase(fetchPortalBalances.fulfilled, (state, action) => {
        state.monthBalances = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchPortalSummary.fulfilled, (state, action) => {
        state.monthSummary = action.payload || null;
      })
      .addCase(fetchPortalCalendar.fulfilled, (state, action) => {
        // not used when you use fetchPortalMonthData, but harmless
      })
      .addCase(fetchPortalHolidays.fulfilled, (state, action) => {
        // not used when you use fetchPortalMonthData, but harmless
      });
  },
});

export const { clearPortalErrors } = portalSlice.actions;

export default portalSlice.reducer;

/** selectors */
export const selectPortal = (s) => s.portal || initialState;
export const selectPortalTypes = (s) => selectPortal(s).types;
export const selectPortalMonthLeaves = (s) => selectPortal(s).monthLeaves;
export const selectPortalMonthHolidays = (s) => selectPortal(s).monthHolidays;
export const selectPortalMonthOverview = (s) => selectPortal(s).monthOverview;
