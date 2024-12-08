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
import { PiListChecks, PiListChecksFill } from "react-icons/pi";
import AddButton from "../../../../components/addButton";

export default function TrialBalanceList() {
    const navigate = useNavigate();

    // Modal State
    const [currentModal, setCurrentModal] = useState(1);
    const [showModal, setShowModal] = useState(false);

    // Date State
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Trial Balance List
    const [trialBalanceList, setTrialBalanceList] = useState([]);

    // Trial Balance Description
    const [trialBalanceDescription, setTrialBalanceDescription] = useState("");

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTrialBalanceID, setDeleteTrialBalanceID] = useState(null);

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

    // Fetch Trial Balance List from Firestore
    useEffect(() => {
        const trialBalanceRef = collection(db, "trialbalance");
        const unsubscribeTrialBalance = onSnapshot(trialBalanceRef, (snapshot) => {
            const trialBalanceData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTrialBalanceList(trialBalanceData);
        }, (error) => {
            console.error("Error fetching trial balance data:", error);
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribeTrialBalance();
        };
    }, []);

    // Add New Trial Balance
    const addNewTrialBalance = async () => {
        if (!trialBalanceDescription || !startDate || !endDate || !selectedLedger) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const collectionRef = collection(db, "trialbalance");

            await addDoc(collectionRef, {
                description: trialBalanceDescription,
                start_date: startDate,
                end_date: endDate,
                ledger: selectedLedger, // Include selected ledger
                created_at: new Date(),
            });

            // Reset form fields and close modal
            setShowModal(false);
            setTrialBalanceDescription("");
            setStartDate(null);
            setEndDate(null);
            setSelectedLedger("");
        } catch (err) {
            console.error("Error adding document:", err);
        }
    };

    // Delete Trial Balance
    const deleteTrialBalance = async () => {
        if (!deleteTrialBalanceID) return;

        try {
            await deleteDoc(doc(db, "trialbalance", deleteTrialBalanceID));
            setShowDeleteModal(false);
            setDeleteTrialBalanceID(null);
        } catch (err) {
            console.error("Error deleting document:", err);
        }
    };

    return (
        <Fragment>
            {/**Breadcrumbs */}
            <nav class="flex absolute top-[20px] ml-2" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li aria-current="page">
                        <div class="flex items-center">
                            <div class="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 ">
                                <PiListChecksFill className="mr-2"></PiListChecksFill>
                                Trial Balance
                            </div>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="px-2">
                <div className="bg-white h-30 py-6 px-8 rounded-lg">
                    <div className="flex justify-between w-full">
                        <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Trial Balance</h1>
                        <div class="flex space-x-4">
                            <AddButton
                                onClick={() => {
                                    setCurrentModal(1);
                                    setShowModal(true);
                                }}
                                label="GENERATE TRIAL BALANCE"
                            />
                        </div>
                    </div>
                </div>
            </div>


            <div className="px-2 py-4">
                <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-72">
                                    DESCRIPTION
                                </th>
                                <th scope="col" className="px-5 py-4 w-72">
                                    Start Date
                                </th>
                                <th scope="col" className="px-4 py-4 w-72">
                                    End Date
                                </th>
                                <th scope="col" className="pr-8 py-4 w-72 text-center">
                                    ACTIONS
                                </th>
                            </tr>
                        </thead>
                    </table>

                    <div className=' w-full overflow-y-auto max-h-[calc(100vh-240px)]'>
                        <table className='w-full overflow-x-visible text-[14px]'>
                            <tbody>
                                {trialBalanceList.map((trialbalance) => (
                                    <tr
                                        key={trialbalance.id}
                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                        // Uncomment and implement navigation if needed
                                        onClick={() => navigate(`/main/TrialBalance/TrialBalanceDetails/${trialbalance.id}`)}
                                    >
                                        <td
                                            className="table-cell px-6 py-3 w-72 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                        >
                                            {trialbalance.description || "No Description"}
                                        </td>
                                        <td className="table-cell px-6 py-3 w-72">
                                            {trialbalance.start_date ? new Date(trialbalance.start_date.seconds * 1000).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="table-cell px-6 py-3 w-72">
                                            {trialbalance.end_date ? new Date(trialbalance.end_date.seconds * 1000).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="table-cell px-6 py-3 w-72 text-center">
                                            <span
                                                className="font-medium text-red-600 dark:text-blue-500 hover:underline cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click event
                                                    setDeleteTrialBalanceID(trialbalance.id); // Set ID to delete
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
                </div>
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
                </Modal>
            )}

            {/* 2nd MODAL */}
            {showModal && currentModal === 2 && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[600px] h-auto rounded py-2 px-4">
                        {/* HEADER */}
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                                Generate Trial Balance
                            </h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => {
                                setCurrentModal(1);
                                setShowModal(false);
                                setStartDate(null);
                                setEndDate(null);
                                setTrialBalanceDescription("");
                                setSelectedLedger("");
                            }}>
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
                                    className="block px-6.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                    placeholder=" "
                                    value={trialBalanceDescription}
                                    onChange={(e) => setTrialBalanceDescription(e.target.value)}
                                />
                                <label
                                    htmlFor="description"
                                    className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-6 
                                    peer-focus:px-6 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 
                                    peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 
                                    peer-placeholder-shown:top-1/2 peer-focus:top-2 
                                    peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                                >
                                    Trial Balance Description
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
                                    setTrialBalanceDescription("");
                                    setSelectedLedger("");
                                }}
                            >
                                BACK
                            </button>
                            <button
                                className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-4 ml-5"
                                onClick={addNewTrialBalance}
                            >
                                GENERATE
                            </button>
                        </div>
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
                                onClick={() => setShowDeleteModal(false)}>
                                <svg
                                    className="w-3 h-3"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 14 14">
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
                                    viewBox="0 0 20 20">
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                </svg>
                                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete this Trial Balance?
                                </h3>
                                <button
                                    type="button"
                                    className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                                    onClick={deleteTrialBalance}>
                                    Yes, I'm sure
                                </button>
                                <button
                                    type="button"
                                    className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTrialBalanceID(null);
                                    }}>
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
