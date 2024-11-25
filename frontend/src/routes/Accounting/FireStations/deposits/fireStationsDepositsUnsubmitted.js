import React, { useState, Fragment, useEffect } from "react";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc, getDoc, doc, updateDoc, serverTimestamp, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from "../../../../config/firebase-config";
import Modal from "../../../../components/Modal"
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from "react-router-dom";
import { IoMdAddCircleOutline } from "react-icons/io";
import { debounce } from 'lodash'; // Import debounce from lodash for debouncing updates
import SubmitButton from "../../../../components/submitButton";

export default function FireStationDepositsUnsubmitted() {

  const navigate = useNavigate();

  const [firestationdeposit, setFirestationdeposit] = useState([]);
  const [depositsData, setDepositsData] = useState([]);
  console.log("data of depositsData: ", depositsData);
  //Hover on Rows
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  console.log("data of editValue: ", editValue);

  //Modal
  const [showModal, setShowModal] = useState(false);
  const [officersData, setOfficersData] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  //Modal II
  const [showModal2, setShowModal2] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dataCollection, setDataCollection] = useState([]);

  console.log("data of dataCollection", dataCollection);
  console.log("data of selectedCategories", selectedCategories);

  //Right click Modal
  const [showRightClickModal, setShowRightClickModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  //Loggin User
  const [logginUser, setLogginUser] = useState('');
  console.log("data of logginUser", logginUser);
  //loading
  const [isLoading, setIsLoading] = useState(false);  // New loading state

  //subNavigations
  const [isPending, setIsPending] = useState(true);


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
            createdAt: serverTimestamp(),
            fireStationName: userFound.username,
            collectingAgent: null,
            accountCode: null,
            dateCollectedStart: null,
            dateCollectedEnd: null,
            orNumber: null,
            lcNumber: null,
            particulars: null,
            natureOfdeposit: null,
            depositAmount: null,
            status: null,
            depositStatus: false,
            nameofDepositor: null,
            depositID: null,
            position: 1 // Default position for the first row
          };

          // Add default document with auto-generated ID
          const newDocRef = await addDoc(depositsSubdepositRef, defaultDoc);
          console.log('Default document created in deposits subdeposit:', newDocRef.id);

          // Immediately update the state with the new document
          const newDocument = { id: newDocRef.id, ...defaultDoc };
          setDepositsData([newDocument]); // Update with the new default row

          // Optionally fetch existing documents to merge them
          const subdepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedSubdepositDocs = subdepositDocs.sort((a, b) => a.position - b.position); // Sort by position

          setDepositsData(prevData => [newDocument, ...sortedSubdepositDocs]); // Merge new document with any existing ones
        } else {
          // Fetch and sort subdeposit documents by position
          const subdepositDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedSubdepositDocs = subdepositDocs.sort((a, b) => a.position - b.position); // Sort by position

          setDepositsData(sortedSubdepositDocs); // Update state with sorted documents
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







  const handleCellChange = async (collectionId, field, newValue) => {
    try {
      // Optimistic update: Update local state immediately
      setDepositsData(prevCollections =>
        prevCollections.map(collection =>
          collection.id === collectionId ? { ...collection, [field]: newValue } : collection
        )
      );

      // Debounced Firebase update to avoid too frequent writes
      debouncedUpdate(collectionId, field, newValue);

      // Clear editing state
      setEditingCell(null);
      setEditValue('');

    } catch (error) {
      console.error('Error updating collection field:', error);
    }
  };

  // Debounced function to handle Firebase update
  const debouncedUpdate = debounce(async (depositId, field, newValue) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        // console.error('No logged-in user found.');
        return;
      }

      const firestationReportsSnapshot = await getDocs(collection(db, 'firestationReportsDeposits'));

      const userDoc = firestationReportsSnapshot.docs.find(doc => doc.data().email === user.email);

      if (!userDoc) {
        // console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }

      const collectionsSubCollectionRef = collection(db, 'firestationReportsDeposits', userDoc.id, 'deposits');
      const docSnapshot = await getDoc(doc(collectionsSubCollectionRef, depositId));

      if (!docSnapshot.exists()) {
        // console.error(`No collection document found with ID ${depositId}.`);
        return;
      }

      const existingData = docSnapshot.data();

      if (existingData[field] === newValue) {
        // console.log('No changes detected, skipping update.');
        return;
      }

      await updateDoc(doc(collectionsSubCollectionRef, depositId), {
        [field]: newValue
      });
    } catch (error) {
      console.error('Error updating collection field:', error);
    }
  }, 1000); // Delay of 1 second for debouncing

  // ------------------------------------------  S U B M I T  M O D A L   I I  ------------------------------------------
  useEffect(() => {
    const getDataCollection = async () => {
      try {
        const submittedCollectionRef = collection(db, 'submittedReportsCollections', logginUser.id, 'collections');
        const collectionsSnapshot = await getDocs(submittedCollectionRef);

        const dataCollection = collectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Check if dataCollection is valid before setting state
        setDataCollection(dataCollection || []);
      } catch (err) {
        console.error("Error fetching ledger data:", err);
      }
    };

    getDataCollection();
  }, [logginUser]);


  // Extract unique months with years where depositStatus is null/false
  useEffect(() => {
    const months = Array.from(
      new Set(
        dataCollection
          .filter((item) => item.depositStatus === null || item.depositStatus === false)
          .map((item) =>
            new Date(item.dateCollected).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })
          )
      )
    );
    setAvailableMonths(months);
  }, [dataCollection]);


  // Filter data based on selected month and depositStatus
  useEffect(() => {
    if (selectedMonth) {
      const filtered = dataCollection.filter(
        (item) =>
          new Date(item.dateCollected).toLocaleString("default", {
            month: "long",
            year: "numeric",
          }) === selectedMonth &&
          (item.depositStatus === null || item.depositStatus === false)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [selectedMonth, dataCollection]);

  // Toggle checkbox selection
  const toggleCheckbox = (item) => {
    setSelectedCategories((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };
  // ------------------------------------------  S U B M I T  M O D A L   I I  ------------------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleSubmit2 = (e) => {
    e.preventDefault();
    setShowModal2(true);
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
        createdAt: serverTimestamp(),
        fireStationName: logginUser.username,
        collectingAgent: null,
        accountCode: null,
        dateCollectedStart: null,
        dateCollectedEnd: null,
        orNumber: null,
        lcNumber: null,
        particulars: null,
        natureOfdeposit: null,
        depositAmount: null,
        nameofDepositor: null,
        status: null,
        depositStatus: false,
        depositID: null,
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
      setDepositsData(prevData =>
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
        createdAt: serverTimestamp(),
        fireStationName: logginUser.username,
        collectingAgent: null,
        accountCode: null,
        dateCollectedStart: null,
        dateCollectedEnd: null,
        orNumber: null,
        lcNumber: null,
        particulars: null,
        natureOfdeposit: null,
        depositAmount: null,
        nameofDepositor: null,
        status: null,
        depositStatus: false,
        depositID: null,
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
      setDepositsData(prevData =>
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
          console.log("data of data: ", data);
          // Check if the row is not empty (you can add more fields to this check if needed)
          if (
            data.collectingAgent &&
            data.dateCollectedStart &&
            data.dateCollectedEnd &&
            data.dateDeposited &&
            data.depositAmount &&
            data.particulars &&
            data.nameofDepositor &&
            (data.orNumber || data.lcNumber)
          ) {
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

        setDepositsData(sorteddeposits);

        // Show Changes to UI---------------------------------------------------------------------------------------------------
      }

      // Now, create a new blank row after deleting all the data
      const newBlankRow = {
        createdAt: serverTimestamp(),
        fireStationName: logginUser.username,
        collectingAgent: null,
        accountCode: null,
        dateCollectedStart: null,
        dateCollectedEnd: null,
        orNumber: null,
        lcNumber: null,
        particulars: null,
        depositAmount: 0,
        nameofDepositor: null,
        status: null,
        depositStatus: false,
        depositID: null,
        position: 1, // Default position for the first row
      };

      // Add the new blank row to the original deposits subdeposit
      await addDoc(depositsSubdepositRef, newBlankRow);

      console.log('New blank row created successfully');

      // Hide the modal after completion
      setShowModal(false);


      // Update the undeposited Collections ------------------------------------------------------------------------------
      // try {
      //   // Reference to the 'submittedReportsDeposits' collection
      //   const submittedDepositsRef = collection(db, 'submittedReportsDeposits', logginUser.id, 'deposits');

      //   // Retrieve all documents in the 'submittedReportsDeposits' collection
      //   const depositsSnapshot = await getDocs(submittedDepositsRef);

      //   // Fetch all documents from the 'submittedReportsCollections' collection
      //   const submittedCollectionRef = collection(db, 'submittedReportsCollections', logginUser.id, 'collections');
      //   const collectionsSnapshot = await getDocs(submittedCollectionRef);

      //   // Loop through each deposit document in 'submittedReportsDeposits'
      //   depositsSnapshot.forEach(async (depositDoc) => {
      //     const depositData = depositDoc.data();
      //     const dateCollectedStart = depositData.dateCollectedStart; // Firestore Timestamp
      //     const dateCollectedEnd = depositData.dateCollectedEnd; // Firestore Timestamp

      //     if (!dateCollectedStart || !dateCollectedEnd) {
      //       console.warn(`Missing date range in deposit document: ${depositDoc.id}`);
      //       return; // Skip if date range is missing
      //     }

      //     // Loop through each collection document in 'submittedReportsCollections'
      //     collectionsSnapshot.forEach(async (collectionDoc) => {
      //       const collectionData = collectionDoc.data();
      //       const dateCollected = collectionData.dateCollected; // Firestore Timestamp

      //       // Check if dateCollected is within the specified date range
      //       if (dateCollected && dateCollected >= dateCollectedStart && dateCollected <= dateCollectedEnd) {
      //         const collectionDocRef = doc(db, 'submittedReportsCollections', logginUser.id, 'collections', collectionDoc.id);

      //         // Update the depositStatus
      //         await updateDoc(collectionDocRef, {
      //           depositStatus: true,
      //         });
      //       }
      //     });
      //   });
      // } catch (error) {
      //   console.error("Error updating depositStatus: ", error);
      // }
      // Update the undeposited Collections ------------------------------------------------------------------------------ 
      try {
        // Reference to the 'submittedReportsDeposits' collection
        const submittedDepositsRef = collection(db, 'submittedReportsDeposits', logginUser.id, 'deposits');

        // Retrieve all documents in the 'submittedReportsDeposits' collection
        const depositsSnapshot = await getDocs(submittedDepositsRef);

        // Fetch all documents from the 'submittedReportsCollections' collection
        const submittedCollectionRef = collection(db, 'submittedReportsCollections', logginUser.id, 'collections');
        const collectionsSnapshot = await getDocs(submittedCollectionRef);

        // Process only selected categories
        const selectedEntries = filteredData.filter((item) =>
          selectedCategories.includes(`${item.natureOfCollection} - ₱${item.collectionAmount}`)
        );

        // Loop through each selected entry to update the depositStatus
        for (const entry of selectedEntries) {
          const collectionDoc = collectionsSnapshot.docs.find(
            (doc) =>
              doc.data().natureOfCollection === entry.natureOfCollection &&
              doc.data().collectionAmount === entry.collectionAmount
          );

          if (collectionDoc) {
            const collectionDocRef = doc(
              db,
              'submittedReportsCollections',
              logginUser.id,
              'collections',
              collectionDoc.id
            );

            // Update the depositStatus
            await updateDoc(collectionDocRef, {
              depositStatus: true,
            });

            console.log(`Updated depositStatus for collection: ${entry.natureOfCollection}`);
          } else {
            console.warn(`No matching document found for: ${entry.natureOfCollection}`);
          }
        }
      } catch (error) {
        console.error("Error updating depositStatus: ", error);
      }




    } catch (error) {
      console.log(error);
    }
  };

  //Right Click Functions
  const handleRightClick = (event, deposits) => {
    event.preventDefault();


    setSelectedRowData(deposits);


    // Set the modal position based on the mouse position
    setModalPosition({ x: event.clientX, y: event.clientY });
    setShowRightClickModal(true); // Open the modal



  };


  const handleHoverData = (deposits) => {

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

    try {

      //Reference directly
      const depositsDataRef = collection(db, "firestationReportsDeposits", logginUser.id, 'deposits');
      const selectedRowRef = doc(db, "firestationReportsDeposits", logginUser.id, 'deposits', selectedRowData.id);

      await deleteDoc(selectedRowRef);

      //fetched the updated accounts after deletion
      const updatedSnapshot = await getDocs(depositsDataRef);
      const updateddeposits = updatedSnapshot.docs.map((doc => ({ id: doc.id, ...doc.data() })));

      //keep existing positions unless some rows need ajustments
      const sorteddeposits = updateddeposits.sort((a, b) => a.position - b.position);

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

        setDepositsData(sorteddeposits);
      }

      setShowRightClickModal(false); // Close the modal
    } catch (error) {
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

      {/* <div className="absolute top-[125px] right-12">
        <SubmitButton
          onClick={handleSubmit}
          label={"SUBMIT"}
        />
      </div> */}

      <div className="absolute top-[125px] right-12">
        <SubmitButton
          onClick={handleSubmit2}
          label={"SUBMIT"}
        />
      </div>




      {/*TABLE*/}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">

        <div className=' w-full overflow-y-scroll h-[calc(96vh-240px)] '>
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
            <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky ">
              <tr className="text-[12px]">
                <th scope="col" className="px-2 py-4 w-[160px]">Collecting Agent</th>
                <th scope="col" className="px-2 py-4 w-[288px] text-center">Date Collected</th>
                <th scope="col" className="px-2 py-4 w-[144px]">Date Deposited</th>
                <th scope="col" className="px-2 py-4 w-[144px]">OR Number</th>
                <th scope="col" className="px-2 py-4 w-[144px]">LC Number</th>
                <th scope="col" className="px-2 py-4 w-[144px]">Particulars</th>
                <th scope="col" className="px-2 py-4 w-[144px]">Amount</th>
                <th scope="col" className="px-2 py-4 w-[144px]">Depositor</th>
                <th scope="col" className=" w-[20px] "></th>
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

                    <td className="table-cell px-2 w-[160px] text-[12px]">
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

                    <td className="table-cell px-2 py-2 w-[288px] text-[12px]">
                      <div className="flex items-center space-x-2">
                        {/* Start Date (dateCollectedStart) */}
                        {editingCell === deposits.id && editValue.field === 'dateCollectedStart' ? (
                          <input
                            type="date"
                            className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                            value={editValue.startDate || ''}
                            onChange={(e) =>
                              setEditValue({ field: 'dateCollectedStart', startDate: e.target.value, endDate: deposits.dateCollectedEnd })
                            }
                            onBlur={() => handleCellChange(deposits.id, 'dateCollectedStart', editValue.startDate)}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setEditingCell(deposits.id) || setEditValue({ field: 'dateCollectedStart', startDate: deposits.dateCollectedStart })}
                            className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px] cursor-pointer"
                          >
                            {deposits.dateCollectedStart ? deposits.dateCollectedStart : 'From'}
                          </span>
                        )}

                        {/* End Date (dateCollectedEnd) */}
                        {editingCell === deposits.id && editValue.field === 'dateCollectedEnd' ? (
                          <input
                            type="date"
                            className="border border-gray-400 focus:outline-none w-full h-8 px-2 text-[12px]"
                            value={editValue.endDate || ''}
                            onChange={(e) =>
                              setEditValue({ field: 'dateCollectedEnd', startDate: deposits.dateCollectedStart, endDate: e.target.value })
                            }
                            onBlur={() => handleCellChange(deposits.id, 'dateCollectedEnd', editValue.endDate)}
                          />
                        ) : (
                          <span
                            onClick={() => setEditingCell(deposits.id) || setEditValue({ field: 'dateCollectedEnd', endDate: deposits.dateCollectedEnd })}
                            className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1 text-[12px] cursor-pointer"
                          >
                            {deposits.dateCollectedEnd ? deposits.dateCollectedEnd : 'To'}
                          </span>
                        )}
                      </div>
                    </td>





                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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




                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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

                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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


                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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



                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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
                    <td className="table-cell px-2 py-2 w-[144px] text-[12px]">
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


            </div>

          </div>


          <div className="flex justify-end py-3 px-4">
            <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4"
              onClick={handleSubmitDataToRegion}
            >Submit</button>
          </div>
        </div>
      </Modal>

      {/*Submit Modal II*/}
      <Modal isVisible={showModal2}>
        <div className="bg-white w-[600px] h-auto rounded-lg py-4 px-4 shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-poppins font-bold text-xl text-gray-700">Submit Unsubmitted Deposits / Undeposited Reports</h1>
            <button
              className="text-2xl font-semibold text-gray-500 focus:outline-none"
              onClick={() => {
                setSelectedMonth("");
                setSelectedCategories([]); // Reset selected checkboxes
                setShowModal2(false);

              }}
            >
              ×
            </button>
          </div>
          <hr className="border-t border-[#7694D4] -my-1" />

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow items-center">
            {/* Dropdown for month-year selection */}
            <div className="w-full max-w-[500px] mb-4">
              <label htmlFor="monthDropdown" className="font-semibold text-sm text-gray-700 mb-2">
                Select Month:
              </label>
              <select
                id="monthDropdown"
                className="block w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="" disabled>
                  -- Select a Month --
                </option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes for filtered data */}
            <div className="w-full max-w-[500px] mb-4">
              <h2 className="font-semibold text-sm text-gray-700 mb-2">Select Reports:</h2>
              <ul className="h-40 px-3 pb-3 overflow-y-auto text-sm text-gray-700 border rounded-lg">
                {availableMonths.length === 0 ? (
                  <li className="mt-14 text-center text-gray-500">No Undeposited Reports Remaining</li>
                ) : (
                  filteredData.map((item, index) => {
                    const uniqueIdentifier = `${item.natureOfCollection} - ₱${item.collectionAmount}`;
                    return (
                      <li key={index} className="flex items-center p-2 hover:bg-gray-200 active:bg-gray-300">
                        <label className="flex items-center w-full cursor-pointer">
                          {/* Display natureOfCollection and collectionAmount */}
                          <span className="flex-grow text-sm text-gray-900">
                            {item.natureOfCollection} - ₱{item.collectionAmount}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(uniqueIdentifier)}
                            onChange={() => toggleCheckbox(uniqueIdentifier)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>

            </div>
          </div>

          {/* Footer */}
          <div className="mb-2 flex justify-center">
            {/* Cancel Button */}
            <button
              type="button"
              className="w-full max-w-[240px] text-white bg-blue-600 hover:bg-blue-700 font-poppins text-sm font-medium py-2 px-8 rounded-lg mr-2"
              onClick={() => {
                setSelectedCategories([]); // Reset selected checkboxes
                setSelectedMonth("");
                setShowModal2(false);
              }}
            >
              Cancel
            </button>

            {/* Apply Button */}
            <button
              type="button"
              className={`w-full max-w-[240px] text-white bg-blue-600 hover:bg-blue-700 font-poppins text-sm font-medium py-2 px-8 rounded-lg ${(selectedCategories.length === 0 && depositsData.some(
                (deposit) =>
                  !deposit.collectingAgent ||
                  !deposit.dateCollectedStart ||
                  !deposit.dateCollectedEnd ||
                  !deposit.dateDeposited ||
                  !deposit.depositAmount ||
                  !deposit.particulars ||
                  !deposit.nameofDepositor ||
                  !(deposit.orNumber || deposit.lcNumber) // At least one of these is required
              )) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={
                selectedCategories.length === 0 &&
                depositsData.some(
                  (deposit) =>
                    !deposit.collectingAgent ||
                    !deposit.dateCollectedStart ||
                    !deposit.dateCollectedEnd ||
                    !deposit.dateDeposited ||
                    !deposit.depositAmount ||
                    !deposit.particulars ||
                    !deposit.nameofDepositor ||
                    !(deposit.orNumber || deposit.lcNumber) // At least one of these is required
                )
              }
              onClick={() => {
                // Logic to handle filtered and selected data
                console.log("Selected Categories:", selectedCategories);
                console.log("Filtered Data:", filteredData);
                setSelectedMonth("");
                setSelectedCategories([]);
                setShowModal2(false);
                handleSubmitDataToRegion();
              }}
            >
              Submit
            </button>

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
