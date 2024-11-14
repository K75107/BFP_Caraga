import React, { Fragment, useState, useEffect } from "react";
import Modal from "../../../../components/Modal";
import { db } from "../../../../config/firebase-config";
import { collection, getDocs, addDoc, getDoc, deleteDoc, doc } from "firebase/firestore";
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { useNavigate } from "react-router-dom";
import AddButton from "../../../../components/addButton";
import ExportButton from "../../../../components/exportButton";

export default function Cashflows() {
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [cashflowData, setCashflowData] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    //Alert
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    // UPDATED YEAR
    const [years, setYears] = useState([]);

    // Cashflow Fields
    const [cashflowDescription, setCashflowDescription] = useState('');
    const [cashflowYear, setCashflowYear] = useState('');

    //DELETE LEDGER ID
    const [deleteCashflowID, setDeleteCashflowID] = useState(null);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2020;
        const yearList = [];

        for (let year = currentYear; year >= startYear; year--) {
            yearList.push(year);
        }

        setYears(yearList);
    }, []);

    useEffect(() => {
        const getCashflowList = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "cashflow"));
                const cashflowData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setCashflowData(cashflowData);
            } catch (err) {
                console.error("Error fetching ledger data:", err);
            }
        };

        getCashflowList();
    }, []);

    const addNewCashflow = async () => {
        try {
            const collectionRef = collection(db, "cashflow");

            const docRef = await addDoc(collectionRef, {
                created_at: new Date(),
                description: cashflowDescription,
                year: cashflowYear,
                selectedPeriod: '',
            });

            const docSnapshot = await getDoc(docRef);

            setCashflowData((prevList) => [...prevList, { id: docSnapshot.id, ...docSnapshot.data() }]);

            setShowModal(false);
            setCashflowDescription(''); // Reset the description
            setCashflowYear(''); // Reset the year

            // Alerts
            setIsSuccess(true);
            const timer = setTimeout(() => {
                setIsSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);

        } catch (err) {
            console.error("Error adding document:", err);
        }
    };

    // Function to delete a ledger
    const deleteCashflow = async () => {
        try {
            // Reference the specific document by its ID and delete it
            await deleteDoc(doc(db, "cashflow", deleteCashflowID));

            // Update the state to remove the deleted ledger from the list
            setCashflowData((prevLedgerList) => prevLedgerList.filter((ledger) => ledger.id !== deleteCashflowID));

            {/**---------------------------------------------Alerts--------------------------------------- */ }
            setIsError(true);
            const timer = setTimeout(() => {
                setIsError(false);
            }, 3000)
            return () => clearTimeout(timer);
            {/**---------------------------------------------Alerts--------------------------------------- */ }

        } catch (err) {
            console.error("Error deleting document:", err);
        }
    };

    return (
        <Fragment>
            {isSuccess && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isSuccess={isSuccess} message={'New Cashflow Statement Created'} icon={'check'} />
                </div>
            )}
            {isError && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isError={isError} message={'Cashflow Statement Deleted'} icon={'wrong'} />
                </div>
            )}

            <div className="bg-white h-full py-8 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Cashflow Statement</h1>

                    <div class="flex space-x-4">
                        <AddButton
                            onClick={() => setShowModal(true)}
                            label="GENERATE CASHFLOW"
                        />
                        <ExportButton
                            label="EXPORT"
                        />
                    </div>

                </div>
                <hr className="border-t border-[#7694D4] my-2 mb-4" />
                <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                            <tr>
                                <th scope="col" className="px-6 py-4">DESCRIPTION</th>
                                <th scope="col" className="px-6 py-4">YEAR</th>
                                <th scope="col" className="px-6 py-4">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashflowData.map((cashflow) => (
                                <tr
                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                    key={cashflow.id}
                                    onClick={() => navigate(`/main/cashflowStatement/cashflows/${cashflow.id}`)}
                                >
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {cashflow.description || ''}
                                    </th>
                                    <td className="px-6 py-4">{cashflow.year || ''}</td>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <span
                                            className="font-medium text-red-600 dark:text-blue-500 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click event
                                                setDeleteCashflowID(cashflow.id)// Call delete function
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            Remove
                                        </span>
                                    </th>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Add Cashflow Statement
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>×</button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    <div className="flex flex-row p-2.5 justify-between">
                        <div className="relative">
                            <input
                                type="text"
                                id="default_outlined1"
                                className="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                placeholder=" "
                                value={cashflowDescription}
                                onChange={(e) => setCashflowDescription(e.target.value)}
                            />
                            <label
                                htmlFor="default_outlined1"
                                className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                            >
                                Description
                            </label>
                        </div>

                        <div className="relative w-40">
                            <select
                                id="year-dropdown"
                                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                value={cashflowYear}
                                onChange={(e) => setCashflowYear(e.target.value)}
                            >
                                <option value="" disabled>Select Year</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <label
                                htmlFor="year-dropdown"
                                className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                            >
                                Year
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end py-3 px-4">
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4" onClick={addNewCashflow}>ADD</button>
                    </div>
                </div>
            </Modal>

            {/*DELETE MODAL*/}
            <Modal isVisible={showDeleteModal}>
                <div class="relative p-4 w-full max-w-md max-h-full">
                    <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <button type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="popup-modal"
                            onClick={() => setShowDeleteModal(false)}>
                            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                            </svg>
                            <span class="sr-only">Close modal</span>
                        </button>
                        <div class="p-4 md:p-5 text-center">
                            <svg class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this Ledger?</h3>
                            <button data-modal-hide="popup-modal" type="button" class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                                onClick={() => deleteCashflow() & setShowDeleteModal(false)}>
                                Yes, I'm sure
                            </button>
                            <button data-modal-hide="popup-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                                onClick={() => setShowDeleteModal(false)}>No, cancel</button>
                        </div>
                    </div>
                </div>
            </Modal>

        </Fragment>
    );
}
