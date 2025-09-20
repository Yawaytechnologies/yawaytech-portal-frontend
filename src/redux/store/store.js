// src/redux/store.js
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
// ⬇️ changed to DEFAULT import because the slice exports default
import hrAttendanceReducer from "../reducer/hrAttendanceSlice";
// keep these as named imports only if those files export named reducers
import { devAttendanceReducer } from "../reducer/devAttendanceSlice";
import dcAttendanceReducer from "../reducer/dcAttendanceSlice";
import employeeReducer from "../reducer/employeeProfileSlice";
import attendanceReducer from "../reducer/employeeSideAttendanceSlice"

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
    attendance: hrAttendanceReducer,   // ✅ now matches the default import
    devAttendance: devAttendanceReducer,
    dcAttendance: dcAttendanceReducer,
    employee:     employeeReducer,
    attendance: attendanceReducer
  },
});

export default store;
