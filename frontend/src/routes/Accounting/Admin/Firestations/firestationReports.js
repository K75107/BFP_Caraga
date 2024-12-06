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
    const [usersData2, setUsersData2] = useState([]);
    const [toggledRows, setToggledRows] = useState({}); // State to manage toggled provinces

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsersData, setFilteredUsersData] = useState([]); // New state for filtered data

    const [filteredGroupedData, setFilteredGroupedData] = useState([]);

    const [firestationData, setFirestationData] = useState([]);
    const [groupedDataByProvince, setGroupedDataByProvince] = useState({});
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
        const fetchFirestationData = async () => {
            try {
                const firestationsRef = collection(db, "firestationReportsCollection");
                const firestationsSnapshot = await getDocs(firestationsRef);
                const data = firestationsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Update state with fetched data
                setFirestationData(data);

                // Group data by province
                const groupedData = data.reduce((acc, item) => {
                    const { province } = item;
                    if (!acc[province]) acc[province] = [];
                    acc[province].push(item);
                    return acc;
                }, {});

                setGroupedDataByProvince(groupedData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchFirestationData();
    }, []);

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
                    `submittedReportsDeposits/${doc.id}/deposits`
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
    const getTotalCollections = (fireStationName) => {
        return reportsData
            .filter(report => report.fireStationName === fireStationName)
            .reduce((total, report) => total + parseFloat(report.collectionAmount || 0), 0);
    };

    const getTotalDeposits = (fireStationName) => {
        return reportsData2
            .filter(report => report.fireStationName === fireStationName)
            .reduce((total, report) => total + parseFloat(report.depositAmount || 0), 0);
    };


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

        const fireStationAggregateMap = {};

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

        
        filteredData.sort((a, b) => {
            if (a.provinceName !== b.provinceName) {
                return a.province.localeCompare(b.province);
            }
            if (a.fireStationName !== b.fireStationName) {
                return a.fireStationName.localeCompare(b.fireStationName);
            }
            return a.collectingOfficer.localeCompare(b.collectingOfficer);
        });

        filteredData2.sort((a, b) => {
            if (a.provinceName !== b.provinceName) {
                return a.province.localeCompare(b.province);
            }
            if (a.fireStationName !== b.fireStationName) {
                return a.fireStationName.localeCompare(b.fireStationName);
            }
            return a.collectingAgent.localeCompare(b.collectingAgent);
        });

        const currentYear = new Date().getFullYear();
        // Process collections data
        filteredData.forEach((data) => {
            const stationKey = data.fireStationName || "Unknown Station";


            if (!fireStationAggregateMap[stationKey]) {
                fireStationAggregateMap[stationKey] = {
                    fireStationName: stationKey,
                    collections: Array(validAccountCodes.length).fill(0),
                    totalCollections: 0,
                    totalDeposits: 0,
                    priorYearCollections: 0,
                    priorYearDeposits: 0,
                    totalUndepositedCollection: 0,
                    priorYearUndepositedCollection: 0,
                    latestOfficer: "", // To store the latest officer
                    latestDate: new Date(0), // Initialize to earliest possible date
                };
            }

            const dateCollected = new Date(data.dateCollected);
            if (dateCollected > fireStationAggregateMap[stationKey].latestDate) {
                fireStationAggregateMap[stationKey].latestDate = dateCollected;
                fireStationAggregateMap[stationKey].latestOfficer = data.collectingOfficer;
            }

            const accountCode = data.natureOfCollection.split(" | ")[0];
            const collectionAmount = parseFloat(data.collectionAmount) || 0;

            if (validAccountCodes.includes(accountCode)) {
                const index = validAccountCodes.indexOf(accountCode);
                fireStationAggregateMap[stationKey].collections[index] += collectionAmount;
            }

            fireStationAggregateMap[stationKey].totalCollections += collectionAmount;

            if (!data.depositStatus) {
                fireStationAggregateMap[stationKey].totalUndepositedCollection += collectionAmount;
            }

            if (dateCollected.getFullYear() === currentYear - 1) {
                fireStationAggregateMap[stationKey].priorYearCollections += collectionAmount;
                if (!data.depositStatus) {
                    fireStationAggregateMap[stationKey].priorYearUndepositedCollection += collectionAmount;
                }
            }
        });

        // Process deposits data
        filteredData2.forEach((data) => {
            const stationKey = data.fireStationName || "Unknown Station";


            if (!fireStationAggregateMap[stationKey]) {
                fireStationAggregateMap[stationKey] = {
                    fireStationName: stationKey,
                    collections: Array(validAccountCodes.length).fill(0),
                    totalCollections: 0,
                    totalDeposits: 0,
                    priorYearCollections: 0,
                    priorYearDeposits: 0,
                    totalUndepositedCollection: 0,
                    priorYearUndepositedCollection: 0,
                    latestOfficer: "", // To store the latest officer/agent
                    latestDate: new Date(0), // Initialize to earliest possible date
                };
            }

            const dateDeposited = new Date(data.dateDeposited);
            if (dateDeposited > fireStationAggregateMap[stationKey].latestDate) {
                fireStationAggregateMap[stationKey].latestDate = dateDeposited;
                fireStationAggregateMap[stationKey].latestOfficer = data.collectingAgent;
            }

            const depositAmount = parseFloat(data.depositAmount) || 0;

            fireStationAggregateMap[stationKey].totalDeposits += depositAmount;

            if (dateDeposited.getFullYear() === currentYear - 1) {
                fireStationAggregateMap[stationKey].priorYearDeposits += depositAmount;
            }
        });

        // Filtering and sorting Caraga data
        const caragaAggregatedData = Object.values(fireStationAggregateMap)
        .sort((a, b) => a.fireStationName.localeCompare(b.fireStationName));

        let currentRow = 21; // Start from row 21 as in your original code
        let currentProvince = ""; // To track the previous city
        let citySubtotal = Array(21).fill(0); // Array to store subtotals for relevant columns (adjust based on your columns)

        // Iterate through officer data
        caragaAggregatedData.forEach((stationData) => {



            // Populate fire station data for the current province
            worksheet.getCell(currentRow, 1).value = stationData.fireStationName;
            worksheet.getCell(currentRow, 2).value = stationData.latestOfficer || "Unknown Officer"; // Use the latest officer


            // Populate collection data in columns
            stationData.collections.forEach((amount, index) => {
                const colIndex = 4 + index; // Adjust index to match columns
                worksheet.getCell(currentRow, colIndex).value = amount > 0 ? amount : "";
            });

            // Populate columns with consolidated amounts
            stationData.collections.forEach((amount, index) => {
                const colIndex = 3 + index; // Columns 3–13
                worksheet.getCell(currentRow, colIndex).value = amount > 0 ? amount : "";
                worksheet.getCell(currentRow, colIndex).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
                citySubtotal[colIndex] += amount;
            });

            // Populate the rest of the columns for officer data (as in your original logic)
            worksheet.getCell(currentRow, 14).value = stationData.totalCollections;
            worksheet.getCell(currentRow, 14).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[14] += stationData.totalCollections;

            const twentyPercent = stationData.totalCollections * 0.2;
            worksheet.getCell(currentRow, 15).value = twentyPercent > 0 ? twentyPercent : ""; // Leave blank if 0
            worksheet.getCell(currentRow, 15).numFmt = "0.00"; // Format as decimal
            worksheet.getCell(currentRow, 15).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[15] += stationData.totalCollections * 0.2;
            worksheet.getCell(currentRow, 16).value = ""; // Set it to empty
            citySubtotal[16] += "-";
            worksheet.getCell(currentRow, 17).value = stationData.totalDeposits;
            worksheet.getCell(currentRow, 17).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[17] += stationData.totalDeposits;
            worksheet.getCell(currentRow, 18).value = stationData.totalundepositedCollection;
            worksheet.getCell(currentRow, 18).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[18] += stationData.totalundepositedCollection;
            worksheet.getCell(currentRow, 19).value = stationData.priorYearCollections;
            worksheet.getCell(currentRow, 19).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[19] += stationData.priorYearCollections;
            worksheet.getCell(currentRow, 20).value = stationData.priorYearDeposits;
            worksheet.getCell(currentRow, 20).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[20] += stationData.priorYearDeposits;
            worksheet.getCell(currentRow, 21).value = stationData.priorYearUndepositedCollection;
            worksheet.getCell(currentRow, 21).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            citySubtotal[21] += stationData.priorYearUndepositedCollection;


            worksheet.getCell(currentRow, 22).value = stationData.priorYearUndepositedCollection + stationData.totalundepositedCollection;

            // Merge columns 22 and 23 (adjust as per your needs)
            worksheet.mergeCells(`V${currentRow}:W${currentRow}`);

            // Apply the borders for the merged cells
            worksheet.getCell(currentRow, 22).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            // Apply borders to all cells in this row, even if empty
            for (let colIndex = 3; colIndex <= 23; colIndex++) {
                const cell = worksheet.getCell(currentRow, colIndex);
                if (!cell.value) cell.value = ""; // Ensure blank cells are defined
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            }

            // Move to the next row for the next officer
            currentRow++;
        });

        // Add an empty row after the last data row
        worksheet.getRow(currentRow).values = [];
        worksheet.getRow(currentRow).eachCell((cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            currentRow++;
        });

        currentRow++;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = "Grand Total";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" };
        worksheet.mergeCells(`V${currentRow}:W${currentRow}`);
        worksheet.getCell(`V${currentRow}`).alignment = { horizontal: "center" };

        // Populate Subtotal row for columns 3–23
        for (let colIndex = 3; colIndex <= 23; colIndex++) {
            const subtotalCell = worksheet.getCell(currentRow, colIndex);
            const formula = `SUM(${String.fromCharCode(64 + colIndex)}21:${String.fromCharCode(64 + colIndex)}${currentRow - 1})`;

            // Set formula to calculate subtotal
            subtotalCell.value = { formula };

            // Apply conditional formula to display dash if result is 0, else show the sum
            subtotalCell.value = {
                formula: `IF(${formula}=0, "-", ${formula})`, // Formula to check if sum is 0 and display "-"
            };

            subtotalCell.font = { bold: true };
            subtotalCell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        }

        // Set row height
        worksheet.getRow(currentRow).height = 15;

        // Move to the next row after populating all columns for the subtotal
        currentRow++; // Increment `currentRow` after processing all columns for the subtotal


        worksheet.addRow([]);
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

        console.log("Fire Station Aggregate Map:", fireStationAggregateMap);
        console.log("Filtered Data:", filteredData);
        console.log("Filtered Data 2:", filteredData2);



        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Consolidated Reports ${monthName}.xlsx`;
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
                                                    <td className="text-[14px] px-6 py-2 w-[150px]">₱{getTotalCollections(collection.username).toLocaleString()}</td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]">₱{getTotalDeposits(collection.username).toLocaleString()}</td>
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
