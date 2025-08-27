// src/redux/actions/summaryCardsActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSummaryCards } from "../services/summaryCardsService";

export const fetchSummaryCards = createAsyncThunk(
  "summaryCards/fetch",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { data, source } = await getSummaryCards({ year, month });
      return { year, month, data, source }; // data: { total, month, year }
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load summary totals");
    }
  }
);
