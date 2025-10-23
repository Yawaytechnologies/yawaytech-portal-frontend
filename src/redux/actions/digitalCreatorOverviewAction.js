import { fetchDigitalCreatorByIdAPI } from "../services/digitalCreatorOverviewService";

export const fetchDigitalCreatorById = (employeeId) => async (dispatch) => {
  dispatch({ type: "DC_DETAIL_REQUEST" });
  try {
    const data = await fetchDigitalCreatorByIdAPI(employeeId);
    dispatch({ type: "DC_DETAIL_SUCCESS", payload: data });
  } catch (e) {
    dispatch({ type: "DC_DETAIL_FAILURE", payload: e.message || "Creator not found" });
  }
};
