import React, { Fragment, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../../config/firebase-config";
import { Timestamp } from "firebase/firestore";
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { PiStack, PiStackFill } from "react-icons/pi";
import ExportButton from "../../../../components/exportButton";
import SearchBar from "../../../../components/searchBar";
import { CiFilter } from "react-icons/ci";

export default function DepositsPerStation() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [isSortedAsc, setIsSortedAsc] = useState(true);
    const handleSortClick = () => {
        setIsSortedAsc(!isSortedAsc);
        // Add sorting logic here
    };

    const [firestationUsername, setFirestationUsername] = useState('');

    useEffect(() => {
        const currentUserRef = doc(db, 'submittedReportsDeposits', userId);

        const fetchUserData = async () => {
            const docSnap = await getDoc(currentUserRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                setFirestationUsername(userData.username || '');
            } else {
                console.log('No such document!');
            }
        };

        fetchUserData();
    }, [userId]);

    //From firestations Code -------------------------------------------------------------------------------------------------------------------------


    //FOR FILTERS -------------------------------------------------------------------------------------------
    // State to track selected category
    const [selectedCategory, setSelectedCategory] = useState('month');

    // Handlers for toggling the checkboxes
    const handleYearChange = () => {
        setSelectedCategory((prev) => (prev === "year" ? null : "year"));
    };

    const handleMonthChange = () => {
        setSelectedCategory((prev) => (prev === "month" ? null : "month"));
    };
    const handleDayChange = () => {
        setSelectedCategory((prev) => (prev === "day" ? null : "day"));
    };
    //FOR FILTERS -------------------------------------------------------------------------------------------

    //Modal
    const [showModal, setShowModal] = useState(false);

    // Define state for firestation deposits
    const [logUserID, setlogUserID] = useState(null);  // Set initial value to null
    const [firestationdeposit, setFirestationdeposit] = useState([]);

    useEffect(() => {
        // Setup listener for the submitted data
        const submitteddepositRef = collection(db, 'submittedReportsDeposits');
        const unsubscribeSubmitteddeposits = onSnapshot(submitteddepositRef, (snapshot) => {
            const submittedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Find the current user in the submitted data by matching their email
                    const currentUser = submittedData.find((doc) => doc.email === user.email);
                    setlogUserID(userId);

                } else {
                    console.log('No user is currently logged in');
                }
            });
        });

        // Return the unsubscribe function to clean up the listener on unmount
        return () => {
            unsubscribeSubmitteddeposits();
        };
    }, []);  // Only runs once on mount

    useEffect(() => {
        // Only run the listener if logUserID is set (i.e., user is found)
        if (logUserID) {
            // Reference the deposits subdeposit
            const submittedSubdepositsDataRef = collection(db, 'submittedReportsDeposits', logUserID, 'deposits');

            // Listener for the deposits subdeposits
            const unsubscribeSubmitteddepositsDataRef = onSnapshot(submittedSubdepositsDataRef, (snapshot) => {
                const submitteddepositsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // console.log(submitteddepositsList);
                setFirestationdeposit(submitteddepositsList);
            });

            // Clean up the listener when the component unmounts or when logUserID changes
            return () => {
                unsubscribeSubmitteddepositsDataRef();
            };
        }
    }, [logUserID]);  // This effect runs only when logUserID changes

    // Convert Firestore Timestamp to JavaScript Date
    const formatTimestamp = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return null;  // Check if timestamp is valid
        return new Date(timestamp.seconds * 1000);  // Convert Firestore Timestamp to JS Date
    };

    // For groupings and Toggle of view
    const groupByDate = (deposits, selectedCategory) => {
        // First, sort the deposits by date_submitted
        const sorteddeposits = deposits.sort((a, b) => {
            const dateA = a.date_submitted ? a.date_submitted.toDate() : new Date(0); // Fallback to epoch if date_submitted is missing
            const dateB = b.date_submitted ? b.date_submitted.toDate() : new Date(0);
            return dateA - dateB; // Ascending order (use dateB - dateA for descending)
        });

        return sorteddeposits.reduce((grouped, deposit) => {
            const date_submitted = deposit.date_submitted ? formatTimestamp(deposit.date_submitted) : null;
            let groupKey;

            if (date_submitted) {
                if (selectedCategory === 'month') {
                    // Format as "Month Year", e.g. "January 2024"
                    groupKey = date_submitted.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                } else if (selectedCategory === 'year') {
                    // Format as "Year", e.g. "2024"
                    groupKey = date_submitted.toLocaleDateString('en-US', { year: 'numeric' });
                } else {
                    // Format as "Month Day, Year", e.g. "January 7, 2024"
                    groupKey = date_submitted.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
            } else {
                groupKey = "N/A";
            }

            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }
            grouped[groupKey].push(deposit);
            return grouped;
        }, {});
    };

    // Usage
    const [groupedDeposits, setGroupedDeposits] = useState({});
    useEffect(() => {
        // Call the groupByDate function whenever firestationdeposit or selectedCategory changes
        const updatedGroupedDeposits = groupByDate(firestationdeposit, selectedCategory);

        // Update the state with the new grouped deposits
        setGroupedDeposits(updatedGroupedDeposits);

    }, [firestationdeposit, selectedCategory]);



    // State to manage which groups are expanded/collapsed
    const [expandedGroups, setExpandedGroups] = useState({});

    // Toggle function to expand/collapse groups
    const toggleGroup = (date) => {
        setExpandedGroups((prevExpandedGroups) => ({
            ...prevExpandedGroups,
            [date]: !prevExpandedGroups[date],
        }));
    };


    // For SEARCH ---------------------------------------------------------------------------------------------
    const [searchQuery, setSearchQuery] = useState(''); // Search input state
    const [filteredGroupedDeposits, setFilteredGroupedDeposits] = useState(groupedDeposits); // Filtered grouped deposits

    // Function to filter the grouped deposits based on search query
    const filterGroupedDeposits = (groupedDeposits, searchQuery) => {
        const filteredGroups = {};

        Object.keys(groupedDeposits).forEach((groupKey) => {
            const deposits = groupedDeposits[groupKey];

            // Filter deposits based on the search query
            const filteredRows = deposits.filter((deposit) => {
                const depositorName = deposit.nameofDepositor?.toLowerCase() || ''; // Use nameofDepositor
                return depositorName.includes(searchQuery.toLowerCase());
            });

            if (filteredRows.length > 0) {
                filteredGroups[groupKey] = filteredRows;
            }
        });

        return filteredGroups;
    };

    // Update filteredGroupedDeposits when searchQuery or groupedDeposits change
    useEffect(() => {
        const filtered = filterGroupedDeposits(groupedDeposits, searchQuery);
        setFilteredGroupedDeposits(filtered);
    }, [searchQuery, groupedDeposits, selectedCategory]); // Remove selectedDepositFilter from the dependencies
    // For SEARCH ---------------------------------------------------------------------------------------------

    //From firestations Code -------------------------------------------------------------------------------------------------------------------------



    return (
        <Fragment>
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li class="inline-flex items-center">
                        <button onClick={() => navigate("/main/reports/firestationReports")} class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <PiStackFill className="mr-2"></PiStackFill>
                            Collections & Deposits
                        </button>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{firestationUsername}</span>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Deposits</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="px-2">
                <div className="bg-white h-30 px-2 rounded-lg">
                    <div className="flex flex-col space-y-6 w-full px-4 pt-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-semibold text-gray-800">
                                {firestationUsername}
                            </h1>
                        </div>
                    </div>
                    {/* Unsubmitted and Submitted */}
                    <div className="mb-4 border-b border-gray-200 dark:border-gray-700 px-2 py-2">
                        <ul
                            className="flex flex-wrap -mb-px text-sm font-medium text-center"
                            id="default-styled-tab"
                            role="tablist"
                        >
                            <li className="me-2" role="presentation">
                                <button
                                    onClick={() => navigate(`/main/reports/overview/${userId}`)}
                                    className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
                                    id="profile-styled-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="profile"
                                    aria-selected="false"
                                >
                                    Overview
                                </button>
                            </li>
                            <li className="me-2" role="presentation">
                                <button
                                    onClick={() => navigate(`/main/reports/collections/${userId}`)}
                                    className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
                                    id="profile-styled-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="profile"
                                    aria-selected="false"
                                >
                                    Collections
                                </button>
                            </li>
                            <li className="me-2" role="presentation">
                                <button
                                    onClick={() => navigate(`/main/reports/deposits/${userId}`)}
                                    className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
                                    id="dashboard-styled-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="dashboard"
                                    aria-selected="false"
                                >
                                    Deposits
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            {/* Table Header */}

            <div className="flex flex-col items-center justify-between  space-y-3 md:flex-row md:space-y-0 md:space-x-4 absolute top-28 right-10">
                {/* Search Form */}
                <SearchBar
                    placeholder="Search Depositor"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />


                {/* Buttons and Dropdowns */}
                <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">

                    {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}
                    {/* Filter Dropdown */}
                    <Dropdown
                        label={
                            <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                                <CiFilter className="w-5 h-5 mr-2" aria-hidden="true" />
                                <span className="mr-2 font-medium">Group by</span>
                                <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                            </div>
                        }
                        dismissOnClick={false}
                        inline={true}
                        arrowIcon={false} // Disabled default arrow icon
                        className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto  hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >


                        <div className="p-3 w-40">
                            <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white ">
                                Category
                            </h6>
                            <ul className="space-y-2 text-sm ">
                                <li className="flex items-center hover:bg-gray-100 p-1">
                                    <Checkbox
                                        id="year"
                                        label="Year"
                                        checked={selectedCategory === "year"}
                                        onChange={handleYearChange} // Toggle year
                                    />
                                    <span className="ml-2">Year</span>
                                </li>
                                <li className="flex items-center hover:bg-gray-100 p-1">
                                    <Checkbox
                                        id="month"
                                        label="Month"
                                        checked={selectedCategory === "month"}
                                        onChange={handleMonthChange} // Toggle month
                                    />
                                    <span className="ml-2">Month</span>
                                </li>
                                <li className="flex items-center hover:bg-gray-100 p-1">
                                    <Checkbox
                                        id="day"
                                        label="day"
                                        checked={selectedCategory === "day"}
                                        onChange={handleDayChange} // Toggle month
                                    />
                                    <span className="ml-2">Day</span>
                                </li>
                            </ul>
                        </div>
                        {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}

                    </Dropdown>

                </div>
            </div>

            <div className="px-2">
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg ">

                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
                        <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky" style={{ zIndex: 1 }}>
                            <tr className="text-[12px]">
                                <th scope="col" className="px-2 py-4 w-40">Date Submitted</th>
                                <th scope="col" className="px-1 py-4 w-40">Collecting Agent</th>
                                <th scope="col" className="px-1 py-4 w-36">Date Collected</th>
                                <th scope="col" className="px-1 py-4 w-36">Date Deposited</th>
                                <th scope="col" className="px-1 py-4 w-36">OR Number</th>
                                <th scope="col" className="px-1 py-4 w-36">LC Number</th>
                                <th scope="col" className="px-1 py-4 w-36">Particulars</th>
                                <th scope="col" className="px-1 py-4 w-36">Depositor</th>
                                <th scope="col" className="px-1 py-4 w-36">Amount</th>
                                <th scope="col" className="w-4"></th>
                            </tr>
                        </thead>
                    </table>

                    <div className="w-full overflow-y-auto max-h-[calc(96vh-240px)]">
                        <table className="w-full overflow-x-visible">
                            <tbody>
                                {/* Iterate over grouped deposits by date_submitted date */}
                                {Object.keys(filteredGroupedDeposits).map((date) => {
                                    // Calculate the total amount for each date group
                                    const totalAmount = filteredGroupedDeposits[date].reduce(
                                        (sum, deposit) => sum + parseFloat(deposit.depositAmount || 0),
                                        0
                                    );

                                    return (
                                        <React.Fragment key={date}>
                                            {/* Render clickable header row for the date */}
                                            <tr
                                                className="text-[12px] bg-blue-100 h-8 border-b w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                                onClick={() => toggleGroup(date)}
                                            >
                                                <td className="table-cell px-2 py-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300 relative">
                                                    {date}
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                        {expandedGroups[date] ? (
                                                            <MdKeyboardArrowDown size={20} style={{ display: 'inline' }} />
                                                        ) : (
                                                            <MdKeyboardArrowRight size={20} style={{ display: 'inline' }} />
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Empty cells for alignment */}
                                                <td className="table-cell px-2 py-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                                                <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                                                    {/* Display the total amount */}
                                                    {totalAmount.toFixed(2)}
                                                </td>
                                            </tr>

                                            {/* Conditionally render rows under the current date header */}
                                            {expandedGroups[date] &&
                                                filteredGroupedDeposits[date].map((deposit) => {
                                                    const submittedDate = deposit.date_submitted?.toDate();
                                                    let formattedDate;

                                                    if (selectedCategory === 'year') {
                                                        formattedDate = submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                                                    } else if (selectedCategory === 'month') {
                                                        formattedDate = submittedDate.toLocaleDateString('en-US', { day: 'numeric' });
                                                    } else {
                                                        formattedDate = '';
                                                    }

                                                    return (
                                                        <tr
                                                            key={deposit.id}
                                                            className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                                                        >
                                                            <td className="table-cell px-2 py-2 w-40 text-[12px] pl-10">{formattedDate}</td>
                                                            <td className="table-cell px-2 py-2 w-40 text-[12px]">{deposit.collectingAgent}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.dateCollected}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.dateDeposited}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.orNumber}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.lcNumber}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.particulars}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.nameofDepositor}</td>
                                                            <td className="table-cell px-2 py-2 w-36 text-[12px]">{deposit.depositAmount}</td>
                                                        </tr>
                                                    );
                                                })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                </div>
            </div>

        </Fragment>
    );
}
