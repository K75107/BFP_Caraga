import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Login from './routes/login';
import Main from './routes/main';
import Dashboard from './routes/dashboard';
import Users from './routes/users';
import IncomeStatement from './routes/incomeStatement';
import BalanceSheet from './routes/balanceSheet';
import CashflowStatement from './routes/cashflowStatements';
import ChangesInEquity from './routes/changesInEquity';
import GeneralLedger from './routes/generalLedger';
import TrialBalance from './routes/trialBalance';
import Deposits from './routes/deposits';
import Collections from './routes/collections';
import { Provider } from 'react-redux';
import store from './store';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/main',
    element: <Main />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'incomeStatement',
        element: <IncomeStatement />,
      },
      {
        path: 'balanceSheet',
        element: <BalanceSheet />,
      },
      {
        path: 'cashflowStatement',
        element: <CashflowStatement />,
      },
      {
        path: 'changesInEquity',
        element: <ChangesInEquity />,
      },
      {
        path: 'generalLedger',
        element: <GeneralLedger />,
      },
      {
        path: 'trialBalance',
        element: <TrialBalance />,
      },
      {
        path: 'deposits',
        element: <Deposits />,
      },
      {
        path: 'collections',
        element: <Collections />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
