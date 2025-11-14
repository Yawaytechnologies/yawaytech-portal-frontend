// src/redux/actions/departmentAttendanceOverviewAction.js

import {
  DEPARTMENT_ATTENDANCE_SET_DEPARTMENT,
  DEPARTMENT_ATTENDANCE_SET_MONTH,
  DEPARTMENT_ATTENDANCE_FETCH_START,
  DEPARTMENT_ATTENDANCE_FETCH_SUCCESS,
  DEPARTMENT_ATTENDANCE_FETCH_ERROR,
  DEPARTMENT_ATTENDANCE_CLEAR,
} from "../reducer/departmentAttendanceOverviewSlice";

import { fetchDepartmentAttendanceOverviewAPI } from "../services/departmentAttendanceOverviewService";

/* --------------------------- simple actions --------------------------- */

export const setDepartmentName = (dept) => ({
  type: DEPARTMENT_ATTENDANCE_SET_DEPARTMENT,
  payload: dept,
});

export const setDepartmentMonth = (month) => ({
  type: DEPARTMENT_ATTENDANCE_SET_MONTH,
  payload: month,
});

export const clearDepartmentAttendance = () => ({
  type: DEPARTMENT_ATTENDANCE_CLEAR,
});

/* ------------------------------- thunk -------------------------------- */

export const fetchDepartmentAttendanceByMonth =
  (department, month) => async (dispatch) => {
    try {
      dispatch({ type: DEPARTMENT_ATTENDANCE_FETCH_START });

      const payload = await fetchDepartmentAttendanceOverviewAPI(
        department,
        month
      );

      dispatch({
        type: DEPARTMENT_ATTENDANCE_FETCH_SUCCESS,
        payload,
      });
    } catch (err) {
      console.error("Failed to fetch department attendance", err);
      dispatch({
        type: DEPARTMENT_ATTENDANCE_FETCH_ERROR,
        error: err?.message || "Unable to load department attendance",
      });
    }
  };
