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

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Firestation Reports");

        worksheet.pageSetup = {
            orientation: 'landscape',
            fitToPage: true, // Ensure content fits within one page
            fitToWidth: 1,
            fitToHeight: 0,
        };

        const startDate = new Date(startExportDate);
        const endDate = new Date(endExportDate);

        // Get the month name
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        const monthName2 = endDate.toLocaleString('default', { month: 'long' });

        // Merge and format the main title
        worksheet.mergeCells("A2:W2");
        worksheet.getCell("A2").value = "SUMMARY OF COLLECTIONS AND DEPOSITS";
        worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getCell("A2").font = { bold: true, size: 14 };
        worksheet.getCell("A2").border = { top: null, left: null, bottom: null, right: null };

        // Merge and format the subtitle
        worksheet.mergeCells("A3:W3");
        worksheet.getCell("A3").value = `As of ${monthName} ${startDate.getFullYear()}`;
        worksheet.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getCell("A3").font = { bold: true };
        worksheet.getCell("A3").border = { top: null, left: null, bottom: null, right: null };

        // Define headers
        worksheet.getRow(5).values = [
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

        worksheet.mergeCells('C5:M5'); // Merge ACCOUNT CODE range
        worksheet.mergeCells('N5:R5'); // Merge CURRENT YEAR header
        worksheet.mergeCells('S5:U5');


        // Subheaders for "NATURE OF COLLECTION DATA"
        worksheet.getRow(6).values = [
            "", "",
            "628 - BFP-01", "628 - BFP-02", "628 - BFP-03",
            "628 - BFP-04", "628 - BFP-05", "628 - BFP-06",
            "628 - BFP-07", "628 - BFP-08", "628 - BFP-09",
            "628 - BFP-10", "628 - BFP-11",
            "Total Collections", "20% LGU Share", "Total Last Report", "Total Deposits", "Undeposited Collection",
            "Total Collections", "Total Deposits", "Undeposited Collection", "", "",
        ];

        // Apply header styles
        [6].forEach((rowIndex) => {
            worksheet.getRow(rowIndex).font = { name: "Arial", size: 7 };
            worksheet.getRow(rowIndex).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });
        [5].forEach((rowIndex) => {
            worksheet.getRow(rowIndex).font = { bold: true, name: "Arial", size: 7 };
            worksheet.getRow(rowIndex).alignment = { horizontal: "center", vertical: "middle" };
        });
        worksheet.getRow(6).height = 20; // Adjust to desired height

        worksheet.mergeCells('A5:A6'); // Merge CITY / MUNICIPALITY
        worksheet.getCell('A5').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('A5').font = { bold: true, name: "Arial", size: 7 };
        ['A5', 'A6'].forEach((cell) => {
            worksheet.getCell(cell).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });


        worksheet.mergeCells('B5:B6'); // Merge COLLECTING OFFICER
        worksheet.getCell('B5').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('B5').font = { bold: true, name: "Arial", size: 7 };
        ['B5', 'B6'].forEach((cell) => {
            worksheet.getCell(cell).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        worksheet.mergeCells('V5:W6'); // Merge TOTAL UNDEPOSITED
        worksheet.getCell('V5').alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell('V5').value = "TOTAL UNDEPOSITED";
        worksheet.getCell('V5').font = { bold: true, name: "Arial", size: 7 };
        ['V5', 'W6'].forEach((cell) => {
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
                state: 'frozen',
                xSplit: 0, // No horizontal freeze
                ySplit: 6, // Freeze row 5 (just below your headers)
                topLeftCell: 'A7', // The first cell visible after freeze
                activeCell: 'A7', // The cell that is active when the worksheet is opened
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

        let currentRow = 7; // Start adding data from row 8
        let currentCity = ''; // To keep track of the current city


        // Create a map to store all reports for each officer (as an array)
        const officerReportsMap = {};

        filteredData.forEach((data) => {
            // Check if the current city's name has changed
            if (data.fireStationName !== currentCity) {
                // Insert a blank row with the city name
                worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
                worksheet.getCell(`A${currentRow}`).value = `${data.fireStationName} City`; // City name
                worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
                worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" };

                // Apply borders to the merged row
                worksheet.getCell(`A${currentRow}`).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Increase the row to leave space above
                currentRow++;

                currentCity = data.fireStationName; // Update current city
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

            // Store this report in the map for the current officer
            if (!officerReportsMap[data.collectingOfficer]) {
                officerReportsMap[data.collectingOfficer] = [];
            }

            officerReportsMap[data.collectingOfficer].push({
                dateSubmitted: data.dateSubmitted,
                collectionAmount: totalCollection,
            });

            // Populate "Total Last Report" column (16th column) with the second-to-last report's collection amount
            const officerReports = officerReportsMap[data.collectingOfficer];

            // Check if there are more than 1 report for the officer (second-to-last exists)
            if (officerReports.length > 1) {
                const secondToLastReport = officerReports[officerReports.length - 2]; // Get second-to-last report
                worksheet.getCell(currentRow, 16).value = secondToLastReport.collectionAmount; // Set the value in the "Total Last Report" column
            } else {
                worksheet.getCell(currentRow, 16).value = ""; // If there's no second-to-last report, leave it empty
            }

            // Apply border to the "Total Last Report" column
            worksheet.getCell(currentRow, 16).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            const totalDeposits = depositMap[data.collectingOfficer] || null; // Use `null` if no deposits

            // Set the "Total Deposits" column (17th column)
            worksheet.getCell(currentRow, 17).value = totalDeposits;
            worksheet.getCell(currentRow, 17).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

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

            currentRow++;
        });

        // Apply styles to all data rows
        worksheet.eachRow((row, rowIndex) => {
            row.eachCell((cell) => {
                // Apply borders
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };

                // Apply font and alignment
                if (rowIndex > 6) {
                    cell.font = { name: "Arial", size: 7 };
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Firestation Report ${monthName} to ${monthName2}.xlsx`;
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
                        {/* Buttons and Dropdowns */}
                        <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">

                            {/* Filter Dropdown */}
                            <Dropdown
                                label={
                                    <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                                        <CiFilter className="w-5 h-5 mr-2" aria-hidden="true" />
                                        <span className="mr-2 font-medium">Filter</span>
                                        <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                                    </div>
                                }
                                dismissOnClick={false}
                                inline={true}
                                arrowIcon={false} // Disabled default arrow icon
                                className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto  hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            >


                                <div className="p-7 w-56">
                                    <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white ">
                                        Province
                                    </h6>
                                    <ul className="space-y-2 text-sm ">

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="year"
                                                label="Year"
                                            // checked={selectedCategory === "year"}
                                            // onChange={handleYearChange} // Toggle year
                                            />
                                            <span className="ml-2">All</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="year"
                                                label="Year"
                                            // checked={selectedCategory === "year"}
                                            // onChange={handleYearChange} // Toggle year
                                            />
                                            <span className="ml-2">Agusan del Norte</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="month"
                                                label="Month"
                                            // checked={selectedCategory === "month"}
                                            // onChange={handleMonthChange} // Toggle month
                                            />
                                            <span className="ml-2">Agusan del Sur</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Dinagat Islands</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Surigao del Norte</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Surigao del Sur</span>
                                        </li>
                                    </ul>
                                </div>
                                {/* New Section for Deposit Filter */}
                                <div className="px-7 py-2 w-40">
                                    <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                                        Period
                                    </h6>
                                    <ul className="space-y-2 text-sm">
                                        {years.map((year) => (
                                            <li key={year} className="flex items-center hover:bg-gray-100 p-1">
                                                <Checkbox
                                                    id={`year-${year}`}
                                                    label="Year"
                                                />
                                                <span className="ml-2">{year}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>


                            </Dropdown>
                        </div>

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
