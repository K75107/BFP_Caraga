import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';
import Login from "./routes/login";
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path:"/Dashboard",
    element:<Dashboard/>,
  },
  {
    path:"/Users",
    element:<Users/>,
  },
  {
    path:"/IncomeStatement",
    element:<IncomeStatement/>,
  },
  {
    path:"/BalanceSheet",
    element:<BalanceSheet/>,
  },
  {
    path:"/CashflowStatement",
    element:<CashflowStatement/>,
  },
  {
    path:"/ChangesInEquity",
    element:<ChangesInEquity/>,
  },
  {
    path:"/GeneralLedger",
    element:<GeneralLedger/>,
  },
  {
    path:"/TrialBalance",
    element:<TrialBalance/>,
  },
  {
    path:"/Deposits",
    element:<Deposits/>,
  },
  {
    path:"/Collections",
    element:<Collections/>,
  },




]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
