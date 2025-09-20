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

// HR attendance (admin side) – default export in that file
import hrAttendanceReducer from "../reducer/hrAttendanceSlice";

// Dev/DC attendance – adjust if these are default vs named in your files
import { devAttendanceReducer } from "../reducer/devAttendanceSlice";
import dcAttendanceReducer from "../reducer/dcAttendanceSlice";

// Employee profile
import employeeReducer from "../reducer/employeeProfileSlice";

// Employee-side attendance (rename the variable for clarity)
import employeeAttendanceReducer from "../reducer/employeeSideAttendanceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    categoryPie: categoryPieReducer,
    comparisonBar: comparisonBarReducer,
    summaryCards: summaryCardsReducer,

    hr: hrReducer,
    hrOverview: hrOverviewReducer,

    softwareDev: softwareDevReducer,
    softwareDevOverview: softwareDevOverviewReducer,

    digitalCreator: digitalCreatorReducer,
    digitalCreatorOverview: digitalCreatorOverviewReducer,

    // ✅ unique keys for each slice
    hrAttendance: hrAttendanceReducer,          // admin/HR view
    devAttendance: devAttendanceReducer,
    dcAttendance: dcAttendanceReducer,

    employee: employeeReducer,

    attendance: employeeAttendanceReducer,      // employee-side view (keeps old key)
  },
});

export default store;
