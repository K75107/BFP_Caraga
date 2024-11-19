import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { db } from "../../../../config/firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Dropdown, Checkbox } from 'flowbite-react';
import { BiFilterAlt, BiChevronDown } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { PiStack, PiStackFill } from "react-icons/pi";
import SearchBar from "../../../../components/searchBar";
import ExportButton from "../../../../components/exportButton";
import { CiFilter } from "react-icons/ci";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoMdAddCircleOutline } from "react-icons/io"; // Icon
import { BiExport } from "react-icons/bi"; // Icons for filter button


export default function FirestationReports() {
    const navigate = useNavigate();
    const [usersData, setUsersData] = useState([]);
    const [toggledRows, setToggledRows] = useState({}); // State to manage toggled provinces

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsersData, setFilteredUsersData] = useState([]); // New state for filtered data

    const [filteredGroupedData, setFilteredGroupedData] = useState([]);

    useEffect(() => {
        const filteredUsers = usersData.filter((users) =>
            users.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsersData(filteredUsers);

        // Group the data by province based on filteredUsers
        const groupedData = filteredUsers.reduce((acc, collection) => {
            const { province } = collection;
            if (!acc[province]) {
                acc[province] = [];
            }
            acc[province].push(collection);
            return acc;
        }, {});

        setFilteredGroupedData(groupedData);
    }, [searchQuery, usersData]);


    useEffect(() => {
        const fetchUsersData = async () => {
            const firestationsRef = collection(db, 'firestationReportsCollections');
            const firestationsSnapshot = await getDocs(firestationsRef);
            const collectionsData = firestationsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsersData(collectionsData);
        }

        fetchUsersData();
    }, []);

    // Toggle function for provinces
    const toggleProvince = (province) => {
        setToggledRows((prev) => ({
            ...prev,
            [province]: !prev[province]
        }));
    };

    // Updated year list
    const [years, setYears] = useState([]);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2020;
        const yearList = [];

        for (let year = currentYear; year >= startYear; year--) {
            yearList.push(year);
        }

        setYears(yearList);
    }, []);

    return (
        <Fragment>
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li aria-current="page">
                        <div class="flex items-center">
                            <div class="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 ">
                                <PiStackFill className="mr-2"></PiStackFill>
                                Collections & Deposits
                            </div>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="flex flex-col space-y-6 w-full mb-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Fire Station Reports
                    </h1>
                    <div class="flex space-x-4">
                        <SearchBar
                            placeholder="Search Firestation"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            listSource={filteredUsersData}
                        />

                        {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}
                        {/* Buttons and Dropdowns */}
                        <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">

                            {/* Filter Dropdown */}
                            <Dropdown
                                label={
                                    <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                                        <CiFilter className="w-5 h-5 mr-2" aria-hidden="true" />
                                        <span className="mr-2 font-medium">Filter</span>
                                        <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                                    </div>
                                }
                                dismissOnClick={false}
                                inline={true}
                                arrowIcon={false} // Disabled default arrow icon
                                className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto  hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            >


                                <div className="p-7 w-56">
                                    <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white ">
                                        Province
                                    </h6>
                                    <ul className="space-y-2 text-sm ">

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="year"
                                                label="Year"
                                            // checked={selectedCategory === "year"}
                                            // onChange={handleYearChange} // Toggle year
                                            />
                                            <span className="ml-2">All</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="year"
                                                label="Year"
                                            // checked={selectedCategory === "year"}
                                            // onChange={handleYearChange} // Toggle year
                                            />
                                            <span className="ml-2">Agusan del Norte</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="month"
                                                label="Month"
                                            // checked={selectedCategory === "month"}
                                            // onChange={handleMonthChange} // Toggle month
                                            />
                                            <span className="ml-2">Agusan del Sur</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Dinagat Islands</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Surigao del Norte</span>
                                        </li>

                                        <li className="flex items-center hover:bg-gray-100 p-1">
                                            <Checkbox
                                                id="day"
                                                label="day"
                                            // checked={selectedCategory === "day"}
                                            // onChange={handleDayChange} // Toggle month
                                            />
                                            <span className="ml-2">Surigao del Sur</span>
                                        </li>
                                    </ul>
                                </div>
                                {/* New Section for Deposit Filter */}
                                <div className="px-7 py-2 w-40">
                                    <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                                        Period
                                    </h6>
                                    <ul className="space-y-2 text-sm">
                                        {years.map((year) => (
                                            <li key={year} className="flex items-center hover:bg-gray-100 p-1">
                                                <Checkbox
                                                    id={`year-${year}`}
                                                    label="Year"
                                                />
                                                <span className="ml-2">{year}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>


                            </Dropdown>
                        </div>

                        {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}
            {/* Export Dropdown */}
            <Dropdown
              label={
                <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                  <BiExport className="mr-2 text-[15px] font-bold" />
                  <span className="mr-2 font-medium">Export</span>
                  <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                </div>
              }
              dismissOnClick={false}
              inline={true}
              arrowIcon={false} // Disabled default arrow icon
              className=" w-70 text-gray-900 bg-white border border-gray-200 rounded-lg  focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              <h6 className=" text-sm font-medium text-gray-700 dark:text-white p-1 text-center">
                Export by Date
              </h6>
              <hr className="border-t bordergray-50 my-1" />

              <div className="px-3 py-1 flex flex-row justify-between">
                <div className='px-3 py-1'>
                  <DatePicker
                    // selected={startExportDate}
                    // onChange={(date) => setStartExportDate(date)}
                    placeholderText="Start Date"
                    dateFormat="yyyy-MM-dd"
                    onKeyDown={(e) => e.stopPropagation()} 
                    className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                  />
                </div>
                <div className='px-3 py-1'>
                  <DatePicker
                    // selected={endExportDate}
                    // onChange={(date) => setEndExportDate(date)}
                    placeholderText="End Date"
                    dateFormat="yyyy-MM-dd"
                    onKeyDown={(e) => e.stopPropagation()} 
                    className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                  />
                </div>

                <div className='px-3 py-1'>
                  <ExportButton
                    label="EXPORT"
                    // onClick={exportToExcel}
                  />
                </div>
              </div>
            </Dropdown>

                    </div>
                </div>
            </div>











            <hr className="border-t border-[#7694D4] my-2 mb-4" />



            <div className="flex flex-row">
                <div className="grow bg-white">
                    <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                        <div className="w-full overflow-y-scroll h-[calc(96vh-160px)]">
                            <table className="w-full text-left text-black-700 ">
                                <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 w-[140px]">Province</th>
                                        <th scope="col" className="px-6 py-4 w-[120px]">Firestation</th>
                                        <th scope="col" className="px-6 py-4 w-[170px]">Location</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Total Collections</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Total Deposits</th>
                                        <th scope="col" className="px-6 py-4 w-[130px]">Submission Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(filteredGroupedData).map(([province, collections]) => (
                                        <Fragment key={province}>
                                            <tr
                                                className=" text-[14px] bg-gray-100 h-8 border-b  w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                                onClick={() => toggleProvince(province)}
                                            >
                                                <td className=" table-cell px-6 py-2 w-[120px] text-[14px] h-8 px-2">
                                                    {province}

                                                    {toggledRows[province] ? (
                                                        <MdKeyboardArrowDown size={20} style={{ display: "inline" }} />
                                                    ) : (
                                                        <MdKeyboardArrowRight size={20} style={{ display: "inline" }} />
                                                    )}

                                                </td>
                                                <td className=" table-cell px-6 py-2 w-[120px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-6 py-2 w-[150px] text-[14px] h-8 px-2"></td>

                                            </tr>

                                            {toggledRows[province] && collections.map((collection) => (
                                                <tr
                                                    key={collection.id}
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer h-8"
                                                    onClick={() => navigate(`/main/reports/overview/${collection.id}`)}
                                                >
                                                    <td className="text-[14px] px-6 py-2 w-[120px]"></td>
                                                    <td className="text-[14px] px-6 py-2 w-[120px]">
                                                        {collection.username}
                                                    </td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]">
                                                        {collection.province + ', ' + collection.municipalityCity}
                                                    </td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]"></td>
                                                    <td className="text-[14px] px-6 py-2 w-[150px]"></td>

                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
