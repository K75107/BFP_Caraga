import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc,getDoc,doc,updateDoc } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";
import Modal from "../../../components/Modal"

import { IoMdAddCircleOutline } from "react-icons/io";

export default function FireStationCollection() {
  const [firestationCollection, setFirestationCollection] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);

  //Hover on Rows
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);

  const [editingCell,setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [reportData, setReportData] = useState([]);

  //Modal
  const [showModal, setShowModal] = useState(false);
  const [officersData, setOfficersData] = useState([]);

  const [selectedOfficer,setSelectedOfficer] = useState('');




  useEffect(() => {
    const checkUserInCollections = async (userEmail, collections) => {
        const userFound = collections.find((collection) => collection.email === userEmail);
        
        if (userFound) {
            
            /*--------------------------------------------------Collections------------------------------------------------------------- */

            const collectionsSubCollectionRef = collection(db, 'firestationReports', userFound.id, 'collections');
            const snapshot = await getDocs(collectionsSubCollectionRef);

            // If there are no documents, create a default document
            if (snapshot.empty) {
                console.log('No documents in collections subcollection. Creating default document...');

                const defaultDoc = {
                    fireStationName: userFound.username,
                    collectingOfficer: null,
                    lcNumber: null,
                    date: null,
                    orNumber: null,
                    amount: null,
                    position: 1 // Default position for the first row
                };

                // Add default document with auto-generated ID
                const newDocRef = await addDoc(collectionsSubCollectionRef, defaultDoc);
                console.log('Default document created in collections subcollection:', newDocRef.id);
                
                // Immediately update the state with the new document
                const newDocument = { id: newDocRef.id, ...defaultDoc };
                setCollectionsData([newDocument]); // Update with the new default row

                // Optionally fetch existing documents to merge them
                const subCollectionDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCollectionsData(prevData => [newDocument, ...subCollectionDocs]); // Merge new document with any existing ones
            } else {
                // Fetch subcollection documents
                const subCollectionDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCollectionsData(subCollectionDocs); // Update state with existing documents
            }

            /*------------------------------------------------------------------------------------------------------------------ */


            //Collecting Officer
            const officersSubcollectionRef = collection(db, 'firestationReports', userFound.id, 'officers');
            const officerSnapshot = await getDocs(officersSubcollectionRef);

            const officerDocs = officerSnapshot.docs.map(doc =>({id:doc.id, ...doc.data()}));
            setOfficersData(officerDocs);

          
        } else {
            console.log('User not found in unsubmitted collections');
        }
    };

    // Set up a listener for the unsubmitted collections
    const unsubmitCollectionRef = collection(db, 'firestationReports');
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
        const listCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationCollection(listCollections); // Update state with fetched data

        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // console.log('Current User Email:', user.email);
                checkUserInCollections(user.email, listCollections);
            } else {
                console.log('No user is currently logged in');
            }
        });
    });

    return () => {
        unsubscribeUnsubmitCollections(); // Unsubscribe from Firestore snapshot listener
    };
}, []);

  


  const handleCellChange = async (collectionId, field, newValue) => {
    try {
      // Fetch the current authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        console.error('No logged-in user found.');
        return;
      }
  
      // Check if the logged-in user's email matches any document in firestationReports
      const firestationReportsSnapshot = await getDocs(collection(db, 'firestationReports'));
  
      // Find the document where the email matches the logged-in user's email
      const userDoc = firestationReportsSnapshot.docs.find(doc => doc.data().email === user.email);
  
      if (!userDoc) {
        console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }
  
      // Check if the subcollection 'collections' exists for the user's document
      const collectionsSubCollectionRef = collection(db, 'firestationReports', userDoc.id, 'collections');
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


  const [currentDate] = useState(new Date().toISOString().split('T')[0]); 

 

 

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };


  const handleHoverData = (collections) =>{
    const collection = collections.id; // Account document ID
 

     setSelectedRowData(collection);



}    

