// src/redux/reducer/summaryCardsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchSummaryCards } from "../actions/summaryCardsActions";

const initialState = {
  totals: { total: 0, month: 0, year: 0 },
  params: { year: 2024, month: "Feb" },
  source: "dummy",
  status: "idle",
  error: null,
};

const summaryCardsSlice = createSlice({
  name: "summaryCards",
  initialState,
  reducers: {
    setSummaryParams(state, action) {
      const { year, month } = action.payload || {};
      if (typeof year !== "undefined") state.params.year = Number(year);
      if (typeof month === "string") state.params.month = month;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSummaryCards.pending, (s) => {
      s.status = "loading";
      s.error = null;
    });
    b.addCase(fetchSummaryCards.fulfilled, (s, a) => {
      s.status = "succeeded";
      s.totals = a.payload.data || { total: 0, month: 0, year: 0 };
      s.params = { year: a.payload.year, month: a.payload.month };
      s.source = a.payload.source || "dummy";
    });
    b.addCase(fetchSummaryCards.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.payload || a.error?.message || "Error";
    });
  },
});

export const { setSummaryParams } = summaryCardsSlice.actions;
export default summaryCardsSlice.reducer;

/* ---------- Safe root + selectors ---------- */
const selectRoot = (s) => s?.summaryCards || initialState;

export const selectSummaryTotals = (s) => selectRoot(s).totals;
export const selectSummaryStatus = (s) => selectRoot(s).status;
export const selectSummaryError  = (s) => selectRoot(s).error;
export const selectSummaryParams = (s) => selectRoot(s).params;
export const selectSummarySource = (s) => selectRoot(s).source;
