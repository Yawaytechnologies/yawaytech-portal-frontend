import { fetchDigitalCreatorsAPI } from "../services/digitalCreatorService";

export const fetchDigitalCreators = () => async (dispatch) => {
  dispatch({ type: "DC_FETCH_REQUEST" });
  try {
    const data = await fetchDigitalCreatorsAPI();
    dispatch({ type: "DC_FETCH_SUCCESS", payload: data });
  } catch (e) {
    dispatch({ type: "DC_FETCH_FAILURE", payload: e.message || "Failed to load" });
  }
};
