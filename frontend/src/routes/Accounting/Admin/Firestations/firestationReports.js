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

export default function FirestationReports() {
    const navigate = useNavigate();
    const [usersData, setUsersData] = useState([]);
    const [toggledRows, setToggledRows] = useState({}); // State to manage toggled provinces

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

    // Grouping data by province
    const groupedData = usersData.reduce((acc, collection) => {
        const { province } = collection;
        if (!acc[province]) {
            acc[province] = [];
        }
        acc[province].push(collection);
        return acc;
    }, {});

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
                </div>
            </div>
            {/* Buttons */}
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul
                    className="flex flex-wrap -mb-px text-sm font-medium text-center"
                    id="default-styled-tab"
                    role="tablist"
                >
                    <li className="me-2" role="presentation">
                        <button
                            onClick={() => navigate(`/main/reports/firestationReports`)}
                            className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
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
                            className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
                            id="profile-styled-tab"
                            type="button"
                            role="tab"
                            aria-controls="profile"
                            aria-selected="false"
                        >
                            Reports
                        </button>
                    </li>
                </ul>
            </div>

            <div className="flex flex-col items-center justify-between mb-4 space-y-3 md:flex-row md:space-y-0 md:space-x-4">
                {/* Search Form */}
                <div className="w-full md:w-1/2">
                    <form className="flex items-center">
                        <label htmlFor="search" className="sr-only">Search</label>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg
                                    aria-hidden="true"
                                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="search"
                                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Search..."
                                // value={searchQuery}
                                // onChange={(e) => setSearchQuery(e.target.value)} // Update search query
                                autoComplete="off"
                            />
                        </div>
                    </form>
                </div>




                {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}
                {/* Buttons and Dropdowns */}
                <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">
                    <Dropdown
                        label={
                            <div className="flex items-center">
                                <BiFilterAlt className="w-4 h-4 mr-2 text-gray-400" /> {/* Filter Icon */}
                                <span className="mr-2">Period</span>
                                <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
                            </div>
                        }
                        dismissOnClick={false}
                        inline={true}
                        arrowIcon={false} // Disabled default arrow icon
                        className="text-gray-900 bg-white border border-gray-200 rounded-lg md:w-auto hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                        <div className="p-4 w-40">
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
                    {/* Filter Dropdown */}
                    <Dropdown
                        label={
                            <div className="flex items-center">
                                <BiFilterAlt className="w-4 h-4 mr-2 text-gray-400" /> {/* Filter Icon */}
                                <span className="mr-2">Filter</span>
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

                            {/* New Section for Deposit Filter */}
                            <h6 className="mt-4 mb-3 text-sm font-medium text-gray-900 dark:text-white ">
                                Deposit Status
                            </h6>
                            <div className="space-y-2">
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="all"
                                        // checked={selectedDepositFilter === 'all'}
                                        // onChange={() => setSelectedDepositFilter('all')}
                                        className="mr-2"
                                    />
                                    <span>All</span>
                                </label>
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="deposited"
                                        // checked={selectedDepositFilter === 'deposited'}
                                        // onChange={() => setSelectedDepositFilter('deposited')}
                                        className="mr-2"
                                    />
                                    <span>Deposited</span>
                                </label>
                                <label className="flex items-center hover:bg-gray-100 p-1 text-sm">
                                    <input
                                        type="radio"
                                        value="undeposited"
                                        // checked={selectedDepositFilter === 'undeposited'}
                                        // onChange={() => setSelectedDepositFilter('undeposited')}
                                        className="mr-2"
                                    />
                                    <span>Undeposited</span>
                                </label>
                            </div>

                        </div>
                    </Dropdown>
                </div>
            </div>
            {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}




            <hr className="border-t border-[#7694D4] my-4" />



            <div className="flex flex-row">
                <div className="grow bg-white">
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <div className="w-full overflow-y-scroll h-[calc(96vh-240px)]">
                            <table className="w-full text-left text-black-700 ">
                                <thead className="text-[12px] uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-2 py-3 w-[120px]">Province</th>
                                        <th scope="col" className="px-2 py-3 w-[120px]">Firestation</th>
                                        <th scope="col" className="px-2 py-3 w-[150px]">Location</th>
                                        <th scope="col" className="px-2 py-3 w-[150px]">Total Collections</th>
                                        <th scope="col" className="px-2 py-3 w-[150px]">Total Deposits</th>
                                        <th scope="col" className="px-2 py-3 w-[150px]">Submission Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedData).map(([province, collections]) => (
                                        <Fragment key={province}>
                                            <tr
                                                className=" text-[14px] bg-gray-100 h-8 border-b  w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                                onClick={() => toggleProvince(province)}
                                            >
                                                <td className=" table-cell px-2 py-2 w-[120px] text-[14px] h-8 px-2">
                                                    {province}

                                                    {toggledRows[province] ? (
                                                        <MdKeyboardArrowDown size={20} style={{ display: "inline" }} />
                                                    ) : (
                                                        <MdKeyboardArrowRight size={20} style={{ display: "inline" }} />
                                                    )}

                                                </td>
                                                <td className=" table-cell px-2 py-2 w-[120px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>
                                                <td className=" table-cell px-2 py-2 w-[150px] text-[14px] h-8 px-2"></td>

                                            </tr>

                                            {toggledRows[province] && collections.map((collection) => (
                                                <tr
                                                    key={collection.id}
                                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer h-8"
                                                    onClick={() => navigate(`/main/reports/overview/${collection.id}`)}
                                                >
                                                    <td className="text-[14px] px-2 py-2 w-[120px]"></td>
                                                    <td className="text-[14px] px-2 py-2 w-[120px]">
                                                        {collection.username}
                                                    </td>
                                                    <td className="text-[14px] px-2 py-2 w-[150px]">
                                                        {collection.province + ', ' + collection.municipalityCity}
                                                    </td>
                                                    <td className="text-[14px] px-2 py-2 w-[150px]"></td>
                                                    <td className="text-[14px] px-2 py-2 w-[150px]"></td>

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
