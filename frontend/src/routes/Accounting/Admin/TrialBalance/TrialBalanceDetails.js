import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, collection, onSnapshot, addDoc, updateDoc, arrayRemove,deleteDoc,where,query,getDocs,getDoc,writeBatch } from 'firebase/firestore';

export default function TrialBalanceDetails(){

    const [TrialBalanceDescription, setTrialBalanceDescription] = useState("");

    const { trialbalanceID } = useParams(); // Get ledgerId from URL

    useEffect(() => {
        if (!trialbalanceID) {
            console.error('ledgerId is not provided.');
            return;
        }

        const trialbalanceDocRef = doc(db, 'trialbalance', trialbalanceID); 
        // Fetch ledger description from Firestore
        const fetchTrialBalanceDescription = async () => {
            const docSnap = await getDoc(trialbalanceDocRef);

            if (docSnap.exists()) {
                setTrialBalanceDescription(docSnap.data().description || 'No Description');
            } else {
                console.error('No such document!');
            }
        };

        fetchTrialBalanceDescription();

    });

    return(
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{TrialBalanceDescription}</h1>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                {/*TABLE*/}
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" class="px-6 py-3">
                                    PARTICULARS
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    ACCOUNT CODE
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    DEBIT
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    CREDIT
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                  
                                </th>
                                <td class="px-6 py-4">
                                
                                </td>
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                   
                                </th>
                                <td class="px-6 py-4">
                                   
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>



        </Fragment>
    );
}