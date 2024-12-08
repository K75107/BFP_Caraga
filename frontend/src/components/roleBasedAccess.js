import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const userTypePaths = {
    "admin": [
      "/main/adminDashboard",
      "/main/users",
      "/main/generalLedger",
      "/main/accounts",
      "/main/TrialBalance",
      "/main/incomeStatement",
      "/main/balanceSheet",
      "/main/cashflowStatement",
      "/main/changesInEquityMain",
      "/main/reports/firestationReports",
    ],
    "regional-accountant": [
      "/main/accountingDashboard",
      "/main/generalLedger",
      "/main/accounts",
      "/main/TrialBalance",
      "/main/incomeStatement",
      "/main/balanceSheet",
      "/main/cashflowStatement",
      "/main/changesInEquityMain",
      "/main/reports/firestationReports",
    ],
    "chief-fmd": [
      "/main/accountingDashboard",
      "/main/generalLedger",
      "/main/accounts",
      "/main/TrialBalance",
      "/main/incomeStatement",
      "/main/balanceSheet",
      "/main/cashflowStatement",
      "/main/changesInEquityMain",
      "/main/reports/firestationReports",
    ],
    "disbursement-processor": [
      "/main/accountingDashboard",
      "/main/generalLedger",
      "/main/accounts",
      "/main/TrialBalance",
      "/main/incomeStatement",
      "/main/balanceSheet",
      "/main/cashflowStatement",
      "/main/changesInEquityMain",
      "/main/reports/firestationReports",
    ],
    "fire-stations": [
      "/main/firestation/dashboard",
      "/main/firestation/deposits",
      "/main/firestation/collections",
      "/main/firestation/officers",
    ],
    "bookkeeper": [
      "/main/bookkeeper/dashboard",
      "/main/generalLedger",
      "/main/accounts",
      "/main/TrialBalance",
    ],
    "firecode-monitoring": [
      "/main/firecodemonitoring/dashboard",
      "/main/reports/firestationReports",
    ],
    "firecode-revenue": [
      "/main/firecoderevenue/dashboard",
      "/main/generalLedger",
      "/main/TrialBalance",
      "/main/reports/firestationReports",
    ],
  };
  
  const RoleBasedAccess = (userType) => {
    const location = useLocation();
    const navigate = useNavigate();
  
    useEffect(() => {
      if (userType && userTypePaths[userType]) {
        const validPaths = userTypePaths[userType];
        if (!validPaths.some((path) => location.pathname.startsWith(path))) {
          navigate(validPaths[0], { replace: true }); // Redirect to the dashboard
        }
      }
    }, [userType, location.pathname, navigate]);
  };

  export default RoleBasedAccess;