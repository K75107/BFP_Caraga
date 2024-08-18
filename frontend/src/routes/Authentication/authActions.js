
export const login = (username, password) => (dispatch) => {
    // Mock login logic
    const mockUsers = [
      { username: 'admin', password: 'admin123', role: 'Admin' },
      { username: 'regional', password: 'regional123', role: 'Regional Accountant' },
      { username: 'firestation1', password: 'firestation1', role: 'Fire Station' },
      { username: 'firestation2', password: 'firestation2', role: 'Fire Station' },
      { username: 'bookeper', password: 'bookeper', role: 'Bookeper' },
      { username: 'chieffmd', password: 'chieffmd', role: 'Chief FMD' },
      { username: 'firecode monitoring', password: 'firecodemonitoring', role: 'Firecode Monitoring' },
      { username: 'reconciliationRevenue', password: 'reconciliationRevenue', role: 'Reconciliation and Revenue' },
      // Add more mock users with different roles here...
    ];
  
    const user = mockUsers.find(
      (user) => user.username === username && user.password === password
    );
  
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid username or password' });
    }
  };
  