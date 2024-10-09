import { useEffect, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { db } from "../../../../config/firebase-config";
import { doc,getDocs,collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown } from "react-icons/bi"; // Icons for filter button


export default function FirestationReports(){
    const navigate = useNavigate();
    const [usersData, setUsersData] = useState([]);

    useEffect(()=>{

        const fetchUsersData = async () =>{
            const firestationsRef = collection(db, 'firestationReportsCollections');
            const firestationsSnapshot = await getDocs(firestationsRef);

            const collectionsData = firestationsSnapshot.docs.map((doc => ({id:doc.id, ...doc.data()})));

            setUsersData(collectionsData);
        }

        fetchUsersData();
        
   
        



    },[]);

    return(
        <Fragment>
            
            <div className="flex flex-col space-y-6 w-full mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports
              </h1>
            </div>
          </div>
       
           {/* Buttons and Dropdowns */}
            <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">

                {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}         
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
                {/**FOR FILTERS ------------------------------------------------------------------------------------------- */}   

                </Dropdown>
                
                </div>


                <hr className="border-t border-[#7694D4] my-4" />
            
            <div className="flex flex-row">
            
                
           
            <div className="grow bg-white">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
           
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    
                        <tr>
                            <th scope="col" className="px-6 py-3">Firestation</th>
                            <th scope="col" className="px-6 py-3">Location</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    {usersData.map((collection) => (
                        <tr
                        key={collection.id} 
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => navigate(`/main/reports/overview/${collection.id}`)}
                        >
                            <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                            >
                                {collection.username}
                            </th>
                            <td className="px-6 py-4">{collection.province + ', ' + collection.municipalityCity}</td>
                            <td className="px-6 py-4"></td>
                        </tr>
                         ))}
                    </tbody>
                    
                </table>
           
            </div>

            </div>
            </div>

        </Fragment>
    )

}
