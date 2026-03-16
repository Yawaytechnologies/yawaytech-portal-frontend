import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCurrentShift,
  assignEmployeeShift,
} from "../actions/shiftsActions";

const initialState = {
  current: null,
  loading: false,
  error: null,

  assigning: false,
  assignError: null,
  assignSuccess: null,
};

const shiftsSlice = createSlice({
  name: "shifts",
  initialState,
  reducers: {
    clearShiftMessages: (s) => {
      s.error = null;
      s.assignError = null;
      s.assignSuccess = null;
    },
    resetShifts: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(fetchCurrentShift.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchCurrentShift.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.current = payload || null;
    });
    b.addCase(fetchCurrentShift.rejected, (s, { payload }) => {
      s.loading = false;
      s.current = null;
      s.error = payload?.message || "Failed to load shift";
    });

    b.addCase(assignEmployeeShift.pending, (s) => {
      s.assigning = true;
      s.assignError = null;
      s.assignSuccess = null;
    });
    b.addCase(assignEmployeeShift.fulfilled, (s) => {
      s.assigning = false;
      s.assignSuccess = "Shift assigned successfully";
    });
    b.addCase(assignEmployeeShift.rejected, (s, { payload }) => {
      s.assigning = false;
      s.assignError = payload?.message || "Failed to assign shift";
    });
  },
});

export const { clearShiftMessages, resetShifts } = shiftsSlice.actions;
export default shiftsSlice.reducer;

export const selectShiftState = (s) => s.shifts || initialState;
export const selectCurrentShift = (s) => selectShiftState(s).current;
export const selectShiftLoading = (s) => selectShiftState(s).loading;
export const selectShiftError = (s) => selectShiftState(s).error;
export const selectAssigning = (s) => selectShiftState(s).assigning;
export const selectAssignError = (s) => selectShiftState(s).assignError;
export const selectAssignSuccess = (s) => selectShiftState(s).assignSuccess;
