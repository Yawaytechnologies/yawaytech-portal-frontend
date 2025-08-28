// src/redux/slices/expenseSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchExpenses,
  createExpense,
  editExpense,
  removeExpense,
} from "../actions/expenseActions";

const initialState = {
  expenseList: [],
  loading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // FETCH
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseList = action.payload || [];
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.expenseList = [];
        state.error = action.payload;
      });

    // CREATE
    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.expenseList.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // UPDATE
    builder
      .addCase(editExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(editExpense.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.expenseList.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.expenseList[idx] = action.payload;
      })
      .addCase(editExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // DELETE
    builder
      .addCase(removeExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseList = state.expenseList.filter((e) => e.id !== action.payload);
      })
      .addCase(removeExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;
