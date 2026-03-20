import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBankDetailById,
  createBankDetailThunk,
} from "../actions/bankActions";

const bankSlice = createSlice({
  name: "bank",
  initialState: {
    detail: null,
    detailId: null,
    loading: false,
    saving: false, // ← ADD
    notFound: false, // ← ADD
    error: null,
  },
  reducers: {
    bankReset(state) {
      state.detail = null;
      state.detailId = null;
      state.loading = false;
      state.saving = false;
      state.notFound = false; // ← ADD
      state.error = null;
    },
    bankSetDetailId(state, action) {
      state.detailId = action.payload ?? null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(fetchBankDetailById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.notFound = false; // ← ADD
      })
      .addCase(fetchBankDetailById.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
        state.detailId = action.payload?.id ?? state.detailId;
        state.notFound = false; // ← ADD
      })
      .addCase(fetchBankDetailById.rejected, (state, action) => {
        state.loading = false;
        state.notFound = true; // ← ADD: 404 = show Add form
        state.error = null; // don't show error toast on 404
      })

      // CREATE
      .addCase(createBankDetailThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createBankDetailThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.detail = action.payload;
        state.notFound = false;
      })
      .addCase(createBankDetailThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save";
      });
  },
});

export const { bankReset, bankSetDetailId } = bankSlice.actions;
export default bankSlice.reducer;
