import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, collection, onSnapshot, addDoc, updateDoc, arrayRemove,deleteDoc,where,query,getDocs,getDoc,writeBatch } from 'firebase/firestore';
import Modal from "../../../../components/Modal";
import { IoMdAddCircleOutline } from "react-icons/io";

export default function LedgerDetails() {
    const [showModal, setShowModal] = useState(false);
    const { ledgerId } = useParams(); // Get ledgerId from URL
    const [loading, setLoading] = useState(true);
    
    //Hover on Rows
    const [hoveredRowId, setHoveredRowId] = useState(null);

    //List of Account Titles from
    const [listAccountTitles,setListAccountTitles] = useState([]); 


    //Ledger Account Titles
    const [accountTitles, setAccountTitles] = useState([]);
    const [accountsData, setSelectedAccountsData] = useState('');

    const [selectedAccountTitle, setSelectedAccountTitle] = useState('');

    const [accountCode, setAccountCode] = useState('');
    const [accountType, setAccountType] = useState('');
    const [editingCell, setEditingCell] = useState(null); // To track which cell is being edited
    const [editValue, setEditValue] = useState('');

    //Right click Modal
    const [showRightClickModal, setShowRightClickModal] = useState(false); 
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [selectedAccountTitleRowData,setSelectedAccountTitleRowData] = useState(null);
    

    useEffect(() => {
        if (!ledgerId) {
            console.error('ledgerId is not provided.');
            return;
        }
    
        
        // Fetch ledger data with onSnapshot for real-time updates
        const ledgerDocRef = doc(db, 'ledger', ledgerId); // Reference to the specific ledger document
        const accountsCollectionRef = collection(ledgerDocRef, 'accounttitles'); // Subcollection 'accounttitles' under the ledger document

        let accountTitles = []; // To store account titles
        let accounts = {}; // To store accounts under each account title

        // Fetch account titles and their subcollection accounts
        const unsubscribeLedger = onSnapshot(accountsCollectionRef, async (snapshot) => {
            if (snapshot.empty) {
                console.log('No account titles found');
                return;
            }

            // Store account titles
            accountTitles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Loop through each account title to fetch its accounts
            for (const accountTitleDoc of snapshot.docs) {
                const accountTitleId = accountTitleDoc.id;

                // Reference to the 'accounts' subcollection under each account title
                const accountsSubCollectionRef = collection(accountTitleDoc.ref, 'accounts');

                // Fetch accounts under each account title
                const accountsSnapshot = await getDocs(accountsSubCollectionRef);
                accounts[accountTitleId] = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }


            // Filter out account titles with no associated accounts
            const filteredAccountTitles = accountTitles.filter(title => accounts[title.id] && accounts[title.id].length > 0);

            setAccountTitles(filteredAccountTitles);
            setSelectedAccountsData(accounts);



        }, (error) => {
            console.error('Error fetching ledger data:', error);
        });

    
        // Fetch account titles with onSnapshot
        const listAccountTitlesRef = collection(db, 'accountTitle'); 
        
        const unsubscribeAccountTitles = onSnapshot(listAccountTitlesRef, (snapshot) => {
            const listTitles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setListAccountTitles(listTitles);



        }, (error) => {
            console.error('Error fetching account titles:', error);
        });


        // Clean up the snapshot listeners
        return () => {
            unsubscribeLedger();
            unsubscribeAccountTitles();
           
        };
    }, [ledgerId]);
    

    //Right Click Functions

    const handleRightClick = (event,account, accountTitle) => {
        event.preventDefault(); 

        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID

        console.log('Account:', accountId);  // Logs the account object
         console.log('Account Title ID:', accountTitleId);  // Logs the accountTitleId


         setSelectedRowData(account);
         setSelectedAccountTitleRowData(accountTitle);
        
        // Set the modal position based on the mouse position
        setModalPosition({ x: event.clientX, y: event.clientY });
        setShowRightClickModal(true); // Open the modal


        
      };

      const closeModalOnOutsideClick = (e) => {
        if (e.target.id === "user-modal-overlay") {
            setShowRightClickModal(false);
        }
      };

      

   // Add Row Above
   const handleAddRowAbove = async () => {
    if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;

    try {
        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
        const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');

        // Fetch existing accounts and their positions
        const accountsSnapshot = await getDocs(accountsSubcollectionRef);
        const existingAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sortedAccounts = existingAccounts.sort((a, b) => a.position - b.position);

        // Find the selected row's position
        const selectedRowPosition = selectedRowData.position;

        // Find the row above (if any) and calculate new position
        const index = sortedAccounts.findIndex(account => account.position === selectedRowPosition);
        const rowAbove = sortedAccounts[index - 1];

        // Calculate the new position (as a float)
        const newPosition = rowAbove ? (rowAbove.position + selectedRowPosition) / 2 : selectedRowPosition - 1;

        // Ensure the new position is a float
        const newAccount = {
            date: '',
            particulars: '',
            debit: 0,
            credit: 0,
            balance: selectedRowData.balance,
            position: parseFloat(newPosition.toFixed(10)),  // Force float precision
        };

        // Add new document with auto-generated ID and calculated position
        const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);

        // Fetch the updated list of accounts and update the local state
        const updatedAccountsSnapshot = await getDocs(accountsSubcollectionRef);
        const updatedAccounts = updatedAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update the state to reflect the new account
        setSelectedAccountsData(prevData => ({
            ...prevData,
            [selectedAccountTitleRowData.id]: updatedAccounts.sort((a, b) => a.position - b.position),
        }));

    } catch (error) {
        console.error('Error adding row above:', error);
    }
};


    

