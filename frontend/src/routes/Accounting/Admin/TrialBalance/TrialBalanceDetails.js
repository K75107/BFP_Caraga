import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config';
import { doc, collection, getDocs, getDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import ExcelHeader from '../../../../assets/ExcelHeader.png';
import { PiListChecks, PiListChecksFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import ExportButton from "../../../../components/exportButton";

export default function TrialBalanceDetails() {
    const navigate = useNavigate();

    const [TrialBalanceDescription, setTrialBalanceDescription] = useState("");
    const [trialBalanceData, setTrialBalanceData] = useState([]);
    const { trialbalanceID } = useParams();
    const [loading, setLoading] = useState(false);

    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);

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

        // Ensure endDate is the last moment of the day (23:59:59)
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        return accountTimestamp >= startDate && accountTimestamp <= endOfDay;
    };


    useEffect(() => {
        setLoading(true); // Start loading before fetching data

        const fetchTrialBalanceData = async () => {
            if (!trialbalanceID) {
                console.error('trialbalanceID is not provided.');
                return;
            }

            try {
                const trialBalanceDocRef = doc(db, 'trialbalance', trialbalanceID);
                const trialBalanceDoc = await getDoc(trialBalanceDocRef);

                if (!trialBalanceDoc.exists()) {
                    console.error("Trial balance document not found");
                    setLoading(false); // Stop loading on error
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

                const ledgerDocRef = doc(db, 'ledger', ledgerID);
                const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
                const accountTitlesSnapshot = await getDocs(accountTitlesCollectionRef);

                let trialData = [];
                let debitSum = 0; // For summing total debit
                let creditSum = 0; // For summing total credit

                for (const accountTitleDoc of accountTitlesSnapshot.docs) {
                    const accountTitleData = accountTitleDoc.data();
                    const accountsCollectionRef = collection(accountTitleDoc.ref, 'accounts');
                    const accountsSnapshot = await getDocs(accountsCollectionRef);

                    let totalDebit = 0;
                    let totalCredit = 0;
                    let hasValidAccounts = false;

                    accountsSnapshot.forEach(accountDoc => {
                        const accountData = accountDoc.data();
                        const accountDate = accountData.date;

                        if (isWithinDateRange(accountDate, startDate, endDate)) {
                            const debit = parseFloat(accountData.debit) || 0;
                            const credit = parseFloat(accountData.credit) || 0;

                            totalDebit += debit;
                            totalCredit += credit;
                            hasValidAccounts = true;
                        }
                    });

                    if (hasValidAccounts) {
                        const debitBalance = totalDebit - totalCredit > 0 ? totalDebit - totalCredit : 0;
                        const creditBalance = totalCredit - totalDebit > 0 ? totalCredit - totalDebit : 0;

                        trialData.push({
                            particulars: accountTitleData.accountTitle,
                            accountCode: accountTitleData.accountCode,
                            debit: debitBalance,
                            credit: creditBalance,
                        });

                        // Sum up the total debit and credit
                        debitSum += debitBalance;
                        creditSum += creditBalance;
                    }
                }

                // Update state with the summarized trial balance data
                setTrialBalanceData(
                    trialData.sort((a, b) => {
                        const codeA = parseInt(a.accountCode.replace(/\s+/g, ""), 10);
                        const codeB = parseInt(b.accountCode.replace(/\s+/g, ""), 10);
                        return codeA - codeB;
                    })
                );
                setTrialBalanceDescription(trialBalanceData.description || 'Trial Balance');
                setTotalDebit(debitSum); // Set total debit state
                setTotalCredit(creditSum); // Set total credit state
                setLoading(false); // Stop loading after fetching data
            } catch (error) {
                console.error("Error fetching trial balance data:", error);
                setLoading(false); // Stop loading on error
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
            // Header row
            ["PARTICULARS", "ACCT CODE", "REGULAR AGENCY FUND"],
            ["", "", "(01 101101)"],
            ["", "", "debit", "credit"],
            // Use the trialBalanceData from the state
            ...trialBalanceData.map(entry => [
                entry.particulars,
                entry.accountCode,
                // Convert zero values to an empty string for export
                entry.debit === 0 || entry.debit === "" ? "" : entry.debit,
                entry.credit === 0 || entry.credit === "" ? "" : entry.credit
            ]),
            ["TOTAL", "", totalDebit, totalCredit],
        ];

        // Append the rows to the worksheet
        const addedRows = worksheetData.map(row => worksheet.addRow(row));

        const fillColor = 'FFCCC0DA';

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
        worksheet.mergeCells('A15:A17'); // PARTICULARS
        worksheet.mergeCells('B15:B17'); // ACCT CODE
        worksheet.mergeCells('C15:D15'); // REGULAR AGENCY FUND
        worksheet.mergeCells('C16:D16'); // (01 101101)

        // Apply styles to the merged header rows
        const NormalArialHeader = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial', size: 11 }
        };

        const BoldArialHeader = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial', size: 11, bold: true }
        };

        const NormalArialNarrowHeader = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 12 }
        };

        const BoldArialNarrowHeader16 = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 16, bold: true }
        };

        const BoldArialNarrowHeader = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 12, bold: true }
        };

        const BoldArialNarrowRows = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 11, bold: true }
        };

        const BoldArialNarrowRows10 = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 10, bold: true }
        };

        const NormalArialNarrowRows10 = {
            alignment: { horizontal: 'center', vertical: 'middle' },
            font: { name: 'Arial Narrow', size: 10 }
        };

        //NORMAL ARIAL HEADER
        ['A4', 'A8', 'A9'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = NormalArialHeader;
        });

        //BOLD ARIAL HEADER
        ['A5', 'A6', 'A7'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = BoldArialHeader;
        });

        //BOLD ARIAL NARROW HEADER
        ['A11'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = BoldArialNarrowHeader16;
        });

        //NORMAL ARIAL NARROW HEADER
        ['A12'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = NormalArialNarrowHeader;
        });


        //BOLD ARIAL NARROW HEADER
        ['A13'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = BoldArialNarrowHeader;
        });


        //BOLD ARIAL NARROW ROWS
        ['A15', 'B15'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = BoldArialNarrowRows;
        });

        //BOLD ARIAL NARROW ROWS - 10
        ['C15', 'C17', 'D17'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = BoldArialNarrowRows10;
        });

        //NORMAL ARIAL NARROW ROWS - 10
        ['C16'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.style = NormalArialNarrowRows10;
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fillColor }
            };
        });

        //FILL COLOR FOR C17
        ['C17'].forEach(cell => {
            const row = worksheet.getCell(cell);
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fillColor }
            };
        });

        // Apply styles to the entries in trialBalanceData
        addedRows.forEach((row, rowIndex) => {
            if (rowIndex >= 17) {
                row.eachCell((cell, colNumber) => {
                    const ParticularsStyle = {
                        alignment: { horizontal: 'left', vertical: 'bottom' },
                        font: { name: 'Arial', size: 11 }
                    };
                    const AcctCodeStyle = {
                        alignment: { horizontal: 'center', vertical: 'bottom' },
                        font: { name: 'Arial', size: 11 }
                    };
                    const DebitCreditStyle = {
                        alignment: { vertical: 'bottom' },
                        font: { name: 'Arial', size: 11 },
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: fillColor }
                        },
                        numFmt: '#,##0.00' // Apply number format for Debit and Credit columns
                    };

                    if (colNumber === 1) {
                        cell.style = ParticularsStyle;
                    }
                    if (colNumber === 2) {
                        cell.style = AcctCodeStyle;
                    }
                    if (colNumber === 3 || colNumber === 4) {
                        cell.style = DebitCreditStyle;
                    }
                });
            }
        });

        const totalRowIndex = addedRows.length; // Get the index of the last added row (total row)
        const totalRow = worksheet.getRow(totalRowIndex); // Access the total row

        totalRow.eachCell((cell, colNumber) => {
            // Apply bold font and center alignment for the total row
            cell.font = { bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };

            // Apply specific styles based on the column
            if (colNumber === 3 || colNumber === 4) { // Debit and Credit columns
                cell.numFmt = '#,##0.00'; // Number format with commas and two decimal places
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'double' }, // Double border for total row
                    right: { style: 'thin' }
                };
            } else {
                // For other columns (e.g., particulars and account code)
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '95B3D7' }
                };
            }
        });

        // Add the logo to the worksheet at a specific position
        worksheet.addImage(logoId, {
            tl: { col: 0.2, row: 0 }, // Top-left corner of the image (adjust as needed)
            ext: { width: 650, height: 140 }, // Width and height of the image
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
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px] ml-2" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li class="inline-flex items-center">
                        <button onClick={() => navigate("/main/TrialBalance/TrialBalanceList")} class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <PiListChecksFill className="mr-2"></PiListChecksFill>
                            Trial Balance
                        </button>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{TrialBalanceDescription}</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="px-2">
                <div className="bg-white h-30 py-6 px-8 rounded-lg">
                    <div className="flex justify-between w-full">
                        <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{TrialBalanceDescription}</h1>
                        {/* Button to export to Excel */}
                        <ExportButton
                            onClick={exportToExcel}
                            label="EXPORT"
                        />

                    </div>
                </div>



                <div className="px-2 py-4">
                    <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky ">
                                <tr>
                                    <th scope="col" className="px-6 py-4 w-72">
                                        PARTICULARS
                                    </th>
                                    <th scope="col" className="px-4 py-4 w-48">
                                        ACCOUNT CODE
                                    </th>
                                    <th scope="col" className="px-3 py-4 w-48">
                                        DEBIT
                                    </th>
                                    <th scope="col" className="px-3 py-4 w-48">
                                        CREDIT
                                    </th>
                                </tr>
                            </thead>
                        </table>
                        <div className=' w-full overflow-y-auto max-h-[calc(96vh-240px)]'>
                            <table className='w-full overflow-x-visible'>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-6">
                                                {/* Spinner Wrapper for Centering */}
                                                <div className="flex justify-center items-center h-96"> {/* Use Flexbox to center */}
                                                    <div role="status">
                                                        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                        </svg>
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        trialBalanceData.length > 0 ? (
                                            trialBalanceData.map((entry, index) => (
                                                <tr key={index} className=" text-sm w-full bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <td className="table-cell px-6 py-3 w-72 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                        {entry.particulars}
                                                    </td>
                                                    <td className="table-cell px-6 py-3 w-48">
                                                        {entry.accountCode}
                                                    </td>
                                                    <td className="table-cell px-6 py-3 w-48">
                                                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                                    </td>
                                                    <td className="table-cell px-6 py-3 w-48">
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
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* TOTAL */}
                <table className=" w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-[14px] font-bold font-poppins text-gray-700 uppercase dark:text-gray-400 sticky">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-72">
                                TOTAL
                            </th>
                            <th scope="col" className="px-2 py-3 w-48"></th>
                            {/* TOTAL DEBIT */}
                            <th scope="col" className="px-2 py-3 w-48">
                                {totalDebit.toLocaleString()}
                            </th>
                            {/* TOTAL CREDIT */}
                            <th scope="col" className="px-2 py-3 w-48">
                                {totalCredit.toLocaleString()}
                            </th>
                        </tr>
                    </thead>
                </table>
            </div>

        </Fragment >
    );
}