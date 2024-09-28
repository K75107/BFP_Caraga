import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, getDoc } from 'firebase/firestore';

export default function IncomeStatementDetails() {  // Updated component name

    const [incomeStatementDescription, setIncomeStatementDescription] = useState("");  // Updated variable name
    const [rows, setRows] = useState([{ description: '', period: '' }]); // Initial row
    const [showMainAccountRightClick, setShowMainAccountRightClick] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [selectedRowIndex, setSelectedRowIndex] = useState(null); // Track selected row for context menu

    const { incomeStatementID } = useParams(); // Updated parameter name

    useEffect(() => {
        if (!incomeStatementID) {
            console.error('ledgerId is not provided.');
            return;
        }

        const incomeStatementDocRef = doc(db, 'incomestatement', incomeStatementID);  // Updated Firestore reference
        // Fetch ledger description from Firestore
        const fetchIncomeStatementDescription = async () => {
            const docSnap = await getDoc(incomeStatementDocRef);

            if (docSnap.exists()) {
                setIncomeStatementDescription(docSnap.data().description || 'No Description');
            } else {
                console.error('No such document!');
            }
        };

        fetchIncomeStatementDescription();
    }, [incomeStatementID]);

    // Function to handle right-click and show context menu
    const handleRightClick = (event, index) => {
        event.preventDefault(); // Prevent the default right-click menu
        setSelectedRowIndex(index);
        setModalPosition({ x: event.pageX, y: event.pageY });
        setShowMainAccountRightClick(true);
    };

    // Function to handle closing the modal when clicked outside
    const closeModalOnOutsideClick = (event) => {
        event.preventDefault();
        setShowMainAccountRightClick(false);
    };

    // Function to add a new row below the selected row
    const handleAddEntry = () => {
        const newRows = [...rows];
        newRows.splice(selectedRowIndex + 1, 0, { description: 'New Account', period: '' });
        setRows(newRows);
        setShowMainAccountRightClick(false); // Close the right-click menu
    };

    // Function to delete the selected row
    const handleDeleteAccount = () => {
        const newRows = rows.filter((_, index) => index !== selectedRowIndex);
        setRows(newRows);
        setShowMainAccountRightClick(false); // Close the right-click menu
    };

    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
                        {incomeStatementDescription}
                    </h1>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                {/* TABLE */}
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Account Description
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Period
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr
                                    key={index}
                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                    onContextMenu={(e) => handleRightClick(e, index)} // Show context menu on right-click
                                >
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {row.description}
                                    </th>
                                    <td className="px-6 py-4">
                                        {row.period}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Account Right-click context modal */}
            {showMainAccountRightClick && (
                <div
                    id="user-modal-overlay"
                    className="fixed inset-0 flex justify-center items-center"
                    onClick={closeModalOnOutsideClick}
                    onContextMenu={(event) => closeModalOnOutsideClick(event)}
                >
                    <div
                        style={{ top: modalPosition.y, left: modalPosition.x }}
                        className="absolute z-10 bg-white shadow-lg rounded-lg p-2"
                    >
                        <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleAddEntry}
                        >
                            Add Row Below
                        </button>
                        <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleDeleteAccount}
                        >
                            Delete Row
                        </button>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
