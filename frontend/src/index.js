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
import BalanceSheetList from './routes/Accounting/Admin/BalanceSheet/balanceSheetList';
import BalanceSheetDetails from './routes/Accounting/Admin/BalanceSheet/balanceSheetDetails';

import Cashflows from './routes/Accounting/Admin/CashFlow/cashflows';
import CashflowStatement from './routes/Accounting/Admin/CashFlow/cashflowStatement';
import CashFlowsReports from './routes/Accounting/Admin/CashFlow/cashflowsReports';
import CashflowsDetails from './routes/Accounting/Admin/CashFlow/cashflowsDetails';

import ChangesInEquity from './routes/Accounting/Admin/ChangesInEquity/changesInEquity';
import GeneralLedger from './routes/Accounting/Admin/GeneralLedger/generalLedger';
import Accounts from './routes/Accounting/Admin/GeneralLedger/accounts';
import LedgerDetails from './routes/Accounting/Admin/GeneralLedger/ledgerDetails';
import LedgerList from './routes/Accounting/Admin/GeneralLedger/legderList';

import TrialBalance from './routes/Accounting/Admin/TrialBalance/trialBalance';
import TrialBalanceList from './routes/Accounting/Admin/TrialBalance/TrialBalanceList';
import TrialBalanceDetails from './routes/Accounting/Admin/TrialBalance/TrialBalanceDetails';


import Deposits from './routes/Accounting/Admin/deposits';

//Collections and Deposit admin side
import Reports from './routes/Accounting/Admin/Firestations/reports';
import CollectionsPerStation from './routes/Accounting/Admin/Firestations/collectionsPerStation';
import FirestationReports from './routes/Accounting/Admin/Firestations/firestationReports';
import ReportsOverview from './routes/Accounting/Admin/Firestations/reportsOverview';
import DepositsPerStation from './routes/Accounting/Admin/Firestations/depositsPerStation';
import GeneratedReports from './routes/Accounting/Admin/Firestations/reportsGenerated';

import FireStationDepositsSubmitted from './routes/Accounting/FireStations/deposits/fireStationDepositsSubmitted';
import FireStationDepositsUnsubmitted from './routes/Accounting/FireStations/deposits/fireStationsDepositsUnsubmitted';

//FireStations
import FireStationOfficers from './routes/Accounting/FireStations/fireStationOfficers';
import FireStationCollectionsUnsubmitted from './routes/Accounting/FireStations/collections/fireStationCollectionsUnsubmitted';
import FireStationCollections from './routes/Accounting/FireStations/collections/fireStationCollections';
import FireStationCollectionsSubmitted from './routes/Accounting/FireStations/collections/fireStationCollectionsSubmitted';

import FireStationDeposits from './routes/Accounting/FireStations/deposits/fireStationDeposits';
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
            element: <IncomeStatementList />,
          },
          {
            path: '/main/IncomeStatement/incomeStatementDetails/:incomeStatementID',
            element: <IncomeStatementDetails />
          },
          {
            index: true,
            element: <Navigate to="incomeStatementList" />
          },
        ],
      },
      {
        path: 'balanceSheet',
        element: <BalanceSheet />,
        children: [
          {
            path: '/main/balanceSheet/balanceSheetList',
            element: <BalanceSheetList />,
          },
          {
            path: '/main/balanceSheet/balanceSheetDetails/:balanceSheetID',
            element: <BalanceSheetDetails />
          },
          {
            index: true,
            element: <Navigate to="balanceSheetList" />
          },
        ],
      },
      {
        path: 'cashflowStatement',
        element: <CashflowStatement />,
        children: [
          {
            path: 'cashflows',
            element: <Cashflows />
          },
          {
            path:'generatedReports',
            element : <CashFlowsReports/>
          },
          {
            path:'main/cashflowStatement/cashflows/:cashflowId',
            element: <CashflowsDetails/>
          },
          {
            index: true,
            element: <Navigate to="cashflows" />,
          },
        ]
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
            element: <TrialBalanceList />,
          },
          {
            path: '/main/TrialBalance/TrialBalanceDetails/:trialbalanceID',
            element: <TrialBalanceDetails />
          },
          {
            index: true,
            element: <Navigate to="TrialBalanceList" />
          },
        ],
      },
      {
        path: 'deposits',
        element: <Deposits />,
      },
      {
        path: 'reports',
        element: <Reports />,
        children: [
          {
            path: '/main/reports/collections/:userId',
            element: <CollectionsPerStation />
          },

          {
            path: 'firestationReports',
            element: <FirestationReports />
          },
          {
            path: '/main/reports/overview/:userId',
            element: <ReportsOverview />
          },
          {
            path: '/main/reports/deposits/:userId',
            element: <DepositsPerStation />
          },
          {
            path: 'generateReports',
            element: <GeneratedReports />
          },

          {
            index: true,
            element: <Navigate to='firestationReports' />
          },


        ]
      },
      {
        path: 'fireStation/dashboard',
        element: <FireStationDashboard />,
      },
      {
        path: 'fireStation/deposits',
        element: <FireStationDeposits />,
        children: [
          {
            index: true,
            element: <Navigate to='unsubmitted' />
          },
          {
            path: 'unsubmitted',
            element: <FireStationDepositsUnsubmitted />
          },
          {
            path: 'submitted',
            element: <FireStationDepositsSubmitted />
          },

        ]
      },
      {
        path: 'fireStation/collections',
        element: <FireStationCollections />,
        children: [
          {
            index: true,
            element: <Navigate to='unsubmitted' />
          },
          {
            path: 'unsubmitted',
            element: <FireStationCollectionsUnsubmitted />
          },
          {
            path: 'submitted',
            element: <FireStationCollectionsSubmitted />
          },

        ]
      },
      {
        path: 'fireStation/officers',
        element: <FireStationOfficers />,
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
