const initialState = {
  employees: [],
  loading: false,
  error: null,
};

export const hrReducer = (state = initialState, action) => {
  switch (action.type) {
    case "HR_FETCH_REQUEST":
      return { ...state, loading: true, error: null };
    case "HR_FETCH_SUCCESS":
      return { ...state, loading: false, employees: action.payload || [] };
    case "HR_FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload || "Failed to load" };
    default:
      return state;
  }
};
