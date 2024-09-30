import React from "react";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../../config/firebase-config";
import { Timestamp } from "firebase/firestore";

export default function FireStationCollectionsSubmitted() {
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

                console.log(submittedCollectionsList);
                setFirestationCollection(submittedCollectionsList);
            });

            // Clean up the listener when the component unmounts or when logUserID changes
            return () => {
                unsubscribeSubmittedCollectionsDataRef();
            };
        }
    }, [logUserID]);  // This effect runs only when logUserID changes

    // For timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp.seconds * 1000);  // Convert Firestore Timestamp to JS Date
        return date.toISOString().split("T")[0];  // Format the date as yyyy-MM-dd
    };

    // For groupings and Toggle of view
    const groupByDate = (collections) => {
        return collections.reduce((grouped, collection) => {
            const dateKey = collection.createdAt ? formatTimestamp(collection.createdAt) : "N/A";
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(collection);
            return grouped;
        }, {});
    };


        // State to manage which groups are expanded/collapsed
        const [expandedGroups, setExpandedGroups] = useState({});

        // Toggle function to expand/collapse groups
        const toggleGroup = (date) => {
            setExpandedGroups((prevExpandedGroups) => ({
                ...prevExpandedGroups,
                [date]: !prevExpandedGroups[date],
            }));
        };

        const groupedCollections = groupByDate(firestationCollection);

    
    return (
        <div>
            {/* TABLE */}
            <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-full">
                <button
                    type="button"
                    className="absolute top-[-70px] right-10 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                >
                    Submit
                </button>
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
                        {expandedGroups[date] && (
                            groupedCollections[date].map((collection) => (
                                <tr key={collection.id} className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                                    <td className="table-cell px-2 w-40 text-[12px]"></td>
                                    <td className="table-cell px-2 w-40 text-[12px]">{collection.collectingOfficer}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.dateCollected}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.orNumber}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.lcNumber}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.nameOfPayor}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.natureOfCollection}</td>
                                    <td className="table-cell px-2 py-2 w-36 text-[12px]">{collection.collectionAmount}</td>
                                </tr>
                            ))
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
                </div>
            </div>
        </div>
    );
}
