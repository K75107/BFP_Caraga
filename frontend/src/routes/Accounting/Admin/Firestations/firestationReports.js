import { useEffect, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { db } from "../../../../config/firebase-config";
import { doc,getDocs,collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function FirestationReports(){
    const navigate = useNavigate();
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
            
            <div className="flex flex-col space-y-6 w-full mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Fire Station Reports
              </h1>
            </div>
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
                            <th scope="col" className="px-6 py-3">Collecting Officer</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    {collectionsReport.map((collection) => (
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
                            <td className="px-6 py-4">{collection.region + ', ' + collection.province + ', ' + collection.municipalityCity}</td>
                            <td className="px-6 py-4"></td>
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
