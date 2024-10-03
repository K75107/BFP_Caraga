import React, { Fragment, useEffect, useState } from "react";
import { Button, Input, Label, Select } from 'flowbite-react';
//import testDatabase from "../../../data/testDB";
import 'react-datepicker/dist/react-datepicker.css';
import Modal from "../../../components/Modal";
import { useNavigate } from "react-router-dom";
// Firebase
import { auth } from "../../../config/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, storage } from "../../../config/firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";



export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [usersList, setUserList] = useState([]);


  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  //Get User Data from firebase
  
  useEffect(() => {
    const getUserList = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserList(usersData);
      } catch (err) {
        console.error(err);
      }
    };
  
    getUserList();
  }, []);
  

  const handleAddUser = async () => {
    try {

      // Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Upload profile picture to Firebase Storage
      let profilePictureUrl = '';
      if (profilePicture) {
        const storageRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(storageRef, profilePicture);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      // Create a new document in Firestore with the user's ID as the document ID
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, {
            email: email,
            username: username,
            usertype: usertype,
            profilePicture: profilePictureUrl,
            isActive: true, // Assuming new users are active by default
        });

        console.log("User added successfully!");

        // Add user to the firestationReports if the usertype is 'firestation'
        if (usertype === "fire-stations") {
            const unsubmitCollectionRef = doc(db, "firestationReportsDeposits", userId);
            await setDoc(unsubmitCollectionRef, {
                email: email,
                username: username,
            });

            // console.log("User added to firestationReportsDeposits!");
        }

        if (usertype === "fire-stations") {
          const unsubmitCollectionRef = doc(db, "firestationReportsCollections", userId);
          await setDoc(unsubmitCollectionRef, {
              email: email,
              username: username,
          });

          // console.log("User added to firestationReportsCollections!");
      }

        if (usertype === "fire-stations") {
          const unsubmitCollectionRef = doc(db, "firestationReportsOfficers", userId);
          await setDoc(unsubmitCollectionRef, {
              email: email,
              username: username,
          });

          // console.log("User added to firestationReportsOfficers!");
      }

    } catch (err) {
      console.error("Error adding user: ", err);
    }
  };

  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Manage Users</h1>
          <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>ADD USERS</button>
        </div>

        <hr className="border-t border-[#7694D4] my-4" />

        {/* TABLE */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">USER</th>
                <th scope="col" className="px-6 py-3">EMAIL</th>
                <th scope="col" className="px-6 py-3">USERTYPE</th>
                <th scope="col" className="px-6 py-3">ACTIVE</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody>
            {usersList.map((user, index) => (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center">
                  <div
                    className="w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-gray-300"
                    style={{
                      backgroundImage: user?.profilePicture ? `url(${user.profilePicture})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!user?.profilePicture && (
                      <span className="text-white">N/A</span>
                    )}
                  </div>
                  {user?.username || 'Unknown'}
                </td>
                <td className="px-6 py-4">{user?.email || 'N/A'}</td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {user?.usertype || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      user?.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}

          </tbody>

          </table>
        </div>
      </div>

      {/* MODAL */}
      <Modal isVisible={showModal}>
        <div className="bg-white w-[600px] h-auto rounded py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Add New User</h1>
            <button className="text-[27px] text-[#1E1E1E] bg-transparent border-none" onClick={() => setShowModal(false)}>×</button>
          </div>

          <hr className="border-t border-[#7694D4] my-3" />

          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="email"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Email</label>
            </div>

            <div className="relative">
              <input
                type="text"
                id="username"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="username" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Username</label>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Password</label>
            </div>

            <div className="relative">
              <select
                id="usertype"
                className="block w-full px-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={usertype}
                onChange={(e) => setUsertype(e.target.value)}
              >
                <option value="">Select user type</option>
                <option value="admin">Admin</option>
                <option value="regional-accountant">Regional Accountant</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="chief-fmd">Chief FMD</option>
                <option value="firecode-monitoring">Firecode Monitoring</option>
                <option value="fire-stations">Fire Stations</option>
                <option value="firecode-reconciliation">Firecode Reconciliation</option>
                <option value="revenue">Revenue</option>
              </select>
              <label htmlFor="usertype" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">User Type</label>
            </div>

          </div>

          <div className="flex justify-end py-3 px-4">
            <button
              className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4"
              onClick={handleAddUser}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </Fragment>
  );
}
