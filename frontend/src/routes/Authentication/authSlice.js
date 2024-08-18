const initialState = {
  isAuthenticated: false,
  user: null, // Store the user details including role here
  error: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload, // payload should include role info
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};