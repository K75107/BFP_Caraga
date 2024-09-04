import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCircleChevronLeft } from "react-icons/fa6";
import logo from '../assets/logo.png'; // Update the path to your logo image

import { MdSpaceDashboard, MdOutlineSpaceDashboard } from "react-icons/md";
import { HiOutlineUsers, HiUsers } from "react-icons/hi2";
import { RiBook2Line, RiBook2Fill } from "react-icons/ri";
import { PiListChecks, PiListChecksFill } from "react-icons/pi";
import { RiFileAddLine, RiFileAddFill } from "react-icons/ri";
import { PiBookOpenText, PiBookOpenTextFill } from "react-icons/pi";
import { PiMoneyWavy, PiMoneyWavyFill } from "react-icons/pi";
import { PiEqualizer, PiEqualizerFill } from "react-icons/pi";
import { PiHandDeposit, PiHandDepositFill } from "react-icons/pi";
import { PiStack, PiStackFill } from "react-icons/pi";

// Firebase
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userType, setUserType] = useState('Guest');

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === '/main/generalLedger' && (currentPath === '/main/generalLedger' || currentPath === '/main/generalLedgerTable')) {
      return true;
    }
    return currentPath === path;
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const db = getFirestore();
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);

          if (docSnap.exists()) {
            setUserType(docSnap.data().usertype || 'Guest');
          } else {
            console.log('No such document!');
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserType();
  }, []);

  // Define the visibility of each menu item based on user types
  const menuItems = {
    "admin": [
      { path: '/main/dashboard', icon: isActive('/main/dashboard') ? <MdSpaceDashboard size={18} /> : <MdOutlineSpaceDashboard size={18} />, label: 'Dashboard' },
      { path: '/main/users', icon: isActive('/main/users') ? <HiUsers size={18} />: <HiOutlineUsers size={18}/>, label: 'Users' },
      { section: 'Ledger' },
      { path: '/main/generalLedger', icon: isActive('/main/generalLedger') ? <RiBook2Fill size={18} /> : <RiBook2Line size={18} />, label: 'General Ledger' },
      { path: '/main/trialBalance', icon: isActive('/main/trialBalance') ? <PiListChecksFill size={18} /> : <PiListChecks size={18} />, label: 'Trial Balance' },
      { section: 'Financial Statements' },
      { path: '/main/incomeStatement', icon: isActive('/main/incomeStatement') ? <RiFileAddFill size={18} /> : <RiFileAddLine size={18} />, label: 'Income Statement' },
      { path: '/main/balanceSheet', icon: isActive('/main/balanceSheet') ? <PiBookOpenTextFill size={18} /> : <PiBookOpenText size={18} />, label: 'Balance Sheet' },
      { path: '/main/cashflowStatement', icon: isActive('/main/cashflowStatement') ? <PiMoneyWavyFill size={18} /> : <PiMoneyWavy size={18} />, label: 'Cashflow Statement' },
      { path: '/main/changesInEquity', icon: isActive('/main/changesInEquity') ? <PiEqualizerFill size={18} /> : <PiEqualizer size={18} />, label: 'Changes In Equity' },
      { section: 'Reports' },
      { path: '/main/deposits', icon: isActive('/main/deposits') ? <PiHandDepositFill size={18} /> : <PiHandDeposit size={18} />, label: 'Deposits' },
      { path: '/main/collections', icon: isActive('/main/collections') ? <PiStackFill size={18} /> : <PiStack size={18} />, label: 'Collections' },
    ],
    // Define other user types here...
  };

  // Get the current user's menu items
  const currentMenuItems = menuItems[userType] || [];

  return (
    <div className={` flex h-screen ${isCollapsed ? 'w-16' : 'w-64'} ${isCollapsed ? 'px-0' : 'px-2'} bg-white text-black font-body flex-col text-sm border-r transition-all duration-300 py-2 `}>
      <div className="flex items-center px-2 py-3 whitespace-nowrap">
        <img 
          src={logo} 
          alt="BFP Logo" 
          className={`h-8 w-8 mr-2 ml-2 ${isCollapsed ? 'cursor-pointer rotate-[360deg] duration-300' : 'rotate-360 duration-300'}`} 
          onClick={isCollapsed ? toggleSidebar : null}
        />
        {!isCollapsed && (
          <>
            <h1 className='font-bold text-2xl flex-1'>BFP CARAGA</h1>
          </>
        )}
        <button onClick={toggleSidebar} className={` ${isCollapsed ? 'ml-15 z-10 rotate-180 duration-300' : 'ml-8 z-10 ml-15 z-10 rotate-360 duration-300'} `}>
          <FaCircleChevronLeft size={26} color='#b91c1c'/>
        </button>
      </div>
      <nav className="px-2 py-3 flex-grow">
        <ul className="space-y-1">
          {currentMenuItems.map((item, index) =>
            item.section ? (
              <li key={index}>
                <div className={`${isCollapsed ? 'hidden' : 'block'} mt-10`}>
                  <h1 className='font-bold text-sm ml-2 whitespace-nowrap'>{item.section}</h1>
                </div>
              </li>
            ) : (
              <li key={item.path} className={`whitespace-nowrap flex items-center pl-3 py-2 rounded-md font-normal ${isActive(item.path) ? 'bg-gradient-to-r from-red-700 to-orange-400 text-white font-semibold' : 'hover:bg-color-lighter-gray'}`}>
                <Link to={item.path} className="flex items-center">
                  {item.icon}
                  <div className={`${isCollapsed ? 'hidden' : 'block'} ml-4 py-1`}>
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
