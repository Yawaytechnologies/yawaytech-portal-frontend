import { createSlice } from "@reduxjs/toolkit";
import { fetchCategoryPie } from "../actions/categoryPieActions";

const initialState = {
  pieType: "Year",                    // "Year" | "Month" | "Week"
  selectedCategory: null,             // string | null
  dataByPeriod: { Year: [], Month: [], Week: [] },
  lastSourceByPeriod: {},             // { Year: "api"|"dummy", ... }
  status: "idle",                     // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const categoryPieSlice = createSlice({
  name: "categoryPie",
  initialState,
  reducers: {
    setPieType(state, action) { state.pieType = action.payload; },
    setSelectedCategory(state, action) { state.selectedCategory = action.payload; },
    clearSelectedCategory(state) { state.selectedCategory = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryPie.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategoryPie.fulfilled, (state, action) => {
        const { period, data, source } = action.payload;
        state.dataByPeriod[period] = data;
        state.lastSourceByPeriod[period] = source;
        state.status = "succeeded";
      })
      .addCase(fetchCategoryPie.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Error";
      });
  },
});

export const {
  setPieType,
  setSelectedCategory,
  clearSelectedCategory,
} = categoryPieSlice.actions;

/* -------- Selectors -------- */
export const selectPieType = (s) => s.categoryPie.pieType;
export const selectSelectedCategory = (s) => s.categoryPie.selectedCategory;
export const selectPieData = (s) =>
  s.categoryPie.dataByPeriod[s.categoryPie.pieType] || [];
export const selectTotalAmount = (s) =>
  selectPieData(s).reduce((sum, c) => sum + c.value, 0);
export const selectDataSourceForCurrent = (s) =>
  s.categoryPie.lastSourceByPeriod[s.categoryPie.pieType] || "dummy";

export default categoryPieSlice.reducer;
