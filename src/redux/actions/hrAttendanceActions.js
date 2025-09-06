import { fetchAttendanceByMonthAPI } from "../services/hrAttendanceService";

export const setAttendanceMonth = (monthStr) => ({
  type: "ATT_SET_MONTH",
  payload: monthStr,
});

export const clearAttendance = () => ({ type: "ATT_RESET" });

export const fetchAttendanceByMonth = (employeeId, monthStr) => async (dispatch) => {
  dispatch({ type: "ATT_FETCH_REQUEST" });
  try {
    const rows = await fetchAttendanceByMonthAPI(employeeId, monthStr);
    dispatch({ type: "ATT_FETCH_SUCCESS", payload: { month: monthStr, rows } });
  } catch (e) {
    dispatch({ type: "ATT_FETCH_FAILURE", payload: e.message || "Failed to load attendance" });
  }
};
