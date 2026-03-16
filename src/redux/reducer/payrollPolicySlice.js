// src/redux/reducer/payrollPolicySlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPayrollPolicies,
  fetchPayrollPolicyById,
  createPayrollPolicyThunk,
  updatePayrollPolicyThunk,
  deletePayrollPolicyThunk,
} from "../actions/payrollPolicyActions";

const initialState = {
  items: [],
  loading: false,
  saving: false,
  deleting: false,
  error: null,
  selected: null,
};

const payrollPolicySlice = createSlice({
  name: "payrollPolicies",
  initialState,
  reducers: {
    payrollPolicyReset(state) {
      Object.assign(state, initialState);
    },
    clearSelectedPolicy(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET list
      .addCase(fetchPayrollPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollPolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPayrollPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load policies";
      })

      // GET one
      .addCase(fetchPayrollPolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollPolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload || null;
      })
      .addCase(fetchPayrollPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load policy";
      })

      // POST
      .addCase(createPayrollPolicyThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPayrollPolicyThunk.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createPayrollPolicyThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create policy";
      })

      // PUT
      .addCase(updatePayrollPolicyThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePayrollPolicyThunk.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updatePayrollPolicyThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update policy";
      })

      // DELETE
      .addCase(deletePayrollPolicyThunk.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deletePayrollPolicyThunk.fulfilled, (state, action) => {
        state.deleting = false;
        const pid = Number(action.payload?.policyId);
        if (!Number.isNaN(pid)) {
          state.items = (state.items || []).filter((x) => Number(x?.id) !== pid);
        }
      })
      .addCase(deletePayrollPolicyThunk.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete policy";
      });
  },
});

export const { payrollPolicyReset, clearSelectedPolicy } = payrollPolicySlice.actions;
export default payrollPolicySlice.reducer;

/** ✅ Stable selectors (no rerender warning) */
const EMPTY_ARR = [];
export const selectPolicies = (s) => s.payrollPolicies?.items ?? EMPTY_ARR;
export const selectPoliciesLoading = (s) => !!s.payrollPolicies?.loading;
export const selectPoliciesSaving = (s) => !!s.payrollPolicies?.saving;
export const selectPoliciesDeleting = (s) => !!s.payrollPolicies?.deleting;
export const selectPoliciesError = (s) => s.payrollPolicies?.error ?? null;
export const selectSelectedPolicy = (s) => s.payrollPolicies?.selected ?? null;