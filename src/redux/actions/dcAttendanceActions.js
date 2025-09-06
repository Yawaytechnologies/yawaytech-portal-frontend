import { fetchAttendanceByMonthAPI } from "../services/dcAttendanceService";

export const setDCAttendanceMonth = (monthStr) => ({
  type: "DC_ATT_SET_MONTH",
  payload: monthStr,
});

export const clearDCAttendance = () => ({ type: "DC_ATT_RESET" });

export const fetchDCAttendanceByMonth = (employeeId, monthStr) => async (dispatch) => {
  dispatch({ type: "DC_ATT_FETCH_REQUEST" });
  try {
    const rows = await fetchAttendanceByMonthAPI(employeeId, monthStr);
    dispatch({ type: "DC_ATT_FETCH_SUCCESS", payload: { month: monthStr, rows } });
  } catch (e) {
    dispatch({
      type: "DC_ATT_FETCH_FAILURE",
      payload: e.message || "Failed to load attendance",
    });
  }
};
