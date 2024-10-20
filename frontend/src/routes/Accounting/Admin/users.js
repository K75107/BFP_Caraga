import React, { Fragment, useEffect, useState } from "react";
import { Button, Input, Label, Select } from 'flowbite-react';
//import testDatabase from "../../../data/testDB";
import 'react-datepicker/dist/react-datepicker.css';
import Modal from "../../../components/Modal";
import { useNavigate } from "react-router-dom";
// Firebase
import { auth } from "../../../config/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, storage } from "../../../config/firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import SuccessUnsuccessfulAlert from "../../../components/Alerts/SuccessUnsuccessfulALert";


export default function Users() {

  //Alerts
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);



  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [usersList, setUserList] = useState([]);


  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');



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


  //Get User Data from firebase

  useEffect(() => {
    const getUserList = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserList(usersData);
      } catch (err) {
        console.error(err);
      }
    };

    getUserList();



  }, []);

  const handleAddUser = async () => {
    try {

      // Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;


      // Create a new document in Firestore with the user's ID as the document ID
      const docRef = doc(db, "users", userId);
      await setDoc(docRef, {
        email: email,
        username: username,
        region: selectedRegion,
        province: selectedProvince,
        municipalityCity: selectedCityMunicipality,
        usertype: usertype,
        isActive: true, // Assuming new users are active by default
      });

      // console.log("User added successfully!");

      // Add user to the firestationReports if the usertype is 'firestation'
      if (usertype === "fire-stations") {
        const unsubmitCollectionRef = doc(db, "firestationReportsDeposits", userId);
        await setDoc(unsubmitCollectionRef, {
          email: email,
          username: username,
          region: selectedRegion,
          province: selectedProvince,
          municipalityCity: selectedCityMunicipality,
        });

        // console.log("User added to firestationReportsDeposits!");
      }

      if (usertype === "fire-stations") {
        const unsubmitCollectionRef = doc(db, "firestationReportsCollections", userId);
        await setDoc(unsubmitCollectionRef, {
          email: email,
          username: username,
          region: selectedRegion,
          province: selectedProvince,
          municipalityCity: selectedCityMunicipality,
        });

        // console.log("User added to firestationReportsCollections!");
        //---------------------------------------------Alerts--------------------------------------- 
        setIsSuccess(true);
        const timer = setTimeout(() => {
          setIsSuccess(false);
        }, 2000)
        return () => clearTimeout(timer);
        //---------------------------------------------Alerts--------------------------------------- 

      }

      if (usertype === "fire-stations") {
        const unsubmitCollectionRef = doc(db, "firestationReportsOfficers", userId);
        await setDoc(unsubmitCollectionRef, {
          email: email,
          username: username,
          region: selectedRegion,
          province: selectedProvince,
          municipalityCity: selectedCityMunicipality,
        });

        // console.log("User added to firestationReportsOfficers!");
      }

    } catch (err) {
      // console.error("Error adding user: ", err);

      //---------------------------------------------Alerts---------------------------------------
      setIsError(true);
             const timer = setTimeout(() => {
                setIsError(false);
             }, 2000)
             return () => clearTimeout(timer);
      //---------------------------------------------Alerts---------------------------------------
    }
    setShowModal(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setSelectedRegion('');
    setSelectedProvince('');
    setSelectedCityMunicipality('');
    setUsertype('');

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

      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Manage Users</h1>
          <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>ADD USERS</button>
        </div>

        <hr className="border-t border-[#7694D4] my-4" />

        {/* TABLE */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">USER</th>
                <th scope="col" className="px-6 py-3">LOCATION</th>
                <th scope="col" className="px-6 py-3">EMAIL</th>
                <th scope="col" className="px-6 py-3">USERTYPE</th>
                <th scope="col" className="px-6 py-3">ACTIVE</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user, index) => (
                <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center">
                    <div
                      className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor:
                          user?.province === 'Agusan del Norte' ? 'blue' :
                            user?.province === 'Agusan del Sur' ? 'red' :
                              user?.province === 'Dinagat Islands' ? 'brown' :
                                user?.province === 'Surigao del Norte' ? 'orange' :
                                  user?.province === 'Surigao del Sur' ? 'violet' :
                                    'gray' // Default color
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>

                    {user?.username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">{user.region + ', ' + user.province + ', ' + user.municipalityCity}</td>
                  <td className="px-6 py-4">{user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {user?.usertype || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${user?.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                    ></span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              ))}

            </tbody>

          </table>
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
                  setEmail(e.target.value + '@email.com')
                  setUsername(e.target.value)
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
                <option value="admin">Admin</option>
                <option value="regional-accountant">Regional Accountant</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="chief-fmd">Chief FMD</option>
                <option value="firecode-monitoring">Firecode Monitoring</option>
                <option value="fire-stations">Fire Stations</option>
                <option value="firecode-reconciliation">Firecode Reconciliation</option>
                <option value="revenue">Revenue</option>
              </select>
              <label htmlFor="usertype" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2">User Type</label>
            </div>

          </div>

          <div className="flex justify-end py-3 px-4">
            <button
              className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4"
              onClick={handleAddUser}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </Fragment>
  );
}
