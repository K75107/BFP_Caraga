import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store';
import { Navigate } from 'react-router-dom';

import Login from './routes/Authentication/login';
import Main from './routes/main';
import Dashboard from './routes/Accounting/Admin/dashboard';
import Users from './routes/Accounting/Admin/users';
import IncomeStatement from './routes/Accounting/Admin/IncomeStatement/incomeStatement';
import IncomeStatementDetails from './routes/Accounting/Admin/IncomeStatement/incomeStatementDetails';
import IncomeStatementList from './routes/Accounting/Admin/IncomeStatement/incomeStatementList';
import BalanceSheet from './routes/Accounting/Admin/BalanceSheet/balanceSheet';
import CashflowStatement from './routes/Accounting/Admin/CashFlow/cashflowStatements';
import ChangesInEquity from './routes/Accounting/Admin/ChangesInEquity/changesInEquity';
import GeneralLedger from './routes/Accounting/Admin/GeneralLedger/generalLedger';
import Accounts from './routes/Accounting/Admin/GeneralLedger/accounts';
import LedgerDetails from './routes/Accounting/Admin/GeneralLedger/ledgerDetails';
import LedgerList from './routes/Accounting/Admin/GeneralLedger/legderList';

import TrialBalance from './routes/Accounting/Admin/TrialBalance/trialBalance';
import TrialBalanceList from './routes/Accounting/Admin/TrialBalance/TrialBalanceList';
import TrialBalanceDetails from './routes/Accounting/Admin/TrialBalance/TrialBalanceDetails';

import Deposits from './routes/Accounting/Admin/deposits';

//Collections
import Collections from './routes/Accounting/Admin/collections/collections';
import CollectionsPerStation from './routes/Accounting/Admin/collections/collectionsPerStation';
import CollectionsList from './routes/Accounting/Admin/collections/collectionsList';

//FireStations
import FireStationOfficers from './routes/Accounting/FireStations/fireStationOfficers';
import FireStationCollections from './routes/Accounting/FireStations/fireStationCollections';
import FireStationDeposits from './routes/Accounting/FireStations/fireStationDeposits';
import FireStationDashboard from './routes/Accounting/FireStations/fireStationDashboard';

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
        path: 'IncomeStatement',
        element: <IncomeStatement />,
        children: [
          {
          path: '/main/IncomeStatement/incomeStatementList',
          element: <IncomeStatementList/>,
          },
          {
            path: '/main/IncomeStatement/incomeStatementDetails/:incomeStatementID',
            element: <IncomeStatementDetails/>
          },
          {
            index: true,
            element: <Navigate to="incomeStatementList"/>
          },
        ],
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
        path: 'TrialBalance',
        element: <TrialBalance />,
        children: [
          {
          path: '/main/TrialBalance/TrialBalanceList',
          element: <TrialBalanceList/>,
          },
          {
            path: '/main/TrialBalance/TrialBalanceDetails/:trialbalanceID',
            element: <TrialBalanceDetails/>
          },
          {
            index: true,
            element: <Navigate to="TrialBalanceList"/>
          },
        ],
      },
      {
        path: 'deposits',
        element: <Deposits />,
      },
      {
        path: 'collections',
        element: <Collections />,
        children:[
          {
            path:'collections/reports',
            element:<CollectionsPerStation/>
          },
          {
            path:'collectionsList',
            element:<CollectionsList/>
          },
          {
            index:true,
            element: <Navigate to = 'collectionsList'/>
          }


        ]
      },
      {
        path: 'fireStation/dashboard',
        element: <FireStationDashboard/>,
      },
      {
        path: 'fireStation/deposits',
        element: <FireStationDeposits/>,
      },
      {
        path: 'fireStation/collections',
        element: <FireStationCollections/>,
      },
      {
        path: 'fireStation/officers',
        element: <FireStationOfficers/>,
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
