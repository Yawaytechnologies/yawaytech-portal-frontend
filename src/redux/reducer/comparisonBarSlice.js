import { createSlice } from "@reduxjs/toolkit";
import { fetchComparisonBar, fetchMonthTotal } from "../actions/comparisonBarActions";

/* ---------- Constants ---------- */
const YEARS  = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const initialMonth = "Feb";

/* ---------- State ---------- */
const initialState = {
  // UI state
  tab: "Year",                 // "Year" | "Month"
  selectedYear: 2024,
  selectedMonth: initialMonth,
  yearPage: 0,                 // 0 -> months 1–6, 1 -> months 7–12
  monthPage: MONTHS.indexOf(initialMonth),

  // meta
  years: YEARS,
  months: MONTHS,
  status: "idle",
  error: null,

  // data stores
  dataMonthlyByYear: {},       // { [year]: Array<{ label, month, value }> } (12 dense items)
  dataWeeklyByKey: {},         // { ["YYYY-MonLabel"]: Array<{ week|label, value }> } (W1..Wn dense)
  lastSourceByKey: {},         // { ["Y:YYYY"|"M:YYYY:Mon"]: "api" }

  // month totals cache (from /summary/month) — not used for pill now, kept for other views
  monthTotalByKey: {},         // { ["YYYY-MonLabel"]: number }
};

/* ---------- Slice ---------- */
const comparisonBarSlice = createSlice({
  name: "comparisonBar",
  initialState,
  reducers: {
    setTab(state, action) {
      state.tab = action.payload;
    },
    setSelectedYear(state, action) {
      state.selectedYear = Number(action.payload);
      state.yearPage = 0; // reset to first half when year changes
    },
    setSelectedMonth(state, action) {
      const m = action.payload;
      state.selectedMonth = m;
      state.monthPage = Math.max(0, state.months.indexOf(m));
    },
    setYearPage(state, action) {
      state.yearPage = action.payload; // 0 or 1
    },
    setMonthPage(state, action) {
      const idx = action.payload;
      state.monthPage = idx;
      state.selectedMonth = state.months[idx] ?? state.selectedMonth;
    },
  },
  extraReducers: (builder) => {
    builder
      // chart data
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

        state.lastSourceByKey[key] = source || "api";
        state.status = "succeeded";
      })
      .addCase(fetchComparisonBar.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Error";
      })

      // month total (kept for other use-cases; not used for pill anymore)
      .addCase(fetchMonthTotal.fulfilled, (state, { payload }) => {
        const k = `${payload.year}-${payload.month}`;
        state.monthTotalByKey[k] = Number(payload.total || 0);
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

/* ---------- Selectors ---------- */
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
  return s.comparisonBar.lastSourceByKey[key] || "api";
};

/** Visible chart data + xKey for the component */
export const selectCBVisibleChart = (s) => {
  const { tab, selectedYear, yearPage, monthPage, months } = s.comparisonBar;

  if (tab === "Year") {
    const full = s.comparisonBar.dataMonthlyByYear[selectedYear] || [];
    const start = yearPage * 6;
    const end = start + 6;
    return { data: full.slice(start, end), xKey: "label" };
  }

  const month = months[Math.max(0, monthPage)];
  const key = `${selectedYear}-${month}`;
  const weeks = s.comparisonBar.dataWeeklyByKey[key] || [];
  // Weeks are expected to be normalized already (W1..Wn) with {label:'Wn', value}
  return { data: weeks, xKey: "label" in (weeks[0] || {}) ? "label" : "week" };
};

/** Pill total
 * Always sum what is currently rendered in the chart.
 * - Year tab: sum of the 6 visible months
 * - Month tab: sum of the visible weeks (W1..Wn). If empty or all zeros -> 0.
 */
export const selectCBVisibleTotal = (s) => {
  const { data } = selectCBVisibleChart(s);

  const plottedSum = Array.isArray(data)
    ? data.reduce((sum, d) => sum + (Number(d?.value) || 0), 0)
    : 0;

  return plottedSum; // exact match with chart; 0 if empty/zeros
};
