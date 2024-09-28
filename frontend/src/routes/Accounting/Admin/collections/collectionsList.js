import { useEffect, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { db } from "../../../../config/firebase-config";
import { doc,getDocs,collection } from "firebase/firestore";

export default function CollectionsList(){
    
    const [collectionsReport, setCollectionsReport] = useState([]);

    useEffect(()=>{

        const fetchCollectionsReport = async () =>{
            const firestationsRef = collection(db, 'firestationReportsCollections');
            const firestationsSnapshot = await getDocs(firestationsRef);

            const collectionsData = firestationsSnapshot.docs.map((doc => ({id:doc.id, ...doc.data()})));

            setCollectionsReport(collectionsData);
        }

        fetchCollectionsReport();
        
   
        



    },[]);

    return(
        <Fragment>
            
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Collections Report</h1>

            </div>

            <hr className="border-t border-[#7694D4] my-4" />
            
            <div className="flex flex-row">
            
                <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700 flex-none">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">Fire Stations</h5>
                        <a href="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
                            View all
                        </a>
                    </div>
                    <div className="flow-root">
                        {collectionsReport.map((collection) => (
                            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700" key={collection.id}>
                                <li className="py-3 sm:py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            {/* Add an image/icon if needed */}
                                        </div>
                                        <div className="flex-1 min-w-0 ms-4">
                                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                                {collection.username}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                {/* {collection.email} */}
                                            </p>
                                        </div>
                                        <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                            {/* ${collection.amount} Assuming amount is a property */}
                                        </div>
                                    </div>
                                </li>   
                            </ul>
                        ))}
                    </div>
                </div>
            
            <div className="ml-8 grow bg-white">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date Submitted</th>
                            <th scope="col" className="px-6 py-3">Number Of Collections</th>
                            <th scope="col" className="px-6 py-3">Collecting Officer</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                            <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                            >
                                January 2021
                            </th>
                            <td className="px-6 py-4">5</td>
                            <td className="px-6 py-4">Kent Divinagracia</td>
                            <td className="px-6 py-4">Reviewed</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            </div>
            </div>

        </Fragment>
    )

}
