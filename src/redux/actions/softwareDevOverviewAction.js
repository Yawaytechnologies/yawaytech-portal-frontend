import { fetchSoftwareDeveloperByIdAPI } from "../services/softwareDevOverviewService";

export const fetchSoftwareDeveloperById = (employeeId) => async (dispatch) => {
  dispatch({ type: "SE_DETAIL_REQUEST" });
  try {
    const data = await fetchSoftwareDeveloperByIdAPI(employeeId);
    dispatch({ type: "SE_DETAIL_SUCCESS", payload: data });
  } catch (error) {
    dispatch({ type: "SE_DETAIL_FAILURE", payload: error.message || "Developer not found" });
  }
};
