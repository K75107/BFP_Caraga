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

export default function FireStationDepositsUnsubmitted() {

  const navigate = useNavigate();

  const [firestationdeposit, setFirestationdeposit] = useState([]);
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

  //subNavigations
  const [isPending,setIsPending] =useState(true);


  //default classifications
  const accountCodes = [
    '628-BFP-01',
    '628-BFP-02',
    '628-BFP-03',
    '628-BFP-04',
    '628-BFP-05',
    '628-BFP-06',
    '628-BFP-07',
    '628-BFP-08',
    '628-BFP-09',
    '628-BFP-10',
    '628-BFP-11',

  ]

  useEffect(() => {
    const checkUserIndeposits = async (userEmail, deposits) => {
      const userFound = deposits.find((deposit) => deposit.email === userEmail);

      if (userFound) {
          // Set the logged-in user to global state
          setLogginUser(userFound);

          /*--------------------------------------------------deposits------------------------------------------------------------- */
          const depositsSubdepositRef = collection(db, 'firestationReportsDeposits', userFound.id, 'deposits');
          const snapshot = await getDocs(depositsSubdepositRef);

          // If there are no documents, create a default document
          if (snapshot.empty) {
              console.log('No documents in deposits subdeposit. Creating default document...');

              const defaultDoc = {
                  createdAt:serverTimestamp(),
                  fireStationName: userFound.username,
                  collectingAgent: null,
                  accountCode:null,
                  dateCollected: null,
                  orNumber: null,
                  lcNumber: null,
                  particulars:null,
                  natureOfdeposit:null,
                  depositAmount: null,
                  status:null,
                  depositStatus:null,
                  nameofDepositor:null,
                  depositID:null,
                  position: 1 // Default position for the first row
              };

              // Add default document with auto-generated ID
              const newDocRef = await addDoc(depositsSubdepositRef, defaultDoc);
              console.log('Default document created in deposits subdeposit:', newDocRef.id);

              // Immediately update the state with the new document
              const newDocument = { id: newDocRef.id, ...defaultDoc };
              setdepositsData([newDocument]); // Update with the new default row

              // Optionally fetch existing documents to merge them
              const subdepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              const sortedSubdepositDocs = subdepositDocs.sort((a, b) => a.position - b.position); // Sort by position

              setdepositsData(prevData => [newDocument, ...sortedSubdepositDocs]); // Merge new document with any existing ones
          } else {
              // Fetch and sort subdeposit documents by position
              const subdepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              const sortedSubdepositDocs = subdepositDocs.sort((a, b) => a.position - b.position); // Sort by position

              setdepositsData(sortedSubdepositDocs); // Update state with sorted documents
          }

          /*------------------------------------------------------------------------------------------------------------------ */

          // Fetch Collecting Officer data
          const officersSubdepositRef = collection(db, 'firestationReportsOfficers', userFound.id, 'officers');
          const officerSnapshot = await getDocs(officersSubdepositRef);

          const officerDocs = officerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOfficersData(officerDocs);

      } else {
          console.log('User not found in unsubmitted deposits');
      }
  };

  // Set up a listener for the unsubmitted deposits
  const unsubmitdepositRef = collection(db, 'firestationReportsDeposits');
  const unsubscribeUnsubmitdeposits = onSnapshot(unsubmitdepositRef, (snapshot) => {
      const listdeposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestationdeposit(listdeposits); // Update state with fetched data

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




  


  const handleCellChange = async (depositId, field, newValue) => {
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
        console.error('No unsubmitted deposit found for the logged-in user.');
        return;
      }
  
      // Check if the subdeposit 'deposits' exists for the user's document
      const depositsSubdepositRef = collection(db, 'firestationReportsDeposits', userDoc.id, 'deposits');
      const docSnapshot = await getDoc(doc(depositsSubdepositRef, depositId));
  
      if (!docSnapshot.exists()) {
        console.error(`No deposit document found with ID ${depositId}.`);
        return;
      }
  
      const existingData = docSnapshot.data();
  
      // Only update if there is a change in value
      if (existingData[field] === newValue) {
        console.log('No changes detected, skipping update.');
        return;
      }
  
      // Update the specific field of the deposit document
      await updateDoc(doc(depositsSubdepositRef, depositId), {
        [field]: newValue
      });
  
      // Update the local state after a successful update
      setdepositsData(prevdeposits =>
        prevdeposits.map(deposit =>
          deposit.id === depositId ? { ...deposit, [field]: newValue } : deposit
        )
      );
  
      // Clear the editing state after a successful update
      setEditingCell(null);
      setEditValue('');
  
    } catch (error) {
      console.error('Error updating deposit field:', error);
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
      const depositRef = collection(db, 'firestationReportsDeposits', logginUser.id, 'deposits');
      
      // Fetch and sort existing rows
      const depositsDataSnapshot = await getDocs(depositRef);
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
        collectingAgent: null,
        accountCode:null,
        dateCollected: null,
        orNumber: null,
        lcNumber: null,
        particulars:null,
        natureOfdeposit:null,
        depositAmount: null,
        nameofDepositor:null,
        status:null,
        depositStatus:null,
        depositID:null,
        position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
      };




      // Add the new row to Firestore
      const newRowDataRef = await addDoc(depositRef, newRowData);

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
    const depositRef = collection(db, 'firestationReportsDeposits', logginUser.id, 'deposits');
    
    // Fetch and sort existing rows
    const depositsDataSnapshot = await getDocs(depositRef);
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
      collectingAgent: null,
      accountCode:null,
      dateCollected: null,
      orNumber: null,
      lcNumber: null,
      particulars:null,
      natureOfdeposit:null,
      depositAmount: null,
      nameofDepositor:null,
      status:null,
      depositStatus:null,
      depositID:null,
      position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
    };



    // Add the new row to Firestore
    const newRowDataRef = await addDoc(depositRef, newRowData);

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
    // Reference to the submittedReportsdeposits (without logginUser.id initially)
    const submittedReportsdepositRef = collection(db, 'submittedReportsDeposits');

    // First, create a document for the logginUser.id with email and username
    const userDocRef = doc(submittedReportsdepositRef, logginUser.id);
    await setDoc(userDocRef, {
      email: logginUser.email,
      username: logginUser.username,
      date_created: serverTimestamp(), // Optional: track when this document was created
    });

    console.log('User document created successfully with email and username.');

    // Now, reference the specific subdeposit under the newly created logginUser.id document
    const depositsSubdepositRef = collection(
      db,
      'firestationReportsDeposits',
      logginUser.id,
      'deposits'
    );

    // Fetch the value of deposits
    const depositsSnapshot = await getDocs(depositsSubdepositRef);

    if (depositsSnapshot.empty) {
      console.log('No documents inside the deposits');
    } else {
      // Create an array of promises for each document to be added and deleted
      const submissionPromises = depositsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        // Check if the row is not empty (you can add more fields to this check if needed)
        if (
          data.collectingAgent &&
          data.dateCollected &&
          data.depositAmount &&
          data.particulars &&
          data.natureOfdeposit &&
          data.nameofDepositor &&
          (data.orNumber || data.lcNumber)
        ){
          // Prepare the new data with a submission timestamp
          const newData = {
            ...data,
            date_submitted: serverTimestamp(),
          };

          // Reference the subdeposit under the logginUser.id document in submittedReportsdeposits
          const userSubmittedReportsRef = collection(
            db,
            'submittedReportsDeposits',
            logginUser.id,
            'deposits'
          );

          // Add the new data to the submitted reports subdeposit
          await addDoc(userSubmittedReportsRef, newData);

          // Delete the document from the original deposits after it's submitted
          await deleteDoc(docSnapshot.ref);
        }
      });

      // Wait for all documents to be processed
      await Promise.all(submissionPromises);

      // Show Changes to UI---------------------------------------------------------------------------------------------------
      const depositsDataRef = collection(db, 'firestationReportsDeposits', logginUser.id, 'deposits');

      // Fetch the updated accounts after deletion
      const updatedSnapshot = await getDocs(depositsDataRef);
      const updateddeposits = updatedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Keep existing positions unless some rows need adjustments
      const sorteddeposits = updateddeposits.sort((a, b) => a.position - b.position);

      setdepositsData(sorteddeposits);

      // Show Changes to UI---------------------------------------------------------------------------------------------------
    }

    // Now, create a new blank row after deleting all the data
    const newBlankRow = {
      createdAt: serverTimestamp(),
      fireStationName: logginUser.username,
      collectingAgent: null,
      accountCode:null,
      dateCollected: null,
      orNumber: null,
      lcNumber: null,
      particulars: null,
      depositAmount: 0,
      nameofDepositor:null,
      status: null,
      depositStatus: null,
      depositID: null,
      position: 1, // Default position for the first row
    };

    // Add the new blank row to the original deposits subdeposit
    await addDoc(depositsSubdepositRef, newBlankRow);

    console.log('New blank row created successfully');

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

        // console.log(deposit);
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
              const nextdepositData = sorteddeposits[index + 1];
              return nextdepositData && (nextdepositData.position - depositsData.position) > 1;
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
             
             <div className="flex flex-col space-y-6 w-full mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports - Deposits
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
                    onClick={() => navigate("/main/firestation/deposits/unsubmitted")}
                    className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
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
                    onClick={() => navigate("/main/firestation/deposits/submitted")}
                    className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100 "
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
                              <th scope="col" className="px-2 py-3 w-40">Collecting Agent</th>
                              <th scope="col" className="px-2 py-3 w-36">Account Code</th>
                              <th scope="col" className="px-2 py-3 w-36">Date Collected</th>
                              <th scope="col" className="px-2 py-3 w-36">Date Deposited</th>
                              <th scope="col" className="px-2 py-3 w-36">OR Number</th>
                              <th scope="col" className="px-2 py-3 w-36">LC Number</th>
                              <th scope="col" className="px-2 py-3 w-36">Particulars</th>
                              <th scope="col" className="px-2 py-3 w-36">Amount</th>
                              <th scope="col" className="px-2 py-3 w-36">Name of Depositor</th>
                              <th scope="col" className=" w-[20px] "></th>
                          </tr>
              </thead>
            </table>

            
            <div className=' w-full overflow-y-scroll h-[calc(96vh-240px)] '>
            <table className='w-full overflow-x-visible'>
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

                          <td className="table-cell px-2 w-40 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'collectingAgent' ? (
                              <select

                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px] text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'collectingAgent', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'collectingAgent', editValue.value)}
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
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'collectingAgent', value: deposits.collectingAgent || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.collectingAgent || '-'}
                              </span>
                            )}

                          </td>
                          <td className="table-cell px-2 w-40 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'accountCode' ? (
                              <select

                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px] text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'accountCode', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'accountCode', editValue.value)}
                                autoFocus
                              >
                              <option value="" disabled>Select an officer</option>
                              {accountCodes.map((accountcode,index)=>(
                                  <option key={index} value={accountcode}>{accountcode}</option>

                              ))}
                              </select>
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'accountCode', value: deposits.accountCode || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.accountCode || '-'}
                              </span>
                            )}

                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'dateCollected' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px] "
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'dateCollected', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'dateCollected', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'dateCollected', value: deposits.dateCollected || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px] "
                              >
                                {deposits.dateCollected || '-'}
                              </span>
                            )}
                          </td>
                          

                          
                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'dateDeposited' ? (
                              <input
                                type="date"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px] "
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'dateDeposited', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'dateDeposited', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'dateDeposited', value: deposits.dateDeposited || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px] "
                              >
                                {deposits.dateDeposited || '-'}
                              </span>
                            )}
                          </td>
                          
                          


                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'orNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'orNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'orNumber', value: deposits.orNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.orNumber || '-'}
                              </span>
                            )}
                          </td>

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'lcNumber' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'lcNumber', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'lcNumber', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'lcNumber', value: deposits.lcNumber || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.lcNumber || '-'}
                              </span>
                            )}
                          </td>


                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'particulars' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'particulars', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'particulars', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'particulars', value: deposits.particulars || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.particulars || '-'}
                              </span>
                            )}
                          </td>

                  

                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'depositAmount' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'depositAmount', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'depositAmount', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'depositAmount', value: deposits.depositAmount || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.depositAmount || '-'}
                              </span>
                            )}
                          </td>
                          <td className="table-cell px-2 py-2 w-36 text-[12px]">
                            {editingCell === deposits.id && editValue.field === 'nameofDepositor' ? (
                              <input
                                type="text"
                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'nameofDepositor', value: e.target.value })}
                                onBlur={() => handleCellChange(deposits.id, 'nameofDepositor', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(deposits.id); setEditValue({ field: 'nameofDepositor', value: deposits.nameofDepositor || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px]"
                              >
                                {deposits.nameofDepositor || '-'}
                              </span>
                            )}
                          </td>

                          {/* Add Row Button */}
                                                    <td className="px-2 py-5 w-0 relative z-10"> {/* Add relative position for button */}
                                                        {hoveredRowId === deposits.id && (
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
