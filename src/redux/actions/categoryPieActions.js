import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCategoryPieByPeriod } from "../services/categoryPieService";

export const fetchCategoryPie = createAsyncThunk(
  "categoryPie/fetch",
  async (period, { rejectWithValue }) => {
    try {
      const { data, source } = await getCategoryPieByPeriod(period);
      return { period, data, source }; // source: "api" | "dummy"
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load pie data");
    }
  }
);