const handleAddRowBelow = async () => {
    if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;

    try {
        


        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
        const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');

        // Fetch existing accounts to determine positions
        const accountsSnapshot = await getDocs(accountsSubcollectionRef);
        const existingAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Find the position of the selected row
        const selectedRowPosition = selectedRowData.position;

        // Determine the new position (below the selected row)
        const newPosition = existingAccounts.reduce((acc, account) => {
            if (account.position > selectedRowPosition) {
                acc.push(account.position);
            }
            return acc;
        }, []);
        
        const newRowPosition = newPosition.length > 0 ? (selectedRowPosition + Math.min(...newPosition)) / 2 : selectedRowPosition + 1;

        const newAccount = {
            date: null,
            particulars: null,
            debit: null,
            credit: null,
            balance: null,
            position: parseFloat(newRowPosition.toFixed(10)), // Ensure position is a float
        };

        // Add the new account to the subcollection
        await addDoc(accountsSubcollectionRef, newAccount);

        // Fetch updated accounts after the new one is added
        const updatedSnapshot = await getDocs(accountsSubcollectionRef);
        const updatedAccounts = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update the state with the new accounts data
        setSelectedAccountsData(prevData => ({
            ...prevData,
            [selectedAccountTitleRowData.id]: updatedAccounts.sort((a, b) => a.position - b.position),
        }));

    } catch (error) {
        console.error('Error adding row below:', error);
    }
};



