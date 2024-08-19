const initialState = {
  isAuthenticated: false,
  user: null,
  error: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return initialState; // Resets to initial state on logout
    default:
      return state;
  }
};
