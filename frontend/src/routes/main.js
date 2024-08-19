import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { LuUserCircle } from "react-icons/lu";
import { TbSettings2 } from "react-icons/tb";

// Redux
import { useSelector } from 'react-redux';

const Main = () => {

  // Redux
  const user = useSelector((state) => state.auth.user);


  return (
    <div className="bg-color-lighter-gray flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <header className=" px-5 py-3 flex items-center justify-between">
          {/* Placeholder for logo or other content */}
          <div></div>
          <div className="flex items-center space-x-4">
            <TbSettings2 className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"/>
              <button data-modal-target="select-modal" data-modal-toggle="select-modal">
                <img
                          className="w-10 h-10 rounded-full mr-4"
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
  );
};

export default Main;
