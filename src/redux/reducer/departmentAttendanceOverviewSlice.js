// src/redux/reducer/departmentAttendanceOverviewSlice.js

const INITIAL_STATE = {
  loading: false,
  error: null,
  department: "",
  month: "",
  rows: [],
  totals: null,
};

export const DEPARTMENT_ATTENDANCE_SET_DEPARTMENT =
  "departmentAttendanceOverview/SET_DEPARTMENT";
export const DEPARTMENT_ATTENDANCE_SET_MONTH =
  "departmentAttendanceOverview/SET_MONTH";
export const DEPARTMENT_ATTENDANCE_FETCH_START =
  "departmentAttendanceOverview/FETCH_START";
export const DEPARTMENT_ATTENDANCE_FETCH_SUCCESS =
  "departmentAttendanceOverview/FETCH_SUCCESS";
export const DEPARTMENT_ATTENDANCE_FETCH_ERROR =
  "departmentAttendanceOverview/FETCH_ERROR";
export const DEPARTMENT_ATTENDANCE_CLEAR =
  "departmentAttendanceOverview/CLEAR";

export default function departmentAttendanceOverviewReducer(
  state = INITIAL_STATE,
  action
) {
  switch (action.type) {
    case DEPARTMENT_ATTENDANCE_SET_DEPARTMENT:
      return {
        ...state,
        department: (action.payload || "").toLowerCase(),
      };

    case DEPARTMENT_ATTENDANCE_SET_MONTH:
      return {
        ...state,
        month: action.payload,
      };

    case DEPARTMENT_ATTENDANCE_FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case DEPARTMENT_ATTENDANCE_FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        rows: action.payload.rows || [],
        totals: action.payload.totals || null,
        department: action.payload.department ?? state.department,
        month: action.payload.month ?? state.month,
      };

    case DEPARTMENT_ATTENDANCE_FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error || "Failed to load department attendance",
      };

    case DEPARTMENT_ATTENDANCE_CLEAR:
      return INITIAL_STATE;

    default:
      return state;
  }
}
