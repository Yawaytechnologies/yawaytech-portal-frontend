// src/redux/store/store.js
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../reducer/authSlice";
import expenseReducer from "../reducer/expenseSlice";
import categoryPieReducer from "../reducer/categoryPieSlice";
import comparisonBarReducer from "../reducer/comparisonBarSlice";
import summaryCardsReducer from "../reducer/summaryCardsSlice";

import { hrReducer } from "../reducer/hrSlice";
import { hrOverviewReducer } from "../reducer/hrOverviewSlice";
import { softwareDevReducer } from "../reducer/softwareDevSlice";
import { softwareDevOverviewReducer } from "../reducer/softwareDevOverviewSlice";
import { digitalCreatorReducer } from "../reducer/digitalCreatorSlice";
import { digitalCreatorOverviewReducer } from "../reducer/digitalCreatorOverviewSlice";
import { marketingOverviewReducer } from "../reducer/marketingOverviewSlice";
import { financeOverviewReducer } from "../reducer/financeOverviewSlice";
import { salesOverviewReducer } from "../reducer/salesOverviewSlice"; 
import worklogReducerSlice from "../reducer/worklogSlice";
// HR attendance (admin side) – default export in that file
import hrAttendanceReducer from "../reducer/hrAttendanceSlice";

// Dev/DC attendance – adjust if these are default vs named in your files
import { devAttendanceReducer } from "../reducer/devAttendanceSlice";
import dcAttendanceReducer from "../reducer/dcAttendanceSlice";

// Employee profile
import employeeReducer from "../reducer/employeeProfileSlice";

// Employee-side attendance (rename the variable for clarity)
import employeeAttendanceReducer from "../reducer/employeeSideAttendanceSlice";

import newEmployeesReducer from "../reducer/newEmployeeSlice"
import MonitoringReducer from "../reducer/monitoringSlice";
import MarketingReducer from "../reducer/marketingSlice";
import FinanceReducer from "../reducer/financeSlice";
import SalesReducer from "../reducer/salesSlice";   




export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    categoryPie: categoryPieReducer,
    comparisonBar: comparisonBarReducer,
    summaryCards: summaryCardsReducer,

    hr: hrReducer,
    hrOverview: hrOverviewReducer,
    worklog: worklogReducerSlice,
    softwareDev: softwareDevReducer,
    softwareDevOverview: softwareDevOverviewReducer,

    digitalCreator: digitalCreatorReducer,
    digitalCreatorOverview: digitalCreatorOverviewReducer,
    marketing: MarketingReducer,
    finance: FinanceReducer,
    sales: SalesReducer,
    marketingOverview: marketingOverviewReducer,
    financeOverview: financeOverviewReducer,
    salesOverview: salesOverviewReducer,
    // ✅ unique keys for each slice
    hrAttendance: hrAttendanceReducer,          // admin/HR view
    devAttendance: devAttendanceReducer,
    dcAttendance: dcAttendanceReducer,

    employee: employeeReducer,

    attendance: employeeAttendanceReducer, 
    
    newEmployees: newEmployeesReducer,   // employee-side view (keeps old key)

    monitoring: MonitoringReducer, // new slice for employee monitoring
  },
});

export default store;
