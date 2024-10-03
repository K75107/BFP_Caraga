import React, { Fragment, useState } from "react";
import { FaFilter, FaCog, FaSortDown, FaSortUp } from 'react-icons/fa'; // Ensure react-icons is installed

export default function CollectionsPerStation() {
    const [isSortedAsc, setIsSortedAsc] = useState(true);

    const handleSortClick = () => {
        setIsSortedAsc(!isSortedAsc);
        // Add sorting logic here
    };

    return (
        <Fragment>
            
            <div className="flex flex-col space-y-6 w-full mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports
              </h1>
            </div>
          </div>
        {/* Unsubmitted and Submitted */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul
                className="flex flex-wrap -mb-px text-sm font-medium text-center"
                id="default-styled-tab"
                role="tablist"
                >
                <li className="me-2" role="presentation">
                    <button
                    // onClick={() => navigate("/main/firestation/collections/unsubmitted")}
                    className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
                    id="profile-styled-tab"
                    type="button"
                    role="tab"
                    aria-controls="profile"
                    aria-selected="false"
                    >
                    Overview
                    </button>
                </li>
                <li className="me-2" role="presentation">
                    <button
                    // onClick={() => navigate("/main/firestation/collections/unsubmitted")}
                    className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
                    id="profile-styled-tab"
                    type="button"
                    role="tab"
                    aria-controls="profile"
                    aria-selected="false"
                    >
                    Collections
                    </button>
                </li>
                <li className="me-2" role="presentation">
                    <button
                    // onClick={() => navigate("/main/firestation/collections/submitted")}
                    className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100 "
                    id="dashboard-styled-tab"
                    type="button"
                    role="tab"
                    aria-controls="dashboard"
                    aria-selected="false"
                    >
                    Deposits
                    </button>
                </li>
                </ul>
            </div>
                <hr className="border-t border-[#7694D4] my-4" />

                {/* TABLE */}
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Fire Station</th>
                                <th scope="col" className="px-6 py-3">OPS Number</th>
                                <th scope="col" className="px-6 py-3 flex items-center">
                                    OPS Date
                                    <button onClick={handleSortClick} className="ml-2 text-gray-600 hover:text-gray-800">
                                        {isSortedAsc ? <FaSortDown size={16} /> : <FaSortUp size={16} />}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">OPS Amount</th>
                                <th scope="col" className="px-6 py-3">OR Date</th>
                                <th scope="col" className="px-6 py-3">OR Number</th>
                                <th scope="col" className="px-6 py-3">Payor Name</th>
                                <th scope="col" className="px-6 py-3">Fire Code Classification</th>
                                <th scope="col" className="px-6 py-3">Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Table rows will go here */}
                        </tbody>
                    </table>
                </div>
      
        </Fragment>
    );
}
