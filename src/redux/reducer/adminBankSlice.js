// src/redux/reducer/adminBankSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  adminListBankDetails,
  adminFetchBankDetail,
  adminCreateBankDetail,
  adminUpdateBankDetail,
  adminDeleteBankDetail,
} from "../actions/adminBankActions";

const initialState = {
  items:    [],   // from LIST all
  detail:   null, // from GET single
  loading:  false,
  saving:   false,
  deleting: false,
  error:    null,
};

const adminBankSlice = createSlice({
  name: "adminBank",
  initialState,
  reducers: {
    adminBankReset(state) {
      Object.assign(state, initialState);
    },
    adminBankClearError(state) {
      state.error = null;
    },
    /* remove a record from items list locally after delete */
    adminBankRemoveItem(state, action) {
      state.items = state.items.filter(
        (r) => r.employee_id !== action.payload,
      );
    },
    /* upsert a record into items list */
    adminBankUpsertItem(state, action) {
      const incoming = action.payload;
      const idx = state.items.findIndex(
        (r) => r.employee_id === incoming?.employee_id,
      );
      if (idx >= 0) {
        state.items[idx] = incoming;
      } else {
        state.items = [incoming, ...state.items];
      }
    },
  },
  extraReducers: (builder) => {
    builder

      /* ── LIST ── */
      .addCase(adminListBankDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminListBankDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload ?? [];
      })
      .addCase(adminListBankDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch bank details";
      })

      /* ── GET single ── */
      .addCase(adminFetchBankDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminFetchBankDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload ?? null;
        /* also upsert into items list */
        if (action.payload) {
          const incoming = action.payload;
          const idx = state.items.findIndex(
            (r) => r.employee_id === incoming.employee_id,
          );
          if (idx >= 0) {
            state.items[idx] = incoming;
          } else {
            state.items = [incoming, ...state.items];
          }
        }
      })
      .addCase(adminFetchBankDetail.rejected, (state, action) => {
        state.loading = false;
        state.detail = null;
        state.error = action.payload || "Failed to fetch bank detail";
      })

      /* ── POST ── */
      .addCase(adminCreateBankDetail.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(adminCreateBankDetail.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload ?? null;
        if (action.payload) {
          const incoming = action.payload;
          const idx = state.items.findIndex(
            (r) => r.employee_id === incoming.employee_id,
          );
          if (idx >= 0) {
            state.items[idx] = incoming;
          } else {
            state.items = [incoming, ...state.items];
          }
        }
      })
      .addCase(adminCreateBankDetail.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create bank detail";
      })

      /* ── PUT ── */
      .addCase(adminUpdateBankDetail.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(adminUpdateBankDetail.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload ?? null;
        if (action.payload) {
          const incoming = action.payload;
          const idx = state.items.findIndex(
            (r) => r.employee_id === incoming.employee_id,
          );
          if (idx >= 0) {
            state.items[idx] = incoming;
          } else {
            state.items = [incoming, ...state.items];
          }
        }
      })
      .addCase(adminUpdateBankDetail.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update bank detail";
      })

      /* ── DELETE ── */
      .addCase(adminDeleteBankDetail.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(adminDeleteBankDetail.fulfilled, (state, action) => {
        state.deleting = false;
        state.detail = null;
        const empId = action.payload?.employeeId;
        if (empId) {
          state.items = state.items.filter((r) => r.employee_id !== empId);
        }
      })
      .addCase(adminDeleteBankDetail.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete bank detail";
      });
  },
});

export const {
  adminBankReset,
  adminBankClearError,
  adminBankRemoveItem,
  adminBankUpsertItem,
} = adminBankSlice.actions;

export default adminBankSlice.reducer;

/* ── SELECTORS ── */
export const selectAdminBankItems   = (s) => s.adminBank?.items   ?? [];
export const selectAdminBankDetail  = (s) => s.adminBank?.detail  ?? null;
export const selectAdminBankLoading = (s) => !!(s.adminBank?.loading);
export const selectAdminBankSaving  = (s) => !!(s.adminBank?.saving);
export const selectAdminBankDeleting= (s) => !!(s.adminBank?.deleting);
export const selectAdminBankError   = (s) => s.adminBank?.error   ?? null;