import React, { Fragment, useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebase-config"; // Firebase setup
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AddButton from "../../../components/addButton";

export default function FireStationOfficers() {
  const [showModal, setShowModal] = useState(false);
  const [stationsList, setStationsList] = useState([]);



  //Firestation
  const [firestationUsers, setfirestationUsers] = useState([]);

  //Users Data
  const [newUserFirstname, setNewUserFirstname] = useState('');
  const [newUserLastname, setNewUserLastname] = useState('');
  const [newUserRank, setNewUserRank] = useState('');
  const [user, setLoggedUser] = useState('');

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
                      onClick={() => handleDeleteRow(officer.id)}
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
                Firstname
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
                Lastname
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
                  <option value="Fire Marshal">Fire Marshal</option>
                  <option value="Senior Fire Officer">Senior Fire Officer</option>
                  <option value="Fire Officer I">Fire Officer I</option>
                  {/* Add more rank options as needed */}
                </select>
              </div>

              <button
                className="mt-6 ml-4 inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

              >
                Edit Ranks
              </button>
            </div>
          </div>

          <div className="flex justify-end py-3 mt-10">
            <button
              className="bg-[#2196F3] rounded text-white py-2.5 px-4 mt-4"
              onClick={handleOfficer}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>

    </Fragment>
  );
}