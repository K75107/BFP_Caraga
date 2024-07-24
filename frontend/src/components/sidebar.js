import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RxDashboard } from "react-icons/rx";
import { HiOutlineUsers } from "react-icons/hi2";
import { SlNotebook } from "react-icons/sl";
import { VscNotebook, VscNotebookTemplate } from "react-icons/vsc";
import { LiaMoneyBillWaveAltSolid } from "react-icons/lia";
import { AiOutlineBarChart } from "react-icons/ai";
import { CiViewTable } from "react-icons/ci";
import { PiHandDeposit } from "react-icons/pi";
import { BiCollection } from "react-icons/bi";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import logo from '../assets/logo.png'; // Update the path to your logo image

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

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
              <AiOutlineClose size={22} />
            </button>
          </>
        )}
      </div>
      <nav className="px-2 py-3 flex-grow">
        <ul className="space-y-1">
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/dashboard') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/dashboard" className="flex items-center">
              <RxDashboard size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Dashboard</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/users') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/users" className="flex items-center">
              <HiOutlineUsers size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Users</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/incomeStatement') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/incomeStatement" className="flex items-center">
              <SlNotebook size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Income Statement</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/balanceSheet') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/balanceSheet" className="flex items-center">
              <VscNotebookTemplate size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Balance Sheet</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/cashflowStatement') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/cashflowStatement" className="flex items-center">
              <LiaMoneyBillWaveAltSolid size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Cashflow Statement</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/changesInEquity') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/changesInEquity" className="flex items-center">
              <AiOutlineBarChart size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Changes In Equity</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/generalLedger') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/generalLedger" className="flex items-center">
              <VscNotebook size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>General Ledger</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/trialBalance') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/trialBalance" className="flex items-center">
              <CiViewTable size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Trial Balance</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/deposits') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/deposits" className="flex items-center">
              <PiHandDeposit size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Deposits</span>
              </div>
            </Link>
          </li>
          <li className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-sm font-semibold ${isActive('/main/collections') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
            <Link to="/main/collections" className="flex items-center">
              <BiCollection size={22} className="mr-3" />
              <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                <span>Collections</span>
              </div>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
