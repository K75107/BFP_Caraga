import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Import your Firestore configuration
import { doc, getDoc } from 'firebase/firestore';
import Modal from "../../../../components/Modal";


export default function LedgerDetails() {
    const [showModal, setShowModal] = useState(false);
    const { ledgerId } = useParams(); // Get ledgerId from URL
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedgerData = async () => {
            try {
                const ledgerDocRef = doc(db, 'ledger', ledgerId); // Reference to the specific ledger
                const ledgerDoc = await getDoc(ledgerDocRef);

                if (ledgerDoc.exists()) {
                    setLedgerData(ledgerDoc.data());
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching ledger data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLedgerData();
    }, [ledgerId]);

    if (loading) return <p>Loading...</p>;

    return (
        <Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Ledger Details</h1>
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ ADD ACCOUNT</button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/*TABLE*/}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">ACCOUNT TITLE</th>
                            <th scope="col" className="px-6 py-3">ACCOUNT CODE</th>
                            <th scope="col" className="px-6 py-3">DATE</th>
                            <th scope="col" className="px-6 py-3">PARTICULARS</th>
                            <th scope="col" className="px-6 py-3">DEBIT</th>
                            <th scope="col" className="px-6 py-3">CREDIT</th>
                            <th scope="col" className="px-6 py-3">BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Assuming ledgerData has the necessary fields */}
                        {ledgerData && ledgerData.entries && ledgerData.entries.map((entry, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{entry.accountTitle || "N/A"}</td>
                                <td className="px-6 py-4">{entry.accountCode || "N/A"}</td>
                                <td className="px-6 py-4">{entry.date || "N/A"}</td>
                                <td className="px-6 py-4">{entry.particulars || "N/A"}</td>
                                <td className="px-6 py-4">{entry.debit || "0.00"}</td>
                                <td className="px-6 py-4">{entry.credit || "0.00"}</td>
                                <td className="px-6 py-4">{entry.balance || "0.00"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/*MODAL*/}
            <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Add Account
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    
                     
                  

                    <div className="flex justify-end py-3 px-4">
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4" >ADD</button>
                    </div>
                </div>
            </Modal>
        </Fragment>
    );
}
