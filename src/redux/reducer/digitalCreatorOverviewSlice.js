const initialState = {
  loading: false,
  error: null,
  selectedCreator: null,
};

export const digitalCreatorOverviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case "DC_DETAIL_RESET":
      return initialState;
    case "DC_DETAIL_REQUEST":
      return { ...state, loading: true, error: null, selectedCreator: null };
    case "DC_DETAIL_SUCCESS":
      return { ...state, loading: false, selectedCreator: action.payload };
    case "DC_DETAIL_FAILURE":
      return { ...state, loading: false, error: action.payload, selectedCreator: null };
    default:
      return state;
  }
};
