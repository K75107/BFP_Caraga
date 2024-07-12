import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/main/dashboard">Dashboard</Link></li>
          <li><Link to="/main/users">Users</Link></li>
          <li><Link to="/main/incomeStatement">Income Statement</Link></li>
          <li><Link to="/main/balanceSheet">Balance Sheet</Link></li>
          <li><Link to="/main/cashflowStatement">Cashflow Statement</Link></li>
          <li><Link to="/main/changesInEquity">Changes In Equity</Link></li>
          <li><Link to="/main/generalLedger">General Ledger</Link></li>
          <li><Link to="/main/trialBalance">Trial Balance</Link></li>
          <li><Link to="/main/deposits">Deposits</Link></li>
          <li><Link to="/main/collections">Collections</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
