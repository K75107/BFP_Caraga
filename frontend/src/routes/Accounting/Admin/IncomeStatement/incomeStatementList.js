import React, { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../../components/Modal";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from "../../../../config/firebase-config";
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot 
} from "firebase/firestore";

export default function IncomeStatementList() {
    const navigate = useNavigate();

    // Modal State
    const [currentModal, setCurrentModal] = useState(1);
    const [showModal, setShowModal] = useState(false);

    // Date State
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Income Statement List
    const [incomeStatementList, setIncomeStatementList] = useState([]);

    // Income Statement Description
    const [incomeStatementDescription, setIncomeStatementDescription] = useState("");

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteIncomeStatementID, setDeleteIncomeStatementID] = useState(null);

    // Ledger List and Selected Ledger
    const [listLedger, setListLedger] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState("");

    // Fetch Ledgers from Firestore
    useEffect(() => {
        const listLedgersRef = collection(db, 'ledger');
        const unsubscribeLedger = onSnapshot(listLedgersRef, (snapshot) => {
            const listLedgers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Fetched Ledgers:", listLedgers); // Debugging
            setListLedger(listLedgers);
        }, (error) => {
            console.error('Error fetching ledgers:', error);
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribeLedger();
        };
    }, []);

    // Fetch Income Statement List from Firestore
    useEffect(() => {
        const incomeStatementRef = collection(db, "incomestatement");
        const unsubscribeIncomeStatement = onSnapshot(incomeStatementRef, (snapshot) => {
            const incomeStatementData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setIncomeStatementList(incomeStatementData);
        }, (error) => {
            console.error("Error fetching income statement data:", error);
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribeIncomeStatement();
        };
    }, []);

    // Add New Income Statement
    const addNewIncomeStatement = async () => {
        if (!incomeStatementDescription || !startDate || !endDate || !selectedLedger) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const collectionRef = collection(db, "incomestatement");

            await addDoc(collectionRef, {
                description: incomeStatementDescription,
                start_date: startDate,
                end_date: endDate,
                ledger: selectedLedger, // Include selected ledger
                created_at: new Date(),
            });

            // Reset form fields and close modal
            setShowModal(false);
            setIncomeStatementDescription("");
            setStartDate(null);   
            setEndDate(null);  
            setSelectedLedger("");       
        } catch (err) {
            console.error("Error adding document:", err);
        }
    };

    // Delete Income Statement
    const deleteIncomeStatement = async () => {
        if (!deleteIncomeStatementID) return;

        try {
            await deleteDoc(doc(db, "incomestatement", deleteIncomeStatementID));
            setShowDeleteModal(false);
            setDeleteIncomeStatementID(null);
        } catch (err) {
            console.error("Error deleting document:", err);
        }
    };

    return(
        <Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Income Statement</h1>
                <button 
                    className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" 
                    onClick={() => {
                        setCurrentModal(1);
                        setShowModal(true);
                    }}
                >
                    + GENERATE INCOME STATEMENT
                </button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/* TABLE */}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                DESCRIPTION
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Start Date
                            </th>
                            <th scope="col" className="px-6 py-3">
                                End Date
                            </th>
                            <th scope="col" className="px-6 py-3">
                                TOTAL SURPLUS/DEFICIT
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <span className="sr-only">View</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementList.map((incomestatement) => (
                            <tr
                                key={incomestatement.id}
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                // Uncomment and implement navigation if needed
                                onClick={() => navigate(`/main/IncomeStatement/incomeStatementDetails/${incomestatement.id}`)}
                            >
                                <th
                                    scope="row"
                                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                    {incomestatement.description || "No Description"}
                                </th>
                                <td className="px-6 py-4">
                                    {incomestatement.start_date ? new Date(incomestatement.start_date.seconds * 1000).toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    {incomestatement.end_date ? new Date(incomestatement.end_date.seconds * 1000).toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    {incomestatement.total_surplusdeficit || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span
                                        className="font-medium text-red-600 dark:text-blue-500 hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent row click event
                                            setDeleteIncomeStatementID(incomestatement.id); // Set ID to delete
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        Remove
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}

            {/* 1ST MODAL */}
            {showModal && currentModal === 1 && (
                <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                    {/* HEADER */}
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Select a Ledger
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />


                        {/* SELECT */}
                        <form className="max-w-sm mt-5">
                            <select 
                                id="ledgerselect" 
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                value={selectedLedger}
                                onChange={(e) => setSelectedLedger(e.target.value)}
                            >
                                <option value="">Select Ledger</option>
                                {listLedger.map((ledger) => (
                                    <option key={ledger.id} value={ledger.id}>
                                        {ledger.description || ledger.name || "No Description"}
                                    </option>
                                ))}
                            </select>
                        </form>

                        {/* BUTTON */}
                        <div className="flex justify-end py-3 px-4">
                            <button 
                                className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5"
                                onClick={() => {
                                    if (!selectedLedger) {
                                        alert("Please select a ledger.");
                                        return;
                                    }
                                    setCurrentModal(2);
                                }}
                            >
                                NEXT
                            </button>
                            </div>
                             </div> 
                        </Modal> )}
        {/* 2nd MODAL */}
{showModal && currentModal === 2 && (
    <Modal isVisible={showModal}>
        <div className="bg-white w-[600px] h-auto rounded py-2 px-4">
            {/* HEADER */}
            <div className="flex justify-between">
                <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                    Generate Income Statement
                </h1>
                <button
                    className="font-poppins text-[27px] text-[#1E1E1E]"
                    onClick={() => {
                        setCurrentModal(1);
                        setShowModal(false);
                        setStartDate(null);
                        setEndDate(null);
                        setIncomeStatementDescription(""); // Updated to Income Statement
                        setSelectedLedger("");
                    }}
                >
                    ×
                </button>
            </div>

            <hr className="border-t border-[#7694D4] my-3" />

            {/* LABEL */}
            <div className="flex p-2.5">
                <div className="relative">
                    <input
                        type="text"
                        id="description"
                        className="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                        placeholder=" "
                        value={incomeStatementDescription} // Updated to Income Statement
                        onChange={(e) => setIncomeStatementDescription(e.target.value)}
                    />
                    <label
                        htmlFor="description"
                        className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 
                                    peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 
                                    peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 
                                    peer-placeholder-shown:top-1/2 peer-focus:top-2 
                                    peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                    >
                        Income Statement Description {/* Updated label */}
                    </label>
                </div>
            </div>

            {/* DATE PICKERS */}
            <div className="flex items-center space-x-4 p-2.5 bg-white max-w-lg">
                <div className="relative">
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholderText="Select start date"
                    />
                </div>

                <span className="text-gray-500">to</span>

                <div className="relative">
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholderText="Select end date"
                    />
                </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end py-3 px-4 flex-row">
                <button
                    className="bg-white border border-[#D32F2F] rounded text-[11px] text-[#D32F2F] font-poppins font-medium py-2.5 px-7 mt-4"
                    onClick={() => {
                        setCurrentModal(1);
                        setStartDate(null);
                        setEndDate(null);
                        setIncomeStatementDescription(""); // Updated to Income Statement
                        setSelectedLedger("");
                    }}
                >
                    BACK
                </button>
                <button
                    className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-4 ml-5"
                    onClick={addNewIncomeStatement} // Updated function for Income Statement generation
                >
                    GENERATE
                </button>
            </div>
        </div>
    </Modal>
)}


        {/* DELETE MODAL */}
        {showDeleteModal && (
            <Modal isVisible={showDeleteModal}>
                <div className="bg-white w-[400px] h-[200px] rounded py-2 px-4">
                    <h2 className="text-lg font-semibold">Are you sure you want to delete this Income Statement?</h2>
                    <div className="flex justify-end mt-6">
                        <button 
                            className="bg-red-600 text-white py-2 px-4 rounded mr-2" 
                            onClick={deleteIncomeStatement}
                        >
                            Yes, Delete
                        </button>
                        <button 
                            className="bg-gray-300 py-2 px-4 rounded" 
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        )}
    </Fragment>
)
}