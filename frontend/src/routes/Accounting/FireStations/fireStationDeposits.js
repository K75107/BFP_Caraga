import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc,getDoc,doc,updateDoc,serverTimestamp,setDoc,deleteDoc,writeBatch } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";
import Modal from "../../../components/Modal"

import { IoMdAddCircleOutline } from "react-icons/io";

export default function FireStationDeposit() {
  const [firestationDeposit, setFirestationDeposit] = useState([]);
  const [depositsData, setdepositsData] = useState([]);

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


  useEffect(() => {
    const checkUserIndeposits = async (userEmail, deposits) => {
        const userFound = deposits.find((Deposit) => Deposit.email === userEmail);

        if (userFound) {
            // Set the logged-in user to global state
            setLogginUser(userFound);

            /*--------------------------------------------------deposits------------------------------------------------------------- */
            const depositsSubDepositRef = collection(db, 'firestationReportsDeposits', userFound.id, 'deposits');
            const snapshot = await getDocs(depositsSubDepositRef);

            // If there are no documents, create a default document
            if (snapshot.empty) {
                console.log('No documents in deposits subDeposit. Creating default document...');

                const defaultDoc = {
                    createdAt:serverTimestamp(),
                    fireStationName: userFound.username,
                    opsDate: null,
                    opsNumber:null,
                    opsAmount:null,
                    orDate:null,
                    orNumber:null,
                    payorName:null, 
                    firecodeClassification: null,
                    amountPaid:null,
                    position: 1 // Default position for the first row
                };

                // Add default document with auto-generated ID
                const newDocRef = await addDoc(depositsSubDepositRef, defaultDoc);
                console.log('Default document created in deposits subDeposit:', newDocRef.id);

                // Immediately update the state with the new document
                const newDocument = { id: newDocRef.id, ...defaultDoc };
                setdepositsData([newDocument]); // Update with the new default row

                // Optionally fetch existing documents to merge them
                const subDepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sortedSubDepositDocs = subDepositDocs.sort((a, b) => a.position - b.position); // Sort by position

                setdepositsData(prevData => [newDocument, ...sortedSubDepositDocs]); // Merge new document with any existing ones
            } else {
                // Fetch and sort subDeposit documents by position
                const subDepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sortedSubDepositDocs = subDepositDocs.sort((a, b) => a.position - b.position); // Sort by position

                setdepositsData(sortedSubDepositDocs); // Update state with sorted documents
            }

            /*------------------------------------------------------------------------------------------------------------------ */

            // Fetch Collecting Officer data
            const officersSubDepositRef = collection(db, 'firestationReportsOfficers', userFound.id, 'officers');
            const officerSnapshot = await getDocs(officersSubDepositRef);

            const officerDocs = officerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOfficersData(officerDocs);

        } else {
            console.log('User not found in unsubmitted deposits');
        }
    };

    // Set up a listener for the unsubmitted deposits
    const unsubmitDepositRef = collection(db, 'firestationReportsDeposits');
    const unsubscribeUnsubmitdeposits = onSnapshot(unsubmitDepositRef, (snapshot) => {
        const listdeposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationDeposit(listdeposits); // Update state with fetched data

        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Check if the logged-in user is part of the deposits
                checkUserIndeposits(user.email, listdeposits);
            } else {
                console.log('No user is currently logged in');
            }
        });
    });

    return () => {
        unsubscribeUnsubmitdeposits(); // Unsubscribe from Firestore snapshot listener
    };
}, []);





  


  const handleCellChange = async (DepositId, field, newValue) => {
    try {
      // Fetch the current authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        console.error('No logged-in user found.');
        return;
      }
  
      // Check if the logged-in user's email matches any document in firestationReportsDeposits
      const firestationReportsSnapshot = await getDocs(collection(db, 'firestationReportsDeposits'));
  
      // Find the document where the email matches the logged-in user's email
      const userDoc = firestationReportsSnapshot.docs.find(doc => doc.data().email === user.email);
  
      if (!userDoc) {
        console.error('No unsubmitted Deposit found for the logged-in user.');
        return;
      }
  
      // Check if the subDeposit 'deposits' exists for the user's document
      const depositsSubDepositRef = collection(db, 'firestationReportsDeposits', userDoc.id, 'deposits');
      const docSnapshot = await getDoc(doc(depositsSubDepositRef, DepositId));
  
      if (!docSnapshot.exists()) {
        console.error(`No Deposit document found with ID ${DepositId}.`);
        return;
      }
  
      const existingData = docSnapshot.data();
  
      // Only update if there is a change in value
      if (existingData[field] === newValue) {
        console.log('No changes detected, skipping update.');
        return;
      }
  
      // Update the specific field of the Deposit document
      await updateDoc(doc(depositsSubDepositRef, DepositId), {
        [field]: newValue
      });
  
      // Update the local state after a successful update
      setdepositsData(prevdeposits =>
        prevdeposits.map(Deposit =>
          Deposit.id === DepositId ? { ...Deposit, [field]: newValue } : Deposit
        )
      );
  
      // Clear the editing state after a successful update
      setEditingCell(null);
      setEditValue('');
  
    } catch (error) {
      console.error('Error updating Deposit field:', error);
    }
  };




  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };


  const handleAddRowBelow = async () => {
    if (!selectedRowData || !depositsData || isLoading) return;

    setIsLoading(true);

    try {
      // Reference the deposits data
      const DepositRef = collection(db, 'firestationReportsDeposits', logginUser.id, 'deposits');
      
      // Fetch and sort existing rows
      const depositsDataSnapshot = await getDocs(DepositRef);
      const sortedRows = depositsDataSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.position - b.position);

      // Find the position of the selected row
      const selectedRowPosition = selectedRowData.position;

      // Find the next row after the selected one
      const nextRow = sortedRows.find(firedeposits => firedeposits.position > selectedRowPosition);

      // Calculate the new position (midpoint or +1)
      const newRowPosition = nextRow
        ? (selectedRowPosition + nextRow.position) / 2
        : selectedRowPosition + 1;

      // console.log(newRowPosition);


      // Create new data with its position
      const newRowData = {
        createdAt:serverTimestamp(),
        fireStationName: logginUser.username,
        opsDate: null,
        opsNumber:null,
        opsAmount:null,
        orDate:null,
        orNumber:null,
        payorName:null, 
        firecodeClassification: null,
        amountPaid:null,
        position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
      };

      // Add the new row to Firestore
      const newRowDataRef = await addDoc(DepositRef, newRowData);

      // Fetch the new row's ID and add it to the new row data
      const newRowWithId = {
        ...newRowData,
        id: newRowDataRef.id,
      };

      // Update the local state by adding the new row and re-sorting
      setdepositsData(prevData => 
        [...prevData, newRowWithId].sort((a, b) => a.position - b.position)
      );

    } catch (error) {
        console.error('Error adding row below:', error.message || error);
    } finally {
        setIsLoading(false);
    }
};

