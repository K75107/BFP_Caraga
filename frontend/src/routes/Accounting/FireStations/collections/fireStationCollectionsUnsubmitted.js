import React, { useState, Fragment, useEffect} from "react";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc,getDoc,doc,updateDoc,serverTimestamp,setDoc,deleteDoc,writeBatch } from 'firebase/firestore';
import { db } from "../../../../config/firebase-config";
import Modal from "../../../../components/Modal"
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from "react-router-dom";

import { IoMdAddCircleOutline } from "react-icons/io";

export default function FireStationCollectionsUnsubmitted() {

  const navigate = useNavigate();

  const [firestationCollection, setFirestationCollection] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);

  //Hover on Rows
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);

  const [editingCell,setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');


  //Modal
  const [showModal, setShowModal] = useState(false);
  const [officersData, setOfficersData] = useState([]);
  const [selectedOfficer,setSelectedOfficer] = useState('');

  //Right click Modal
  const [showRightClickModal, setShowRightClickModal] = useState(false); 
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  //Loggin User
  const [logginUser, setLogginUser] = useState('');


  //loading
  const [isLoading, setIsLoading] = useState(false);  // New loading state

  //subNavigations
  const [isPending,setIsPending] =useState(true);

  useEffect(() => {
    const checkUserInCollections = async (userEmail, collections) => {
        const userFound = collections.find((collection) => collection.email === userEmail);

        if (userFound) {
            // Set the logged-in user to global state
            setLogginUser(userFound);

            /*--------------------------------------------------Collections------------------------------------------------------------- */
            const collectionsSubCollectionRef = collection(db, 'firestationReportsCollections', userFound.id, 'collections');
            const snapshot = await getDocs(collectionsSubCollectionRef);

            // If there are no documents, create a default document
            if (snapshot.empty) {
                console.log('No documents in collections subcollection. Creating default document...');

                const defaultDoc = {
                    createdAt:serverTimestamp(),
                    fireStationName: userFound.username,
                    collectingOfficer: null,
                    dateCollected: null,
                    orNumber: null,
                    lcNumber: null,
                    nameOfPayor:null,
                    natureOfCollection:null,
                    collectionAmount: null,
                    status:null,
                    depositStatus:null,
                    depositID:null,
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
                const sortedSubCollectionDocs = subCollectionDocs.sort((a, b) => a.position - b.position); // Sort by position

                setCollectionsData(prevData => [newDocument, ...sortedSubCollectionDocs]); // Merge new document with any existing ones
            } else {
                // Fetch and sort subcollection documents by position
                const subCollectionDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sortedSubCollectionDocs = subCollectionDocs.sort((a, b) => a.position - b.position); // Sort by position

                setCollectionsData(sortedSubCollectionDocs); // Update state with sorted documents
            }

            /*------------------------------------------------------------------------------------------------------------------ */

            // Fetch Collecting Officer data
            const officersSubcollectionRef = collection(db, 'firestationReportsOfficers', userFound.id, 'officers');
            const officerSnapshot = await getDocs(officersSubcollectionRef);

            const officerDocs = officerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOfficersData(officerDocs);

        } else {
            console.log('User not found in unsubmitted collections');
        }
    };

    // Set up a listener for the unsubmitted collections
    const unsubmitCollectionRef = collection(db, 'firestationReportsCollections');
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
        const listCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationCollection(listCollections); // Update state with fetched data

        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Check if the logged-in user is part of the collections
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
  
      // Check if the logged-in user's email matches any document in firestationReportsCollections
      const firestationReportsSnapshot = await getDocs(collection(db, 'firestationReportsCollections'));
  
      // Find the document where the email matches the logged-in user's email
      const userDoc = firestationReportsSnapshot.docs.find(doc => doc.data().email === user.email);
  
      if (!userDoc) {
        console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }
  
      // Check if the subcollection 'collections' exists for the user's document
      const collectionsSubCollectionRef = collection(db, 'firestationReportsCollections', userDoc.id, 'collections');
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




  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };


  const handleAddRowBelow = async () => {
    if (!selectedRowData || !collectionsData || isLoading) return;

    setIsLoading(true);

    try {
      // Reference the collections data
      const collectionRef = collection(db, 'firestationReportsCollections', logginUser.id, 'collections');
      
      // Fetch and sort existing rows
      const collectionsDataSnapshot = await getDocs(collectionRef);
      const sortedRows = collectionsDataSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.position - b.position);

      // Find the position of the selected row
      const selectedRowPosition = selectedRowData.position;

      // Find the next row after the selected one
      const nextRow = sortedRows.find(fireCollections => fireCollections.position > selectedRowPosition);

      // Calculate the new position (midpoint or +1)
      const newRowPosition = nextRow
        ? (selectedRowPosition + nextRow.position) / 2
        : selectedRowPosition + 1;

      // console.log(newRowPosition);


      // Create new data with its position
      const newRowData = {
        createdAt:serverTimestamp(),
        fireStationName: logginUser.username,
        collectingOfficer: null,
        dateCollected: null,
        orNumber: null,
        lcNumber: null,
        nameOfPayor:null,
        natureOfCollection:null,
        collectionAmount: null,
        status:null,
        depositStatus:null,
        depositID:null,
        position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
      };




      // Add the new row to Firestore
      const newRowDataRef = await addDoc(collectionRef, newRowData);

      // Fetch the new row's ID and add it to the new row data
      const newRowWithId = {
        ...newRowData,
        id: newRowDataRef.id,
      };

      // Update the local state by adding the new row and re-sorting
      setCollectionsData(prevData => 
        [...prevData, newRowWithId].sort((a, b) => a.position - b.position)
      );

    } catch (error) {
        console.error('Error adding row below:', error.message || error);
    } finally {
        setIsLoading(false);
    }
};

const handleAddRowAbove = async () => {
  if (!selectedRowData || !collectionsData || isLoading) return;

  setIsLoading(true);

  try {
    // Reference the collections data
    const collectionRef = collection(db, 'firestationReportsCollections', logginUser.id, 'collections');
    
    // Fetch and sort existing rows
    const collectionsDataSnapshot = await getDocs(collectionRef);
    const sortedRows = collectionsDataSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.position - b.position);

    // Find the position of the selected row
    const selectedRowPosition = selectedRowData.position;

    // Find the next row after the selected one
    const prevRow = sortedRows.find(fireCollections => fireCollections.position < selectedRowPosition);

    // Calculate the new position (midpoint or +1)
    const newRowPosition = prevRow
      ? (selectedRowPosition + prevRow.position) / 2
      : selectedRowPosition - 1;

    // console.log(newRowPosition);


    // Create new data with its position
    const newRowData = {
      createdAt:serverTimestamp(),
      fireStationName: logginUser.username,
      collectingOfficer: null,
      dateCollected: null,
      orNumber: null,
      lcNumber: null,
      nameOfPayor:null,
      natureOfCollection:null,
      collectionAmount: null,
      status:null,
      depositStatus:null,
      depositID:null,
      position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
    };



    // Add the new row to Firestore
    const newRowDataRef = await addDoc(collectionRef, newRowData);

    // Fetch the new row's ID and add it to the new row data
    const newRowWithId = {
      ...newRowData,
      id: newRowDataRef.id,
    };

    // Update the local state by adding the new row and re-sorting
    setCollectionsData(prevData => 
      [...prevData, newRowWithId].sort((a, b) => a.position - b.position)
    );

  } catch (error) {
      console.error('Error adding row below:', error.message || error);
  } finally {
      setIsLoading(false);
  }
};


const handleSubmitDataToRegion = async () => {
  try {
    // Reference to the submittedReportsCollections (without logginUser.id initially)
    const submittedReportsCollectionRef = collection(db, 'submittedReportsCollections');

    // First, create a document for the logginUser.id with email and username
    const userDocRef = doc(submittedReportsCollectionRef, logginUser.id);
    await setDoc(userDocRef, {
      email: logginUser.email,
      username: logginUser.username,
      date_created: serverTimestamp(), // Optional: track when this document was created
    });

    console.log('User document created successfully with email and username.');

    // Now, reference the specific subcollection under the newly created logginUser.id document
    const collectionsSubCollectionRef = collection(
      db,
      'firestationReportsCollections',
      logginUser.id,
      'collections'
    );

    // Fetch the value of collections
    const collectionsSnapshot = await getDocs(collectionsSubCollectionRef);

    if (collectionsSnapshot.empty) {
      console.log('No documents inside the collections');
    } else {
      // Create an array of promises for each document to be added and deleted
      const submissionPromises = collectionsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        // Check if the row is not empty (you can add more fields to this check if needed)
        if (data.collectingOfficer || data.collectionAmount || data.orNumber || data.nameOfPayor) {
          // Prepare the new data with a submission timestamp
          const newData = {
            ...data,
            date_submitted: serverTimestamp(),
          };

          // Reference the subcollection under the logginUser.id document in submittedReportsCollections
          const userSubmittedReportsRef = collection(
            db,
            'submittedReportsCollections',
            logginUser.id,
            'Collections'
          );

          // Add the new data to the submitted reports subcollection
          await addDoc(userSubmittedReportsRef, newData);

          // Delete the document from the original collections after it's submitted
          await deleteDoc(docSnapshot.ref);
        }
      });

      // Wait for all documents to be processed
      await Promise.all(submissionPromises);

      // Show Changes to UI---------------------------------------------------------------------------------------------------
      const collectionsDataRef = collection(db, 'firestationReportsCollections', logginUser.id, 'collections');

      // Fetch the updated accounts after deletion
      const updatedSnapshot = await getDocs(collectionsDataRef);
      const updatedCollections = updatedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Keep existing positions unless some rows need adjustments
      const sortedCollections = updatedCollections.sort((a, b) => a.position - b.position);

      setCollectionsData(sortedCollections);

      // Show Changes to UI---------------------------------------------------------------------------------------------------
    }

    // Now, create a new blank row after deleting all the data
    const newBlankRow = {
      createdAt: serverTimestamp(),
      fireStationName: logginUser.username,
      collectingOfficer: null,
      dateCollected: null,
      orNumber: null,
      lcNumber: null,
      nameOfPayor: null,
      natureOfCollection: null,
      collectionAmount: null,
      status: null,
      depositStatus: null,
      depositID: null,
      position: 1, // Default position for the first row
    };

    // Add the new blank row to the original collections subcollection
    await addDoc(collectionsSubCollectionRef, newBlankRow);

    console.log('New blank row created successfully');

    // Hide the modal after completion
    setShowModal(false);
  } catch (error) {
    console.log(error);
  }
};

    //Right Click Functions
    const handleRightClick = (event,Collections) => {
      event.preventDefault(); 


       setSelectedRowData(Collections);

      
      // Set the modal position based on the mouse position
      setModalPosition({ x: event.clientX, y: event.clientY });
      setShowRightClickModal(true); // Open the modal


      
    };


    const handleHoverData = (collections) =>{

        // console.log(collection);
       setSelectedRowData(collections);
  
  }    
  

    const closeModalOnOutsideClick = (e) => {
      if (e.target.id === "user-modal-overlay") {
          setShowRightClickModal(false);
      }
    };


      //DELETE MAIN ACCOUNT
      const handleDeleteRow = async () => {

        if (!selectedRowData) return;

        try{

            //Reference directly
            const collectionsDataRef = collection(db, "firestationReportsCollections",logginUser.id,'collections');
            const selectedRowRef = doc(db, "firestationReportsCollections",logginUser.id,'collections',selectedRowData.id);

            await deleteDoc(selectedRowRef);
            
            //fetched the updated accounts after deletion
            const updatedSnapshot = await getDocs(collectionsDataRef);
            const updatedCollections = updatedSnapshot.docs.map((doc =>({id:doc.id, ...doc.data()})));

            //keep existing positions unless some rows need ajustments
            const sortedCollections = updatedCollections.sort((a,b) => a.position - b.position);

             // Optional: If the position gap between rows becomes too large, reassign positions.
             const shouldReassign = sortedCollections.some((collectionsData, index) => {
              const nextCollectionData = sortedCollections[index + 1];
              return nextCollectionData && (nextCollectionData.position - collectionsData.position) > 1;
            });
            
            if (shouldReassign) {
              const newCollections = sortedCollections.map((collectionsData, index) => ({
                  ...collectionsData,
                  position: parseFloat((index + 1).toFixed(10)), // Reassign positions only if necessary
              }));
  
              // Update Firestore with new positions
              const batch = writeBatch(db);
              newCollections.forEach(collectionsData => {
                  const collectionsRef = doc(collectionsDataRef, collectionsData.id);
                  batch.update(collectionsRef, { position: collectionsData.position });
              });
              await batch.commit();
            
          } else {

            setCollectionsData(sortedCollections);
        }

        setShowRightClickModal(false); // Close the modal
        }catch(error){
            console.error(error);
        }


    };

    
  

  return (
    <Fragment>
             
             <div className="flex flex-col space-y-6 w-full mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports - Collections
              </h1>
            </div>
          </div>

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


        {/*TABLE*/}
        <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-full">
        <button type="button" onClick={handleSubmit} class="absolute top-[-70px] right-10 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Submit</button>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
              <thead className="text-[12px] text-gray-700 uppercase bg-gray-100  dark:bg-gray-700 dark:text-gray-400">
                          <tr className="text-[12px]">
                              <th scope="col" className="px-2 py-3 w-40">Collecting Officer</th>
                              <th scope="col" className="px-2 py-3 w-36">Date Collected</th>
                              <th scope="col" className="px-2 py-3 w-36">OR Number</th>
                              <th scope="col" className="px-2 py-3 w-36">LC Number</th>
                              <th scope="col" className="px-2 py-3 w-36">Name of Payor</th>
                              <th scope="col" className="px-2 py-3 w-36">Nature of Collection</th>
                              <th scope="col" className="px-2 py-3 w-36">Amount</th>
                              <th scope="col" className=" w-[20px] "></th>
                          </tr>
              </thead>
            </table>

            
            <div className=' w-full overflow-y-scroll h-[calc(96vh-240px)] '>
            <table className='w-full overflow-x-visible'>
                  <tbody>
                  {collectionsData.map((collections) => (
                      <Fragment key={collections.id}>
                        <tr className=" text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                        onMouseEnter={(e) => { 
                          setHoveredRowId(collections.id); 
                          handleHoverData(collections); 
                        }}
                      onContextMenu={(e) => handleRightClick(e, collections)}  // Right-click functionality
                        >

                        <td className="table-cell px-2 w-40 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'collectingOfficer' ? (
                              <select

                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'collectingOfficer', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'collectingOfficer', editValue.value)}
                                autoFocus
                              >
                              <option value="" disabled>Select an officer</option>
                                {/* Dynamically render officers */}
                                {officersData.map((officer) => (
                                  <option key={officer.id} value={`${officer.firstname} ${officer.lastname}`}>
                                    {officer.firstname} {officer.lastname}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'collectingOfficer', value: collections.collectingOfficer || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.collectingOfficer || '-'}
                              </span>
                            )}

                          </td>

                          
                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'dateCollected' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'dateCollected', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'dateCollected', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'dateCollected', value: collections.dateCollected || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.dateCollected || '-'}
                              </span>
                            )}
                          </td>

                          

                          


                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'orNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'orNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'orNumber', value: collections.orNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.orNumber || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'lcNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'lcNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'lcNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'lcNumber', value: collections.lcNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.lcNumber || '-'}
                              </span>
                            )}
                          </td>


                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'nameOfPayor' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'nameOfPayor', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'nameOfPayor', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'nameOfPayor', value: collections.nameOfPayor || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.nameOfPayor || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'natureOfCollection' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'natureOfCollection', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'natureOfCollection', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'natureOfCollection', value: collections.natureOfCollection || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.natureOfCollection || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === collections.id && editValue.field === 'collectionAmount' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'collectionAmount', value: e.target.value })}
                                onBlur={() => handleCellChange(collections.id, 'collectionAmount', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(collections.id); setEditValue({ field: 'collectionAmount', value: collections.collectionAmount || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {collections.collectionAmount || '-'}
                              </span>
                            )}
                          </td>

                          {/* Add Row Button */}
                                                    <td className="px-2 py-5 w-0 relative z-10"> {/* Add relative position for button */}
                                                        {hoveredRowId === collections.id && (
                                                            <button
                                                                className="absolute left-[-10px] top-[49px] transform -translate-y-1/2 bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                                                onClick={handleAddRowBelow}
                                                            >
                                                                <IoMdAddCircleOutline />
                                                            </button>
                                                        )}
                                                    </td>
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
                          
                        </div>
                       
                    </div>
                 

                    <div className="flex justify-end py-3 px-4">
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4" 
                                onClick={handleSubmitDataToRegion}
                        >Submit</button>
                    </div>
                </div>
            </Modal>

            {/* Right-click context modal */}
            {showRightClickModal && (
                <div
                    id="user-modal-overlay"
                    className="fixed inset-0 flex justify-center items-center"
                    onClick={closeModalOnOutsideClick}
                    onContextMenu={(event) => closeModalOnOutsideClick(event)}
                >
                    <div
                    style={{ top: modalPosition.y, left: modalPosition.x }}
                    className="absolute z-10 bg-white shadow-lg rounded-lg p-2"
                    >
                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleAddRowAbove}
                    >
                        Add Row Above
                    </button>


                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleAddRowBelow}
                    >
                        Add Row Below
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleDeleteRow}
                    >
                        Delete Row
                    </button>
                    </div>
                </div>
                )}



    </Fragment>
    
  );
}