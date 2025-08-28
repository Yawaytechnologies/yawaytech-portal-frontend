import { createSlice } from "@reduxjs/toolkit";
import { fetchComparisonBar } from "../actions/comparisonBarActions";

/* Constants aligned with your component */
const YEARS = [2021, 2022, 2023, 2024, 2025];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const initialMonth = "Feb";
const initialState = {
  // UI state to mirror your component exactly
  tab: "Year",                 // "Year" | "Month"
  selectedYear: 2024,
  selectedMonth: initialMonth,
  yearPage: 0,                 // shows 6 months at a time: 0 -> 1-6, 1 -> 7-12
  monthPage: MONTHS.indexOf(initialMonth),

  // data + meta
  years: YEARS,
  months: MONTHS,
  status: "idle",
  error: null,

  // storage keyed by context
  // Year view data: 12-month array stored per year
  dataMonthlyByYear: {},             // { [year:number]: Array<{ month, value }> }
  // Month view data: 4-week array stored per (year,month)
  dataWeeklyByKey: {},               // { ["2024-Feb"]: Array<{ week, value }> }
  lastSourceByKey: {},               // { ["Y:2024"|"M:2024:Feb"]: "api"|"dummy" }
};

/* -------- Slice -------- */
const comparisonBarSlice = createSlice({
  name: "comparisonBar",
  initialState,
  reducers: {
    setTab(state, action) {
      state.tab = action.payload;     // "Year" | "Month"
    },
    setSelectedYear(state, action) {
      state.selectedYear = Number(action.payload);
      state.yearPage = 0;             // reset pagination like your code
    },
    setSelectedMonth(state, action) {
      const m = action.payload;
      state.selectedMonth = m;
      state.monthPage = Math.max(0, state.months.indexOf(m));
    },
    setYearPage(state, action) {
      state.yearPage = action.payload;
    },
    setMonthPage(state, action) {
      const idx = action.payload;
      state.monthPage = idx;
      const m = state.months[idx] ?? state.selectedMonth;
      state.selectedMonth = m;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComparisonBar.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchComparisonBar.fulfilled, (state, action) => {
        const { period, year, month, key, data, source } = action.payload;

        if (period === "Year") {
          state.dataMonthlyByYear[year] = data || [];
        } else {
          const wkKey = `${year}-${month}`;
          state.dataWeeklyByKey[wkKey] = data || [];
        }

        state.lastSourceByKey[key] = source || "dummy";
        state.status = "succeeded";
      })
      .addCase(fetchComparisonBar.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Error";
      });
  },
});

export const {
  setTab,
  setSelectedYear,
  setSelectedMonth,
  setYearPage,
  setMonthPage,
} = comparisonBarSlice.actions;

export default comparisonBarSlice.reducer;

/* -------- Selectors (mirroring your Category selectors style) -------- */
export const selectCBTab = (s) => s.comparisonBar.tab;
export const selectCBYears = (s) => s.comparisonBar.years;
export const selectCBMonths = (s) => s.comparisonBar.months;

export const selectCBSelectedYear = (s) => s.comparisonBar.selectedYear;
export const selectCBSelectedMonth = (s) => s.comparisonBar.selectedMonth;
export const selectCBYearPage = (s) => s.comparisonBar.yearPage;
export const selectCBMonthPage = (s) => s.comparisonBar.monthPage;

export const selectCBStatus = (s) => s.comparisonBar.status;
export const selectCBError = (s) => s.comparisonBar.error;

export const selectCBDataSourceForCurrent = (s) => {
  const { tab, selectedYear, selectedMonth } = s.comparisonBar;
  const key = tab === "Year" ? `Y:${selectedYear}` : `M:${selectedYear}:${selectedMonth}`;
  return s.comparisonBar.lastSourceByKey[key] || "dummy";
};

/* Visible chart data + xKey computed exactly like your component */
export const selectCBVisibleChart = (s) => {
  const { tab, selectedYear, yearPage, monthPage, months } = s.comparisonBar;

  if (tab === "Year") {
    const full = s.comparisonBar.dataMonthlyByYear[selectedYear] || [];
    const start = yearPage * 6;
    const end = start + 6;
    return { data: full.slice(start, end), xKey: "month" };
  }
  const month = months[Math.max(0, monthPage)];
  const key = `${selectedYear}-${month}`;
  const weeks = s.comparisonBar.dataWeeklyByKey[key] || [];
  return { data: weeks, xKey: "week" };
};

export const selectCBVisibleTotal = (s) => {
  const { data } = selectCBVisibleChart(s);
  return data.reduce((sum, d) => sum + (Number(d?.value) || 0), 0);
};
