import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot,doc,getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase-config";
import { useNavigate } from "react-router-dom";
export default function ReportsOverview() {
    
    const {userId} = useParams();
    const navigate = useNavigate();

    const [firestationDeposit, setFirestationDeposit] = useState([]);
    const [totalCollectionAmount, settotalCollectionAmount] = useState(0);
    const [totalDepositAmount, setTotalDepositAmount] = useState(0);
    const [firestationUsername, setFirestationUsername] = useState('');

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-30');

    useEffect(() => {
        // Reference to the document of the current logged-in user
        const currentUserRef = doc(db, 'submittedReportsDeposits', userId);
    
        // Fetch the document's data to access email
        const fetchUserData = async () => {
          const docSnap = await getDoc(currentUserRef);
    
          if (docSnap.exists()) {
            // Access the email field from the document
            const userData = docSnap.data();
            setFirestationUsername(userData.username || '');
          } else {
            console.log('No such document!');
          }
        };
    
        fetchUserData();
      }, [userId, db]);



      useEffect(() => {
        if (userId) {
          // Reference to the collections subcollection
          const submittedSubcollectionsDataRef = collection(db, 'submittedReportsCollections', userId, 'Collections');
          
          
          // Listener for the collections subcollection
          const unsubscribeSubmittedCollectionsDataRef = onSnapshot(submittedSubcollectionsDataRef, (snapshot) => {
            const submittedCollectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    

            // Filter collections based on the start and end date
            const filteredCollections = submittedCollectionsList.filter(collections => {
              const collectionsDate = collections.date_submitted.toDate(); // Convert Firestore Timestamp to JS Date
              return collectionsDate >= new Date(startDate) && collectionsDate <= new Date(endDate);
            });
    
            // Calculate the total deposit amount from the filtered deposits
            const totalAmount = filteredCollections.reduce((acc, collections) => acc + parseFloat(collections.collectionAmount || 0), 0);

    
            // Set the filtered deposits and total amount in state
            setFirestationDeposit(filteredCollections);
            settotalCollectionAmount(totalAmount);

          });
    
          // Clean up the listener
          return () => {
            unsubscribeSubmittedCollectionsDataRef();
          };
        }
      }, []);



    useEffect(() => {
        if (userId) {
          // Reference to the deposits subcollection
          const submittedSubdepositsDataRef = collection(db, 'submittedReportsDeposits', userId, 'deposits');
          
          
          // Listener for the deposits subcollection
          const unsubscribeSubmitteddepositsDataRef = onSnapshot(submittedSubdepositsDataRef, (snapshot) => {
            const submittedDepositsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    

            // Filter deposits based on the start and end date
            const filteredDeposits = submittedDepositsList.filter(deposit => {
              const depositDate = deposit.date_submitted.toDate(); // Convert Firestore Timestamp to JS Date
              return depositDate >= new Date(startDate) && depositDate <= new Date(endDate);
            });
    
            // Calculate the total deposit amount from the filtered deposits
            const totalAmount = filteredDeposits.reduce((acc, deposit) => acc + parseFloat(deposit.depositAmount || 0), 0);

    
            // Set the filtered deposits and total amount in state
            setFirestationDeposit(filteredDeposits);
            setTotalDepositAmount(totalAmount);
          });
    
          // Clean up the listener
          return () => {
            unsubscribeSubmitteddepositsDataRef();
          };
        }
      }, []);
    

    return (
        <Fragment>
            
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
                    className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
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
                <hr className="border-t border-[#7694D4] my-4" />


                <div className="container mx-auto ">
                    <div className="grid grid-cols-3 ">
                        <div className=" grid gap-6 mb-8">
                            {/* Deposits Card */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Deposits</h2>
                            <p className="text-gray-700 mb-2">Total Deposits: ₱{totalDepositAmount}</p>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
                            </div>

                            {/* Collections Card */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Collections</h2>
                            <p className="text-gray-700 mb-2">Total Collections: ₱{totalCollectionAmount}</p>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
                            </div>

                            {/* Officers Card */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Undeposited</h2>
                            <p className="text-gray-700 mb-2">Total Undeposited: ₱XX,XXX</p>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md ml-6 mb-8">

                        </div>
                    </div>
                    </div>

        </Fragment>
    );
}
