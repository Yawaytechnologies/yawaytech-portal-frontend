import { fetchDigitalCreatorsAPI } from "../services/digitalCreatorService";

export const DIGITAL_CREATORS_REQUEST = "DIGITAL_CREATORS_REQUEST";
export const DIGITAL_CREATORS_SUCCESS = "DIGITAL_CREATORS_SUCCESS";
export const DIGITAL_CREATORS_FAILURE = "DIGITAL_CREATORS_FAILURE";

/**
 * If you really want only "Digital Creator", set FILTER_ROLE=true.
 * With your current payload (all "Developer"), that would return empty.
 */
const FILTER_ROLE = false;

export const fetchDigitalCreators = () => async (dispatch) => {
  dispatch({ type: DIGITAL_CREATORS_REQUEST });
  try {
    let items = await fetchDigitalCreatorsAPI();

    // Optional: filter by designation contains "digital"
    if (FILTER_ROLE) {
      items = items.filter((x) =>
        String(x?.designation ?? "").toLowerCase().includes("digital")
      );
    }

    dispatch({ type: DIGITAL_CREATORS_SUCCESS, payload: items });
  } catch (err) {
    dispatch({ type: DIGITAL_CREATORS_FAILURE, error: err?.message || "Failed to load creators" });
  }
};