const handleDeleteRow = async () => {
    if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;

    try {
        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
        const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');

        // Reference to the account document to delete
        const accountDocRef = doc(accountsSubcollectionRef, selectedRowData.id);

        // Delete the account from Firestore
        await deleteDoc(accountDocRef);

        // Fetch updated accounts after deletion
        const updatedSnapshot = await getDocs(accountsSubcollectionRef);
        const updatedAccounts = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update positions of remaining accounts
        const newAccounts = updatedAccounts.map((account, index) => ({
            ...account,
            position: parseFloat((index + 1).toFixed(10)), // Reassign positions
        }));

        // Update Firestore with new positions
        const batch = writeBatch(db);
        newAccounts.forEach(account => {
            const accountRef = doc(accountsSubcollectionRef, account.id);
            batch.update(accountRef, { position: account.position });
        });
        await batch.commit();

        // Update the state with the new accounts data
        setSelectedAccountsData(prevData => ({
            ...prevData,
            [selectedAccountTitleRowData.id]: newAccounts.sort((a, b) => a.position - b.position),
        }));

        // Close the right-click modal
        setShowRightClickModal(false);
    } catch (error) {
        console.error('Error deleting account row from Firestore:', error);
    }
};


    const handleHoverData = (account, accountTitle) =>{
        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID

        console.log('Account:', accountId);  // Logs the account object
         console.log('Account Title ID:', accountTitleId);  // Logs the accountTitleId


         setSelectedRowData(account);
         setSelectedAccountTitleRowData(accountTitle);


    }    


    const calculateBalance = (type, debit, credit, previousBalance) => {
        let balance = previousBalance || 0;

        switch (type) {
            case 'Assets':
            case 'Expenses':
                balance += debit - credit;
                break;
            case 'Liabilities':
            case 'Equity':
            case 'Revenue':
            case 'Contra Assets':
                balance += credit - debit;
                break;
            default:
                balance += debit - credit;
        }
        return balance;
    };

    const handleAddAccount = async () => {
        try {
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
    
            // Check if the selected account title already exists
            const accountTitlesQuery = query(accountTitlesCollectionRef, where("accountTitle", "==", selectedAccountTitle));
            const accountTitlesSnapshot = await getDocs(accountTitlesQuery);
    
            let accountTitleDocRef;
            if (accountTitlesSnapshot.empty) {
                // Add the new account title if it doesn't exist
                accountTitleDocRef = await addDoc(accountTitlesCollectionRef, {
                    accountTitle: selectedAccountTitle,
                    accountCode: accountCode || null,
                    accountType: accountType || null
                });
            } else {
                // Use the existing account title document reference
                accountTitleDocRef = accountTitlesSnapshot.docs[0].ref;
            }
    
            const accountsSubcollectionRef = collection(accountTitleDocRef, 'accounts');
    
            // Fetch all existing accounts to determine the current maximum position
            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
            const existingAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            // Find the current maximum position
            const maxPosition = existingAccounts.length > 0
                ? Math.max(...existingAccounts.map(account => account.position || 0))
                : 0; // Default to 0 if there are no accounts
    
            // Prepare the new account data with the next position after the current max
            const newAccount = {
                date: null,
                particulars: null,
                debit: null,
                credit: null,
                balance: null,
                position: parseFloat((maxPosition + 1).toFixed(10)), // Ensure the position is a float
            };
    
            // Add the new account to the subcollection
            await addDoc(accountsSubcollectionRef, newAccount);
    
            // Fetch updated accounts after the new one is added
            const updatedSnapshot = await getDocs(accountsSubcollectionRef);
            const updatedAccounts = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            // Update the state with the new accounts data
            setSelectedAccountsData(prevData => ({
                ...prevData,
                [accountTitleDocRef.id]: updatedAccounts.sort((a, b) => a.position - b.position),
            }));
    
            setShowModal(false); // Close the modal
        } catch (error) {
            console.error('Error adding account to Firestore:', error);
        }
    };
    
    
    

    const handleCellChange = async (accountId, field, newValue) => {
        try {
            // Get the ledger reference
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
    
            // Get the collection of account titles
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
    
            // Find the account title containing the specific account ID
            let matchingAccountTitle = null;
            let existingAccount = null;
    
            for (let accountTitle of accountTitles) {
                const accounts = accountsData[accountTitle.id];  // Get the accounts for this account title
                
                // Check if this accountTitle contains the account we're trying to update
                const targetAccount = accounts.find(account => account.id === accountId);
    
                if (targetAccount) {
                    matchingAccountTitle = accountTitle;
                    existingAccount = targetAccount;
                    break;  // Exit loop once the account is found
                }
            }
    
            if (!matchingAccountTitle || !existingAccount) {
                console.error(`No account document found with ID ${accountId}.`);
                return;  // Exit if no matching account is found
            }
    
            // Only update if there is a change in value
            if (existingAccount[field] === newValue) {
                console.log('No changes detected, skipping update.');
                return;  // Exit early if no changes are made
            }
    
            // Get the subcollection for the matching account title
            const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, matchingAccountTitle.id), 'accounts');
            const accountDocRef = doc(accountsSubcollectionRef, accountId);
    
            // Update the specific field of the account
            await updateDoc(accountDocRef, {
                [field]: newValue
            });
    
            // Update local state for the UI
            setSelectedAccountsData(prevData => ({
                ...prevData,
                [matchingAccountTitle.id]: prevData[matchingAccountTitle.id].map(account =>
                    account.id === accountId ? { ...account, [field]: newValue } : account
                )
            }));
    
            // Clear the editing state after successful update
            setEditingCell(null);
            setEditValue({ field: '', value: '' });
    
        } catch (error) {
            console.error('Error updating account field:', error);
        }
    };
    
    

    // Function to format numbers with commas and handle empty/null cases
    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num) || num === '') {
            return '-'; // Return '-' if no value
        }
        return parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatBalance = (balance) => {
        return formatNumber(balance);
    };

   //if (loading) return <p>Loading...</p>;

    return (
        <Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Ledger Details</h1>
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ ADD ACCOUNT</button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/*TABLE*/}
            <div className="relative overflow-x-visible shadow-md sm:rounded-lg ">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-[200px]">ACCOUNT TITLE</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">ACCOUNT CODE</th>
                            <th scope="col" className="px-6 py-3 w-[100px]">DATE</th>
                            <th scope="col" className="px-6 py-3 w-[300px]">PARTICULARS</th>
                            <th scope="col" className="px-6 py-3 w-[180px]">DEBIT</th>
                            <th scope="col" className="px-6 py-3 w-[180px]">CREDIT</th>
                            <th scope="col" className="px-6 py-3 w-[180px]">BALANCE</th>
                            <th scope="col" className=" w-[0px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        
            {accountTitles.map((accountTitle) => (
                <Fragment key={accountTitle.id}>
                    {/* Account Title Header */}
                    <tr className="bg-gray-100 font-bold">
                        <td className="table-cell px-6 py-3 w-40">{accountTitle.accountTitle}</td>
                        <td className="table-cell px-6 py-3 w-24">{accountTitle.accountCode}</td>
                        <td className="table-cell px-6 py-3 w-24"></td>
                        <td className="table-cell px-6 py-3 w-32"></td>
                        <td className="table-cell px-6 py-3 w-24"></td>
                        <td className="table-cell px-6 py-3 w-24"></td>
                        <td className="table-cell px-6 py-3 w-32">{formatBalance(accountTitle.runningBalance)}</td>
                    </tr>

                    {/* Account Rows */}
                    {accountsData[accountTitle.id]?.map((account) => (
                        <tr
                            key={account.id}
                            onContextMenu={(e) => handleRightClick(e, account, accountTitle)}
                            onMouseEnter={(e) => { 
                                setHoveredRowId(account.id); 
                                handleHoverData(account, accountTitle); 
                              }}
                            onMouseLeave={() => setHoveredRowId(null)}     
                            className="bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                        >
                            <td className="px-6 py-5 w-40"></td>
                            <td className="px-6 py-5 w-24"></td>

                            {/* Date Field */}
                            <td className="px-6 py-2 w-36 h-6">
                                {editingCell === account.id && editValue.field === 'date' ? (
                                    <input
                                        type="date"
                                        className="border border-gray-400 focus:bg-yellow-100 focus:outline-none w-36 h-8 px-2 "
                                        value={editValue.value}
                                        onChange={(e) => setEditValue({ field: 'date', value: e.target.value })}
                                        onBlur={() => handleCellChange(account.id, 'date', editValue.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => { setEditingCell(account.id); setEditValue({ field: 'date', value: account.date || '' }) }}
                                        className="block border border-gray-300 hover:bg-gray-100 h-8 w-36 px-2 py-1"
                                    >
                                        {account.date || '-'}
                                    </span>
                                )}
                            </td>

                            {/* Particulars Field */}
                            <td className="px-6 py-2 w-40 h-6">
                                {editingCell === account.id && editValue.field === 'particulars' ? (
                                    <input
                                        type="text"
                                        className="border border-gray-400 focus:bg-yellow-100 focus:outline-none w-full h-8 px-2 py-1"
                                        value={editValue.value}
                                        onChange={(e) => setEditValue({ field: 'particulars', value: e.target.value })}
                                        onBlur={() => handleCellChange(account.id, 'particulars', editValue.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => { setEditingCell(account.id); setEditValue({ field: 'particulars', value: account.particulars || '' }) }}
                                        className="block border border-gray-300 hover:bg-gray-100 w-full h-8 px-2 py-1"
                                    >
                                        {account.particulars || '-'}
                                    </span>
                                )}
                            </td>

                            {/* Debit Field */}
                            <td className="px-6 py-2 w-30 h-6">
                                {editingCell === account.id && editValue.field === 'debit' ? (
                                    <input
                                        type="text"
                                        className="border border-gray-400 focus:bg-yellow-100 focus:outline-none w-full h-8 px-2 py-1"
                                        value={editValue.value}
                                        onChange={(e) => setEditValue({ field: 'debit', value: e.target.value })}
                                        onBlur={() => handleCellChange(account.id, 'debit', editValue.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => { setEditingCell(account.id); setEditValue({ field: 'debit', value: account.debit || '' }) }}
                                        className="block border border-gray-300 hover:bg-gray-100 w-30 h-8 px-2 py-1"
                                    >
                                        {formatNumber(account.debit) || '-'}
                                    </span>
                                )}
                            </td>

                            {/* Credit Field */}
                            <td className="px-6 py-2 w-30 h-6">
                                {editingCell === account.id && editValue.field === 'credit' ? (
                                    <input
                                        type="text"
                                        className="border border-gray-400 focus:bg-yellow-100 focus:outline-none w-full h-8 px-2 py-1"
                                        value={editValue.value}
                                        onChange={(e) => setEditValue({ field: 'credit', value: e.target.value })}
                                        onBlur={() => handleCellChange(account.id, 'credit', editValue.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => { setEditingCell(account.id); setEditValue({ field: 'credit', value: account.credit || '' }) }}
                                        className="block border border-gray-300 hover:bg-gray-100 w-30 h-8  px-2 py-1"
                                    >
                                        {formatNumber(account.credit) || '-'}
                                    </span>
                                )}
                            </td>
                            
                            {/**/}
                            <td className="px-6 py-4">
                                {formatBalance(account.balance) || '-'}
                            </td>

                            {hoveredRowId === account.id && (
                                <td className="absolute right-8 mt-9 mr-1">  {/* Position the button absolutely */}
                                <button
                                    className="bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                    style={{ position: 'absolute', right: '-50px' }}  // Adjust position as needed
                                    onClick={handleAddRowBelow}
                                >
                                    <IoMdAddCircleOutline />
                                </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </Fragment>
            ))}




</tbody>
                </table>
            </div>

            
             {/*MODAL*/}
             <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-[420px] rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Add Account
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                            ×
                        </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    <div className="py-4 px-4">
                        <label className="block text-sm font-medium text-gray-700">Account Title</label>
                        <select
                            value={selectedAccountTitle}
                            onChange={(e) => {
                                const selectedTitle = e.target.value;
                                setSelectedAccountTitle(selectedTitle);
                                
                                // Find the selected account title's data
                                const selectedAccount = listAccountTitles.find(title => title.AccountTitle === selectedTitle);
                                
                                // Update account code and account type based on the selected account
                                if (selectedAccount) {
                                    setAccountCode(selectedAccount.AccountCode);
                                    setAccountType(selectedAccount.AccountType);
                                } else {
                                    setAccountCode('');
                                    setAccountType('');
                                }
                            }}
                            className="mt-1 block w-2/4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select Account Title</option>
                            {listAccountTitles.map((title) => (
                                <option key={title.id} value={title.AccountTitle}>
                                    {title.AccountTitle}
                                </option>
                            ))}
                        </select>


                    </div>
                    
                    <div className='pt-2 px-4'>
                        <label className="block text-sm font-medium text-gray-700">Account Code</label>
                        <div className='w-2/4 border border-gray-300 rounded-md shadow-sm p-2'>
                            <p>{accountCode || ''}</p> {/* Display selected Account Code */}
                        </div>
                        
                    </div>

                    <div className='pt-6 px-4'>
                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                        <div className='w-2/4 border border-gray-300 rounded-md shadow-sm p-2'>
                            <p>{accountType || ''}</p> {/* Display selected Account Type */}
                        </div>
                    </div>
      

                    <div className="flex justify-end py-3 px-4">
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4"
                        onClick={handleAddAccount}
                        >ADD</button>

                        <button className="bg-[#4CAF50] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4 ml-3"
                        
                        >EDIT ACCOUNT TITLES</button>
                    </div>
                </div>
            </Modal>

            {/* Right-click context modal */}
            {showRightClickModal && (
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
                        onClick={handleAddRowAbove}
                    >
                        Add Row Above
                    </button>


                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleAddRowBelow}
                    >
                        Add Row Below
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleDeleteRow}
                    >
                        Delete Row
                    </button>
                    </div>
                </div>
                )}





        </Fragment>
    );
}
