import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; 
import { doc, collection, getDocs, getDoc } from 'firebase/firestore';

export default function TrialBalanceDetails() {
    const [TrialBalanceDescription, setTrialBalanceDescription] = useState("");
    const [trialBalanceData, setTrialBalanceData] = useState([]);
    const { trialbalanceID } = useParams(); 

    // Helper function to filter accounts by date range
    const isWithinDateRange = (accountDate, startDate, endDate) => {
        let accountTimestamp;

        // Check if accountDate is a Firestore Timestamp, a string, or a JS Date object
        if (accountDate && accountDate.toDate) {
            accountTimestamp = accountDate.toDate(); // Firestore Timestamp
        } else if (typeof accountDate === 'string') {
            accountTimestamp = new Date(accountDate); // Convert string to JS Date
        } else if (accountDate instanceof Date) {
            accountTimestamp = accountDate; // If it's already a JS Date object
        } else {
            console.log('Invalid account date:', accountDate); // Log invalid date
            return false;
        }

        return accountTimestamp >= startDate && accountTimestamp <= endDate;
    };

    useEffect(() => {
        const fetchTrialBalanceData = async () => {
            if (!trialbalanceID) {
                console.error('trialbalanceID is not provided.');
                return;
            }

            try {
                // Fetch the trial balance document to get the ledgerID, start_date, and end_date
                const trialBalanceDocRef = doc(db, 'trialbalance', trialbalanceID);
                const trialBalanceDoc = await getDoc(trialBalanceDocRef);

                if (!trialBalanceDoc.exists()) {
                    console.error("Trial balance document not found");
                    return;
                }

                const trialBalanceData = trialBalanceDoc.data();
                const ledgerID = trialBalanceData.ledger;
                const startDate = trialBalanceData.start_date.toDate(); // Firestore Timestamp to JS Date
                const endDate = trialBalanceData.end_date.toDate(); // Firestore Timestamp to JS Date

                if (!ledgerID) {
                    console.error('Ledger ID is missing from the trial balance document.');
                    return;
                }

                // Fetch account titles from the ledger using ledgerID
                const ledgerDocRef = doc(db, 'ledger', ledgerID);
                const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
                const accountTitlesSnapshot = await getDocs(accountTitlesCollectionRef);

                let trialData = [];

                // Loop through each account title
                for (const accountTitleDoc of accountTitlesSnapshot.docs) {
                    const accountTitleData = accountTitleDoc.data();
                    const accountsCollectionRef = collection(accountTitleDoc.ref, 'accounts');
                    const accountsSnapshot = await getDocs(accountsCollectionRef);

                    let totalDebit = 0;
                    let totalCredit = 0;
                    let hasValidAccounts = false;

                    // Sum debit and credit for accounts within the date range
                    accountsSnapshot.forEach(accountDoc => {
                        const accountData = accountDoc.data();
                        const accountDate = accountData.date;

                        // Check if the account date is within the start and end dates
                        if (isWithinDateRange(accountDate, startDate, endDate)) {
                            const debit = parseFloat(accountData.debit) || 0; // Parse as float
                            const credit = parseFloat(accountData.credit) || 0; // Parse as float

                            totalDebit += debit;
                            totalCredit += credit;
                            hasValidAccounts = true; // Flag that this account title has valid accounts
                        }
                    });

                    // Only add this account title to the trialData if it has valid accounts
                    if (hasValidAccounts) {
                        // Calculate total debit and credit using the existing logic
                        const debitBalance = totalDebit - totalCredit > 0 ? totalDebit - totalCredit : 0;
                        const creditBalance = totalCredit - totalDebit > 0 ? totalCredit - totalDebit : 0;

                        trialData.push({
                            particulars: accountTitleData.accountTitle, // Account title
                            accountCode: accountTitleData.accountCode, // Account code
                            debit: debitBalance, // Show calculated debit balance
                            credit: creditBalance, // Show calculated credit balance
                        });
                    } else {
                        // Debugging: Log if no valid accounts found for the account title
                        console.log('No valid accounts for Account Title:', accountTitleData.accountTitle);
                    }
                }

                // Update state with the summarized trial balance data
                setTrialBalanceData(trialData);
                setTrialBalanceDescription(trialBalanceData.description || 'Trial Balance');
            } catch (error) {
                console.error("Error fetching trial balance data:", error);
            }
        };

        fetchTrialBalanceData();
    }, [trialbalanceID]);

    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{TrialBalanceDescription}</h1>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                {/* TABLE */}
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    PARTICULARS
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    ACCOUNT CODE
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    DEBIT
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    CREDIT
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {trialBalanceData.length > 0 ? (
                                trialBalanceData.map((entry, index) => (
                                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {entry.particulars}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.accountCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Fragment>
    );
}
