import React from "react";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../../config/firebase-config";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button

export default function FireStationCollectionsSubmitted() {


    //FOR FILTERS -------------------------------------------------------------------------------------------
      // State to track selected category
        const [selectedCategory, setSelectedCategory] = useState(null);

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
                    // Find the current user in the submitted data by matching their email
                    const currentUser = submittedData.find((doc) => doc.email === user.email);

                    if (currentUser) {
                        // Set the current user ID in the state if found in the submitted collections
                        setlogUserID(currentUser.id);
                        // console.log('User found in submittedReportsCollections:', currentUser);
                    } else {
                        console.log('User not found in submittedReportsCollections');
                    }
                } else {
                    console.log('No user is currently logged in');
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
            const submittedSubCollectionsDataRef = collection(db, 'submittedReportsCollections', logUserID, 'Collections');
            
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
    return collections.reduce((grouped, collection) => {
        const createdAt = collection.createdAt ? formatTimestamp(collection.createdAt) : null;
        let groupKey;
        

        if (createdAt) {
            if (selectedCategory === 'month') {
                // Format as "Month Year", e.g. "January 2024"
                groupKey = createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else if (selectedCategory === 'year') {
                // Format as "Year", e.g. "2024"
                groupKey = createdAt.toLocaleDateString('en-US', { year: 'numeric' });
            } else {
                // Format as "Month Day, Year", e.g. "January 7, 2024"
                groupKey = createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

    // Usage
    const groupedCollections = groupByDate(firestationCollection, selectedCategory);



        // State to manage which groups are expanded/collapsed
        const [expandedGroups, setExpandedGroups] = useState({});

        // Toggle function to expand/collapse groups
        const toggleGroup = (date) => {
            setExpandedGroups((prevExpandedGroups) => ({
                ...prevExpandedGroups,
                [date]: !prevExpandedGroups[date],
            }));
        };



    return (
        <div>
            {/* Page Title */}
                <div className="flex flex-col space-y-6 w-full mb-6">
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
                    className="inline-block p-4 border-b-2 rounded-t-lg"
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
                    className="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
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


          {/* Table Header */}

          <div className="flex flex-col items-center justify-between p-4 space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search Form */}
            <div className="w-full md:w-1/2">
              <form className="flex items-center">
                <label htmlFor="simple-search" className="sr-only">Search</label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-gray-500 dark:text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="simple-search"
                    className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Search"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Buttons and Dropdowns */}
            <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">


              {/* Sort By Dropdown */}
              <Dropdown
                label={
                  <div className="flex items-center">
                    <span className="mr-2">Sort</span>
                    <BsChevronDown className="w-4 h-4" /> {/* Chevron Down Icon */}
                  </div>
                }
                dismissOnClick={false}
                inline={true}
                arrowIcon={false} // Disabled default arrow icon
                className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <Dropdown.Item>Mass Edit</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item>Delete all</Dropdown.Item>
              </Dropdown>

              {/* Filter Dropdown */}
              <Dropdown
                label={
                  <div className="flex items-center">
                    <BiFilterAlt className="w-4 h-4 mr-2 text-gray-400" /> {/* Filter Icon */}
                    <span className="mr-2">Filter</span>
                    <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                  </div>
                }
                dismissOnClick={false}
                inline={true}
                arrowIcon={false} // Disabled default arrow icon
                className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >

            {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}                
                <div className="p-3">
                    <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                        Category
                    </h6>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                        <Checkbox
                            id="year"
                            label="Year"
                            checked={selectedCategory === "year"}
                            onChange={handleYearChange} // Toggle year
                        />
                        <span className="ml-2">Year</span>
                        </li>
                        <li className="flex items-center">
                        <Checkbox
                            id="month"
                            label="Month"
                            checked={selectedCategory === "month"}
                            onChange={handleMonthChange} // Toggle month
                        />
                        <span className="ml-2">Month</span>
                        </li>
                        <li className="flex items-center">
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

            <hr className="border-t border-[#7694D4] mt-1 mb-6" />

        



            {/* TABLE */}
            <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-full">
                
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
                    <thead className="text-[12px] text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky">
                        <tr className="text-[12px]">
                            <th scope="col" className="px-2 py-3 w-36">Date Submitted</th>
                            <th scope="col" className="px-2 py-3 w-40">Collecting Officer</th>
                            <th scope="col" className="px-2 py-3 w-36">Date Collected</th>
                            <th scope="col" className="px-2 py-3 w-36">OR Number</th>
                            <th scope="col" className="px-2 py-3 w-36">LC Number</th>
                            <th scope="col" className="px-2 py-3 w-36">Name of Payor</th>
                            <th scope="col" className="px-2 py-3 w-36">Nature of Collection</th>
                            <th scope="col" className="px-2 py-3 w-36">Amount</th>
                            
                        </tr>
                    </thead>
                </table>

                <div className="w-full overflow-y-scroll h-[calc(96vh-240px)]">
                <table className="w-full overflow-x-visible">
            <tbody>
                {/* Iterate over grouped collections by createdAt date */}
                {Object.keys(groupedCollections).map((date) => (
                    <React.Fragment key={date}>
                        {/* Render clickable header row for the date */}
                        <tr 
                            className="text-[12px] bg-gray-100 h-8 border-b w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                            onClick={() => toggleGroup(date)}
                        >
                            <td className="table-cell px-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                                {date}
                            </td>
                            {/* Empty cells for alignment */}
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300"></td>
                        </tr>

                        {/* Conditionally render rows under the current date header */}
                        {expandedGroups[date] &&
                        groupedCollections[date].map((collection) => {

                            // Convert Firestore Timestamp to JavaScript Date and format it
                            const submittedDate = collection.createdAt?.toDate();
                            let formattedDate;

                            //Change the display in submitted Date
                            if(selectedCategory=== 'year'){
                                formattedDate = submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric'});
                            } else if(selectedCategory ==='month'){
                                formattedDate = submittedDate.toLocaleDateString('en-US', {day: 'numeric',});
                            } else{
                                formattedDate = '';
                            }


                            return (
                            <tr
                                key={collection.id}
                                className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                            >
                                <td className="table-cell px-2 w-40 text-[12px] pl-10">{formattedDate}</td>
                                <td className="table-cell px-2 w-40 text-[12px]">{collection.collectingOfficer}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.dateCollected}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.orNumber}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.lcNumber}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.nameOfPayor}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.natureOfCollection}</td>
                                <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.collectionAmount}</td>
                            </tr>
                            );
                        })}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
                </div>
            </div>
        </div>
    );
}
