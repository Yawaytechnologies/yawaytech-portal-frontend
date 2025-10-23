// src/redux/reducer/categoryPieSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchCategoryPie } from "../actions/categoryPieActions";

const initialState = {
  pieType: "Year",            // "Year" | "Month" (UI label)
  selectedCategory: null,
  pieData: [],
  dataSource: "none",
  status: "idle",             // "idle" | "loading" | "succeeded" | "failed"
  error: null,
  loadingKeys: {},            // tracks in-flight requests keyed by "year:month"
};

const categoryPieSlice = createSlice({
  name: "categoryPie",
  initialState,
  reducers: {
    setPieType: (state, action) => {
      state.pieType = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryPie.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        const { year, month } = action.meta.arg || {};
        const key = `${year}:${month ?? ""}`;
        state.loadingKeys[key] = true;
      })
      .addCase(fetchCategoryPie.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pieData = action.payload.data ?? [];
        state.dataSource = action.payload.dataSource;
        const { year, month } = action.meta.arg || {};
        delete state.loadingKeys[`${year}:${month ?? ""}`];
      })
      .addCase(fetchCategoryPie.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Error";
        const { year, month } = action.meta.arg || {};
        delete state.loadingKeys[`${year}:${month ?? ""}`];
      });
  },
});

export const {
  setPieType,
  setSelectedCategory,
  clearSelectedCategory,
} = categoryPieSlice.actions;

/* Selectors */
export const selectPieType = (state) => state.categoryPie.pieType;
export const selectSelectedCategory = (state) => state.categoryPie.selectedCategory;
export const selectPieData = (state) => state.categoryPie.pieData;
export const selectDataSourceForCurrent = (state) => state.categoryPie.dataSource;

export default categoryPieSlice.reducer;
