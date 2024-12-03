import React, { Fragment, useEffect, useState, useRef } from "react";
import Modal from "../../../components/Modal";
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebase-config"; // Firebase setup
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AddButton from "../../../components/addButton";

export default function FireStationOfficers() {
  const [showModal, setShowModal] = useState(false);
  const [stationsList, setStationsList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState([]);


  //Firestation
  const [firestationUsers, setfirestationUsers] = useState([]);
  console.log("data of firestationUsers: ", firestationUsers);
  //Users Data
  const [newUserFirstname, setNewUserFirstname] = useState('');
  const [newUserLastname, setNewUserLastname] = useState('');
  const [newUserRank, setNewUserRank] = useState('');
  const [officerRanks, setOfficerRanks] = useState(["Fire Marshal", "Senior Fire Officer", "Fire Officer I"]);
  const [officerAddRank, setOfficerAddRank] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editRank, setEditRank] = useState(null); // For editing rank
  const [user, setLoggedUser] = useState('');
  const [userID, setUserID] = useState('');

  // Fetch Fire Station Data from Firebase
  useEffect(() => {
    // Reference to the 'firestationReportsOfficers' collection
    const unsubmitCollectionRef = collection(db, 'firestationReportsOfficers');

    // Snapshot listener for the collection
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
      // Fetch the documents and map to data with doc ID
      const listCollections = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));


      // Get the logged-in user
      const auth = getAuth();
      setLoggedUser(auth.currentUser);
      onAuthStateChanged(auth, (user) => {
        if (user) {
          checkUserInCollections(user.email, listCollections); // Call check function with user email and fetched collections
        } else {
          console.log('No user is currently logged in');
        }
      });
    });

    // Function to check if the logged-in user exists in the collections
    const checkUserInCollections = async (userEmail, collections) => {
      // Find the user's document in the collections
      const userFound = collections.find((collection) => collection.email === userEmail)
      setUserID(userFound.id);

      if (userFound) {
        // Access the document using userFound.id
        const userSubcollectionRef = collection(db, 'firestationReportsOfficers', userFound.id, 'officers');

        //fetch using snapshot
        const officerSnapshot = await getDocs(userSubcollectionRef);

        // Map the data and filter where isDeleted is false
        const officersData = officerSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(officer => officer.isDeleted === false);  // Filter out soft-deleted documents

        setfirestationUsers(officersData);



      } else {
        console.log(`User with email ${userEmail} not found in collections.`);
      }
    };

    return () => {
      unsubscribeUnsubmitCollections(); // Unsubscribe from Firestore snapshot listener
    };
  }, []);



  const handleOfficer = async () => {
    if (!firestationUsers) return; // Ensure necessary data exists

    try {
      // Check if the user is logged in
      if (!user) {
        console.log("No logged User");
        return;
      }

      // Get the reference to the collection
      const unsubmitCollectionRef = collection(db, 'firestationReportsOfficers');

      // Fetch documents from the collection
      const querySnapshot = await getDocs(unsubmitCollectionRef);

      // Find the document for the current user
      const userDoc = querySnapshot.docs.find(doc => doc.data().email === user.email);

      // Check if the document for the logged-in user exists
      if (!userDoc) {
        console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }

      // Access the subcollection under the firestationReportsOfficers
      const collectionsSubCollectionRef = collection(db, 'firestationReportsOfficers', userDoc.id, 'officers');

      // Prepare the new officer data
      const newCollection = {
        firstname: newUserFirstname || null,
        lastname: newUserLastname || null,
        station: userDoc.data().username, // Assuming you have a "username" field in your document
        rank: newUserRank || null,
        createdAt: serverTimestamp(),
        isDeleted: false,
        deletedAt: null,
        updatedAt: null,
      };

      // Add the new officer document to Firestore
      const newCollectionRef = await addDoc(collectionsSubCollectionRef, newCollection);

      // Fetch the new collection's ID
      const newCollectionWithId = {
        ...newCollection,
        id: newCollectionRef.id, // Use the Firestore-generated ID
      };



      // Update the local state immediately
      setfirestationUsers((prevReports) => {
        // Ensure prevReports is an array
        if (Array.isArray(prevReports)) {
          return [...prevReports, newCollectionWithId]; // Update state with the new officer
        } else {
          return [newCollectionWithId]; // If prevReports is not an array, create a new one
        }
      });

      setShowModal(false);

    } catch (error) {
      console.error('Error adding user:', error);
    }
  };


  const handleDeleteRank = async (rank) => {
    try {
      // Firestore collection reference
      const periodDataRef = collection(db, 'firestationReportsOfficers', userID, 'ranks');

      // Query to find the rank to delete
      const querySnapshot = await getDocs(periodDataRef);
      const rankDoc = querySnapshot.docs.find(doc => doc.data()?.rankName === rank);

      if (rankDoc) {
        // Mark the rank as deleted in Firestore
        await updateDoc(rankDoc.ref, {
          isDeleted: true,
          deletedAt: serverTimestamp()
        });

        // Fetch updated ranks
        await fetchRankData(userID);
      }
    } catch (error) {
      console.error("Error deleting rank:", error);
    }
  };

  const handleEditRank = (rank) => {
    setEditRank(rank); // Set the rank that is being edited
    setOfficerAddRank(rank); // Pre-fill the input field with the current rank value
  };

  const handleSaveEdit = async () => {
    if (editRank) {
      try {
        // Firestore collection reference
        const periodDataRef = collection(db, 'firestationReportsOfficers', userID, 'ranks');

        // Query to find the rank to edit
        const querySnapshot = await getDocs(periodDataRef);
        const rankDoc = querySnapshot.docs.find(doc => doc.data()?.rankName === editRank);

        if (rankDoc) {
          // Update Firestore document
          await updateDoc(rankDoc.ref, {
            rankName: officerAddRank,
            editedAt: serverTimestamp()
          });

          // Fetch updated ranks
          await fetchRankData(userID);
        }
      } catch (error) {
        console.error("Error updating rank:", error);
      } finally {
        setOfficerAddRank('');
        setEditRank(null); // Clear edit state
      }
    }
  };


  const addRankData = async (officerRanks, userID) => {
    try {
      // Firestore collection reference
      const periodDataRef = collection(db, 'firestationReportsOfficers', userID, 'ranks');

      // Fetch existing ranks from Firestore
      const querySnapshot = await getDocs(periodDataRef);
      const existingRanks = querySnapshot.docs.map(doc => doc.data()?.rankName || "");

      // Determine new ranks to add (filter out existing ranks)
      const newRanks = officerRanks.filter(rank => !existingRanks.includes(rank));

      // Create an array of promises for adding new ranks
      const addPromises = newRanks.map(rank => {
        return addDoc(periodDataRef, {
          rankName: rank,
          createdAt: serverTimestamp(),  // Firestore server timestamp
          editedAt: null,               // Explicitly set to null
          isDeleted: false,
          deletedAt: null               // Explicitly set to null
        });
      });

      // Execute all add operations concurrently
      await Promise.all(addPromises);
      await fetchRankData();
      console.log("New ranks added successfully!");
    } catch (error) {
      console.error("Error adding data to Firestore:", error);
    }
  };


  const fetchRankData = async () => {
    try {
      // Firestore collection reference
      const periodDataRef = collection(db, 'firestationReportsOfficers', userID, 'ranks');

      // Fetch ranks from Firestore
      const querySnapshot = await getDocs(periodDataRef);

      // Filter out deleted ranks and map rankName
      const ranks = querySnapshot.docs
        .map(doc => doc.data())
        .filter(rank => !rank.isDeleted)
        .map(rank => rank.rankName);

      setOfficerRanks(ranks);
      console.log("Fetched active ranks:", ranks);
      return ranks;
    } catch (error) {
      console.error("Error fetching ranks from Firestore:", error);
      return [];
    }
  };

  useEffect(() => {
    if (userID) {
      addRankData(officerRanks, userID);
    } else {
      console.error("Error: UserID is missing or undefined.");
    }
  }, [userID]);

  useEffect(() => {
    fetchRankData();
  }, []);


  const handleDeleteRow = async (station) => {
    if (!station) return;

    try {
      // Get the reference to the 'firestationReportsOfficers' collection
      const unsubmitCollectionRef = collection(db, 'firestationReportsOfficers');

      // Fetch documents from the collection
      const querySnapshot = await getDocs(unsubmitCollectionRef);

      // Find the document for the current user
      const user = getAuth().currentUser;
      if (!user) {
        console.log("No user is logged in");
        return;
      }
      console.log("current user: ", user);
      const userDoc = querySnapshot.docs.find(doc => doc.data().email === user.email);

      // Check if the document for the user exists
      if (!userDoc) {
        console.log("No document found for the logged-in user.");
        return;
      }

      // Get reference to the specific officer's document you want to update
      const officerDocRef = doc(db, 'firestationReportsOfficers', userDoc.id, 'officers', station);

      // Update the specific officer's document to mark it as deleted
      await updateDoc(officerDocRef, {
        isDeleted: true,
        deletedAt: serverTimestamp() // Adds Firestore's server timestamp
      });

      // After successful deletion in Firestore, update the local state
      setfirestationUsers((prevUsers) =>
        prevUsers.filter((officer) => officer.id !== station)  // Remove the deleted officer from the state
      );

      console.log(`Officer with ID ${station} marked as deleted.`);
    } catch (error) {
      console.error("Error deleting officer:", error);
    }
  };





  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E]">Manage Officers</h1>
          <AddButton
            onClick={() => setShowModal(true)}
            label={"ADD OFFICER"}
          />
        </div>

        <hr className="border-t border-[#7694D4] my-4" />

        {/* Table to show list */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
              <tr>
                <th className="px-6 py-4">FIRSTNAME</th>
                <th className="px-6 py-4">LASTNAME</th>
                <th className="px-6 py-4">RANK</th>
                <th className="px-6 py-4"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody>
              {firestationUsers.map((officer, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{officer.firstname || 'N/A'}</td>
                  <td className="px-6 py-4">{officer.lastname || 'N/A'}</td>
                  <td className="px-6 py-4">{officer.rank || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-600 hover:underline"
                      onClick={() => {
                        setDeleteID(officer.id);
                        setShowDeleteModal(true);
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding Fire Station */}
      <Modal isVisible={showModal}>
        <div className="bg-white w-[370px] h-[400px] rounded py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-[27px] text-[#1E1E1E]">Add an Officer</h1>
            <button
              className="text-[27px] bg-transparent"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
          </div>

          <hr className="border-t border-[#7694D4] my-3" />

          <div className="space-y-4">
            {/* Firstname */}
            <div className="relative">
              <input
                type="text"
                id="firstname"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border rounded-lg focus:border-blue-600"
                placeholder=" "
                value={newUserFirstname}
                onChange={(e) => setNewUserFirstname(e.target.value)}
              />
              <label
                htmlFor="firstname"
                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 bg-white px-2"
              >
                First Name
              </label>
            </div>

            {/* Lastname */}
            <div className="relative">
              <input
                type="text"
                id="lastname"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border rounded-lg focus:border-blue-600"
                placeholder=" "
                value={newUserLastname}
                onChange={(e) => setNewUserLastname(e.target.value)}
              />
              <label
                htmlFor="lastname"
                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 bg-white px-2"
              >
                Last Name
              </label>
            </div>

            {/* Rank Selection with Inline Edit Button */}
            <div className="flex items-center space-x-2">
              <div className="w-52 mr-1">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="rank"
                >
                  Rank
                </label>
                <select
                  id="rank"
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUserRank}
                  onChange={(e) => setNewUserRank(e.target.value)}
                >
                  <option value=""></option>
                  {officerRanks.map((officerRanks, index) => (
                    <option key={index} value={officerRanks}>
                      {officerRanks}
                    </option>
                  ))}
                </select>
              </div>

              {/* <button
                className="mt-6 ml-4 inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

              >
                Edit Ranks
              </button> */}

              {/* -------------------------------------- P O P O V E R   E D I T   R A N K S ----------------------------------- */}
              {/* Button to trigger the popover */}
              <button
                type="button"
                className="relative mt-6 ml-4 inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                aria-expanded={isPopoverOpen}
                aria-controls="popover-right"
              >
                Edit Ranks
              </button>

              {/* Popover for editing ranks */}
              <div
                id="popover-right"
                role="tooltip"
                className={`absolute z-10 w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm ${isPopoverOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  } dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800`}
                style={{
                  top: "55%", // Align vertically
                  right: "20%", // Position it to the right
                  transform: "translateY(-50%)", // Adjust for vertical centering
                  marginLeft: "8px", // Add spacing between button and popover
                }}
              >
                {/* Popover Header */}
                <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Edit Ranks</h3>
                </div>

                {/* Popover Content */}
                <div className="px-3 py-2 space-y-2">
                  {/* Ranks List */}
                  <div className="space-y-2 mt-3">
                    {officerRanks.map((rank, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-900 dark:text-white">{rank}</span>
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-sm"
                            aria-label={`Edit ${rank}`}
                            onClick={() => handleEditRank(rank)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline text-sm"
                            aria-label={`Delete ${rank}`}
                            onClick={() => handleDeleteRank(rank)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conditional Form Rendering */}
                  {!editRank && (
                    <div className="mt-3">
                      {/* Add New Rank Form */}
                      <form
                        onSubmit={async (e) => { // Mark the function as async
                          e.preventDefault();
                          if (officerAddRank.trim()) {
                            await addRankData([officerAddRank], userID); // Now await works
                            setOfficerAddRank(''); // Clear input
                            e.target.reset();
                          }
                        }}
                      >
                        <input
                          type="text"
                          name="newRank"
                          placeholder="Add new rank"
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          onChange={(e) => setOfficerAddRank(e.target.value)}
                          required
                        />
                        <button
                          type="submit"
                          className="mt-2 w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                          Add Rank
                        </button>
                      </form>
                    </div>
                  )}

                  {editRank && (
                    <div className="mt-3">
                      {/* Edit Rank Form */}
                      <input
                        type="text"
                        name="editRank"
                        placeholder="Edit rank"
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        value={officerAddRank}
                        onChange={(e) => setOfficerAddRank(e.target.value)}
                        required
                      />
                      <button
                        onClick={() => {
                          handleSaveEdit(editRank);
                          setEditRank(null); // Reset the edit state after saving
                        }}
                        className="mt-2 w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Save Edit
                      </button>
                      <button
                        onClick={() => setEditRank(null)} // Cancel editing
                        className="mt-2 w-full text-gray-600 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-3 py-1.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Popover Arrow */}
                <div
                  data-popper-arrow
                  style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid #fff", // The color of the popover
                    top: "53%", // Position below the popover
                    left: "-2%",
                    transform: "translateX(-50%)", // Center the arrow horizontally
                  }}
                />
              </div>

              {/* -------------------------------------- P O P O V E R   E D I T   R A N K S ----------------------------------- */}


            </div>
          </div>

          <div className="flex justify-end py-3 mt-10">
            <button
              className={`${newUserFirstname && newUserLastname && newUserRank
                ? ""
                : "opacity-50 cursor-not-allowed"
                } bg-blue-600 hover:bg-blue-700 rounded text-white py-2.5 px-4 mt-4`}
              onClick={() => {
                handleOfficer();
                setNewUserFirstname('');
                setNewUserLastname('');
                setNewUserRank('');
              }}
              disabled={!newUserFirstname || !newUserLastname || !newUserRank}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <Modal isVisible={showDeleteModal}>
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <button
                type="button"
                className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={() => {
                  setDeleteID();
                  setShowDeleteModal(false);
                }}
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
              <div className="p-4 md:p-5 text-center">
                <svg className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this Firestation Officer?</h3>
                <button
                  type="button"
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                  onClick={() => {
                    setShowDeleteModal(false);
                    handleDeleteRow(deleteID);
                  }}
                >
                  Yes, I'm sure
                </button>
                <button
                  type="button"
                  className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  onClick={() => {
                    setDeleteID();
                    setShowDeleteModal(false);
                  }}
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </Fragment>
  );
}