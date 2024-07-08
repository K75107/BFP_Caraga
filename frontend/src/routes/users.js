import React from "react";

export default function Users(){
    return(
        <>
        <a href="/Dashboard" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Dashboard</a><br/>
        <a href="/Users" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Users</a><br/>
        <a href="/IncomeStatement" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Income Statement</a><br/>
        <a href="/BalanceSheet" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Balance Sheet</a><br/>
        <a href="/CashflowStatement" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Cashflow Statements</a><br/>
        <a href="/ChangesInEquity" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Changes in Equity</a><br/>
        <a href="/GeneralLedger" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">General Ledger</a><br/>
        <a href="/TrialBalance" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Trial Balance</a><br/>
        <a href="/Collections" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Fire Station Collections</a><br/>
        <a href="/Deposits" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Fire Station Deposits</a>
        </>


    );
}