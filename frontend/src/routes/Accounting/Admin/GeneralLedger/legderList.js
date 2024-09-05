import React, { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../../components/Modal";
import { db } from "../../../../config/firebase-config";
import { getDocs, collection, addDoc } from "firebase/firestore";

export default function LedgerList() {
    const [showModal, setShowModal] = useState(false);
    const [ledgerList, setLedgerList] = useState([]);
    const [ledgerDescription, setLedgerDescription] = useState("");
    const [ledgerYear, setLedgerYear] = useState("");

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

    const navigate = useNavigate();

    // Fetch the Ledger Data
    useEffect(() => {
        const getLedgerList = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "ledger"));
                const ledgerData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLedgerList(ledgerData);
            } catch (err) {
                console.error("Error fetching ledger data:", err);
            }
        };

        getLedgerList();
    }, []);

    // Add New Ledger to the Firestore
    const addNewLedger = async () => {
        try {
            // Create the reference document
            const collectionRef = collection(db, "ledger");

            // Add the new ledger
            await addDoc(collectionRef, {
                description: ledgerDescription,
                year: ledgerYear,
                created_at: new Date(),
            });

            // Optionally, you might want to refresh the list or close the modal
            setShowModal(false);
            setLedgerDescription("");
            setLedgerYear("");
        } catch (err) {
            console.error("Error adding document:", err);
        }
    };

    return (
        <Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">General Ledger</h1>
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>ADD LEDGER</button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/*TABLE*/}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">DESCRIPTION</th>
                            <th scope="col" className="px-6 py-3">Year</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledgerList.map((ledger) => (
                            <tr
                                key={ledger.id}
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <th
                                    scope="row"
                                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                    {ledger.description || "No Description"}
                                </th>
                                <td className="px-6 py-4">
                                    {ledger.year || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <a
                                        href="#"
                                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                        onClick={() => navigate(`/main/generalLedger/ledgerDetails/${ledger.id}`)}
                                    >
                                        View
                                    </a>
                                </td>

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
                            Add New Ledger
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    {/*LABEL*/}
                    <div className="flex flex-row p-2.5 justify-between">
                        {/*LEDGER DESCRIPTION*/}
                        <div className="relative">
                            <input
                                type="text"
                                id="default_outlined1"
                                className="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                placeholder=" "
                                value={ledgerDescription}
                                onChange={(e) => setLedgerDescription(e.target.value)}
                            />
                            <label
                                htmlFor="default_outlined1"
                                className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                            >
                                Ledger Description
                            </label>
                        </div>

                        {/*YEAR*/}
                        <div className="relative w-40">
                            <select
                                id="year-dropdown"
                                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                value={ledgerYear}
                                onChange={(e) => setLedgerYear(e.target.value)}
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
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
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4" onClick={addNewLedger}>ADD</button>
                    </div>
                </div>
            </Modal>
        </Fragment>
    );
}
