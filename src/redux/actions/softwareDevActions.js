import { fetchSoftwareDevelopersAPI } from "../services/softwareDevService";

// Async action using Redux Toolkit's thunk pattern
export const fetchSoftwareDevelopers = () => async (dispatch) => {
  dispatch({ type: "SE_FETCH_REQUEST" });
  try {
    const data = await fetchSoftwareDevelopersAPI();
    dispatch({ type: "SE_FETCH_SUCCESS", payload: data });
  } catch (error) {
    dispatch({
      type: "SE_FETCH_FAILURE",
      payload: error.message || "Failed to load software developers",
    });
  }
};
