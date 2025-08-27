import { createAsyncThunk } from "@reduxjs/toolkit";
import { getComparisonBarByPeriod } from "../services/comparisonBarService";

/**
 * period: "Year" | "Month"
 * year:   number          (required)
 * month:  string          (required for Month) - e.g., "Feb"
 */
export const fetchComparisonBar = createAsyncThunk(
  "comparisonBar/fetch",
  async ({ period, year, month }, { rejectWithValue }) => {
    try {
      const { data, source } = await getComparisonBarByPeriod(period, { year, month });
      const key = period === "Year" ? `Y:${year}` : `M:${year}:${month}`;
      return { period, year, month, key, data, source }; // source: "api" | "dummy"
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load comparison bar data");
    }
  }
);
    