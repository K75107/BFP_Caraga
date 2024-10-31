import React, { createContext, useContext, useState } from 'react';

const BalanceSheetContext = createContext();

export const UseLedgerData = () => useContext(BalanceSheetContext);

export const BalanceSheetPeriodProvider = ({ children }) => {
    const [accountTitlesPeriod, setAccountTitlesPeriod] = useState([]);
    const [accountsPeriod, setAccountsPeriod] = useState([]);
    const [selectedLedgerYear, setSelectedLedgerYear] = useState([]);
    const [showPeriodColumn, setShowPeriodColumn] = useState(false);

    return (
        <BalanceSheetContext.Provider value={{ accountTitlesPeriod, setAccountTitlesPeriod, accountsPeriod, setAccountsPeriod, selectedLedgerYear, setSelectedLedgerYear, showPeriodColumn, setShowPeriodColumn }}>
            {children}
        </BalanceSheetContext.Provider>
    );
};
