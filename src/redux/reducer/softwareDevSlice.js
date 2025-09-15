const initialState = {
  developers: [],
  loading: false,
  error: null,
};

export const softwareDevReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SE_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "SE_FETCH_SUCCESS":
      return { ...state, loading: false, developers: action.payload || [] };
    case "SE_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Failed to load" };
    default:
      return state;
  }
};
