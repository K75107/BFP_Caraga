import React, { Fragment, useState } from "react";
import testDatabase from "../data/testDB";
import 'react-datepicker/dist/react-datepicker.css';
import { FaSearch, FaFilter, FaSort } from "react-icons/fa";
export default function Users() {
  const [showModal, setShowModal] = useState(false);

  return (
    <Fragment>
     <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
     <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Manage Users</h1>
                    
        <div className="flex items-center space-x-4">
         
        </div>
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
    </Fragment>
  );
}
