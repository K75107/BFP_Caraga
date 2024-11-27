import React, { useEffect, useState,Fragment } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../../config/firebase-config";
import { useNavigate } from "react-router-dom";
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import SearchBar from "../../../../components/searchBar";
import { CiFilter } from "react-icons/ci";

export default function FireStationCollectionsSubmitted() {

    // FOR FILTERS -------------------------------------------------------------------------------------------
    const [selectedCategory, setSelectedCategory] = useState('month');

    // Handlers for toggling the checkboxes
    const handleYearChange = () => setSelectedCategory((prev) => (prev === "year" ? null : "year"));
    const handleMonthChange = () => setSelectedCategory((prev) => (prev === "month" ? null : "month"));
    const handleDayChange = () => setSelectedCategory((prev) => (prev === "day" ? null : "day"));
    const handleNatureOfCollection = () => setSelectedCategory('natureOfCollection');
    // FOR FILTERS -------------------------------------------------------------------------------------------

    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // Define state for fire station collections
    const [logUserID, setlogUserID] = useState(null);  // Set initial value to null
    const [firestationCollection, setFirestationCollection] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedDepositFilter, setSelectedDepositFilter] = useState('all'); // Default to 'all'
    const [searchQuery, setSearchQuery] = useState(''); // Search input state
    const [filteredGroupedCollections, setFilteredGroupedCollections] = useState({}); // Filtered grouped collections

    useEffect(() => {
        const submittedCollectionRef = collection(db, 'submittedReportsCollections');
        const unsubscribeSubmittedCollections = onSnapshot(submittedCollectionRef, (snapshot) => {
            const submittedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const currentUser = submittedData.find((doc) => doc.email === user.email);
                    if (currentUser) {
                        setlogUserID(currentUser.id);
                    } else {
                        // console.log('User not found in submittedReportsCollections');
                    }
                } else {
                    // console.log('No user is currently logged in');
                }
            });
        });

        return () => {
            unsubscribeSubmittedCollections();
        };
    }, []);

    useEffect(() => {
        if (logUserID) {
            const submittedSubCollectionsDataRef = collection(db, 'submittedReportsCollections', logUserID, 'collections');
            const unsubscribeSubmittedCollectionsDataRef = onSnapshot(submittedSubCollectionsDataRef, (snapshot) => {
                const submittedCollectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFirestationCollection(submittedCollectionsList);
            });

            return () => {
                unsubscribeSubmittedCollectionsDataRef();
            };
        }
    }, [logUserID]);


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

    // Function to filter the grouped collections based on search query
    const filterGroupedCollections = (groupedCollections, searchQuery) => {
        const filteredGroups = {};
    
        Object.keys(groupedCollections).forEach((groupKey) => {
            const collections = groupedCollections[groupKey];
    
            // Filter collections based on the search query for Name of Payor
            const filteredRows = collections.filter((collection) => {
                const payorName = collection.nameOfPayor?.toLowerCase() || ''; // Ensure case-insensitive search
                return payorName.includes(searchQuery.toLowerCase());
            });
    
            // Retain the group if it contains any matching rows
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




    return (
        <Fragment>
            {/* Page Title */}
            <div className="flex flex-col space-y-6 w-full mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Fire Station Reports - Collections
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
                            onClick={() => navigate("/main/firestation/collections/unsubmitted")}
                            className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100 "
                            id="profile-styled-tab"
                            type="button"
                            role="tab"
                            aria-controls="profile"
                            aria-selected="false"
                        >
                            Unsubmitted
                        </button>
                    </li>
                    <li className="me-2" role="presentation">
                        <button
                            onClick={() => navigate("/main/firestation/collections/submitted")}
                            className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100 "
                            id="dashboard-styled-tab"
                            type="button"
                            role="tab"
                            aria-controls="dashboard"
                            aria-selected="false"
                        >
                            Submitted
                        </button>
                    </li>
                </ul>
            </div>


            <div className="flex flex-col items-center justify-between  space-y-3 md:flex-row md:space-y-0 md:space-x-4 absolute top-32 right-10">
            <SearchBar
                placeholder="Search Payor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Updates the search query
            />

                {/* Buttons and Dropdowns */}
                <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">

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
        </Fragment>
    );
}
