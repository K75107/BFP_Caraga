import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { db } from "../../../../config/firebase-config";
import { collection, getDocs, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Dropdown, Checkbox } from 'flowbite-react';
import { BiFilterAlt, BiChevronDown } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { PiStack, PiStackFill } from "react-icons/pi";
import ExcelHeader2 from '../../../../assets/ExcelHeader2.png';
import ExcelJS from 'exceljs';
import SearchBar from "../../../../components/searchBar";
import ExportButton from "../../../../components/exportButton";
import { CiFilter } from "react-icons/ci";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoMdAddCircleOutline } from "react-icons/io"; // Icon
import { BiExport } from "react-icons/bi"; // Icons for filter button


export default function FirestationReports() {
    const navigate = useNavigate();
    const [usersData, setUsersData] = useState([]);
    const [toggledRows, setToggledRows] = useState({}); // State to manage toggled provinces

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsersData, setFilteredUsersData] = useState([]); // New state for filtered data

    const [filteredGroupedData, setFilteredGroupedData] = useState([]);

    const [reportsData, setReportsData] = useState([]);
    const [reportsData2, setReportsData2] = useState([]);
    const [startExportDate, setStartExportDate] = useState(null);
    const [endExportDate, setEndExportDate] = useState(null);

    useEffect(() => {
        const filteredUsers = usersData.filter((users) =>
            users.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsersData(filteredUsers);

        // Group the data by province based on filteredUsers
        const groupedData = filteredUsers.reduce((acc, collection) => {
            const { province } = collection;
            if (!acc[province]) {
                acc[province] = [];
            }
            acc[province].push(collection);
            return acc;
        }, {});

        setFilteredGroupedData(groupedData);
    }, [searchQuery, usersData]);


    useEffect(() => {
        const fetchUsersData = async () => {
            const firestationsRef = collection(db, 'firestationReportsCollections');
            const firestationsSnapshot = await getDocs(firestationsRef);
            const collectionsData = firestationsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsersData(collectionsData);
        }

        fetchUsersData();
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            const mainCollectionRef = collection(db, "submittedReportsCollections");
            const mainSnapshot = await getDocs(mainCollectionRef);

            const allReports = [];

            // Iterate over each document in the `submittedReportsCollections`
            for (const doc of mainSnapshot.docs) {
                const subCollectionRef = collection(
                    db,
                    `submittedReportsCollections/${doc.id}/collections`
                );

                const subSnapshot = await getDocs(subCollectionRef);

                // Add each subcollection document to the array
                subSnapshot.docs.forEach((subDoc) => {
                    allReports.push({ id: subDoc.id, ...subDoc.data() });
                });
            }

            setReportsData(allReports);
        };

        fetchReports();
    }, []);


    useEffect(() => {
        const fetchReports2 = async () => {
            const mainCollectionRef = collection(db, "submittedReportsDeposits");
            const mainSnapshot = await getDocs(mainCollectionRef);

            const allReports2 = [];

            // Iterate over each document in the `submittedReportsCollections`
            for (const doc of mainSnapshot.docs) {
                const subCollectionRef = collection(
                    db,
                    `submittedReportsDeposits/${doc.id}/collections`
                );

                const subSnapshot = await getDocs(subCollectionRef);

                // Add each subcollection document to the array
                subSnapshot.docs.forEach((subDoc) => {
                    allReports2.push({ id: subDoc.id, ...subDoc.data() });
                });
            }

            setReportsData2(allReports2);
        };

        fetchReports2();
    }, []);

    // Toggle function for provinces
    const toggleProvince = (province) => {
        setToggledRows((prev) => ({
            ...prev,
            [province]: !prev[province]
        }));
    };

    // Updated year list
    const [years, setYears] = useState([]);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2020;
        const yearList = [];

        for (let year = currentYear; year >= startYear; year--) {
            yearList.push(year);
        }

        setYears(yearList);
    }, []);

    //EXPORTING 

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Firestation Reports");

        worksheet.pageSetup = {
            orientation: 'landscape',
            fitToPage: true, // Ensure content fits within one page
            fitToWidth: 1,
            fitToHeight: 0,
        };

        worksheet.pageSetup.margins = {
            left: 0.4, // Left margin (in inches)
            right: 0.4, // Right margin (in inches)
            top: 0.1, // Top margin (in inches)
            bottom: 0, // Bottom margin (in inches)
            header: 1.3, // Header margin (distance from the top edge)
            footer: 0, // Footer margin (distance from the bottom edge)
        };
        // Text data
        const textData = [
            'Republic of the Philippines',
            'DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT',
            'BUREAU OF FIRE PROTECTION',
            'CARAGA REGIONAL OFFICE',
            'Maharlika Road, Brgy. Rizal, Surigao City',
            'Telefax No. (085) 816-3599',
            'Email address: bfp_caraga@yahoo.com'
        ];

        // Start adding text to merged cells from A9 to W15
        let startRow = 8; // Starting at row 9
        textData.forEach((text, index) => {
            const rowIndex = startRow + index; // Calculate the row number

            // Merge cells from A to W for the current row
            worksheet.mergeCells(`A${rowIndex}:W${rowIndex}`);

            // Get the merged cell
            const cell = worksheet.getCell(`A${rowIndex}`);

            // Set the text value
            cell.value = text;

            // Center the text horizontally and vertically
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

            // Apply font styling
            cell.font = {
                bold: index < 3, // Make the first three lines bold
                size: index === 0 ? 14 : 12 // Larger font size for the first line
            };
        });

        // Merge A9:W9 and apply bold specifically to this row
        const titleCell = worksheet.getCell('A9');
        titleCell.font = { ...titleCell.font, bold: true };


        // Load the image
        const logoPath = ExcelHeader2; // Replace with the path to your image file
        const logoImage = await fetch(logoPath).then(res => res.blob()); // Fetch the image as a Blob
        const logoBuffer = await logoImage.arrayBuffer(); // Convert Blob to ArrayBuffer

        // Add the image to the workbook
        const logoId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });

        const startDate = new Date(startExportDate);
        const endDate = new Date(endExportDate);

        // Get the month name
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        const monthName2 = endDate.toLocaleString('default', { month: 'long' });

        // Merge and format the main title
        worksheet.mergeCells("A17:W17");
        worksheet.getCell("A17").value = "SUMMARY OF COLLECTIONS AND DEPOSITS";
        worksheet.getCell("A17").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getCell("A17").font = { bold: true, size: 14 };

        worksheet.mergeCells("A18:W18");
        worksheet.getCell("A18").value = `As of ${monthName} ${startDate.getFullYear()}`;
        worksheet.getCell("A18").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getCell("A18").font = { bold: true };

        // Define headers
        worksheet.getRow(19).values = [
            "CITY / MUNICIPALITY",
            "COLLECTING OFFICER",
            "ACCOUNT CODE",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "CURRENT YEAR",
            "",
            "",
            "",
            "",
            "PRIOR YEAR",
            "",
            "",
            "",
            "TOTAL UNDEPOSITED",

        ];

        worksheet.mergeCells('C19:M19'); // Merge ACCOUNT CODE range
        worksheet.mergeCells('N19:R19'); // Merge CURRENT YEAR header
        worksheet.mergeCells('S19:U19');


        // Subheaders for "NATURE OF COLLECTION DATA"
        worksheet.getRow(20).values = [
            "", "",
            "628 - BFP-01", "628 - BFP-02", "628 - BFP-03",
            "628 - BFP-04", "628 - BFP-05", "628 - BFP-06",
            "628 - BFP-07", "628 - BFP-08", "628 - BFP-09",
            "628 - BFP-10", "628 - BFP-11",
            "Total Collections", "20% LGU Share", "Total Last Report", "Total Deposits", "Undeposited Collection",
            "Total Collections", "Total Deposits", "Undeposited Collection", "", "",
        ];

        // Apply header styles
        [20].forEach((rowIndex) => {
            worksheet.getRow(rowIndex).font = { name: "Arial", size: 7 };
            worksheet.getRow(rowIndex).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });
        [19].forEach((rowIndex) => {
            worksheet.getRow(rowIndex).font = { bold: true, name: "Arial", size: 7 };
            worksheet.getRow(rowIndex).alignment = { horizontal: "center", vertical: "middle" };
        });
        worksheet.getRow(20).height = 20; // Adjust to desired height

        worksheet.mergeCells('A19:A20'); // Merge CITY / MUNICIPALITY
        worksheet.getCell('A19').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('A19').font = { bold: true, name: "Arial", size: 7 };
        ['A19', 'A20'].forEach((cell) => {
            worksheet.getCell(cell).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });


        worksheet.mergeCells('B19:B20'); // Merge COLLECTING OFFICER
        worksheet.getCell('B19').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('B19').font = { bold: true, name: "Arial", size: 7 };
        ['B19', 'B20'].forEach((cell) => {
            worksheet.getCell(cell).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        worksheet.mergeCells('V19:W20'); // Merge TOTAL UNDEPOSITED
        worksheet.getCell('V19').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('V19').value = "TOTAL UNDEPOSITED";
        worksheet.getCell('V19').font = { bold: true, name: "Arial", size: 7 };
        ['V19', 'W20'].forEach((cell) => {
            worksheet.getCell(cell).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Adjust column widths to fit within one page
        worksheet.columns = [
            { width: 8 },  // CITY / MUNICIPALITY
            { width: 12 }, // COLLECTING OFFICER
            { width: 7 },  // 628 - BFP-01
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 7 },
            { width: 8 },  // Total Collections
            { width: 7 },  // 20% LGU Share
            { width: 7 },  // Total Last Report
            { width: 7 },  // Total Deposits
            { width: 9 },  // Undeposited Collection
            { width: 9 },  // 
            { width: 7 },  //
            { width: 9 },  //
            { width: 7 },  //
            { width: 7 },  //

        ];

        worksheet.views = [
            {
                state: 'split',
                ySplit: 16,
                xSplit: 0,
                topLeftCell: 'A17',
                activeCell: 'A17'
            }
        ];


        // Add data dynamically
        const filteredData = reportsData.filter((data) => {
            const dateCollected = new Date(data.dateCollected); // Assuming `dateCollected` is in a valid date format
            const effectiveEndDate = endExportDate
                ? new Date(endExportDate).setHours(23, 59, 59, 999)
                : new Date().setHours(23, 59, 59, 999);
            return (
                (!startExportDate || dateCollected >= new Date(startExportDate)) &&
                (!endExportDate || dateCollected <= effectiveEndDate)
            );
        });

        const filteredData2 = reportsData2.filter((data) => {
            const dateDeposited = new Date(data.dateDeposited);
            const effectiveEndDate = endExportDate
                ? new Date(endExportDate).setHours(23, 59, 59, 999)
                : new Date().setHours(23, 59, 59, 999);
            return (
                (!startExportDate || dateDeposited >= new Date(startExportDate)) &&
                (!endExportDate || dateDeposited <= effectiveEndDate)
            );
        });

        const depositMap = {};
        filteredData2.forEach((deposit) => {
            const officer = deposit.collectingOfficer;
            if (!depositMap[officer]) {
                depositMap[officer] = 0;
            }
            depositMap[officer] += deposit.depositAmount || 0; // Sum deposits
        });

        // List of valid account codes (from the dropdown options)
        const validAccountCodes = [
            "628-BFP-01", "628-BFP-02", "628-BFP-03", "628-BFP-04",
            "628-BFP-05", "628-BFP-06", "628-BFP-07", "628-BFP-08",
            "628-BFP-09", "628-BFP-10", "628-BFP-11"
        ];

        // Sort the filtered data by city (fireStationName)
        filteredData.sort((a, b) => {
            // Sort by collecting officer and date submitted (descending order)
            if (a.collectingOfficer === b.collectingOfficer) {
                return new Date(b.dateSubmitted) - new Date(a.dateSubmitted); // Sort by date descending
            }
            return a.collectingOfficer.localeCompare(b.collectingOfficer); // Sort by officer
        });

        let currentRow = 21;// Start adding data from row 8
        let currentCity = ''; // To keep track of the current city


        // Create a map to store all reports for each officer (as an array)
        const officerReportsMap = {};

        const grandTotals = [];
        let cityTotals = Array(21).fill(0); // Array to track subtotals for each column


        filteredData.forEach((data) => {
            if (data.fireStationName !== currentCity) {
                if (currentCity) {
                    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
                    worksheet.getCell(`A${currentRow}`).value = `${currentCity} Subtotal`;
                    worksheet.getCell(`A${currentRow}`).font = { bold: true };
                    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" };

                    cityTotals.forEach((value, index) => {
                        const colIndex = index + 3; // Adjust column index
                        const cell = worksheet.getCell(currentRow, colIndex); // Define 'cell'

                        if (value > 0) {
                            cell.value = value;
                            cell.font = { bold: true };
                        } else {
                            cell.value = ""; // Ensure empty cells are properly defined
                        }

                        cell.border = {
                            top: { style: "thin" },
                            left: { style: "thin" },
                            bottom: { style: "thin" },
                            right: { style: "thin" },
                        };

                        // Accumulate grand total
                        grandTotals[index] = (grandTotals[index] || 0) + value;
                    });

                    currentRow++;
                    cityTotals.fill(0); // Reset city totals for the next city
                }

                // Increase the row to leave space above
                worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
                worksheet.getCell(`A${currentRow}`).value = `${data.fireStationName}`;
                worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
                worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };
                currentCity = data.fireStationName;
                currentRow++;
            }


            // Insert the data for the current row
            worksheet.getCell(`A${currentRow}`).value = data.fireStationName || "N/A";
            worksheet.getCell(`B${currentRow}`).value = data.collectingOfficer || "N/A";

            // Initialize an array for the columns C to M (subheader account codes)
            const collectionData = Array(validAccountCodes.length).fill(""); // Initialize with empty strings instead of null

            // Extract the account code from `natureOfCollection` and match with valid account codes
            const accountCode = data.natureOfCollection.split(' | ')[0]; // Get the part before the "|"

            // Check if the extracted account code is in the valid list
            if (validAccountCodes.includes(accountCode)) {
                const index = validAccountCodes.indexOf(accountCode);
                const amount = parseFloat(data.collectionAmount) || 0; // Convert to a number, default to 0 if invalid
                collectionData[index] = amount === 0 ? "" : amount; // Leave empty if 0, otherwise use the number
            }

            // Populate the worksheet with the mapped data for columns C to M
            collectionData.forEach((value, index) => {
                const colIndex = 3 + index; // Columns C to M (3 to 13)
                worksheet.getCell(currentRow, colIndex).value = value;

                // Apply borders to each cell, even if it's empty
                worksheet.getCell(currentRow, colIndex).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
                cityTotals[index] += value || 0;
            });

            // Calculate and insert the Total Collections (sum of the collectionData)
            const totalCollection = collectionData.reduce((acc, value) => {
                const numValue = (value === "" || value === 0) ? 0 : Number(value); // Treat empty as 0
                return acc + numValue;
            }, 0);

            // Insert the total in the "Total Collections" column (14th column)
            worksheet.getCell(currentRow, 14).value = totalCollection;

            // Apply border to the "Total Collections" column
            worksheet.getCell(currentRow, 14).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            cityTotals[11] += totalCollection;

            // Calculate 20% LGU Share Collections (20% of the total collection)
            const lguShare = totalCollection * 0.2;

            // Insert the 20% LGU Share Collections in the "20% LGU Share Collections" column (15th column, Column O)
            worksheet.getCell(currentRow, 15).value = lguShare;

            // Apply border to the "20% LGU Share Collections" column
            worksheet.getCell(currentRow, 15).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            cityTotals[12] += lguShare;

            // Store this report in the map for the current officer
            if (!officerReportsMap[data.collectingOfficer]) {
                officerReportsMap[data.collectingOfficer] = [];
            }

            officerReportsMap[data.collectingOfficer].push({
                dateSubmitted: data.dateSubmitted,
                collectionAmount: totalCollection,
            });

            // Populate "Total Last Report" column (16th column) with the second-to-last report's collection amount
            let totalAmount = 0;
            const officerReports = officerReportsMap[data.collectingOfficer];

            // Ensure reports are sorted by date
            officerReports.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending by date
            
            if (officerReports.length > 1) {
                const secondToLastReport = officerReports[officerReports.length - 2];
                const collectionAmount = parseFloat(secondToLastReport.collectionAmount || 0); // Parse as float
                console.log("Second-to-Last Collection Amount:", collectionAmount); // Debugging
                worksheet.getCell(currentRow, 16).value = collectionAmount;
                worksheet.getCell(currentRow, 16).numFmt = "0.00"; // Apply decimal formatting
            } else {
                worksheet.getCell(currentRow, 16).value = ""; // Leave blank if fewer than 2 reports
            }
            
            // Apply border to the "Total Last Report" column
            worksheet.getCell(currentRow, 16).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            // Apply border to the "Total Last Report" column
            worksheet.getCell(currentRow, 16).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[13] += totalAmount;

            const totalDeposits = depositMap[data.collectingOfficer] || null; // Use `null` if no deposits

            // Set the "Total Deposits" column (17th column)
            worksheet.getCell(currentRow, 17).value = totalDeposits;
            worksheet.getCell(currentRow, 17).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[14] += totalDeposits;

            // Calculate "Undeposited Collection" (18th column)
            const totalCollections = worksheet.getCell(currentRow, 14).value || 0; // Default to 0 if missing
            const undeposited = totalDeposits !== null ? totalCollections - totalDeposits : totalCollections; // Handle null deposits

            worksheet.getCell(currentRow, 18).value = undeposited > 0 ? undeposited : null; // Leave empty if no undeposited amount
            worksheet.getCell(currentRow, 18).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            cityTotals[15] += undeposited;

            // Calculate "Prior Year Total Collections" (19th column)
            const currentYear = new Date().getFullYear();
            const priorYear = currentYear - 1;

            const priorYearCollections = reportsData
                .filter((report) =>
                    report.collectingOfficer === data.collectingOfficer &&
                    new Date(report.dateCollected).getFullYear() === priorYear
                )
                .reduce((sum, report) => sum + (report.collectionAmount || 0), 0);

            worksheet.getCell(currentRow, 19).value = priorYearCollections || null; // Leave empty if no prior year data
            worksheet.getCell(currentRow, 19).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[16] += priorYearCollections;

            const priorYearDeposits = filteredData2
                .filter(
                    (report) =>
                        report.collectingOfficer === data.collectingOfficer &&
                        new Date(report.dateDeposited).getFullYear() === priorYear
                )
                .reduce((sum, report) => sum + (report.depositAmount || 0), 0);

            worksheet.getCell(currentRow, 20).value = priorYearDeposits > 0 ? priorYearDeposits : null; // Leave empty if no data
            worksheet.getCell(currentRow, 20).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[17] += priorYearDeposits;


            const priorYearUndeposited =
                priorYearCollections > 0
                    ? priorYearCollections - priorYearDeposits
                    : null; // Leave empty if no prior year data

            worksheet.getCell(currentRow, 21).value = priorYearUndeposited;
            worksheet.getCell(currentRow, 21).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[18] += priorYearUndeposited;


            // Retrieve values from columns 18 and 21
            const undeposited2 = worksheet.getCell(currentRow, 18).value || 0; // Use 0 if null or undefined
            const priorYearUndeposited2 = worksheet.getCell(currentRow, 21).value || 0; // Use 0 if null or undefined

            // Calculate total undeposited as the sum of column 18 and column 21
            const totalundeposited = undeposited2 + priorYearUndeposited2;

            // Merge columns 22 and 23 (V and W) for the current row
            worksheet.mergeCells(`V${currentRow}:W${currentRow}`);

            // Assign total undeposited value to the merged cells
            worksheet.getCell(`V${currentRow}`).value = totalundeposited > 0 ? totalundeposited : null; // Only show if greater than 0
            worksheet.getCell(`V${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };

            // Set borders for the merged cells
            worksheet.getCell(`V${currentRow}`).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cityTotals[19] += totalCollection;
            currentRow++;
        });

        if (currentCity) {
            // Add Subtotal row for the current city
            worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
            const subtotalCell = worksheet.getCell(`A${currentRow}`);
            subtotalCell.value = `${currentCity} Subtotal`;
            subtotalCell.font = { bold: true };
            subtotalCell.alignment = { horizontal: "center", vertical: "middle" };

            cityTotals.forEach((value, index) => {
                const colIndex = index + 3; // Start from column C (index 3)
                const cell = worksheet.getCell(currentRow, colIndex);

                // Ensure that totals for columns like 'Undeposited Collection' or '20% LGU Share' are included
                if (value > 0) {
                    cell.value = value;
                } else {
                    cell.value = ""; // Ensure empty cells are properly defined
                }

                cell.font = { bold: true };
                cell.alignment = { horizontal: "center", vertical: "middle" };

                // Apply borders to each subtotal cell
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };

                // Accumulate grand total
                grandTotals[index] = (grandTotals[index] || 0) + value;
            });

            // Ensure columns 22 and 23 (V and W) are merged after all cells are set
            worksheet.mergeCells(`V${currentRow}:W${currentRow}`); // Merge columns V (22) and W (23)
            currentRow++; // Move to the next row
        }

        // Add Grand Total row directly
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const grandTotalCell = worksheet.getCell(`A${currentRow}`);
        grandTotalCell.value = "Grand Total";
        grandTotalCell.font = { bold: true, size: 14 };
        grandTotalCell.alignment = { horizontal: "center", vertical: "middle" };

        grandTotals.forEach((total, index) => {
            const colIndex = index + 3; // Start from column C (index 3)
            const cell = worksheet.getCell(currentRow, colIndex);

            if (total > 0) {
                cell.value = total;
                cell.font = { bold: true, size: 14 };
                cell.alignment = { horizontal: "center", vertical: "middle" };

                // Apply borders to each grand total cell
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            } else {
                // Ensure that columns with no values show empty cells
                const cell = worksheet.getCell(currentRow, colIndex);
                cell.value = ""; // Set empty value for missing totals (like Undeposited Collection)
            }
        });

        // Merge columns 22 and 23 in the Grand Total row once
        worksheet.mergeCells(`V${currentRow}:W${currentRow}`); // Merge columns V (22) and W (23)

        // Minimal formatting for rows after row 16
        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex > 16) {
                row.eachCell((cell) => {
                    // Apply basic borders
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };

                    // Apply font and alignment
                    cell.font = { name: "Arial", size: 7, }; // Standard size
                    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
                });
            }
        });


        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex > 16 && rowIndex < 20) {
                row.eachCell((cell) => {
                    // Apply basic borders
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };

                    // Apply font and alignment
                    cell.font = { name: "Arial", size: 7, bold: true }; // Standard size
                    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
                });
            }
        });





        // Add the logo to the worksheet at a specific position
        const totalColumns = 23; // Total number of columns in your worksheet
        const imageWidth = 650; // Width of the image in pixels
        const cellWidth = 75; // Average column width in pixels (adjust based on your worksheet settings)

        const imageWidthInColumns = imageWidth / cellWidth; // Convert image width to columns
        const initialCenterColumn = (totalColumns - imageWidthInColumns) / 2;
        const leftAdjustedColumn = initialCenterColumn - 2; // Shift further left by 1 column

        worksheet.addImage(logoId, {
            tl: { col: Math.max(0, leftAdjustedColumn), row: 0 }, // Shifted column, ensuring no negative value
            ext: { width: 650, height: 150 }, // Adjusted width and height for the image
            positioning: {
                type: 'absolute', // Positioning type
                moveWithCells: true, // Move with cells
                size: true // Resize with cells
            }
        });



        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Firestation Report ${monthName}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    };



    return (
        <Fragment>
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li aria-current="page">
                        <div class="flex items-center">
                            <div class="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 ">
                                <PiStackFill className="mr-2"></PiStackFill>
                                Collections & Deposits
                            </div>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="flex flex-col space-y-6 w-full mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Fire Station Reports
                    </h1>
                    <div class="flex space-x-4">
                        <SearchBar
                            placeholder="Search Firestation"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            listSource={filteredUsersData}
                        />

                        {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}
                        {/* Export Dropdown */}
                        <Dropdown
                            label={
                                <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                                    <BiExport className="mr-2 text-[15px] font-bold" />
                                    <span className="mr-2 font-medium">Export</span>
                                    <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                                </div>
                            }
                            dismissOnClick={false}
                            inline={true}
                            arrowIcon={false} // Disabled default arrow icon
                            className=" w-70 text-gray-900 bg-white border border-gray-200 rounded-lg  focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                        >
                            <h6 className=" text-sm font-medium text-gray-700 dark:text-white p-1 text-center">
                                Export by Date
                            </h6>
                            <hr className="border-t bordergray-50 my-1" />

                            <div className="px-3 py-1 flex flex-row justify-between">
                                <div className='px-3 py-1'>
                                    <DatePicker
                                        selected={startExportDate}
                                        onChange={(date) => setStartExportDate(date)}
                                        placeholderText="Start Date"
                                        dateFormat="yyyy-MM-dd"
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                                    />
                                </div>
                                <div className='px-3 py-1'>
                                    <DatePicker
                                        selected={endExportDate}
                                        onChange={(date) => setEndExportDate(date)}
                                        placeholderText="End Date"
                                        dateFormat="yyyy-MM-dd"
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                                    />
                                </div>

                                <div className='px-3 py-1'>
                                    <ExportButton
                                        label="EXPORT"
                                        onClick={exportToExcel}
                                    />
                                </div>
                            </div>
                        </Dropdown>

                    </div>
                </div>
            </div>











            <hr className="border-t border-[#7694D4] my-2 mb-4" />



            <div className="flex flex-row">
                <div className="grow bg-white">
                    <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                        <div className="w-full overflow-y-scroll h-[calc(96vh-160px)]">
                            <table className="w-full text-left text-black-700 ">
                                <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 w-[140px]">Province</th>
                                        <th scope="col" className="px-6 py-4 w-[120px]">Firestation</th>
                                        <th scope="col" className="px-6 py-4 w-[170px]">Location</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Total Collections</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Total Deposits</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Submission Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(filteredGroupedData).map(([province, collections]) => (
                                        <Fragment key={province}>
                                            <tr
                                                className=" text-[14px] bg-gray-100 h-8 border-b  w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                                onClick={() => toggleProvince(province)}
                                            >
                                                <td className=" table-cell px-6 py-2 w-[120px] text-[14px] h-8 px-2">
                                                    {province}

                                                    {toggledRows[province] ? (
                                                        <MdKeyboardArrowDown size={20} style={{ display: "inline" }} />
                                                    ) : (
                                                        <MdKeyboardArrowRight size={20} style={{ display: "inline" }} />
                                                    )}

                                                </td>
                                                <td className=" table-cell px-6 py-2 w-[120px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>

                                            </tr>

                                            {toggledRows[province] && collections.map((collection) => (
                                                <tr
                                                    key={collection.id}
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer h-8"
                                                    onClick={() => navigate(`/main/reports/overview/${collection.id}`)}
                                                >
                                                    <td className="text-[14px] px-6 py-2 w-[120px]"></td>
                                                    <td className="text-[14px] px-6 py-2 w-[120px]">
                                                        {collection.username}
                                                    </td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]">
                                                        {collection.province + ', ' + collection.municipalityCity}
                                                    </td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]"></td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]"></td>

                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
