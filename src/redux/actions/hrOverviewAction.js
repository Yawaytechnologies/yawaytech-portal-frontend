import { fetchEmployeeByIdAPI } from "../services/hrOverviewService";

export const fetchEmployeeById = (employeeId) => async (dispatch) => {
  dispatch({ type: "HR_DETAIL_REQUEST" });
  try {
    const data = await fetchEmployeeByIdAPI(employeeId);
    dispatch({ type: "HR_DETAIL_SUCCESS", payload: data });
  } catch (error) {
    dispatch({ type: "HR_DETAIL_FAILURE", payload: error.message || "Employee not found" });
  }
};
