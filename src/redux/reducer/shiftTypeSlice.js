// src/redux/reducer/shiftTypeSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchShiftTypes, addShiftType } from "../actions/shiftTypeActions";

const initialState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
  success: null,
};

const shiftTypeSlice = createSlice({
  name: "shiftType",
  initialState,
  reducers: {
    clearShiftTypeMessages(state) {
      state.error = null;
      state.success = null;
    },
    clearShiftTypes(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // GET (local/empty)
      .addCase(fetchShiftTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchShiftTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load shift types";
      })

      // POST
      .addCase(addShiftType.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.success = null;
      })
      .addCase(addShiftType.fulfilled, (state, action) => {
        state.creating = false;
        state.success = "Shift created";
        if (action.payload) state.items = [action.payload, ...state.items];
      })
      .addCase(addShiftType.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create shift";
      });
  },
});

export const { clearShiftTypeMessages, clearShiftTypes } =
  shiftTypeSlice.actions;

// ✅ THIS is what your store needs:
export default shiftTypeSlice.reducer;
