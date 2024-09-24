import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc,getDoc,doc,updateDoc } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";

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


  useEffect(() => {
    const checkUserInCollections = async (userEmail, collections) => {
        const userFound = collections.find((collection) => collection.email === userEmail);
        
        if (userFound) {
            console.log('User found in unsubmitted collections');
            
            const collectionsSubCollectionRef = collection(db, 'unsubmittedCollections', userFound.id, 'collections');
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
        } else {
            console.log('User not found in unsubmitted collections');
        }
    };

    // Set up a listener for the unsubmitted collections
    const unsubmitCollectionRef = collection(db, 'unsubmittedCollections');
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
        const listCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationCollection(listCollections); // Update state with fetched data

        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('Current User Email:', user.email);
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

      const unsubmittedCollectionsSnapshot = await getDocs(collection(db, 'unsubmittedCollections'));
      const userDoc = unsubmittedCollectionsSnapshot.docs.find(doc => doc.data().email === user.email);

      if (!userDoc) {
          console.error('No unsubmitted collection found for the logged-in user.');
          return;
      }

      const collectionsSubCollectionRef = collection(db, 'unsubmittedCollections', userDoc.id, 'collections');
      
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
                            <th scope="col" className="px-6 py-3 w-[100px]">DATE</th>
                            <th scope="col" className="px-6 py-3 w-[260px]">LC NUMBER</th>
                            <th scope="col" className="px-6 py-3 w-[260px]">OR NUMBER</th>
                            <th scope="col" className="px-6 py-3 w-[260px]">AMOUNT</th>
                            <th scope="col" className="w-[0px]"></th>
                        </tr>
                  </thead>
                  <tbody>
                  {collectionsData.map((collections) => (
                      <Fragment key={collections.id}>
                        <tr className="bg-white"
                        onMouseEnter={(e) => { 
                          setHoveredRowId(collections.id); 
                          handleHoverData(collections); 
                        }}
                      onMouseLeave={() => setHoveredRowId(null)} 
                        
                        >




                          <td className="table-cell px-6 py-3 w-24">
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

                          

                          <td className="table-cell px-6 py-3 w-[260px]">
                            {editingCell === collections.id && editValue.field === 'lcNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-[260px] h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'lcNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'lcNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'lcNumber', value: collections.lcNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-[260px] px-2 py-1"
                              >
                                {collections.lcNumber || '-'}
                              </span>
                            )}
                          </td>




                          <td className="table-cell px-6 py-3 w-[260px]">
                            {editingCell === collections.id && editValue.field === 'orNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-[260px] h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'orNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'orNumber', value: collections.orNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-[260px] px-2 py-1"
                              >
                                {collections.orNumber || '-'}
                              </span>
                            )}
                          </td>
                          <td className="table-cell px-6 py-3 w-[260px]">
                            {editingCell === collections.id && editValue.field === 'amount' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-[260px] h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'amount', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'amount', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'amount', value: collections.amount || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-[260px] px-2 py-1"
                              >
                                {collections.amount || '-'}
                              </span>
                            )}
                          </td>
                          {hoveredRowId === collections.id && (
                                <td className="absolute right-8 mt-9 mr-1">  {/* Position the button absolutely */}
                                <button
                                    className="bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
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
    </Fragment>
    
  );
}