const handleAddRowAbove = async () => {
  if (!selectedRowData || !depositsData || isLoading) return;

  setIsLoading(true);

  try {
    // Reference the deposits data
    const DepositRef = collection(db, 'firestationReportsDeposits', logginUser.id, 'deposits');
    
    // Fetch and sort existing rows
    const depositsDataSnapshot = await getDocs(DepositRef);
    const sortedRows = depositsDataSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.position - b.position);

    // Find the position of the selected row
    const selectedRowPosition = selectedRowData.position;

    // Find the next row after the selected one
    const prevRow = sortedRows.find(firedeposits => firedeposits.position < selectedRowPosition);

    // Calculate the new position (midpoint or +1)
    const newRowPosition = prevRow
      ? (selectedRowPosition + prevRow.position) / 2
      : selectedRowPosition - 1;

    // console.log(newRowPosition);


    // Create new data with its position
    const newRowData = {
      createdAt:serverTimestamp(),
      fireStationName: logginUser.username,
      opsDate: null,
      opsNumber:null,
      opsAmount:null,
      orDate:null,
      orNumber:null,
      payorName:null, 
      firecodeClassification: null,
      amountPaid:null,
      position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
    };

    // Add the new row to Firestore
    const newRowDataRef = await addDoc(DepositRef, newRowData);

    // Fetch the new row's ID and add it to the new row data
    const newRowWithId = {
      ...newRowData,
      id: newRowDataRef.id,
    };

    // Update the local state by adding the new row and re-sorting
    setdepositsData(prevData => 
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
    // Reference to the submittedReportsDeposits (without logginUser.id initially)
    const submittedReportsDepositRef = collection(db, 'submittedReportsDeposits');

    // First, create a document for the logginUser.id with email and username
    const userDocRef = doc(submittedReportsDepositRef, logginUser.id);
    await setDoc(userDocRef, {
      email: logginUser.email,
      username: logginUser.username,
      date_created: serverTimestamp() // Optional: track when this document was created
    });

    console.log('User document created successfully with email and username.');

    // Now, reference the specific subDeposit under the newly created logginUser.id document
    const depositsSubDepositRef = collection(
      db,
      'firestationReportsDeposits',
      logginUser.id,
      'deposits'
    );

    // Fetch the value of deposits
    const depositsSnapshot = await getDocs(depositsSubDepositRef);

    if (depositsSnapshot.empty) {
      console.log("No documents inside the deposits");
    } else {
      // Create an array of promises for each document to be added and deleted
      const submissionPromises = depositsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        // Prepare the new data with a submission timestamp
        const newData = {
          ...data,
          date_submitted: serverTimestamp(),
        };

        // Reference the subDeposit under the logginUser.id document in submittedReportsDeposits
        const userSubmittedReportsRef = collection(
          db,
          'submittedReportsDeposits',
          logginUser.id,
          'deposits'
        );

        // Add the new data to the submitted reports subDeposit
        await addDoc(userSubmittedReportsRef, newData);

        // Delete the document from the original deposits after it's submitted
        await deleteDoc(docSnapshot.ref);
      });

      // Wait for all documents to be processed
      await Promise.all(submissionPromises);

      // console.log("All documents submitted and deleted successfully");
    }

    // Now, create a new blank row after deleting all the data
    const newBlankRow = {
      createdAt:serverTimestamp(),
      fireStationName: logginUser.username,
      collectingOfficer: null,
      lcNumber: null,
      date: null,
      orNumber: null,
      amount: null,
      position: 1 // Default position for the first row
    };

    // Add the new blank row to the original deposits subDeposit
    await addDoc(depositsSubDepositRef, newBlankRow);

    // console.log("New blank row created successfully");

    //Show changes immediately to UI-----------------------------------------------------------------------------
      
      const depositsDataRef = collection(db, "firestationReportsDeposits",logginUser.id,'deposits');
            
      //fetched the updated accounts after deletion
      const updatedSnapshot = await getDocs(depositsDataRef);
      const updateddeposits = updatedSnapshot.docs.map((doc =>({id:doc.id, ...doc.data()})));

      //keep existing positions unless some rows need ajustments
      const sortedDeposits = updateddeposits.sort((a,b) => a.position - b.position);

      setdepositsData(sortedDeposits);
      
      //Show changes immediately to UI-----------------------------------------------------------------------------


    // Hide the modal after completion
    setShowModal(false);

  } catch (error) {
    console.log(error);
  }
};

    //Right Click Functions
    const handleRightClick = (event,deposits) => {
      event.preventDefault(); 


       setSelectedRowData(deposits);

      
      // Set the modal position based on the mouse position
      setModalPosition({ x: event.clientX, y: event.clientY });
      setShowRightClickModal(true); // Open the modal


      
    };


    const handleHoverData = (deposits) =>{

        // console.log(Deposit);
       setSelectedRowData(deposits);
  
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
            const depositsDataRef = collection(db, "firestationReportsDeposits",logginUser.id,'deposits');
            const selectedRowRef = doc(db, "firestationReportsDeposits",logginUser.id,'deposits',selectedRowData.id);

            await deleteDoc(selectedRowRef);
            
            //fetched the updated accounts after deletion
            const updatedSnapshot = await getDocs(depositsDataRef);
            const updateddeposits = updatedSnapshot.docs.map((doc =>({id:doc.id, ...doc.data()})));

            //keep existing positions unless some rows need ajustments
            const sorteddeposits = updateddeposits.sort((a,b) => a.position - b.position);

             // Optional: If the position gap between rows becomes too large, reassign positions.
             const shouldReassign = sorteddeposits.some((depositsData, index) => {
              const nextDepositData = sorteddeposits[index + 1];
              return nextDepositData && (nextDepositData.position - depositsData.position) > 1;
            });
            
            if (shouldReassign) {
              const newdeposits = sorteddeposits.map((depositsData, index) => ({
                  ...depositsData,
                  position: parseFloat((index + 1).toFixed(10)), // Reassign positions only if necessary
              }));
  
              // Update Firestore with new positions
              const batch = writeBatch(db);
              newdeposits.forEach(depositsData => {
                  const depositsRef = doc(depositsDataRef, depositsData.id);
                  batch.update(depositsRef, { position: depositsData.position });
              });
              await batch.commit();
            
          } else {

            setdepositsData(sorteddeposits);
        }

        setShowRightClickModal(false); // Close the modal
        }catch(error){
            console.error(error);
        }


    };

    
  

  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
            Fire Station Reports - deposits
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
        <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-full">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
            <thead className="text-[12px] text-gray-700 uppercase bg-gray-100  dark:bg-gray-700 dark:text-gray-400">
                        <tr className="text-[12px]">
                            <th scope="col" className="px-2 py-3 w-36">OPS DATE</th>
                            <th scope="col" className="px-2 py-3 w-1/6">OPS NUMBER</th>
                            <th scope="col" className="px-2 py-3 w-1/6">OPS AMOUNT</th>
                            <th scope="col" className="px-2 py-3 w-36">OR DATE</th>
                            <th scope="col" className="px-2 py-3 w-1/6">OR NUMBER</th>
                            <th scope="col" className="px-2 py-3 w-1/6">PAYOR NAME</th>
                            <th scope="col" className="px-2 py-3 w-1/6">FIRECODE CLASSIFICATION</th>
                            <th scope="col" className="px-2 py-3 w-1/6">AMOUNT PAID</th>
                            <th scope="col" className="w-[0px]"></th>
                        </tr>
                  </thead>
                  <tbody>
                  {depositsData.map((deposits) => (
                      <Fragment key={deposits.id}>
                        <tr className=" text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                        onMouseEnter={(e) => { 
                          setHoveredRowId(deposits.id); 
                          handleHoverData(deposits); 
                        }}
                      onContextMenu={(e) => handleRightClick(e, deposits)}  // Right-click functionality
                        >
                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'opsDate' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-36 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'opsDate', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'opsDate', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'opsDate', value: deposits.opsDate || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-36 px-2 py-1"
                              >
                                {deposits.opsDate || '-'}
                              </span>
                            )}
                          </td>

                          

                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'opsNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'opsNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'opsNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'opsNumber', value: deposits.opsNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.opsNumber || '-'}
                              </span>
                            )}
                          </td>


                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'opsAmount' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'opsAmount', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'opsAmount', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'opsAmount', value: deposits.opsAmount || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.opsAmount || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'orDate' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-36 h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orDate', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'orDate', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'orDate', value: deposits.orDate || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-36 px-2 py-1"
                              >
                                {deposits.orDate || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'orNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'orNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'orNumber', value: deposits.orNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.orNumber || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'payorName' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'payorName', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'payorName', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'payorName', value: deposits.payorName || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.payorName || '-'}
                              </span>
                            )}
                          </td>                         

                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'firecodeClassification' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'firecodeClassification', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'firecodeClassification', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'firecodeClassification', value: deposits.firecodeClassification || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.firecodeClassification || '-'}
                              </span>
                            )}
                          </td>          

                          <td className="table-cell px-2 py-2 w-1/8 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'amountPaid' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'amountPaid', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'amountPaid', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'amountPaid', value: deposits.amountPaid || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                              >
                                {deposits.amountPaid || '-'}
                              </span>
                            )}
                          </td>

                          {hoveredRowId === deposits.id && (
                                <td className="relative right-8 mr-1 text-[12px]">  {/* Position the button absolutely */}
                                <button
                                    className="mt-2 bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                    style={{ position: 'absolute', right: '-50px' }}  // Adjust position as needed
                                    onClick={handleAddRowBelow}
                                    disabled={isLoading} 
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
