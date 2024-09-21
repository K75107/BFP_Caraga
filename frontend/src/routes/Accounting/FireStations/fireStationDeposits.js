import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc,getDoc,doc,updateDoc } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";

export default function FireStationDeposits() {
  const [firestationCollection, setFirestationCollection] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);



  const [editingCell,setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [reportData, setReportData] = useState([]);


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
            fireStationName: userFound.username,
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

  


  const handleCellChange = async (collectionId, field, newValue) => {
    try {
      // Fetch the current authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        console.error('No logged-in user found.');
        return;
      }
  
      // Check if the logged-in user's email matches any document in unsubmittedCollections
      const unsubmittedCollectionsSnapshot = await getDocs(collection(db, 'unsubmittedCollections'));
  
      // Find the document where the email matches the logged-in user's email
      const userDoc = unsubmittedCollectionsSnapshot.docs.find(doc => doc.data().email === user.email);
  
      if (!userDoc) {
        console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }
  
      // Check if the subcollection 'collections' exists for the user's document
      const collectionsSubCollectionRef = collection(db, 'unsubmittedCollections', userDoc.id, 'collections');
      const docSnapshot = await getDoc(doc(collectionsSubCollectionRef, collectionId));
  
      if (!docSnapshot.exists()) {
        console.error(`No collection document found with ID ${collectionId}.`);
        return;
      }
  
      const existingData = docSnapshot.data();
  
      // Only update if there is a change in value
      if (existingData[field] === newValue) {
        console.log('No changes detected, skipping update.');
        return;
      }
  
      // Update the specific field of the collection document
      await updateDoc(doc(collectionsSubCollectionRef, collectionId), {
        [field]: newValue
      });
  
      // Update the local state after a successful update
      setCollectionsData(prevCollections =>
        prevCollections.map(collection =>
          collection.id === collectionId ? { ...collection, [field]: newValue } : collection
        )
      );
  
      // Clear the editing state after a successful update
      setEditingCell(null);
      setEditValue('');
  
    } catch (error) {
      console.error('Error updating collection field:', error);
    }
  };
  


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
                        <tr className="bg-white">
                          
                          <td className="table-cell px-6 py-3 w-40">
                          {collections.fireStationName}
                          </td>


                          <td className="table-cell px-6 py-3 w-24">
                            {editingCell === collections.id && editValue.field === 'lcNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-36 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'lcNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'lcNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'lcNumber', value: collections.lcNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-36 px-2 py-1"
                              >
                                {collections.lcNumber || '-'}
                              </span>
                            )}
                          </td>



                          <td className="table-cell px-6 py-3 w-24">{collections.orNumber}</td>
                          <td className="table-cell px-6 py-3 w-32">{collections.amount}</td>
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
