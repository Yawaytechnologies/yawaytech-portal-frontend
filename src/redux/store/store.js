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
import portalReducer from "../reducer/portalSlice";
import DepartmentOverviewReducer from "../reducer/departmentOverviewSlice";

// Employee profile
import employeeReducer from "../reducer/employeeProfileSlice";

// Employee-side attendance
import employeeAttendanceReducer from "../reducer/employeeSideAttendanceSlice";
import shiftReducer from "../reducer/shiftSlice";
import bankReducer from "../reducer/bankSlice";
import newEmployeesReducer from "../reducer/newEmployeeSlice";
import MonitoringReducer from "../reducer/monitoringSlice";

import requests from "../reducer/leaverequestsSlice";
import policies from "../reducer/leavepoliciesSlice";
import holidays from "../reducer/leaveholidaysSlice";
import workweek from "../reducer/leaveworkweekSlice";
import departmentAttendanceOverviewReducer from "../reducer/departmentAttendanceOverviewSlice";
import shiftTypeReducer from "../reducer/shiftTypeSlice";
import shiftsReducer from "../reducer/shiftsSlice";
import salaryReducer from "../reducer/salarySlice";
import payrollPoliciesReducer from "../reducer/payrollPolicySlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    categoryPie: categoryPieReducer,
    comparisonBar: comparisonBarReducer,
    summaryCards: summaryCardsReducer,

    worklog: worklogReducerSlice,
    department: departmentReducer,

    departmentOverview: DepartmentOverviewReducer,
    departmentAttendanceOverview: departmentAttendanceOverviewReducer,
    employee: employeeReducer,

    attendance: employeeAttendanceReducer,

    newEmployees: newEmployeesReducer,

    leave: leaveReducer,
    monitoring: MonitoringReducer,
    portal: portalReducer,

    requests,
    policies,
    holidays,
    workweek,
    shift: shiftReducer,
    bank: bankReducer,
    shiftType: shiftTypeReducer,
    shifts: shiftsReducer,
    payrollPolicies: payrollPoliciesReducer,
    salary: salaryReducer,
  },
});

export default store;
