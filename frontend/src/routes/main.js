import React, { Fragment, useState, useEffect } from "react";
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { TbSettings2 } from "react-icons/tb";
import { TransparentModal } from '../components/Modal';
import { AiOutlineSetting } from "react-icons/ai";
import { MdArrowForwardIos, MdOutlineHelpOutline, MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './Authentication/authActions';

import { auth, db } from "../config/firebase-config";
import { getAuth,onAuthStateChanged } from "firebase/auth";
import { collection,onSnapshot } from "firebase/firestore";

import { signOut } from "firebase/auth";
import { doc, getDocs } from "firebase/firestore";

const Main = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const [showUserModal, setShowUserModal] = useState(false);
  const [logUserData,setLogUserData] = useState({});

  // Logout function using Firebase Authentication
  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const closeModalOnOutsideClick = (e) => {
    if (e.target.id === "user-modal-overlay") {
      setShowUserModal(false);
    }
  };


  useEffect(() => {
    // Setup listener for the submitted data
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Find the current user in the submitted data by matching their email
                const currentUser = usersList.find((doc) => doc.email === user.email);

                if (currentUser) {
                    // Set the current user ID in the state if found in the submitted deposits
                    setLogUserData(currentUser);
                    // console.log('User found in submittedReportsDeposits:', currentUser);
                } else {
                    console.log('User not found in users');
                }
            } else {
                console.log('No user is currently logged in');
            }
        });
    });

    // Return the unsubscribe function to clean up the listener on unmount
    return () => {
      unsubscribeUsers();
    };
}, []);  // Only runs once on mount

  return (
    <Fragment>
    <div className="bg-color-lighter-gray flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <header className="px-4 py-2 flex items-center justify-between">
          <div></div>
          <div className="flex items-center space-x-3">
            <div
                    className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold hover:cursor-pointer"
                    onClick={() => setShowUserModal(true)}
                    style={{
                      backgroundColor: 
                      logUserData?.province === 'Agusan del Norte' ? 'blue' : 
                      logUserData?.province === 'Agusan del Sur' ? 'red' : 
                      logUserData?.province === 'Dinagat Islands' ? 'brown' :
                      logUserData?.province === 'Surigao del Norte' ? 'orange' :
                      logUserData?.province === 'Surigao del Sur' ? 'violet' :   
                        'gray' // Default color
                    }}
                  >
                    {logUserData?.username?.charAt(0).toUpperCase()}
              </div>
          </div>
        </header>
        <div className="px-3 py-1.5 flex-1 h-screen">
          <Outlet /> {/* Renders nested routes */}
        </div>
      </div>
    </div>
  
    {/* User Profile Modal */}
    {showUserModal && (
      <TransparentModal isVisible={showUserModal}>
        <div
          id="user-modal-overlay"
          className="fixed inset-0 flex justify-center items-center"
          onClick={closeModalOnOutsideClick}
        >
          <div className="bg-white w-[240px] rounded-lg shadow-lg p-3 fixed right-1 top-16">
            
            {/* USER DETAILS */}
            <div className="text-center">
              <h3 className="text-base font-medium">{logUserData?.username || 'Username'}</h3>
              <p className="text-gray-600 text-sm">{logUserData?.email || 'Email'}</p>
            </div>
            
            {/* BUTTON */}
            {/* Account Settings */}
            <label className="mt-1.5 inline-flex items-center justify-between w-full p-1.5 text-gray-900 bg-white cursor-pointer hover:bg-gray-100">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-2">
                  <AiOutlineSetting className="text-gray-700" />
                </div>
                <span className="text-sm font-semibold">Account Settings</span>
              </div>
              <MdArrowForwardIos />
            </label>
  
            {/* Help & Support */}
            <label className="mt-1.5 inline-flex items-center justify-between w-full p-1.5 text-gray-900 bg-white cursor-pointer hover:bg-gray-100">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-2">
                  <MdOutlineHelpOutline className="text-gray-700" />
                </div>
                <span className="text-sm font-semibold">Help & Support</span>
              </div>
              <MdArrowForwardIos />
            </label>
  
            {/* Logout */}
            <button 
              className="mt-1.5 inline-flex items-center justify-between w-full p-1.5 text-gray-900 bg-white cursor-pointer hover:bg-gray-100"
              onClick={handleLogout}
            >
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-2">
                  <MdLogout className="text-gray-700" />
                </div>
                <span className="text-sm font-semibold">Logout</span>
              </div>
            </button>
  
          </div>
        </div>
      </TransparentModal>
    )}
  </Fragment>
  
  );
};

export default Main;
