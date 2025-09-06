const initialState = {
  creators: [],
  loading: false,
  error: null,
};

export const digitalCreatorReducer = (state = initialState, action) => {
  switch (action.type) {
    case "DC_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "DC_FETCH_SUCCESS":
      return { ...state, loading: false, creators: action.payload || [] };
    case "DC_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Failed to load" };
    default:
      return state;
  }
};
