import {
  DIGITAL_CREATORS_REQUEST,
  DIGITAL_CREATORS_SUCCESS,
  DIGITAL_CREATORS_FAILURE,
} from "../actions/digitalCreatorActions";

const initial = {
  creators: [],
  loading: false,
  error: null,
};

export const digitalCreatorReducer = (state = initial, action) => {
  switch (action.type) {
    case DIGITAL_CREATORS_REQUEST:
      return { ...state, loading: true, error: null };
    case DIGITAL_CREATORS_SUCCESS:
      return { ...state, loading: false, creators: Array.isArray(action.payload) ? action.payload : [] };
    case DIGITAL_CREATORS_FAILURE:
      return { ...state, loading: false, error: action.error, creators: [] };
    default:
      return state;
  }
};
