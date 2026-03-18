import { createSlice } from "@reduxjs/toolkit";
import { fetchCurrentShift } from "../actions/shiftActions";

const initialState = {
  current: null,
  loadingCurrent: false,
  error: null,
};

const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    shiftReset(state) {
      state.current = null;
      state.loadingCurrent = false;
      state.error = null;
    },
    shiftClearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentShift.pending, (state) => {
        state.loadingCurrent = true;
        state.error = null;
      })
      .addCase(fetchCurrentShift.fulfilled, (state, action) => {
        state.loadingCurrent = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentShift.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.error = action.payload || "Failed to fetch current shift";
      });
  },
});

export const { shiftReset, shiftClearError } = shiftSlice.actions;
export default shiftSlice.reducer;