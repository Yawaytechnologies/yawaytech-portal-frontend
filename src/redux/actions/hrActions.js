import { fetchHREmployeesAPI } from "../services/hrService";

export const fetchHREmployees = () => async (dispatch) => {
  dispatch({ type: "HR_FETCH_REQUEST" });
  try {
    const data = await fetchHREmployeesAPI();
    dispatch({ type: "HR_FETCH_SUCCESS", payload: data });
  } catch (error) {
    dispatch({ type: "HR_FETCH_FAILURE", payload: error.message });
  }
};
