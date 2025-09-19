import { createSlice } from "@reduxjs/toolkit";
import { fetchEmployeeById } from "../actions/employeeProfileActions";

const initialState = {
  selectedEmployee: null, // pruned object
  loading: false,
  error: null,
  usedDemo: false,        // true when we render demo fallback
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
  },
  extraReducers: (b) => {
    b.addCase(fetchEmployeeById.pending, (s) => {
      s.loading = true;
      s.error = null;
      s.usedDemo = false;
    });
    b.addCase(fetchEmployeeById.fulfilled, (s, a) => {
      s.loading = false;
      s.selectedEmployee = a.payload;
      s.usedDemo = !!a.payload?.__usedDemo;
    });
    b.addCase(fetchEmployeeById.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Error loading employee";

      // Optional: show demo data to keep UI working during backend issues
      if (import.meta.env.VITE_SHOW_DEMO === "true") {
        s.selectedEmployee = {
          id: 0,
          name: "Demo User",
          father_name: "—",
          date_of_birth: "1995-01-01",
          employee_id: "DEMO001",
          date_of_joining: "2025-01-01",
          date_of_leaving: null,
          email: "demo@example.com",
          mobile_number: "0000000000",
          marital_status: "Single",
          permanent_address: "—",
          designation: "Engineer",
          department: "R&D",
          __usedDemo: true,
        };
        s.error = null;
        s.usedDemo = true;
      }
    });
  },
});

export const { resetEmployee } = slice.actions;
export default slice.reducer;

// selectors
export const selectEmployee         = (s) => s.employee.selectedEmployee;
export const selectEmployeeLoading  = (s) => s.employee.loading;
export const selectEmployeeError    = (s) => s.employee.error;
export const selectEmployeeUsedDemo = (s) => s.employee.usedDemo;
