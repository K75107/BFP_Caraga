import React, { Fragment, useState, useEffect } from "react";
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { TransparentModal } from '../components/Modal';
import { AiOutlineSetting } from "react-icons/ai";
import { MdArrowForwardIos, MdOutlineHelpOutline, MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './Authentication/authActions';

import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { getDatabase, ref, set, onDisconnect, serverTimestamp } from "firebase/database";

const Main = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showUserModal, setShowUserModal] = useState(false);
  const [logUserData, setLogUserData] = useState({});
  const database = getDatabase();

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userStatusRef = ref(database, `status/${user.uid}`);
        await set(userStatusRef, {
          isActive: false,
          lastActive: serverTimestamp(),
        });

        await signOut(auth);
        dispatch(logout());
        navigate('/');
      }
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const currentUser = usersList.find(doc => doc.email === auth.currentUser?.email);
      if (currentUser) setLogUserData(currentUser);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userStatusRef = ref(database, `status/${user.uid}`);
        set(userStatusRef, {
          isActive: true,
          lastActive: serverTimestamp(),
        });
        onDisconnect(userStatusRef).set({
          isActive: false,
          lastActive: serverTimestamp(),
        });
      } else {
        console.log('No user is currently logged in');
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeAuth();
    };
  }, [database]);
  const closeModalOnOutsideClick = (e) => {
    if (e.target.id === "user-modal-overlay") {
      setShowUserModal(false);
    }
  };
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
