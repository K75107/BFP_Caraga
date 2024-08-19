import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RxDashboard } from "react-icons/rx";
import { HiOutlineUsers } from "react-icons/hi2";
import { VscNotebook, VscNotebookTemplate } from "react-icons/vsc";
import { LiaMoneyBillWaveAltSolid } from "react-icons/lia";
import { AiOutlineBarChart } from "react-icons/ai";
import { CiViewTable } from "react-icons/ci";
import { PiHandDeposit } from "react-icons/pi";
import { BiCollection } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import logo from '../assets/logo.png'; // Update the path to your logo image

// Redux
import { useSelector } from 'react-redux';



const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const user = useSelector((state) => state.auth.user);


  // Hard-coded role for testing
  const userRole = user ? user.role : 'Guest';

  // Define the visibility of each menu item based on user roles
  const menuItems = {
    "Admin": [
      { path: '/main/dashboard', icon: <RxDashboard size={18} />, label: 'Dashboard' },
      { path: '/main/users', icon: <HiOutlineUsers size={18} />, label: 'Users' },
      { section: 'Ledger' },
      { path: '/main/generalLedger', icon: <VscNotebook size={18} />, label: 'General Ledger' },
      { path: '/main/trialBalance', icon: <CiViewTable size={18} />, label: 'Trial Balance' },
      { section: 'Financial Statements' },
      { path: '/main/incomeStatement', icon: <VscNotebookTemplate size={18} />, label: 'Income Statement' },
      { path: '/main/balanceSheet', icon: <VscNotebookTemplate size={18} />, label: 'Balance Sheet' },
      { path: '/main/cashflowStatement', icon: <LiaMoneyBillWaveAltSolid size={18} />, label: 'Cashflow Statement' },
      { path: '/main/changesInEquity', icon: <AiOutlineBarChart size={18} />, label: 'Changes In Equity' },
      { section: 'Reports' },
      { path: '/main/deposits', icon: <PiHandDeposit size={18} />, label: 'Deposits' },
      { path: '/main/collections', icon: <BiCollection size={18} />, label: 'Collections' },
    ],
    "Fire Station": [
      { path: '/main/dashboard', icon: <RxDashboard size={18} />, label: 'Dashboard' },
      { path: '/main/users', icon: <HiOutlineUsers size={18} />, label: 'Users' },
      { section: 'Reports' },
      { path: '/main/deposits', icon: <PiHandDeposit size={18} />, label: 'Deposits' },
      { path: '/main/collections', icon: <BiCollection size={18} />, label: 'Collections' },
    ],
    // Add other user roles here 
  };

  // Get the current user's menu items
  const currentMenuItems = menuItems[userRole] || [];

  return (
    <div className={`flex h-screen ${isCollapsed ? 'w-16' : 'w-64'} bg-white text-black font-body flex-col text-sm border-r transition-all duration-300`}>
      <div className="flex items-center p-2 border-b whitespace-nowrap">
        <img 
          src={logo} 
          alt="BFP Logo" 
          className={`h-8 w-8 mr-2 ml-2 ${isCollapsed ? 'cursor-pointer' : ''}`} 
          onClick={isCollapsed ? toggleSidebar : null}
        />
        {!isCollapsed && (
          <>
            <h1 className='font-bold text-xl flex-1'>BFP CARAGA</h1>
            <button onClick={toggleSidebar} className="ml-2">
              <AiOutlineClose size={18} />
            </button>
          </>
        )}
      </div>
      <nav className="px-2 py-3 flex-grow">
        <ul className="space-y-1">
          {currentMenuItems.map((item, index) =>
            item.section ? (
              <li key={index}>
                <div className={`${isCollapsed ? 'hidden' : 'block'} mt-5`}>
                  <h1 className='font-bold text-sm ml-2 whitespace-nowrap'>{item.section}</h1>
                </div>
              </li>
            ) : (
              <li key={item.path} className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-normal ${isActive(item.path) ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
                <Link to={item.path} className="flex items-center">
                  {item.icon}
                  <div className={`${isCollapsed ? 'hidden' : 'block'} ml-4`}>
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
