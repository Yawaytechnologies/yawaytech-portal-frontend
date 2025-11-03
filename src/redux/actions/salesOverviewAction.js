// src/redux/actions/salesOverviewAction.js
import { fetchSalesByIdAPI } from "../services/salesOverviewService";

export const fetchSalesById = (employeeId) => async (dispatch) => {
  dispatch({ type: "SALES_DETAIL_REQUEST" });
  try {
    const data = await fetchSalesByIdAPI(employeeId);
    dispatch({ type: "SALES_DETAIL_SUCCESS", payload: data });
  } catch (error) {
    dispatch({
      type: "SALES_DETAIL_FAILURE",
      payload: error?.message || "Employee not found",
    });
  }
};
