// src/redux/store/store.js
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../reducer/authSlice";
import expenseReducer from "../reducer/expenseSlice";
import categoryPieReducer from "../reducer/categoryPieSlice";
import comparisonBarReducer from "../reducer/comparisonBarSlice";
import summaryCardsReducer from "../reducer/summaryCardsSlice";
import departmentReducer from "../reducer/departmentSlice";

import worklogReducerSlice from "../reducer/worklogSlice";
import leaveReducer from "../reducer/leaveSlice";

import DepartmentOverviewReducer from "../reducer/departmentOverviewSlice";
// Employee profile
import employeeReducer from "../reducer/employeeProfileSlice";

// Employee-side attendance (rename the variable for clarity)
import employeeAttendanceReducer from "../reducer/employeeSideAttendanceSlice";

import newEmployeesReducer from "../reducer/newEmployeeSlice"
import MonitoringReducer from "../reducer/monitoringSlice";
import departmentAttendanceOverviewReducer from "../reducer/departmentAttendanceOverviewSlice";




export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    categoryPie: categoryPieReducer,
    comparisonBar: comparisonBarReducer,
    summaryCards: summaryCardsReducer,
    
    worklog: worklogReducerSlice,
    department: departmentReducer,
   
    
    // ✅ unique keys for each slice
   
    departmentOverview: DepartmentOverviewReducer,
    departmentAttendanceOverview: departmentAttendanceOverviewReducer,
    employee: employeeReducer,

    attendance: employeeAttendanceReducer, 
    
    newEmployees: newEmployeesReducer,   // employee-side view (keeps old key)

    monitoring: MonitoringReducer, // new slice for employee monitoring
    leave: leaveReducer, // leave management slice
  },
});

export default store;
