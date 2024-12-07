import React, { Fragment, useEffect, useState } from "react";
import { Button, Input, Label, Select } from 'flowbite-react';
//import testDatabase from "../../../data/testDB";
import 'react-datepicker/dist/react-datepicker.css';
import Modal from "../../../components/Modal";
import { useNavigate } from "react-router-dom";
import AddButton from "../../../components/addButton";
import SearchBar from "../../../components/searchBar";
import SubmitButton from "../../../components/submitButton";

// Firebase
import { auth } from "../../../config/firebase-config";
import { createUserWithEmailAndPassword, getAuth, deleteUser as deleteAuthUser } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";
import { db, realtimeDb } from "../../../config/firebase-config";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import SuccessUnsuccessfulAlert from "../../../components/Alerts/SuccessUnsuccessfulALert";

//Axios
import axios from "axios";

export default function Users() {

  //Alerts
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);

  const navigate = useNavigate();
  const [usersList, setUserList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsersList, setFilteredUsersList] = useState([]); // New state for filtered data


  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  //DELETE USER ID
  const [deleteUserID, setDeleteUserID] = useState(null);



  //Location
  var philippines = require('philippines');
  var regions = require('philippines/regions');
  var provinces = require('philippines/provinces');
  var cities = require('philippines/cities');

  // Get the Caraga region
  var caragaProvinces = provinces.filter(province => province.region === 'XIII');
  var AgusanMunicipalitis = cities.filter(cities => cities.province === 'AGN')


  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedCityMunicipality, setSelectedCityMunicipality] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
    if (selectedUser) {
      setEmail(selectedUser.email || '');
      setUsername(selectedUser.username || '');
      setUsertype(selectedUser.usertype || '');
      setSelectedRegion(selectedUser.region || '');
      setSelectedProvince(selectedUser.province || '');
      setSelectedCityMunicipality(selectedUser.municipalityCity || '');
      }
    }, [selectedUser]);

      // Function to delete a user
      const deleteUser = async (userId) => {
        try {
          if (!userId) {
            console.error('User ID is missing!');
            return;
          }
      
          // Log the user ID for debugging purposes
          console.log('Deleting user with ID:', userId);
      
          // Perform the delete operation
          const response = await axios.delete(`https://bfp-caraga-1.onrender.com/delete-user/${userId}`);
          
          if (response.status === 200) {
            console.log('User deleted successfully:', response.data);
            
            // Update UI after deleting
            setUserList((prevUsersList) => prevUsersList.filter((user) => user.id !== userId));
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
          }
      
        } catch (err) {
          console.error('Error deleting user:', err);
          setIsError(true);
          setTimeout(() => setIsError(false), 2000);
        }
      };
      
      
      

  useEffect(() => {
    const filteredUsers = usersList.filter((users) =>
        users.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsersList(filteredUsers);
}, [searchQuery, usersList]);


  //Get User Data from firebase

  useEffect(() => {
    const getUserList = async () => {
      try {
        // Retrieve users from Firestore
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Set the initial user list from Firestore
        setUserList(usersData);
  
        // Retrieve active users from Realtime Database
        const usersRef = ref(realtimeDb, "status");
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          
          if (data) {
            // Format active users from Realtime Database as an object for easier lookup
            const activeUsersMap = Object.fromEntries(
              Object.entries(data).map(([key, value]) => [key, { ...value, id: key }])
            );
  
            // Merge Firestore users with status from Realtime Database
            setUserList(prevList => 
              prevList.map(user => ({
                ...user,
                isActive: activeUsersMap[user.id]?.isActive || false
              }))
            );
          }
        });
      } catch (err) {
        console.error("Error retrieving user data:", err);
      }
    };
  
    getUserList();
  }, []);
  
console.log(usersList)
  

