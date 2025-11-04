// src/redux/actions/marketingOverviewAction.js
import { fetchMarketingByIdAPI } from "../services/marketingOverviewService";

export const fetchMarketingById = (employeeId) => async (dispatch) => {
  dispatch({ type: "MARKETING_DETAIL_REQUEST" });
  try {
    const data = await fetchMarketingByIdAPI(employeeId);
    dispatch({ type: "MARKETING_DETAIL_SUCCESS", payload: data });
  } catch (error) {
    dispatch({
      type: "MARKETING_DETAIL_FAILURE",
      payload: error.message || "Employee not found",
    });
  }
};
