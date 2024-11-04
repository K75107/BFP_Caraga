import React, { createContext, useContext, useState } from 'react';

const IncomeStatementContext = createContext();

export const UseLedgerData = () => useContext(IncomeStatementContext);

export const IncomeStatementPeriodProvider = ({ children }) => {
    const [accountTitlesPeriod, setAccountTitlesPeriod] = useState({});
    const [accountsPeriod, setAccountsPeriod] = useState({});
    const [selectedLedgerYear, setSelectedLedgerYear] = useState({});
    const [showPeriodColumn, setShowPeriodColumn] = useState({});

    const updateAccountTitlesPeriod = (id, data) => {
        setAccountTitlesPeriod(prev => ({ ...prev, [id]: data }));
    };

    const updateAccountsPeriod = (id, data) => {
        setAccountsPeriod(prev => ({ ...prev, [id]: data }));
    };

    const updateSelectedLedgerYear = (id, year) => {
        setSelectedLedgerYear(prev => ({ ...prev, [id]: year }));
    };

    const updateShowPeriodColumn = (id, value) => {
        setShowPeriodColumn(prev => ({ ...prev, [id]: value }));
    };

    return (
        <IncomeStatementContext.Provider value={{
            accountTitlesPeriod, updateAccountTitlesPeriod,
            accountsPeriod, updateAccountsPeriod,
            selectedLedgerYear, updateSelectedLedgerYear,
            showPeriodColumn, updateShowPeriodColumn
        }}>
            {children}
        </IncomeStatementContext.Provider>
    );
};
