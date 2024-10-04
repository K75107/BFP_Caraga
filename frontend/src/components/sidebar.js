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
import { BiSolidLabel, BiLabel } from "react-icons/bi";

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userType, setUserType] = useState('');

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === '/main/generalLedger' && currentPath.startsWith('/main/generalLedger') || path === '/main/reports/firestationReports' && currentPath.startsWith('/main/reports') || path === '/main/TrialBalance' && currentPath.startsWith('/main/TrialBalance') ||
      (path === '/main/balanceSheet' && currentPath.startsWith('/main/balanceSheet')) || (path === '/main/incomeStatement' && currentPath.startsWith('/main/incomeStatement')) 
      || (path === '/main/collections' && currentPath.startsWith('/main/collections'))) {
      return true;
    }
    return currentPath === path;
  };


  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const auth = getAuth();
    const fetchUserType = async (user) => {
      try {
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists()) {
          const userTypeFromFirestore = docSnap.data().usertype;
          if (userTypeFromFirestore) {
            setUserType(userTypeFromFirestore);
          } else {
            console.error("User type not found in Firestore document");
          }
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserType(user);
      } else {
        console.error("No authenticated user found");
      }
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  const menuItems = {
    "admin": [
      { path: '/main/dashboard', icon: isActive('/main/dashboard') ? <MdSpaceDashboard size={18} /> : <MdOutlineSpaceDashboard size={18} />, label: 'Dashboard' },
      { path: '/main/users', icon: isActive('/main/users') ? <HiUsers size={18} /> : <HiOutlineUsers size={18} />, label: 'Users' },
      { section: 'Ledger' },
      { path: '/main/generalLedger', icon: isActive('/main/generalLedger') ? <RiBook2Fill size={18} /> : <RiBook2Line size={18} />, label: 'General Ledger' },
      { path: '/main/accounts', icon: isActive('/main/accounts') ? <BiSolidLabel size={18} /> : <BiLabel size={18} />, label: 'Account Titles' },
      { path: '/main/TrialBalance', icon: isActive('/main/TrialBalance') ? <PiListChecksFill size={18} /> : <PiListChecks size={18} />, label: 'Trial Balance' },
      { section: 'Financial Statements' },
      { path: '/main/incomeStatement', icon: isActive('/main/incomeStatement') ? <RiFileAddFill size={18} /> : <RiFileAddLine size={18} />, label: 'Income Statement' },
      { path: '/main/balanceSheet', icon: isActive('/main/balanceSheet') ? <PiBookOpenTextFill size={18} /> : <PiBookOpenText size={18} />, label: 'Balance Sheet' },
      { path: '/main/cashflowStatement', icon: isActive('/main/cashflowStatement') ? <PiMoneyWavyFill size={18} /> : <PiMoneyWavy size={18} />, label: 'Cashflow Statement' },
      { path: '/main/changesInEquity', icon: isActive('/main/changesInEquity') ? <PiEqualizerFill size={18} /> : <PiEqualizer size={18} />, label: 'Changes In Equity' },
      { section: 'Reports' },
      { path: '/main/reports/firestationReports', icon: isActive('/main/reports') ? <PiStackFill size={18} /> : <PiStack size={18} />, label: 'firestationReports' },
        // Subcategories
        // { path: '/main/deposits', icon: isActive('/main/deposits') ? <PiHandDepositFill size={18} /> : <PiHandDeposit size={18} />, label: 'Deposits', indent: true },
        // { path: '/main/reports/collectionsList', icon: isActive('/main/reports/collectionsList') ? <PiStackFill size={18} /> : <PiStack size={18} />, label: 'Collections', indent: true },

    ],
    "fire-stations": [
      { path: '/main/firestation/dashboard', icon: isActive('/main/firestation/dashboard') ? <MdSpaceDashboard size={18} /> : <MdOutlineSpaceDashboard size={18} />, label: 'Dashboard' },
      { section: 'Reports' },
      { path: '/main/firestation/deposits', icon: isActive('/main/firestation/deposits') ? <PiHandDepositFill size={18} /> : <PiHandDeposit size={18} />, label: 'Deposits' },
      { path: '/main/firestation/collections', icon: isActive('/main/firestation/collections') ? <PiStackFill size={18} /> : <PiStack size={18} />, label: 'Collections' },
      { path: '/main/firestation/officers', icon: isActive('/main/firestation/officers') ? <HiUsers size={18} /> : <HiUsers size={18} />, label: 'Officers' },
    ]
  };

  const currentMenuItems = menuItems[userType] || [];

  return (
    <div className={`flex h-screen ${isCollapsed ? 'w-12' : 'w-64'} ${isCollapsed ? 'px-0' : 'px-1'} bg-white text-black font-body flex-col text-sm border-r transition-all duration-300 py-1`}>
      <div className="flex items-center px-1 py-2 whitespace-nowrap">
        <img
          src={logo}
          alt="BFP Logo"
          className={`h-6 w-6 mr-1 ml-1 ${isCollapsed ? 'cursor-pointer rotate-[360deg] duration-300' : 'rotate-360 duration-300'}`}
          onClick={isCollapsed ? toggleSidebar : null}
        />
        {!isCollapsed && (
          <>
            <h1 className='font-bold text-xl flex-1'>BFP CARAGA</h1>
          </>
        )}
        <button onClick={toggleSidebar} className={` ${isCollapsed ? '  z-10 rotate-180 duration-300' : 'ml-8 z-10 rotate-360 duration-300'}`}>
          <FaCircleChevronLeft size={20} color='#b91c1c' className='ml-18' />
        </button>
      </div>

      <hr className={`border-gray-300 my-1`} />

      <nav className="px-1 py-2 flex-grow">
        <ul className="space-y-1">
          {currentMenuItems.map((item, index) =>
            item.section ? (
              <li key={index}>
                <div className={`${isCollapsed ? 'hidden' : 'block'} mt-3`}>
                  <h1 className='font-bold text-sm ml-1 whitespace-nowrap'>{item.section}</h1>
                </div>
              </li>
            ) : (
              <li key={item.path}>
                <Link to={item.path} className={`whitespace-nowrap flex items-center ${item.indent ? 'pl-6' : 'pl-2'} py-2 rounded-md font-normal ${isActive(item.path) ? 'bg-gradient-to-r from-red-700 to-orange-400 text-white font-semibold' : 'hover:bg-color-lighter-gray'}`}>
                {item.icon}
                <div className={`${isCollapsed ? 'hidden' : 'block'} ml-3 py-0.5`}>
                  <span className="text-sm">{item.label}</span>
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