const handleAddRowBelow = async () => {
  if (!selectedRowData || !collectionsData) return;

  try {
      // Find the selected row data
      const selectedRow = collectionsData.find(collection => collection.id === selectedRowData);

      // If no selected row found, exit
      if (!selectedRow) return;

      // Find the position of the selected row
      const selectedRowPosition = selectedRow.position;

      // Find the next row after the selected one
      const nextRow = collectionsData.find(collection => collection.position > selectedRowPosition);

      // Calculate the new position
      const newRowPosition = nextRow 
          ? (selectedRowPosition + nextRow.position) / 2 
          : selectedRowPosition + 1;

      // Create the new collection with the calculated position
      const newCollection = {
          date: null,
          lcNumber: null,
          orNumber: null,
          amount: null,
          position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
      };

      // Reference to the user's collections subcollection
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
          console.error('No logged-in user found.');
          return;
      }

      const firestationReportsSnapshot = await getDocs(collection(db, 'firestationReports'));
      const userDoc = firestationReportsSnapshot.docs.find(doc => doc.data().email === user.email);

      if (!userDoc) {
          console.error('No unsubmitted collection found for the logged-in user.');
          return;
      }

      const collectionsSubCollectionRef = collection(db, 'firestationReports', userDoc.id, 'collections');
      
      // Add the new collection to Firestore
      const newCollectionRef = await addDoc(collectionsSubCollectionRef, newCollection);

      // Fetch the new collection's ID
      const newCollectionWithId = {
          ...newCollection,
          id: newCollectionRef.id,  // Use the Firestore-generated ID
      };

      // Update the local state immediately
      setCollectionsData(prevCollections => {
          const updatedCollections = [...prevCollections, newCollectionWithId];
          return updatedCollections.sort((a, b) => a.position - b.position); // Sort by position
      });

  } catch (error) {
      console.error('Error adding row below:', error.message || error);
  }
};




  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
            Fire Station Reports - Collections
          </h1>
          <button
            type="button"
            className="bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

       

        {/*TABLE*/}
        <div className="relative overflow-x-visible shadow-md sm:rounded-lg ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
            <thead className="text-[12px] text-gray-700 uppercase bg-gray-100  dark:bg-gray-700 dark:text-gray-400">
                        <tr className="text-[12px]">
                            <th scope="col" className="px-2 py-3 w-24">DATE</th>
                            <th scope="col" className="px-2 py-3 w-56">LC NUMBER</th>
                            <th scope="col" className="px-2 py-3 w-56">OR NUMBER</th>
                            <th scope="col" className="px-2 py-3 w-56">AMOUNT</th>
                            <th scope="col" className="w-[0px]"></th>
                        </tr>
                  </thead>
                  <tbody>
                  {collectionsData.map((collections) => (
                      <Fragment key={collections.id}>
                        <tr className=" text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                        onMouseEnter={(e) => { 
                          setHoveredRowId(collections.id); 
                          handleHoverData(collections); 
                        }}
                      onMouseLeave={() => setHoveredRowId(null)} 
                        
                        >
                          <td className="table-cell px-2 py-2 w-24 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'date' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-36 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'date', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'date', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'date', value: collections.date || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-36 px-2 py-1"
                              >
                                {collections.date || '-'}
                              </span>
                            )}
                          </td>

                          

                          <td className="table-cell px-2 py-2 w-56 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'lcNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-56 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'lcNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'lcNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'lcNumber', value: collections.lcNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-56 px-2 py-1"
                              >
                                {collections.lcNumber || '-'}
                              </span>
                            )}
                          </td>


                          <td className="table-cell px-2 py-2 w-56 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'orNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-56 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'orNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'orNumber', value: collections.orNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-56 px-2 py-1"
                              >
                                {collections.orNumber || '-'}
                              </span>
                            )}
                          </td>
                          <td className="table-cell px-2 py-2 w-56 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'amount' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-56 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'amount', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'amount', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'amount', value: collections.amount || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-56 px-2 py-1"
                              >
                                {collections.amount || '-'}
                              </span>
                            )}
                          </td>
                          {hoveredRowId === collections.id && (
                                <td className="relative right-8 mr-1 text-[12px]">  {/* Position the button absolutely */}
                                <button
                                    className="mt-2 bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                    style={{ position: 'absolute', right: '-50px' }}  // Adjust position as needed
                                    onClick={handleAddRowBelow}
                                >
                                    <IoMdAddCircleOutline />
                                </button>
                                </td>
                            )}
                        </tr>
                      </Fragment>
                    ))}

                  </tbody>
                </table>
      </div>
      </div>


                    {/*Submit Modal*/}
                    <Modal isVisible={showModal}>
                <div className="bg-white w-1/3 h-72 rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Confirm Submission
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    {/*LABEL*/}
                    <div className="flex flex-row justify-start">
                        

                        <div className="py-2 ">
                          <label className="block text-sm font-medium text-gray-700 w-80">Collecting Officer</label>
                          <select
                              className="mt-1 block w-2/4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={selectedOfficer}
                              onChange={(e) => setSelectedOfficer(e.target.value)} // Handle change here
                            >
                              <option value="" disabled>Select an officer</option>

                              {/* Dynamically render officers */}
                              {officersData.map((officer) => (
                                <option key={officer.id} value={`${officer.firstname} ${officer.lastname}`}>
                                  {officer.firstname} {officer.lastname}
                                </option>
                              ))}
                            </select>
                        </div>
                       
                    </div>
                 

                    <div className="flex justify-end py-3 px-4">
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4" >Submit</button>
                    </div>
                </div>
            </Modal>



    </Fragment>
    
  );
}
