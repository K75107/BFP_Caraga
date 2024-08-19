import React, { Fragment, useState } from "react";
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { TbSettings2 } from "react-icons/tb";
import {TransparentModal} from '../components/Modal';

// Redux
import { useSelector } from 'react-redux';

const Main = () => {
  // Redux
  const user = useSelector((state) => state.auth.user);

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
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">User Profile</h2>
                <button
                  className="text-gray-700 text-2xl"
                  onClick={() => setShowUserModal(false)}
                >
                  &times;
                </button>
              </div>
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
              <div className="mt-4 flex justify-end">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  onClick={() => setShowUserModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </TransparentModal>
      )}
    </Fragment>
  );
};

export default Main;
