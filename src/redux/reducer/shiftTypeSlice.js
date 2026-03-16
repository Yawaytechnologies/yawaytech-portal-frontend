import { createSlice } from "@reduxjs/toolkit";
import {
  fetchShiftTypes,
  addShiftType,
  assignShiftToEmployee,
  fetchDepartmentEmployees,
} from "../actions/shiftTypeActions";

const initialState = {
  items: [],
  loading: false,
  creating: false,
  assigning: false,

  employees: [],
  employeesLoading: false,
  employeesError: null,

  currentDepartment: "",
  error: null,
  success: null,
  assignSuccess: null,
};

const shiftTypeSlice = createSlice({
  name: "shiftType",
  initialState,
  reducers: {
    clearShiftTypeMessages(state) {
      state.error = null;
      state.success = null;
      state.assignSuccess = null;
      state.employeesError = null;
    },
    clearDepartmentEmployees(state) {
      state.employees = [];
      state.employeesError = null;
      state.employeesLoading = false;
    },
    clearShiftTypes(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShiftTypes.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentDepartment =
          typeof action.meta.arg === "string"
            ? action.meta.arg
            : action.meta.arg?.department || "";
      })
      .addCase(fetchShiftTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchShiftTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load shifts";
      })

      .addCase(addShiftType.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.success = null;
      })
      .addCase(addShiftType.fulfilled, (state, action) => {
        state.creating = false;
        state.success = "Shift created successfully";

        if (action.payload) {
          const exists = state.items.some(
            (x) => String(x?.id) === String(action.payload?.id),
          );
          if (!exists) state.items = [action.payload, ...state.items];
        }
      })
      .addCase(addShiftType.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create shift";
      })

      .addCase(assignShiftToEmployee.pending, (state) => {
        state.assigning = true;
        state.error = null;
        state.assignSuccess = null;
      })
      .addCase(assignShiftToEmployee.fulfilled, (state) => {
        state.assigning = false;
        state.assignSuccess = "Shift assigned successfully";
      })
      .addCase(assignShiftToEmployee.rejected, (state, action) => {
        state.assigning = false;
        state.error = action.payload || "Failed to assign shift";
      })

      .addCase(fetchDepartmentEmployees.pending, (state) => {
        state.employeesLoading = true;
        state.employeesError = null;
      })
      .addCase(fetchDepartmentEmployees.fulfilled, (state, action) => {
        state.employeesLoading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartmentEmployees.rejected, (state, action) => {
        state.employeesLoading = false;
        state.employees = [];
        state.employeesError = action.payload || "Failed to load employees";
      });
  },
});

export const {
  clearShiftTypeMessages,
  clearDepartmentEmployees,
  clearShiftTypes,
} = shiftTypeSlice.actions;

export default shiftTypeSlice.reducer;
