import React, { Fragment, useState } from "react";
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { TbSettings2 } from "react-icons/tb";
import {TransparentModal} from '../components/Modal';
import { AiOutlineSetting } from "react-icons/ai";
import { MdArrowForwardIos, MdOutlineHelpOutline, MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Redux
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import {logout} from './Authentication/authActions'

const Main = () => {
  
  // Redux
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  //Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    
  };

  const [showUserModal, setShowUserModal] = useState(false);

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
            {/* Placeholder for logo or other content */}
            <div></div>
            <div className="flex items-center space-x-4">
              <TbSettings2 className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer" />
              <button onClick={() => setShowUserModal(true)}>
                <img
                  className="w-10 h-10 rounded-full"
                  src={user.profilePicture}
                  alt={`${user.username}'s profile`}
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
                  src={user.profilePicture}
                  alt={`${user.username}'s profile`}
                />
                <h3 className="text-lg font-medium">{user.username}</h3>
                <p className="text-gray-600">{user.email}</p>
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

              {/* Help & Support */}
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
