import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";

export default function FireStationDeposits() {
  const [firestationCollection, setFirestationCollection] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);

  useEffect(() => {
    // Function to check if the current user's email matches any document in unsubmittedCollections
    const checkUserInCollections = async (userEmail, collections) => {
      // Find the document where the email matches the logged-in user's email
      const userFound = collections.find((collection) => collection.email === userEmail);
      
      if (userFound) {
        console.log('User found in unsubmitted collections');
        
        // Check if subcollection 'collections' exists or has any documents
        const collectionsSubCollectionRef = collection(db, 'unsubmittedCollections', userFound.id, 'collections');
        const snapshot = await getDocs(collectionsSubCollectionRef);

        if (snapshot.empty) {
          console.log('No documents in collections subcollection. Creating default document...');
          
          // Create a default document with fields set to null
          const defaultDoc = {
            collectingOfficer: null,
            lcNumber: null,
            date: null,
            orNumber: null,
            amount: null
          };

          // Add default document with auto-generated ID
          await addDoc(collectionsSubCollectionRef, defaultDoc);
          console.log('Default document created in collections subcollection');
        }

        // Fetch subcollection documents
        const subCollectionDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCollectionsData(subCollectionDocs); // Update state with subcollection data
      } else {
        console.log('User not found in unsubmitted collections');
      }
    };

    // Set up a listener for the unsubmitted collections
    const unsubmitCollectionRef = collection(db, 'unsubmittedCollections');
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
      const listCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestationCollection(listCollections); // Update state with fetched data

      // Once collections are fetched, check for the user
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, compare user email with unsubmitted collections
          console.log('Current User Email:', user.email);
          checkUserInCollections(user.email, listCollections);
        } else {
          console.log('No user is currently logged in');
        }
      });
    });

    // Cleanup the listeners when the component unmounts
    return () => {
      unsubscribeUnsubmitCollections(); // Unsubscribe from Firestore snapshot listener
    };
  }, []); // Empty dependency array to run this effect only once on component mount

  const [reportData, setReportData] = useState([
    {
      id: 1,
      fireStation: "",
      lcNumber: "",
      date: "",
      orNumber: "",
      amount: "",
    },
  ]);

  const [officerName, setOfficerName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]); 

  const handleChange = (id, field, value) => {
    const updatedData = reportData.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setReportData(updatedData);
  };

  const handleOfficerNameChange = (e) => {
    setOfficerName(e.target.value);
  };

  const handleAddRow = () => {
    const newRow = {
      id: reportData.length + 1,
      fireStation: "",
      lcNumber: "",
      date: "",
      orNumber: "",
      amount: "",
    };
    setReportData([...reportData, newRow]);
  };

  const handleRemoveRow = (id) => {
    setReportData(reportData.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    console.log("Submitted data:", reportData);
    console.log("Collecting Officer:", officerName);
    console.log("Current Date:", currentDate);
    // Add form submission logic here
  };

  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
            Fire Station Reports - Deposits
          </h1>
          <button
            type="button"
            className="bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Collecting Officer's Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={officerName}
            onChange={handleOfficerNameChange}
            required
          />
        </div>

        {/*TABLE*/}
        <div className="relative overflow-x-visible shadow-md sm:rounded-lg ">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-[200px]">FIRE STATION</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">LC NUMBER</th>
                            <th scope="col" className="px-6 py-3 w-[100px]">DATE</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">OR NUMBER</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">AMOUNT</th>
                        </tr>
                  </thead>
                  <tbody>
                    {collectionsData.map((collections) => (
                      <Fragment key={collections.id}>
                        <tr className="bg-gray-100 font-bold">
                          <td className="table-cell px-6 py-3 w-40">hi</td>
                          <td className="table-cell px-6 py-3 w-24">{collections.date}</td>
                          <td className="table-cell px-6 py-3 w-24">{collections.lcNumber}</td>
                          <td className="table-cell px-6 py-3 w-32">{collections.orNumber}</td>
                          <td className="table-cell px-6 py-3 w-24">{collections.amount}</td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
      </div>
      </div>
    </Fragment>
    
  );
}
