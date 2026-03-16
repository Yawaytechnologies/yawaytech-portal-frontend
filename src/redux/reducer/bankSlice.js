// src/redux/reducer/bankSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBankDetailById,
  createBankDetailThunk,
  updateBankDetailThunk,
  deleteBankDetailThunk,
} from "../actions/bankActions";

const initialState = {
  detail: null,
  detailId: null,

  loading: false,
  saving: false,
  deleting: false,

  error: null,
};

const bankSlice = createSlice({
  name: "bank",
  initialState,
  reducers: {
    bankReset(state) {
      state.detail = null;
      state.detailId = null;
      state.loading = false;
      state.saving = false;
      state.deleting = false;
      state.error = null;
    },
    bankSetDetailId(state, action) {
      state.detailId = action.payload ?? null;
    },
    bankClearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(fetchBankDetailById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankDetailById.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
        state.detailId = action.payload?.id ?? state.detailId;
      })
      .addCase(fetchBankDetailById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load bank details";
      })

      // POST
      .addCase(createBankDetailThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createBankDetailThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload;
        state.detailId = action.payload?.id ?? null;
      })
      .addCase(createBankDetailThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create bank details";
      })

      // PUT
      .addCase(updateBankDetailThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateBankDetailThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload;
        state.detailId = action.payload?.id ?? state.detailId;
      })
      .addCase(updateBankDetailThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update bank details";
      })

      // DELETE
      .addCase(deleteBankDetailThunk.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteBankDetailThunk.fulfilled, (state) => {
        state.deleting = false;
        state.detail = null;
        state.detailId = null;
      })
      .addCase(deleteBankDetailThunk.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete bank details";
      });
  },
});

export const { bankReset, bankSetDetailId, bankClearError } = bankSlice.actions;
export default bankSlice.reducer;
