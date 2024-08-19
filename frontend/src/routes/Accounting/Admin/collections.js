import React, { Fragment, useState } from "react";
import { FaFilter, FaCog, FaSortDown, FaSortUp } from 'react-icons/fa'; // Ensure react-icons is installed

export default function FireStationReports() {
    const [isSortedAsc, setIsSortedAsc] = useState(true);

    const handleSortClick = () => {
        setIsSortedAsc(!isSortedAsc);
        // Add sorting logic here
    };

    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Fire Station Reports - Collections</h1>
                    <div className="flex space-x-3">
                        <button className="text-gray-600 hover:text-gray-800">
                            <FaFilter size={20} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800">
                            <FaCog size={20} />
                        </button>
                    </div>
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
            </div>
        </Fragment>
    );
}