const handleAddUser = async () => {
  try {
    if (!email || !password || !username || !usertype) {
      setIsError(true);
      console.error('Missing required fields.');
      return;
    }

    const userData = {
      email,
      password,
      username,
      region: selectedRegion,
      province: selectedProvince,
      municipalityCity: selectedCityMunicipality,
      usertype,
      isActive: false,
    };

    const response = await axios.post('https://bfp-caraga-1.onrender.com/add-user', userData);

    if (response.status === 200) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }
  } catch (error) {
    console.error('Error adding user: ', error.message);
    setIsError(true);
    setTimeout(() => setIsError(false), 2000);
  } finally {
    setShowModal(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setSelectedRegion('');
    setSelectedProvince('');
    setSelectedCityMunicipality('');
    setUsertype('');
  }
};

  return (
    <Fragment>
      {/**---------------------------------------------Alerts--------------------------------------- */}
      {isSuccess && (
        <div className="absolute top-4 right-4">
          <SuccessUnsuccessfulAlert isSuccess={isSuccess} message={'User added successfully'} icon={'check'} />
        </div>
      )}
      {isError && (
        <div className="absolute top-4 right-4">
          <SuccessUnsuccessfulAlert isError={isError} message={'Failed to add user. Please try again.'} icon={'wrong'} />
        </div>
      )}
      {/**---------------------------------------------Alerts--------------------------------------- */}

      <div className="bg-white h-full py-8 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Manage Users</h1>
          <div class="flex space-x-4">
          <SearchBar
              placeholder="Search User"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              listSource={filteredUsersList}
              />
            <AddButton
              onClick={() => setShowModal(true)}
              label="ADD USER"
            />
          </div>
        </div>

        <hr className="border-t border-[#7694D4] my-2 mb-4" />

        {/* TABLE */}
        <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 ">
            <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
              <tr>
                <th scope="col" className="px-6 py-4 ">USER</th>
                <th scope="col" className="px-6 py-4">LOCATION</th>
                <th scope="col" className="px-6 py-4">EMAIL</th>
                <th scope="col" className="px-6 py-4">USERTYPE</th>
                <th scope="col" className="px-6 py-4">ACTIVE</th>
                <th scope="col" className="px-6 py-4"></th>
              </tr>
            </thead>
          </table>
              <div className=' w-full overflow-y-scroll h-[calc(100vh-240px)]'>
                  <table className='text-[14px]  w-full overflow-x-visible'>
                      <tbody>
                      {filteredUsersList
                        .sort((a, b) => (a.usertype === 'admin' ? -1 : b.usertype === 'admin' ? 1 : 0)) // Admins first
                        .map((user, index) => (
                          <tr
                            key={index}
                            className={`bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                              user.usertype === 'admin' ? 'cursor-default' : 'cursor-pointer'
                            }`}
                          onClick={() => {
                            if (user.usertype === "admin") return; // Prevent editing admin
                            setSelectedUser(user);
                            setShowUserEditModal(true);
                          }}
                        >
                            <td className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center align-middle">
                              <div
                                className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                                style={{
                                  backgroundColor:
                                    user?.province === 'Agusan del Norte'
                                      ? 'blue'
                                      : user?.province === 'Agusan del Sur'
                                      ? 'red'
                                      : user?.province === 'Dinagat Islands'
                                      ? 'brown'
                                      : user?.province === 'Surigao del Norte'
                                      ? 'orange'
                                      : user?.province === 'Surigao del Sur'
                                      ? 'violet'
                                      : 'gray', // Default color
                                }}
                              >
                                {user?.username?.charAt(0).toUpperCase()}
                              </div>
                              {user?.username || 'Unknown'}
                            </td>
                            <td className="px-6 py-2">{user.region + ', ' + user.province + ', ' + user.municipalityCity}</td>
                            <td className="px-6 py-2">{user?.email || 'N/A'}</td>
                            <td className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              {user?.usertype || 'N/A'}
                            </td>
                            <td className="px-6 py-2">
                              <span
                                className={`inline-block w-3 h-3 rounded-full ${
                                  user?.isActive ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              ></span>
                            </td>
                            <td className="table-cell px-6 py-3 w-72 text-center">
                            {user.usertype !== 'admin' && (
                              <span
                                className="font-medium text-red-600 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteUserID(user.id);
                                  setShowDeleteModal(true);
                                }}
                              >
                                Remove
                              </span>
                            )}

                          </td>
                        </tr>
                      ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
      {/* MODAL */}
      <Modal isVisible={showModal}>
        <div className="bg-white w-[450px] h-auto rounded py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Add New User</h1>
            <button className="text-[27px] text-[#1E1E1E] bg-transparent border-none" onClick={() => setShowModal(false)}>×</button>
          </div>

          <hr className="border-t border-[#7694D4] my-3" />

          <div className="space-y-4">
            {/* *Location-------------------------------------------------------------------------------------------------------------------------------------------------------- */}
            {/**Region */}
            <div className="relative">
              <select
                id="region"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedRegion}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setSelectedRegion(selectedValue); // Save the selected region's code
                  const region = regions.find((region) => region.long === selectedValue); // Find the selected region by its code
                  setSelectedRegionCode(region ? region.key : ''); // Save the region's key (or code) if found
                }}
              >
                <option value="">Select region</option>
                {regions
                  .filter(regions => regions.key === 'XIII')
                  .map((regions) => (
                    <option key={regions.key} value={regions.code}>
                      {regions.long}
                    </option>

                  ))}

              </select>
              <label htmlFor="region" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Region</label>
            </div>
            {/**Province */}
            <div className="relative">
              <select
                id="province"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedProvince}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setSelectedProvince(selectedValue); // Save the selected region's code
                  const province = provinces.find((provinces) => provinces.name === selectedValue); // Find the selected region by its code
                  setSelectedProvinceCode(province ? province.key : ''); // Save the region's key (or code) if found
                }}
              >
                <option value="">Select province</option>
                {provinces
                  .filter(province => province.region === selectedRegionCode)
                  .map(province => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))
                }

              </select>
              <label htmlFor="province" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Province</label>
            </div>

            {/**Municipality/City */}
            <div className="relative">
              <select
                id="municipalityOrCity"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedCityMunicipality}
                onChange={(e) => {
                  setSelectedCityMunicipality(e.target.value)
                }}
              >
                <option value="">Select city/municipality</option>

                {cities
                  .filter(cities => cities.province === selectedProvinceCode)
                  .map(cities => (
                    <option key={cities.code} value={cities.code}>
                      {cities.name}
                    </option>
                  ))
                }

              </select>
              <label htmlFor="municipalityOrCity" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Province</label>
            </div>
            {/**Location-------------------------------------------------------------------------------------------------------------------------------------------------------- */}

            {/**Email-------------------------------------------------------------------- */}
            <div className="relative">
              <input
                type="email"
                id="email"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Email</label>
            </div>
            {/**Email-------------------------------------------------------------------- */}

            {/* Username */}
            <div className="relative mt-4">
              <input
                type="text"
                id="username"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="username" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Display Name</label>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Password</label>
            </div>

            <div className="relative">
              <select
                id="usertype"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={usertype}
                onChange={(e) => setUsertype(e.target.value)}
              >
                <option value="">Select user type</option>
                <option value="regional-accountant">Regional Accountant</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="chief-fmd">Chief FMD</option>
                <option value="disbursement-processor">Disbursement Processor Staff</option>
                <option value="firecode-monitoring">Firecode Monitoring Staff</option>
                <option value="fire-stations">Fire Stations</option>
                <option value="firecode-revenue">Firecode Revenue and Reconciliation Staff</option>
              </select>
              <label htmlFor="usertype" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">User Type</label>
            </div>

          </div>

          <div className="flex justify-end py-2 mt-2 ">
            <SubmitButton
              onClick={handleAddUser}
              label={"Add User"}

            />
          </div>
        </div>
      </Modal>


      {/* EDIT USER MODAL */}
      <Modal isVisible={showUserEditModal}>
        <div className="bg-white w-[450px] h-auto rounded py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Edit User</h1>
            <button className="text-[27px] text-[#1E1E1E] bg-transparent border-none" onClick={() => setShowUserEditModal(false)}>×</button>
          </div>

          <hr className="border-t border-[#7694D4] my-3" />

          <div className="space-y-4">
            {/* *Location-------------------------------------------------------------------------------------------------------------------------------------------------------- */}
            {/**Region */}
            <div className="relative">
              <select
                id="region"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedRegion}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setSelectedRegion(selectedValue); // Save the selected region's code
                  const region = regions.find((region) => region.long === selectedValue); // Find the selected region by its code
                  setSelectedRegionCode(region ? region.key : ''); // Save the region's key (or code) if found
                }}
              >
                <option value="">Select region</option>
                {regions
                  .filter(regions => regions.key === 'XIII')
                  .map((regions) => (
                    <option key={regions.key} value={regions.code}>
                      {regions.long}
                    </option>

                  ))}

              </select>
              <label htmlFor="region" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Region</label>
            </div>
            {/**Province */}
            <div className="relative">
              <select
                id="province"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedProvince}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  setSelectedProvince(selectedValue); // Save the selected region's code
                  const province = provinces.find((provinces) => provinces.name === selectedValue); // Find the selected region by its code
                  setSelectedProvinceCode(province ? province.key : ''); // Save the region's key (or code) if found
                }}
              >
                <option value="">Select province</option>
                {provinces
                  .filter(province => province.region === selectedRegionCode)
                  .map(province => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))
                }

              </select>
              <label htmlFor="province" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Province</label>
            </div>

            {/**Municipality/City */}
            <div className="relative">
              <select
                id="municipalityOrCity"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={selectedCityMunicipality}
                onChange={(e) => {
                  setSelectedCityMunicipality(e.target.value)
                }}
              >
                <option value="">Select city/municipality</option>

                {cities
                  .filter(cities => cities.province === selectedProvinceCode)
                  .map(cities => (
                    <option key={cities.code} value={cities.code}>
                      {cities.name}
                    </option>
                  ))
                }

              </select>
              <label htmlFor="municipalityOrCity" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Province</label>
            </div>
            {/**Location-------------------------------------------------------------------------------------------------------------------------------------------------------- */}

            {/**Email-------------------------------------------------------------------- */}
            <div className="relative">
              <input
                type="email"
                id="email"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Email</label>
            </div>
            {/**Email-------------------------------------------------------------------- */}

            {/* Username */}
            <div className="relative mt-4">
              <input
                type="text"
                id="username"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="username" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Display Name</label>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">Password</label>
            </div>

            <div className="relative">
              <select
                id="usertype"
                className="block w-full px-3 pt-3 pb-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                value={usertype}
                onChange={(e) => setUsertype(e.target.value)}
              >
                <option value="">Select user type</option>
                <option value="regional-accountant">Regional Accountant</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="chief-fmd">Chief FMD</option>
                <option value="disbursement-processor">Disbursement Processor Staff</option>
                <option value="firecode-monitoring">Firecode Monitoring Staff</option>
                <option value="fire-stations">Fire Stations</option>
                <option value="firecode-revenue">Firecode Revenue and Reconciliation Staff</option>
              </select>
              <label htmlFor="usertype" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">User Type</label>
            </div>

          </div>

          <div className="flex justify-end py-2 mt-2 ">
          <SubmitButton
            // onClick={saveEditedUser}
            label="Save"
          />
          </div>
        </div>
      </Modal>



            {/*DELETE MODAL*/}
            <Modal isVisible={showDeleteModal}>
                <div class="relative p-4 w-full max-w-md max-h-full">
                    <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <button type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="popup-modal"
                            onClick={() => setShowDeleteModal(false)}>
                            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                            </svg>
                            <span class="sr-only">Close modal</span>
                        </button>
                        <div class="p-4 md:p-5 text-center">
                            <svg class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this User?</h3>
                            <button data-modal-hide="popup-modal" type="button" class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                                onClick={() => deleteUser(deleteUserID) & setShowDeleteModal(false)}>
                                Yes, I'm sure
                            </button>
                            <button data-modal-hide="popup-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                                onClick={() => setShowDeleteModal(false)}>No, cancel</button>
                        </div>
                    </div>
                </div>
            </Modal>
    </Fragment>
  );
}
