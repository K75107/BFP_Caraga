import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Login from './routes/Authentication/login';
import Main from './routes/main';
import Dashboard from './routes/Accounting/Admin/dashboard';
import Users from './routes/Accounting/Admin/users';
import IncomeStatement from './routes/Accounting/Admin/IncomeStatement/incomeStatement';
import BalanceSheet from './routes/Accounting/Admin/BalanceSheet/balanceSheet';
import CashflowStatement from './routes/Accounting/Admin/CashFlow/cashflowStatements';
import ChangesInEquity from './routes/Accounting/Admin/ChangesInEquity/changesInEquity';
import GeneralLedger from './routes/Accounting/Admin/GeneralLedger/generalLedger';
import Accounts from './routes/Accounting/Admin/GeneralLedger/accounts';
import LedgerDetails from './routes/Accounting/Admin/GeneralLedger/ledgerDetails';
import LedgerList from './routes/Accounting/Admin/GeneralLedger/legderList';
import TrialBalance from './routes/Accounting/Admin/TrialBalance/trialBalance';
import Deposits from './routes/Accounting/Admin/deposits';
import Collections from './routes/Accounting/Admin/collections';
import { Provider } from 'react-redux';
import store from './store';
import { Navigate } from 'react-router-dom';

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
        children: [
          {
            path: '/main/generalLedger/ledgerDetails/:ledgerId',
            element: <LedgerDetails />,
          },
          {
            path: 'ledgerList',
            element: <LedgerList />,
          },
          // Redirect to 'ledgerDetails' by default
          {
            index: true,
            element: <Navigate to="ledgerList" />,
          },
        ],
      },
      {
        path: 'accounts',
        element: <Accounts />,
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
