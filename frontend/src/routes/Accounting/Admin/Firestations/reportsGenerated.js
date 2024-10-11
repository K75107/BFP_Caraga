import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { db } from "../../../../config/firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Dropdown, Checkbox } from 'flowbite-react';
import { BiFilterAlt, BiChevronDown } from "react-icons/bi";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";

export default function GeneratedReports() {
    const navigate = useNavigate();

    return (
        <Fragment>
            <div className="flex flex-col space-y-6 w-full mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Fire Station Reports
                    </h1>
                </div>
            </div>
            {/* Buttons */}
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul
                    className="flex items-center -mb-px text-sm font-medium text-center"
                    id="default-styled-tab"
                    role="tablist"
                >
                    <li className="me-2" role="presentation">
                        <button
                            onClick={() => navigate(`/main/reports/firestationReports`)}
                            className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
                            id="profile-styled-tab"
                            type="button"
                            role="tab"
                            aria-controls="profile"
                            aria-selected="false"
                        >
                            Fire Stations
                        </button>
                    </li>
                    <li className="me-2" role="presentation">
                        <button
                            onClick={() => navigate(`/main/reports/generateReports`)}
                            className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
                            id="profile-styled-tab"
                            type="button"
                            role="tab"
                            aria-controls="profile"
                            aria-selected="false"
                        >
                            Reports
                        </button>
                    </li>
                    {/* Generate Report Button Inline */}
                    <li className="ml-auto">
                        <button
                            onClick={() => console.log("Generate Report Clicked")} // Replace with your actual click handler
                            className="mb-2 bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium"
                        >
                           + GENERATE REPORT
                        </button>
                    </li>
                </ul>
            </div>
        </Fragment>
    );
}
