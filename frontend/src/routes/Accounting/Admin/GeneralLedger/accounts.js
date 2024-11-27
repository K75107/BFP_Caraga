import React, { Fragment, useState, useEffect } from 'react';
import { db } from '../../../../config/firebase-config';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'; // Add `addDoc` for Firestore insertion
import Modal from "../../../../components/Modal";
import AddButton from '../../../../components/addButton';
import SearchBar from '../../../../components/searchBar';

export default function Accounts() {
    const [accountsData, setAccountsData] = useState([]);
    const [editing, setEditing] = useState({ id: null, field: null, value: '' });
    const [originalValue, setOriginalValue] = useState(''); // Store original value in case of cancel
    const [showModal, setShowModal] = useState(false);

    // State for new account fields
    const [newAccountTitle, setNewAccountTitle] = useState('');
    const [newAccountCode, setNewAccountCode] = useState('');
    const [newAccountType, setNewAccountType] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAccountsData, setFilteredAccountsData] = useState([]); // New state for filtered data

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteAccountID, setDeleteAccountID] = useState(null);

    useEffect(() => {
        const filteredAccounts = accountsData.filter((account) =>
            account.AccountTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredAccountsData(filteredAccounts);
    }, [searchQuery, accountsData]);

    useEffect(() => {
        const fetchAccountsData = async () => {
            try {
                const accountsDataCollectionRef = collection(db, 'accountTitle');
                const accountsSnapshot = await getDocs(accountsDataCollectionRef);

                const titles = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAccountsData(titles);

            } catch (error) {
                console.error('Error fetching account data:', error);
            }
        };

        fetchAccountsData();
    }, []);

    const handleEdit = (id, field, value) => {
        setEditing({ id, field, value });
        setOriginalValue(value); // Store the original value when editing starts
    };

    const handleInputChange = (event) => {
        setEditing((prev) => ({
            ...prev,
            value: event.target.value
        }));
    };

    const handleSave = async () => {
        const { id, field, value } = editing;

        try {
            // Update Firestore
            const accountDocRef = doc(db, 'accountTitle', id);
            await updateDoc(accountDocRef, {
                [field]: value
            });

            // Update local state
            setAccountsData((prev) =>
                prev.map((account) =>
                    account.id === id ? { ...account, [field]: value } : account
                )
            );

            setEditing({ id: null, field: null, value: '' }); // Reset editing state
        } catch (error) {
            console.error('Error updating document:', error);
        }
    };

    const handleCancel = () => {
        setEditing({ id: null, field: null, value: '' }); // Cancel edit and reset the state
    };

    // Function to add a new account to Firestore
    const handleAddAccount = async () => {
        try {
            const newAccount = {
                "AccountTitle": newAccountTitle,
                "AccountCode": newAccountCode,
                "AccountType": newAccountType
            };

            // Add new account to Firestore and get the document reference
            const docRef = await addDoc(collection(db, 'accountTitle'), newAccount);

            // Update the local state with the new account, including the Firestore-generated id
            setAccountsData((prev) => [
                ...prev,
                { id: docRef.id, ...newAccount }
            ]);

            // Reset the input fields
            setNewAccountTitle('');
            setNewAccountCode('');
            setNewAccountType('');

            // Close the modal
            setShowModal(false);
        } catch (error) {
            console.error('Error adding new account:', error);
        }
    };

    const handleRemoveAccount = async () => {
        try {
            // Delete the account from Firestore
            const id = deleteAccountID;
            const accountDocRef = doc(db, 'accountTitle', id);
            await deleteDoc(accountDocRef);
    
            // Update the local state by filtering out the removed account
            setAccountsData((prev) => prev.filter((account) => account.id !== id));
        } catch (error) {
            console.error('Error removing account:', error);
        }
    };


    return (
        <Fragment>
            <div className="bg-white h-[calc(92vh)] py-8 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Saved Account Titles</h1>
                    <div class="flex space-x-4">
                        <SearchBar
                            placeholder="Search Account Title"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            listSource={filteredAccountsData}
                        />
                        <AddButton
                            onClick={() => setShowModal(true)}
                            label="ADD ACCOUNT"
                        />
                    </div>
                </div>
                <hr className="border-t border-[#7694D4] my-2 mb-4" />
                <div className="relative overflow-x-auto shadow-lg sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-72">ACCOUNT TITLE</th>
                                <th scope="col" className="px-5 py-4 w-48">ACCOUNT CODE</th>
                                <th scope="col" className="px-4 py-4 w-72">ACCOUNT TYPE</th>
                                <th scope="col" className="px-6 py-4 w-72"></th>
                                <th scope="col" className="px-6 py-4 w-48"></th>
                            </tr>
                        </thead>
                    </table>
                    <div className=' w-full overflow-y-scroll h-[calc(100vh-240px)]'>
                        <table className='w-full overflow-x-visible text-[14px]'>

                            <tbody>
                                {filteredAccountsData.map((account) => (
                                    <tr
                                        key={account.id}
                                        className="w-full bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        {/*ACCOUNT TITLE*/}
                                        <td
                                            className="table-cell px-6 py-3 w-72"
                                        >
                                            {account["AccountTitle"] || "No Title"}
                                        </td>

                                        {/* Editable Account Code */}
                                        <td className="table-cell px-6 py-3 w-48">
                                            {editing.id === account.id && editing.field === "AccountCode" ? (
                                                <input
                                                    type="text"
                                                    value={editing.value}
                                                    onChange={handleInputChange}
                                                    className="w-[100px] px-1 py-1 border rounded"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    onClick={() => handleEdit(account.id, "AccountCode", account["AccountCode"])}
                                                    className="cursor-pointer"
                                                >
                                                    {account["AccountCode"] || "Not Set"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Editable Account Type */}
                                        <td className="table-cell px-6 py-3 w-72">
                                            {editing.id === account.id && editing.field === "AccountType" ? (
                                                <select
                                                    value={editing.value}
                                                    onChange={handleInputChange}
                                                    className="w-[200px] px-6 py-1 border rounded"
                                                >
                                                    <option value="Assets">Assets</option>
                                                    <option value="Liabilities">Liabilities</option>
                                                    <option value="Equity">Equity</option>
                                                    <option value="Revenue">Revenue</option>
                                                    <option value="Expenses">Expenses</option>
                                                    <option value="Contra Assets">Contra Assets</option>
                                                    <option value="Subsidy">Subsidy</option>
                                                </select>
                                            ) : (
                                                <span
                                                    onClick={() => handleEdit(account.id, "AccountType", account["AccountType"])}
                                                    className="cursor-pointer"
                                                >
                                                    {account["AccountType"] || "Not Set"}
                                                </span>
                                            )}
                                        </td>
                                        {/* Action buttons */}
                                        <td className="table-cell px-6 py-3 w-72">
                                            {editing.id === account.id ? (
                                                <Fragment>
                                                    <button
                                                        onClick={handleSave}
                                                        className="mr-2 px-4 py-1 bg-blue-500 text-white rounded"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-4 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </Fragment>
                                            ) : (
                                                <span></span>
                                            )}
                                        </td>

                                        {/*REMOVE*/}
                                        <td className="px-6 py-4 text-right w-48">
                                            <span
                                                className="font-medium text-red-600 dark:text-blue-500 hover:underline cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click event
                                                    setDeleteAccountID(account.id);
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

            {/*MODAL*/}
            <Modal isVisible={showModal}>
                <div className="bg-white w-[400px] h-[400px] rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Add New Account
                        </h1>
                        <button
                            className="font-poppins text-[27px] text-[#1E1E1E]"
                            onClick={() => setShowModal(false)}
                        >
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    {/* Input Fields */}

                    {/* Account Title */}
                    <div className="relative m-5">
                        <input
                            type="text"
                            id="default_outlined1"
                            className="block px-6.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            value={newAccountTitle}
                            onChange={(e) => setNewAccountTitle(e.target.value)}
                        />
                        <label
                            htmlFor="default_outlined1"
                            className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-6 peer-focus:px-6 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                        >
                            Ledger Description
                        </label>
                    </div>

                    {/* Account Code */}
                    <div className="relative m-5">
                        <input
                            type="text"
                            id="default_outlined1"
                            className="block px-6.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            value={newAccountCode}
                            onChange={(e) => setNewAccountCode(e.target.value)}
                        />
                        <label
                            htmlFor="default_outlined1"
                            className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-6 peer-focus:px-6 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                        >
                            Account Code
                        </label>
                    </div>



                    {/* Account Type */}
                    <div className="relative w-80 m-5">
                        <select
                            id="account-type"
                            className="block px-6.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            value={newAccountType}
                            onChange={(e) => setNewAccountType(e.target.value)}
                        >
                            <option value="" disabled>Select Account Type</option>
                            <option value="Assets">Assets</option>
                            <option value="Liabilities">Liabilities</option>
                            <option value="Equity">Equity</option>
                            <option value="Revenue">Revenue</option>
                            <option value="Expenses">Expenses</option>
                            <option value="Contra Assets">Contra Assets</option>
                            <option value="Subsidy">Subsidy</option>
                        </select>
                        <label
                            htmlFor="account-type"
                            className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-6 peer-focus:px-6 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
                        >
                            Account Type
                        </label>
                    </div>


                    {/* Add Button */}
                    <div className="flex justify-end py-3 px-4">
                        <button
                            onClick={handleAddAccount}
                            className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4 "
                        >
                            ADD
                        </button>
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
                            <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this Account?</h3>
                            <button data-modal-hide="popup-modal" type="button" class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                                onClick={() => handleRemoveAccount() & setShowDeleteModal(false)}>
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
