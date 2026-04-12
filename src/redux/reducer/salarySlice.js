import { createSlice } from "@reduxjs/toolkit";
import {
  fetchSalaries,
  createSalaryThunk,
  updateSalaryThunk,
  deleteSalaryThunk,
} from "../actions/salaryActions";

const initialState = {
  items: [],       // raw salary records from backend
  loading: false,
  saving: false,
  deleting: false,
  error: null,
};

const salarySlice = createSlice({
  name: "salary",
  initialState,
  reducers: {
    salaryReset(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchSalaries ───────────────────────────────────────────────────
      .addCase(fetchSalaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalaries.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload;
        state.items = Array.isArray(p)
          ? p
          : Array.isArray(p?.items)   ? p.items
          : Array.isArray(p?.data)    ? p.data
          : Array.isArray(p?.results) ? p.results
          : [];
      })
      .addCase(fetchSalaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch salaries";
      })

      // ── createSalaryThunk ───────────────────────────────────────────────
      .addCase(createSalaryThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createSalaryThunk.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createSalaryThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create salary";
      })

      // ── updateSalaryThunk ───────────────────────────────────────────────
      .addCase(updateSalaryThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSalaryThunk.fulfilled, (state, action) => {
        state.saving = false;
        // Optimistically update the item in the list
        const updated = action.payload;
        if (updated?.id != null) {
          const idx = state.items.findIndex(
            (x) => Number(x?.id ?? x?.salary_id) === Number(updated.id)
          );
          if (idx !== -1) state.items[idx] = { ...state.items[idx], ...updated };
        }
      })
      .addCase(updateSalaryThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update salary";
      })

      // ── deleteSalaryThunk ───────────────────────────────────────────────
      .addCase(deleteSalaryThunk.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSalaryThunk.fulfilled, (state, action) => {
        state.deleting = false;
        const salaryId =
          action.payload?.salaryId ??
          action.meta?.arg?.salaryId ??
          action.meta?.arg?.id ??
          action.meta?.arg;
        if (salaryId != null) {
          state.items = state.items.filter(
            (x) => Number(x?.id ?? x?.salary_id) !== Number(salaryId)
          );
        }
      })
      .addCase(deleteSalaryThunk.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete salary";
      });
  },
});

export const { salaryReset } = salarySlice.actions;
export default salarySlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
const EMPTY_ARR = [];

export const selectSalaryItems    = (s) => s.salary?.items    ?? s.salaries?.items    ?? EMPTY_ARR;
export const selectSalaryLoading  = (s) => !!(s.salary?.loading  ?? s.salaries?.loading);
export const selectSalarySaving   = (s) => !!(s.salary?.saving   ?? s.salaries?.saving);
export const selectSalaryDeleting = (s) => !!(s.salary?.deleting ?? s.salaries?.deleting);
export const selectSalaryError    = (s) => s.salary?.error    ?? s.salaries?.error    ?? null;