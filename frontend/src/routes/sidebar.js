import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuUserCircle } from "react-icons/lu";
import { TbSettings2 } from "react-icons/tb";
import { RxDashboard } from "react-icons/rx";
import { HiOutlineUsers } from "react-icons/hi2";
import { SlNotebook } from "react-icons/sl";
import { VscNotebook } from "react-icons/vsc";
import { VscNotebookTemplate } from "react-icons/vsc";
import { LiaMoneyBillWaveAltSolid } from "react-icons/lia";
import { AiOutlineBarChart } from "react-icons/ai";
import { CiViewTable } from "react-icons/ci";
import { PiHandDeposit } from "react-icons/pi";
import { BiCollection } from "react-icons/bi";
import logo from '../assets/logo.png'; // Update the path to your logo image

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className='bg-color-lighter-gray min-h-screen flex'>
      <div className="w-72 h-screen bg-color-white text-black shadow-xl font-body flex flex-col">
        <div className="flex items-center p-2">
          <img src={logo} alt="BFP Logo" className="h-11 w-11 mr-2 ml-5"/>
          <h1 className='font-bold text-3xl'>BFP CARAGA</h1>
        </div>
        <nav className="px-4 py-3 flex-grow">
          <ul className="space-y-1">
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/dashboard') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/dashboard" className="flex items-center space-x-2">
                <RxDashboard className='mr-3'/>
                <span>Dashboard</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/users') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/users" className="flex items-center space-x-2">
                <HiOutlineUsers className='mr-3'/>
                <span>Users</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/incomeStatement') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/incomeStatement" className="flex items-center space-x-2">
                <SlNotebook className='mr-3' />
                <span>Income Statement</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/balanceSheet') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/balanceSheet" className="flex items-center space-x-2">
                <VscNotebookTemplate className='mr-3'/>
                <span>Balance Sheet</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/cashflowStatement') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/cashflowStatement" className="flex items-center space-x-2">
                <LiaMoneyBillWaveAltSolid className='mr-3'/>
                <span>Cashflow Statement</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/changesInEquity') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/changesInEquity" className="flex items-center space-x-2">
                <AiOutlineBarChart className='mr-3'/>
                <span>Changes In Equity</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/generalLedger') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/generalLedger" className="flex items-center space-x-2">
                <VscNotebook className='mr-3'/>
                <span>General Ledger</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/trialBalance') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/trialBalance" className="flex items-center space-x-2">
                <CiViewTable className='mr-3'/>
                <span>Trial Balance</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/deposits') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/deposits" className="flex items-center space-x-2">
                <PiHandDeposit className='mr-3'/>
                <span>Deposits</span>
              </Link>
            </li>
            <li className={`px-3 py-3 rounded-md font-semibold ${isActive('/main/collections') ? 'bg-color-dark-red text-white' : 'hover:bg-color-light-red'}`}>
              <Link to="/main/collections" className="flex items-center space-x-2">
                <BiCollection className='mr-3'/>
                <span>Collections</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4">
          {/* Footer or additional content here */}
        </div>
      </div>
      <div className="flex-1 pl-1 bg-gray-100">
        <header className="flex items-center justify-between bg-white p-4 shadow-sm mb-6">
          <div></div>
          <div className="flex items-center space-x-4">
            <TbSettings2 className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"/>
            <LuUserCircle className="text-2xl text-gray-700 hover:text-gray-900 cursor-pointer"/>
          </div>
        </header>
        {/* Add your main content here */}
      </div>
    </div>
  );
};

export default Sidebar;
