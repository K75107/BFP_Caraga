import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { LuUserCircle } from "react-icons/lu";
import { TbSettings2 } from "react-icons/tb";

const Main = () => {
  return (
    <div className="bg-color-lighter-gray flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <header className="bg-white p-3 shadow-sm flex items-center justify-between">
          {/* Placeholder for logo or other content */}
          <div></div>
          <div className="flex items-center space-x-4">
            <TbSettings2 className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"/>
            <LuUserCircle className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"/>
          </div>
        </header>
        <div className="p-4 flex-1 overflow-auto">
          <Outlet /> {/* Renders nested routes */}
        </div>
      </div>
    </div>
  );
};

export default Main;
