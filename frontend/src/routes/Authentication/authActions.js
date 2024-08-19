import testDatabase from "../../data/testDB";

// Redux action for login
export const login = (username, password) => (dispatch) => {
  const user = testDatabase.users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    dispatch({ type: "LOGIN_SUCCESS", payload: user });
  } else {
    dispatch({ type: "LOGIN_FAILURE", payload: "Invalid username or password" });
  }
};
