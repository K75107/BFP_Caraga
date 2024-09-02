import React, { Fragment, useState} from "react";
import {Button, Input, Label, Select } from 'flowbite-react';
import testDatabase from "../../../data/testDB";
import 'react-datepicker/dist/react-datepicker.css';
import Modal from "../../../components/Modal"
import { useNavigate } from "react-router-dom";
//Firebase
import { auth } from "../../../config/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";


export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');

  const handleAddUser = async () => {
    await createUserWithEmailAndPassword(auth,email,password);
    
  };


  return (
    <Fragment>
     <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
     <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Manage Users</h1>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>ADD USERS</button>
                    </div>     
        <div className="flex items-center space-x-4">
         
        </div>
        

        <hr className="border-t border-[#7694D4] my-4" />

        {/* TABLE */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">USER</th>
                <th scope="col" className="px-6 py-3">PASSWORD</th>
                <th scope="col" className="px-6 py-3">USERTYPE</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody>
              {testDatabase.users.map((user, index) => (
                <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center">
                    <img
                      className="w-8 h-8 rounded-full mr-3"
                      src={user.profilePicture}
                      alt={`${user.username}'s profile`}
                    />
                    {user.username}
                  </td>
                  <td className="px-6 py-4">{user.password}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {user.usertype}
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


      {/*MODAL*/}
      <Modal isVisible={showModal}>
      <div className="bg-white w-[600px] h-auto rounded py-4 px-6">
        <div className="flex justify-between items-center">
          <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
            Add New User
          </h1>
          <button
            className="text-[27px] text-[#1E1E1E] bg-transparent border-none"
            onClick={() => setShowModal(false)}
          >
            ×
          </button>
        </div>

        <hr className="border-t border-[#7694D4] my-3" />

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              id="username"
              className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor="username"
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2"
            >
              Username
            </label>
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
            <label
              htmlFor="password"
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2"
            >
              Password
            </label>
          </div>

          <div className="relative">
            <select
              id="usertype"
              className="block w-full px-3 py-2 text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
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
            <label
              htmlFor="usertype"
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2"
            >
              User Type
            </label>
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
