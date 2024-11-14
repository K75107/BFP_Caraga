import React, { Fragment, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../../config/firebase-config";
import { Timestamp } from "firebase/firestore";
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { PiStack, PiStackFill } from "react-icons/pi";
import { CiFilter } from "react-icons/ci";
import SearchBar from "../../../../components/searchBar";

export default function CollectionsPerStation() {
    const { userId } = useParams();

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

    const handleNatureOfCollection = () => {
        setSelectedCategory('natureOfCollection');
    }
    //FOR FILTERS -------------------------------------------------------------------------------------------

    //Modal
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    // Define state for firestation collections
    const [logUserID, setlogUserID] = useState(null);  // Set initial value to null
    const [firestationCollection, setFirestationCollection] = useState([]);

    useEffect(() => {
        // Setup listener for the submitted data
        const submittedCollectionRef = collection(db, 'submittedReportsCollections');
        const unsubscribeSubmittedCollections = onSnapshot(submittedCollectionRef, (snapshot) => {
            const submittedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                if (user) {

                    setlogUserID(userId);

                } else {
                    // console.log('No user is currently logged in');
                }
            });
        });

        // Return the unsubscribe function to clean up the listener on unmount
        return () => {
            unsubscribeSubmittedCollections();
        };
    }, []);  // Only runs once on mount

    useEffect(() => {
        // Only run the listener if logUserID is set (i.e., user is found)
        if (logUserID) {
            // Reference the collections subcollection
            const submittedSubCollectionsDataRef = collection(db, 'submittedReportsCollections', logUserID, 'collections');

            // Listener for the collections subcollections
            const unsubscribeSubmittedCollectionsDataRef = onSnapshot(submittedSubCollectionsDataRef, (snapshot) => {
                const submittedCollectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // console.log(submittedCollectionsList);
                setFirestationCollection(submittedCollectionsList);
            });

            // Clean up the listener when the component unmounts or when logUserID changes
            return () => {
                unsubscribeSubmittedCollectionsDataRef();
            };
        }
    }, [logUserID]);  // This effect runs only when logUserID changes

    // Convert Firestore Timestamp to JavaScript Date
    const formatTimestamp = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return null;  // Check if timestamp is valid
        return new Date(timestamp.seconds * 1000);  // Convert Firestore Timestamp to JS Date
    };

    // For groupings and Toggle of view
    const groupByDate = (collections, selectedCategory) => {
        // First, sort the collections by date_submitted
        const sortedCollections = collections.sort((a, b) => {
            const dateA = a.date_submitted ? a.date_submitted.toDate() : new Date(0); // Fallback to epoch if date_submitted is missing
            const dateB = b.date_submitted ? b.date_submitted.toDate() : new Date(0);
            return dateA - dateB; // Ascending order (use dateB - dateA for descending)
        });

        return sortedCollections.reduce((grouped, collection) => {
            const date_submitted = collection.date_submitted ? formatTimestamp(collection.date_submitted) : null;
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
            grouped[groupKey].push(collection);
            return grouped;
        }, {});
    };


    const groupByNatureOfCollections = (collections) => {
        // First, sort the collections by natureOfCollections alphabetically
        const sortedCollections = collections.sort((a, b) => {
            const natureA = a.natureOfCollection ? a.natureOfCollection.toLowerCase() : '';
            const natureB = b.natureOfCollection ? b.natureOfCollection.toLowerCase() : '';
            return natureA.localeCompare(natureB); // Ascending alphabetical order
        });

        return sortedCollections.reduce((grouped, collection) => {
            const natureOfCollection = collection.natureOfCollection;

            // Only proceed if natureOfCollections exists
            if (natureOfCollection) {
                const key = natureOfCollection.toLowerCase(); // Normalize key to lowercase for consistency

                if (!grouped[key]) {
                    grouped[key] = [];
                }

                grouped[key].push(collection);
            }

            return grouped;
        }, {});
    };


    // Usage
    // Declare state for grouped collections and columns
    const [groupedCollections, setGroupedCollections] = useState([]);
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        // Define groupedCollections inside useEffect, keeping the original name
        const groupedCollections = selectedCategory === 'year' || selectedCategory === 'month' || selectedCategory === 'day'
            ? groupByDate(firestationCollection, selectedCategory)
            : groupByNatureOfCollections(firestationCollection);

        setGroupedCollections(groupedCollections); // No renaming, keeping setGroupedCollections
    }, [firestationCollection, selectedCategory]);


    // State to manage which groups are expanded/collapsed
    const [expandedGroups, setExpandedGroups] = useState({});

    // Toggle function to expand/collapse groups
    const toggleGroup = (date) => {
        setExpandedGroups((prevExpandedGroups) => ({
            ...prevExpandedGroups,
            [date]: !prevExpandedGroups[date],
        }));
    };

    useEffect(() => {
        // Define columns based on selectedCategory, keeping the original name
        const columns = selectedCategory === 'natureOfCollection'
            ? [
                { id: 'natureOfCollection', label: 'Nature of Collection', width: '170px' },
                { id: 'dateSubmitted', label: 'Date Submitted', width: '144px' },
                { id: 'collectingOfficer', label: 'Collecting Officer', width: '160px' },
                { id: 'collectingAgent', label: 'Collecting Agent', width: '160px' },
                { id: 'dateCollected', label: 'Date Collected', width: '144px' },
                { id: 'orNumber', label: 'OR Number', width: '128px' },
                { id: 'lcNumber', label: 'LC Number', width: '128px' },
                { id: 'nameOfPayor', label: 'Name of Payor', width: '144px' },
                { id: 'collectionAmount', label: 'Amount', width: '100px' },
                { id: 'depositStatus', label: 'Status', width: '100px' },
            ]
            : [
                { id: 'dateSubmitted', label: 'Date Submitted', width: '144px' },
                { id: 'natureOfCollection', label: 'Nature of Collection', width: '170px' },
                { id: 'collectingOfficer', label: 'Collecting Officer', width: '160px' },
                { id: 'collectingAgent', label: 'Collecting Agent', width: '160px' },
                { id: 'dateCollected', label: 'Date Collected', width: '144px' },
                { id: 'orNumber', label: 'OR Number', width: '128px' },
                { id: 'lcNumber', label: 'LC Number', width: '128px' },
                { id: 'nameOfPayor', label: 'Name of Payor', width: '144px' },
                { id: 'collectionAmount', label: 'Amount', width: '100px' },
                { id: 'depositStatus', label: 'Status', width: '100px' },
            ];

        setColumns(columns); // No renaming, keeping setColumns
    }, [selectedCategory]);


    // For the display of deposited,undeposited and all
    const [selectedDepositFilter, setSelectedDepositFilter] = useState('all'); // Default to 'all'

    // For SEARCH ---------------------------------------------------------------------------------------------
    const [searchQuery, setSearchQuery] = useState(''); // Search input state
    const [filteredGroupedCollections, setFilteredGroupedCollections] = useState(groupedCollections); // Filtered grouped collections

    // Function to filter the grouped collections based on search query
    const filterGroupedCollections = (groupedCollections, searchQuery) => {
        const filteredGroups = {};

        Object.keys(groupedCollections).forEach((groupKey) => {
            const collections = groupedCollections[groupKey];

            // Filter collections based on the selected category and deposit status
            const filteredRows = collections.filter((collection) => {
                const matchesSearchQuery = (collection) => {
                    if (selectedCategory === 'year' || selectedCategory === 'month' || selectedCategory === 'day') {
                        const date = collection.date_submitted?.toDate();
                        if (!date) return false; // Skip if date_submitted is missing

                        let formattedDate;

                        // Format the date based on the selected category
                        if (selectedCategory === 'year') {
                            formattedDate = date.toLocaleDateString('en-US', { year: 'numeric' });
                        } else if (selectedCategory === 'month') {
                            formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        } else if (selectedCategory === 'day') {
                            formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        }

                        return formattedDate && formattedDate.toLowerCase().includes(searchQuery.toLowerCase());
                    } else {
                        // If selectedCategory is 'natureOfCollection', search by natureOfCollection
                        return collection.natureOfCollection?.toLowerCase().includes(searchQuery.toLowerCase());
                    }
                };

                // Filter based on the selected deposit filter
                const matchesDepositFilter = () => {
                    if (selectedDepositFilter === 'all') return true; // Show all entries
                    if (selectedDepositFilter === 'deposited') return collection.depositStatus; // Adjust according to your data
                    if (selectedDepositFilter === 'undeposited') return !collection.depositStatus; // Adjust according to your data
                    return false; // Default case (should not occur)
                };

                return matchesSearchQuery(collection) && matchesDepositFilter();
            });

            if (filteredRows.length > 0) {
                filteredGroups[groupKey] = filteredRows;
            }
        });

        return filteredGroups;
    };

    // Update filteredGroupedCollections when searchQuery or groupedCollections change
    useEffect(() => {
        const filtered = filterGroupedCollections(groupedCollections, searchQuery);
        setFilteredGroupedCollections(filtered);
    }, [searchQuery, groupedCollections, selectedCategory, selectedDepositFilter]); // Make sure to include selectedDepositFilter


    // For SEARCH --------------------------------------------------------------------------------------------
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
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Collections</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="flex flex-col space-y-6 w-full mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {firestationUsername}
                    </h1>
                </div>
            </div>
            {/* Unsubmitted and Submitted */}
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
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
                            className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
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
                            onClick={() => navigate(`/main/reports/deposits/${userId}`)} s
                            className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100 "
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


            <div className="flex flex-col items-center justify-between  space-y-3 md:flex-row md:space-y-0 md:space-x-4 absolute top-32 right-10">
                <SearchBar
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />

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
                        style={{ zIndex: 3 }}
                    >

                        <div className="p-6 w-[170px]" style={{ zIndex: 3 }}>
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
                                        label="Day"
                                        checked={selectedCategory === "day"}
                                        onChange={handleDayChange} // Toggle day
                                    />
                                    <span className="ml-2">Day</span>
                                </li>
                                <li className="flex items-center hover:bg-gray-100 p-1">
                                    <Checkbox
                                        id="natureOfCollection"
                                        label="Nature of Collection"
                                        checked={selectedCategory === "natureOfCollection"}
                                        onChange={handleNatureOfCollection} // Toggle collection
                                    />
                                    <span className="ml-2">Nature of Collection</span>
                                </li>
                            </ul>

                            {/* New Section for Deposit Filter */}
                            <h6 className="mt-4 mb-3 text-sm font-medium text-gray-900 dark:text-white ">
                                Deposit Status
                            </h6>
                            <div className="space-y-2">
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="all"
                                        checked={selectedDepositFilter === 'all'}
                                        onChange={() => setSelectedDepositFilter('all')}
                                        className="mr-2"
                                    />
                                    <span>All</span>
                                </label>
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="deposited"
                                        checked={selectedDepositFilter === 'deposited'}
                                        onChange={() => setSelectedDepositFilter('deposited')}
                                        className="mr-2"
                                    />
                                    <span>Deposited</span>
                                </label>
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="undeposited"
                                        checked={selectedDepositFilter === 'undeposited'}
                                        onChange={() => setSelectedDepositFilter('undeposited')}
                                        className="mr-2"
                                    />
                                    <span>Undeposited</span>
                                </label>
                            </div>
                        </div>

                        {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}

                    </Dropdown>

                </div>
            </div>





            {/* TABLE */}
            <div className="relative overflow-y-scroll shadow-md sm:rounded-lg h-[500px]">
                <table className=" w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky" style={{ zIndex: 1 }}>
                        <tr className="text-[12px] h-10">
                            {columns.map((col) => (
                                <th key={col.id} scope="col" className={`px-2 py-2 w-[${col.width}]`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {Object.keys(filteredGroupedCollections).map((date) => {
                            const totalAmount = filteredGroupedCollections[date].reduce(
                                (sum, collection) => sum + parseFloat(collection.collectionAmount || 0),
                                0
                            );

                            return (
                                <React.Fragment key={date}>
                                    <tr
                                        className="text-[12px] bg-gray-50 h-8 border-b w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                        onClick={() => toggleGroup(date)}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.id}
                                                className={`table-cell px-2 py-2 w-[${col.width}] text-[12px] font-semibold text-gray-700 dark:text-gray-300 relative`}
                                            >
                                                {selectedCategory === 'natureOfCollection' && col.id === 'natureOfCollection'
                                                    ? filteredGroupedCollections[date][0]?.natureOfCollection
                                                    : selectedCategory !== 'natureOfCollection' && col.id === 'dateSubmitted'
                                                        ? date
                                                        : ''}
                                                {(selectedCategory !== 'natureOfCollection' && col.id === 'dateSubmitted') ||
                                                    (selectedCategory === 'natureOfCollection' && col.id === 'natureOfCollection') ? (
                                                    <span className="absolute right-[-15px] top-1/2 transform -translate-y-1/2">
                                                        {expandedGroups[date] ? (
                                                            <MdKeyboardArrowDown size={20} />
                                                        ) : (
                                                            <MdKeyboardArrowRight size={20} />
                                                        )}
                                                    </span>
                                                ) : null}
                                                {col.id === 'collectionAmount' && (
                                                    <span>{totalAmount.toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {expandedGroups[date] &&
                                        filteredGroupedCollections[date]
                                            // Apply the deposit status filter before mapping
                                            .filter((collection) => {
                                                if (selectedDepositFilter === 'all') return true;
                                                if (selectedDepositFilter === 'deposited') return collection.depositStatus;
                                                if (selectedDepositFilter === 'undeposited') return !collection.depositStatus;
                                            })
                                            .map((collection) => {
                                                const submittedDate = collection.date_submitted?.toDate();
                                                let formattedDate;

                                                if (selectedCategory === 'year') {
                                                    formattedDate = submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                                                } else if (selectedCategory === 'month') {
                                                    formattedDate = submittedDate.toLocaleDateString('en-US', { day: 'numeric' });
                                                } else if (selectedCategory === 'natureOfCollection') {
                                                    formattedDate = submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                                                } else {
                                                    formattedDate = '';
                                                }

                                                return (
                                                    <tr
                                                        key={collection.id}
                                                        className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                                                    >
                                                        {columns.map((col) => (
                                                            <td
                                                                key={col.id}
                                                                className={`table-cell px-2 py-2 w-[${col.width}] text-[12px] ${col.id === 'collectionAmount' || col.id === 'dateSubmitted' || col.id === 'natureOfCollection' ? 'pl-5' : ''
                                                                    }`}
                                                            >
                                                                {col.id === 'natureOfCollection' && selectedCategory === 'natureOfCollection'
                                                                    ? '' // Show empty string if col.id is 'natureOfCollection'
                                                                    : col.id === 'dateSubmitted'
                                                                        ? formattedDate
                                                                        : col.id === 'depositStatus'
                                                                            ? (
                                                                                <span className={collection.depositStatus ? 'text-green-600' : 'text-red-600'}>
                                                                                    {collection.depositStatus ? 'Deposited' : 'Undeposited'}
                                                                                </span>
                                                                            )
                                                                            : collection[col.id] || ''} {/* Show the value or empty string */}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Fragment >
    );
}
