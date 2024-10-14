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
    getDocs,
    getDoc
} from "firebase/firestore";
import { RiFileAddLine, RiFileAddFill } from "react-icons/ri";


export default function IncomeStatementList() {
    const navigate = useNavigate();
    const [currentModal, setCurrentModal] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [incomeStatementLedgerList, setIncomeStatementLedgerList] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState("");
    const [incomeStatementList, setIncomeStatementList] = useState([]);
    const [incomeStatementDescription, setIncomeStatementDescription] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteIncomeStatementID, setDeleteIncomeStatementID] = useState(null);

    // Add New Income Statement to Firestore
    const addNewIncomeStatement = async () => {
        try {
            const collectionRef = collection(db, "incomestatement");
            const docRef = await addDoc(collectionRef, {
                created_at: new Date(),
                description: incomeStatementDescription,
                start_date: startDate,
                end_date: endDate,
                ledgerID: selectedLedger,
            });
            const docSnapshot = await getDoc(docRef);
            setIncomeStatementList((prevList) => [...prevList, { id: docSnapshot.id, ...docSnapshot.data() }]);
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
            setIncomeStatementList((prevList) => prevList.filter((statement) => statement.id !== deleteIncomeStatementID));
            setShowDeleteModal(false);
            setDeleteIncomeStatementID(null);
        } catch (err) {
            console.error("Error deleting document:", err);
        }
    };

    // Fetching income statement list from Firestore
    const getIncomeStatementList = async () => {
        try {
            const data = await getDocs(collection(db, "incomestatement"));
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setIncomeStatementList(filteredData);
        } catch (err) {
            console.error("Error fetching income statement data:", err);
        }
    };

    // Fetching ledger list from Firestore
    const getLedgerList = async () => {
        try {
            const data = await getDocs(collection(db, "ledger"));
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setIncomeStatementLedgerList(filteredData);
        } catch (err) {
            console.error("Error fetching ledger data:", err);
        }
    };

    useEffect(() => {
        getLedgerList();
        getIncomeStatementList();
    }, []);

    return (
        <Fragment>
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li aria-current="page">
                        <div class="flex items-center">
                            <div class="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 ">
                                <RiFileAddFill className="mr-2"></RiFileAddFill>
                                Income Statement
                            </div>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}


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
                            <th scope="col" className="px-6 py-3">DESCRIPTION</th>
                            <th scope="col" className="px-6 py-3">Start Date</th>
                            <th scope="col" className="px-6 py-3">End Date</th>
                            <th scope="col" className="px-6 py-3">TOTAL SURPLUS/DEFICIT</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementList.map((incomeStatement) => (
                            <tr
                                key={incomeStatement.id}
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                onClick={() => navigate(`/main/incomeStatement/incomeStatementDetails/${incomeStatement.id}`)}
                            >
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    {incomeStatement.description || "N/A"}
                                </th>
                                <td className="px-6 py-4">
                                    {incomeStatement.start_date ? incomeStatement.start_date.toDate().toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    {incomeStatement.end_date ? incomeStatement.end_date.toDate().toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    {incomeStatement.totalSurplusDeficit !== undefined ? incomeStatement.totalSurplusDeficit : "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span
                                        className="font-medium text-red-600 dark:text-blue-500 hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent row click event
                                            setDeleteIncomeStatementID(incomeStatement.id);
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
            {showModal && currentModal === 1 && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select a Ledger</h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <hr className="border-t border-[#7694D4] my-3" />

                        <form className="max-w-sm mt-5">
                            <select
                                id="ledgerselect"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                value={selectedLedger}
                                onChange={(e) => setSelectedLedger(e.target.value)}
                            >
                                <option value="">Select Ledger</option>
                                {incomeStatementLedgerList.map((ledger) => (
                                    <option key={ledger.id} value={ledger.id}>
                                        {ledger.description}
                                    </option>
                                ))}
                            </select>
                        </form>

                        <div className="flex justify-end py-3 px-4">
                            <button
                                className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5 ${!selectedLedger && "opacity-50 cursor-not-allowed"}`}
                                onClick={() => selectedLedger && setCurrentModal(2)}
                                disabled={!selectedLedger}
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showModal && currentModal === 2 && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[600px] h-auto rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Generate Income Statement</h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <hr className="border-t border-[#7694D4] my-3" />

                        <form>
                            <label className="block font-medium font-poppins text-[#1E1E1E] mb-1">Income Statement Description</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                value={incomeStatementDescription}
                                onChange={(e) => setIncomeStatementDescription(e.target.value)}
                            />

                            <div className="flex flex-row justify-between gap-4 mt-5">
                                <div>
                                    <label className="block font-medium font-poppins text-[#1E1E1E] mb-1">Start Date</label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium font-poppins text-[#1E1E1E] mb-1">End Date</label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end py-3 px-4">
                                <button
                                    className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5"
                                    onClick={addNewIncomeStatement}
                                >
                                    GENERATE
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

           {/* DELETE CONFIRMATION MODAL */}
{showDeleteModal && (
    <Modal isVisible={showDeleteModal}>
        <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <button 
                    type="button" 
                    className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <svg 
                        className="w-3 h-3" 
                        aria-hidden="true" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 14 14"
                    >
                        <path 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6" 
                        />
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>
                <div className="p-4 md:p-5 text-center">
                    <svg 
                        className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" 
                        aria-hidden="true" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 20 20"
                    >
                        <path 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" 
                        />
                    </svg>
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this Income Statement?
                    </h3>
                    <button 
                        type="button" 
                        className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                        onClick={deleteIncomeStatement}
                    >
                        Yes, I'm sure
                    </button>
                    <button 
                        type="button" 
                        className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteIncomeStatementID(null);
                        }}
                    >
                        No, cancel
                    </button>
                </div>
            </div>
        </div>
    </Modal>
)}
        </Fragment>
    );
}
