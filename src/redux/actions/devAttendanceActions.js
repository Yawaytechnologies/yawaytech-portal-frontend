import { fetchAttendanceByMonthAPI } from "../services/devAttendanceService";

export const setDevAttendanceMonth = (monthStr) => ({
  type: "DEV_ATT_SET_MONTH",
  payload: monthStr,
});

export const clearDevAttendance = () => ({ type: "DEV_ATT_RESET" });

export const fetchDevAttendanceByMonth = (employeeId, monthStr) => async (dispatch) => {
  dispatch({ type: "DEV_ATT_FETCH_REQUEST" });
  try {
    const rows = await fetchAttendanceByMonthAPI(employeeId, monthStr);
    dispatch({ type: "DEV_ATT_FETCH_SUCCESS", payload: { month: monthStr, rows } });
  } catch (e) {
    dispatch({ type: "DEV_ATT_FETCH_FAILURE", payload: e.message || "Failed to load attendance" });
  }
};
