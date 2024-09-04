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
import { auth,db } from "../config/firebase-config";

import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Main = () => {
  const user = useSelector((state) => state.auth.user);
  const [profilePicture, setProfilePicture] = useState('/path/to/default/profilePicture.jpg');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (user?.uid) {
        try {
          const userDoc = doc(db, "users", user.uid); // Adjust collection and document path if needed
          const docSnapshot = await getDoc(userDoc);

          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setProfilePicture(userData.profilePicture || '/path/to/default/profilePicture.jpg');
          }
        } catch (error) {
          console.error("Error fetching user profile picture: ", error);
        }
      }
    };

    fetchProfilePicture();
  }, [user?.uid]);

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

  return (
    <Fragment>
      <div className="bg-color-lighter-gray flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          <header className="px-5 py-3 flex items-center justify-between">
            <div></div>
            <div className="flex items-center space-x-4">
              <TbSettings2 className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer" />
              <button onClick={() => setShowUserModal(true)}>
                <img
                  className="w-10 h-10 rounded-full"
                  src={profilePicture}
                  alt={`${user?.username || 'User'}'s profile`}
                />
              </button>
            </div>
          </header>
          <div className="px-4 py-2 flex-1 overflow-auto">
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
            <div className="bg-white w-[300px] rounded-lg shadow-lg p-4 fixed right-1 top-16">
              
              {/* USER DETAILS */}
              <div className="text-center">
                <img
                  className="w-16 h-16 rounded-full mx-auto mb-3"
                  src={profilePicture}
                  alt={`${user?.username || 'User'}'s profile`}
                />
                <h3 className="text-lg font-medium">{user?.username || 'Username'}</h3>
                <p className="text-gray-600">{user?.email || 'Email'}</p>
              </div>
              
              {/* BUTTON */}
              {/* Account Settings */}
              <label className="mt-2 inline-flex items-center justify-between w-full p-2 text-gray-900 bg-white cursor-pointer hover:bg-gray-100">
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full p-3 mr-3">
                    <AiOutlineSetting className="text-gray-700" />
                  </div>
                  <span className="text-md font-semibold">Account Settings</span>
                </div>
                <MdArrowForwardIos />
              </label>

              {/* Help & Support */}
              <label className="mt-2 inline-flex items-center justify-between w-full p-2 text-gray-900 bg-white cursor-pointer hover:bg-gray-100">
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full p-3 mr-3">
                    <MdOutlineHelpOutline className="text-gray-700" />
                  </div>
                  <span className="text-md font-semibold">Help & Support</span>
                </div>
                <MdArrowForwardIos />
              </label>

              {/* Logout */}
              <button 
                className="mt-2 inline-flex items-center justify-between w-full p-2 text-gray-900 bg-white cursor-pointer hover:bg-gray-100"
                onClick={handleLogout}
              >
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full p-3 mr-3">
                    <MdLogout className="text-gray-700" />
                  </div>
                  <span className="text-md font-semibold">Logout</span>
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
