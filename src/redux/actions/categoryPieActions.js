// src/redux/actions/categoryPieActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCategoryPieAPI } from "../services/categoryPieService";

/**
 * Usage:
 *  dispatch(fetchCategoryPie({ year: 2025 }));
 *  dispatch(fetchCategoryPie({ year: 2025, month: 2 }));
 */
export const fetchCategoryPie = createAsyncThunk(
  "categoryPie/fetch",
  async ({ year, month }, { signal }) => {
    const data = await fetchCategoryPieAPI({ year, month, signal });
    return { year, month, data, dataSource: "api" };
  },
  {
    // Prevent duplicate in-flight (React 18 StrictMode / quick toggles)
    condition: ({ year, month }, { getState }) => {
      const key = `${year}:${month ?? ""}`;
      const s = getState().categoryPie;
      return !(s.loadingKeys && s.loadingKeys[key]);
    },
  }
);
