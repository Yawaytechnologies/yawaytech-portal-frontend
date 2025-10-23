import { createAsyncThunk } from "@reduxjs/toolkit";
import { getComparisonBarByPeriod, getMonthTotal } from "../services/comparisonBarService";

/** Chart data */
export const fetchComparisonBar = createAsyncThunk(
  "comparisonBar/fetch",
  async ({ period, year, month }, { rejectWithValue }) => {
    try {
      const { data, xKey, source } = await getComparisonBarByPeriod(period, { year, month });
      const key = period === "Year" ? `Y:${year}` : `M:${year}:${month}`;
      return { period, year, month, key, data, xKey, source };
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load comparison bar data");
    }
  }
);

/** Month total (for Month tab pill) */
export const fetchMonthTotal = createAsyncThunk(
  "comparisonBar/fetchMonthTotal",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const total = await getMonthTotal(year, month);
      return { year, month, total };
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load month total");
    }
  }
);
