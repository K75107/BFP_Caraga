import React, { Fragment, useState, useEffect } from 'react';
import { db } from '../../../../config/firebase-config';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore'; // Add `addDoc` for Firestore insertion
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
                        field="accountTitle"
                        />
                        <AddButton
                            onClick={() => setShowModal(true)}
                            label="ADD ACCOUNT"
                        />
                    </div>
                </div>
                <hr className="border-t border-[#7694D4] my-2" />
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-72">ACCOUNT TITLE</th>
                                <th scope="col" className="px-5 py-3 w-48">ACCOUNT CODE</th>
                                <th scope="col" className="px-4 py-3 w-72">ACCOUNT TYPE</th>
                                <th scope="col" className="px-6 py-3 w-72">ACTIONS</th>
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
        </Fragment>
    );
}
