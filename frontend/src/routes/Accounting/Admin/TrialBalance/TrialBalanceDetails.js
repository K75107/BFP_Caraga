import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; 
import { doc, collection, getDocs, getDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import ExcelHeader from '../../../../assets/ExcelHeader.png';

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

    // Function to export the data to Excel
    const exportToExcel = async () => {
        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Trial Balance');

        // Load the image
        const logoPath = ExcelHeader; // Replace with the path to your image file
        const logoImage = await fetch(logoPath).then(res => res.blob()); // Fetch the image as a Blob
        const logoBuffer = await logoImage.arrayBuffer(); // Convert Blob to ArrayBuffer

        // Add the image to the workbook
        const logoId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });

        // Add the data rows
        const worksheetData = [
            ["", "", "", ""],
            ["", "", "", ""],
            ["", "", "", ""],
            ["Republic of the Philippines"],
            ["DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT"],
            ["BUREAU OF FIRE PROTECTION"],
            ["CARAGA REGIONAL OFFICE"],
            ["Maharlika Road, Brgy. Rizal, Surigao City"],
            ["Telefax No. (085) 816-3599"],
            ["", "", "", ""],   
            ["TRIAL BALANCE"],
            ["As of (DATE)"],
            ["REGULAR AGENCY FUND"],
            ["", "", "", ""],           
            ["PARTICULARS", "ACCT CODE", "DEBIT", "CREDIT"], // Header row
            // Use the trialBalanceData from the state
            ...trialBalanceData.map(entry => [
                entry.particulars,
                entry.accountCode,
                entry.debit,
                entry.credit
            ])
        ];

        // Append the rows to the worksheet
        worksheetData.forEach((row) => {
            worksheet.addRow(row);
        });

        // Set column widths
        worksheet.columns = [
            { width: 45 },
            { width: 15 },
            { width: 15 },
            { width: 15 }
        ];

        // Merge header cells
        worksheet.mergeCells('A4:D4'); // Republic of the Philippines
        worksheet.mergeCells('A5:D5'); // Department of the Interior and Local Government
        worksheet.mergeCells('A6:D6'); // BUREAU OF FIRE PROTECTION
        worksheet.mergeCells('A7:D7'); // Caraga Regional Office
        worksheet.mergeCells('A8:D8'); // Maharlika Road, Brgy. Rizal, Surigao City
        worksheet.mergeCells('A9:D9'); // Telefax No. (085) 816-3599
        worksheet.mergeCells('A11:D11'); // TRIAL BALANCE
        worksheet.mergeCells('A12:D12'); // As of (DATE)
        worksheet.mergeCells('A13:D13'); // REGULAR AGENCY FUND

        // Apply styles to the merged header rows
        const mergeCellStyle = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { bold: true }
        };

        ['A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A11', 'A12', 'A13'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = mergeCellStyle;
        });

        // Apply styles to the header row (row 10)
        const headerRow = worksheet.getRow(9); // Row for "PARTICULARS", etc.
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.font = { bold: true };

        // Add the logo to the worksheet at a specific position
        worksheet.addImage(logoId, {
            tl: { col: 0.1, row: 0 }, // Top-left corner of the image (adjust as needed)
            ext: { width: 635, height: 120 }, // Width and height of the image
            positioning: {
                type: 'absolute', // Positioning type
                moveWithCells: true, // Move with cells
                size: true // Resize with cells
            }
        });

        // Save to a file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'TrialBalance.xlsx';
        link.click();
    };

    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{TrialBalanceDescription}</h1>
                    {/* Button to export to Excel */}
                    <button
                        onClick={exportToExcel}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Export to Excel
                    </button>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                {/* TABLE */}
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">PARTICULARS</th>
                                <th scope="col" className="px-6 py-3">ACCT CODE</th>
                                <th scope="col" className="px-6 py-3">DEBIT</th>
                                <th scope="col" className="px-6 py-3">CREDIT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trialBalanceData.length > 0 ? (
                                trialBalanceData.map((entry, index) => (
                                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {entry.particulars}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.accountCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.debit}
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.credit}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-6 py-4 text-center" colSpan={4}>
                                        No trial balance data available.
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