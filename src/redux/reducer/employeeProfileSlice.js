// src/redux/reducer/employeeProfileSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchEmployeeById } from "../actions/employeeProfileActions";

// If API is down/unavailable, we can auto-use this demo (toggle via env)
const USE_DEMO_ON_FAIL =
  (import.meta.env.VITE_USE_DEMO_EMPLOYEE_ON_FAIL ?? "true").toLowerCase() !== "false";

const DEMO_EMPLOYEE = {
  id: 0,
  name: "Sowjanya S",
  employeeId: "EMP000001",
  email: "sowjanya@yawaytech.com",
  mobile: "+91 98765 43210",
  designation: "Software Developer",
  department: "IT",
  joinDate: "2024-06-12",
  avatarUrl: "",
  status: "Active",
  address: "No. 14, 2nd Cross, JP Nagar, Bangalore 560078",
  officeAddress: "Yaway Technologies, 2nd Floor, OMR, Chennai 600119",
  fatherName: "K. Ramesh",
  fatherNumber: "+91 98765 43210",
  bloodGroup: "O+",
  dob: "1990-05-15",
};

const initialState = {
  selectedEmployee: null,
  loading: false,
  error: null,
  usedDemo: false, // lets the UI know a fallback was used
};

const slice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    resetEmployee(state) {
      state.selectedEmployee = null;
      state.loading = false;
      state.error = null;
      state.usedDemo = false;
    },
    // Optional: allow manual load of demo
    loadDemoEmployee(state) {
      state.selectedEmployee = DEMO_EMPLOYEE;
      state.loading = false;
      state.error = null;
      state.usedDemo = true;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchEmployeeById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.usedDemo = false;
    });
    b.addCase(fetchEmployeeById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedEmployee = action.payload;
      state.error = null;
      state.usedDemo = false;
    });
    b.addCase(fetchEmployeeById.rejected, (state, action) => {
      state.loading = false;
      if (USE_DEMO_ON_FAIL) {
        state.selectedEmployee = DEMO_EMPLOYEE; // auto-fallback
        state.error = null;
        state.usedDemo = true;
      } else {
        state.error = action.payload || "Error loading employee";
      }
    });
  },
});

export const { resetEmployee, loadDemoEmployee } = slice.actions;
export default slice.reducer;

// --- Selectors (as you already import in the component) ---
export const selectEmployee = (s) => s.employee.selectedEmployee;
export const selectEmployeeLoading = (s) => s.employee.loading;
export const selectEmployeeError = (s) => s.employee.error;
export const selectEmployeeUsedDemo = (s) => s.employee.usedDemo;
