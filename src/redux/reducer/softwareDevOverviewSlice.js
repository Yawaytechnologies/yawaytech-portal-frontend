// src/redux/reducer/softwareDevOverviewSlice.js
const initialState = {
  loading: false,
  error: null,
  selectedDeveloper: null,
};

export const softwareDevOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SE_DETAIL_RESET":
      return initialState;
    case "SE_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedDeveloper: null };
    case "SE_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedDeveloper: action.payload, error: null };
    case "SE_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedDeveloper: null };
    default:
      return state;
  }
};
