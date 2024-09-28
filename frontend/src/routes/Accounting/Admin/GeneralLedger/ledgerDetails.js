import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, collection, onSnapshot, addDoc, updateDoc, arrayRemove,deleteDoc,where,query,getDocs,getDoc,writeBatch } from 'firebase/firestore';
import Modal from "../../../../components/Modal";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoMdAddCircleOutline } from "react-icons/io";

export default function LedgerDetails() {
    const [showModal, setShowModal] = useState(false);
    const { ledgerId } = useParams(); // Get ledgerId from URL
    const [loading, setLoading] = useState(true);
    const [ledgerDescription, setLedgerDescription] = useState('');
    
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
    
    /// Main Account Right click Modal
    const [showMainAccountRightClick, setShowMainAccountRightClick] = useState(false); 
    const [selectedMainAccount, setSelectedMainAccount] = useState(null);


    useEffect(() => {
        if (!ledgerId) {
            console.error('ledgerId is not provided.');
            return;
        }

        const ledgerDocRef = doc(db, 'ledger', ledgerId); 

        // Fetch ledger description from Firestore
        const fetchLedgerDescription = async () => {
            const docSnap = await getDoc(ledgerDocRef);

            if (docSnap.exists()) {
                setLedgerDescription(docSnap.data().description || 'No Description');
            } else {
                console.error('No such document!');
            }
        };

        fetchLedgerDescription();

        // Fetch ledger data with onSnapshot for real-time updates
        const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
    
        let unsubscribeLedger;
        let unsubscribeAccountTitles;
    
        // Function to fetch accounts for each account title
        const fetchAccounts = async (accountTitleId) => {
            const accountsSubcollectionRef = collection(ledgerDocRef, `accounttitles/${accountTitleId}/accounts`);
            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
    
            return accountsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.position - b.position);
        };
    
        // Fetch account titles and their subcollection accounts
        unsubscribeLedger = onSnapshot(accountTitlesCollectionRef, async (snapshot) => {
            if (snapshot.empty) {
                console.log('No account titles found');
                setAccountTitles([]); // Clear state if no titles
                return;
            }
            
            

            const fetchedAccountTitles = [];
            const fetchedAccounts = {};
    
            // Loop through each account title and fetch its accounts
            for (const accountTitleDoc of snapshot.docs) {
                const accountTitleData = { id: accountTitleDoc.id, ...accountTitleDoc.data() };
                fetchedAccountTitles.push(accountTitleData);
    
                // Fetch accounts for this account title
                const accounts = await fetchAccounts(accountTitleDoc.id);
                fetchedAccounts[accountTitleDoc.id] = accounts;
            }
            
            
            setAccountTitles(fetchedAccountTitles);
            setSelectedAccountsData(fetchedAccounts);
    
        }, (error) => {
            console.error('Error fetching ledger data:', error);
        });
    
        // Fetch list of all account titles (assuming these are used elsewhere)
        const listAccountTitlesRef = collection(db, 'accountTitle');
        unsubscribeAccountTitles = onSnapshot(listAccountTitlesRef, (snapshot) => {
            const listTitles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setListAccountTitles(listTitles);
        }, (error) => {
            console.error('Error fetching account titles:', error);
        });
    
        // Clean up the snapshot listeners
        return () => {
            if (unsubscribeLedger) unsubscribeLedger();
            if (unsubscribeAccountTitles) unsubscribeAccountTitles();
        };
    }, [ledgerId]);
    
    
    //Right Click Functions

    const handleRightClick = (event,account, accountTitle) => {
        event.preventDefault(); 

        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID
        
         setSelectedRowData(account);
         setSelectedAccountTitleRowData(accountTitle);
        
        // Set the modal position based on the mouse position
        setModalPosition({ x: event.clientX, y: event.clientY });
        setShowRightClickModal(true); // Open the modal


        
      };

      // Main Account Right Click Functions
      const handleMainAccountRightClick = (event, accountTitle) => {
        event.preventDefault();

        setSelectedMainAccount(accountTitle);

        // Set the modal position based on the mouse position
        setModalPosition({ x: event.clientX, y: event.clientY });
        setShowMainAccountRightClick(true); // Open the modal
      };

      const closeModalOnOutsideClick = (e) => {
        if (e.target.id === "user-modal-overlay") {
            setShowRightClickModal(false);
            setShowMainAccountRightClick(false);
        }
      };

      
//ADD ENTRY UNDER MAIN ACCOUNT
const handleAddEntry = async () => {
    if (!selectedMainAccount || !ledgerId) return; // Ensure main account and ledger ID exist

    try {
        // Reference the selected main account's document
        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
        const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedMainAccount), 'accounts');

        // Fetch and sort existing accounts by position
        const accountsSnapshot = await getDocs(accountsSubcollectionRef);
        const sortedAccounts = accountsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => a.position - b.position);

        // Calculate the new position for the child row
        const newRowPosition = sortedAccounts.length > 0 
            ? sortedAccounts[sortedAccounts.length - 1].position + 1 // Increment position
            : 1; // Default position for the first row

        // Create the new account (child row) with calculated position
        const newAccount = {
            date: null,
            particulars: null,
            debit: null,
            credit: null,
            balance: null,
            position: parseFloat(newRowPosition.toFixed(10)) // Ensure position is a float
        };

        // Add the new account to Firestore and get its reference
        const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);

        // Fetch the new account's ID
        const newAccountWithId = {
            ...newAccount,
            id: newAccountRef.id, // Use the Firestore-generated ID
        };

        // Update the local state with the new account row
        setSelectedAccountsData(prevData => ({
            ...prevData,
            [selectedMainAccount]: [...sortedAccounts, newAccountWithId].sort((a, b) => a.position - b.position),
        }));

        setShowMainAccountRightClick(false); // Close the modal after adding the row
        console.log("Successfully added a child row below the main account.");

    } catch (error) {
        console.error('Error adding entry under main account:', error.message || error);
    }
};

      //DELETE MAIN ACCOUNT
      const handleDeleteAccount = async () => {

        if (!selectedMainAccount || !ledgerId) return;
        try{

            //Reference directly
            const selectedAccountTitleRef = doc(db, 'ledger', ledgerId , 'accounttitles', selectedMainAccount);

            await deleteDoc(selectedAccountTitleRef);
            setShowMainAccountRightClick(false);
            console.log("successfully deleted account");
        }catch(error){
            console.error(error);
        }


    };


      const handleAddRowAbove = async () => {
        if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;
    
        try {
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
            const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');
    
            // Fetch existing accounts and sort them by position
            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
            const sortedAccounts = accountsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.position - b.position);
    
            // Get the position of the selected row
            const selectedRowPosition = selectedRowData.position;
    
            // Find the row immediately above the selected row, if any
            const index = sortedAccounts.findIndex(account => account.position === selectedRowPosition);
            const rowAbove = sortedAccounts[index - 1];
    
            // Calculate the new position (between rowAbove and the selected row, or -1 if no rowAbove)
            const newPosition = rowAbove 
                ? (rowAbove.position + selectedRowPosition) / 2 
                : selectedRowPosition - 1;
    
            const newAccount = {
                date: '',
                particulars: '',
                debit: 0,
                credit: 0,
                balance: selectedRowData.balance, // Preserving balance of the selected row
                position: parseFloat(newPosition.toFixed(10)),  // Ensure it's a float for consistency
            };
    
            // Add the new account to Firestore and get its reference
            const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);
    
            // Fetch the new account's ID
            const newAccountWithId = {
                ...newAccount,
                id: newAccountRef.id,  // Use the Firestore-generated ID
            };
    
            // Update the local state with the new account
            setSelectedAccountsData(prevData => ({
                ...prevData,
                [selectedAccountTitleRowData.id]: [...sortedAccounts, newAccountWithId].sort((a, b) => a.position - b.position),
            }));
    
        } catch (error) {
            console.error('Error adding row above:', error.message || error);
        }
    };
    
    
    

    

    const handleAddRowBelow = async () => {
        if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;
    
        try {
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
            const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');
    
            // Fetch and sort existing accounts by position
            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
            const sortedAccounts = accountsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.position - b.position);
    
            // Find the position of the selected row
            const selectedRowPosition = selectedRowData.position;
    
            // Find the next row after the selected one
            const nextRow = sortedAccounts.find(account => account.position > selectedRowPosition);
    
            // Calculate the new position (midpoint or +1)
            const newRowPosition = nextRow 
                ? (selectedRowPosition + nextRow.position) / 2 
                : selectedRowPosition + 1;
    
            // Create the new account with the calculated position
            const newAccount = {
                date: null,
                particulars: null,
                debit: null,
                credit: null,
                balance: null,
                position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
            };
    
            // Add the new account to Firestore and get its reference
            const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);
    
            // Fetch the new account's ID
            const newAccountWithId = {
                ...newAccount,
                id: newAccountRef.id,  // Use the Firestore-generated ID
            };
    
            // Update the local state, ensuring all accounts have a unique key (ID)
            setSelectedAccountsData(prevData => ({
                ...prevData,
                [selectedAccountTitleRowData.id]: [...sortedAccounts, newAccountWithId].sort((a, b) => a.position - b.position),
            }));
    
        } catch (error) {
            console.error('Error adding row below:', error.message || error);
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
    
            // Keep existing positions unless some rows need adjustment
            const sortedAccounts = updatedAccounts.sort((a, b) => a.position - b.position);
    
            // Optional: If the position gap between rows becomes too large, we can consider reassigning positions.
            // This is more of a safeguard and not mandatory.
            const shouldReassign = sortedAccounts.some((account, index) => {
                const nextAccount = sortedAccounts[index + 1];
                return nextAccount && (nextAccount.position - account.position) > 1;
            });
    
            if (shouldReassign) {
                const newAccounts = sortedAccounts.map((account, index) => ({
                    ...account,
                    position: parseFloat((index + 1).toFixed(10)), // Reassign positions only if necessary
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
                    [selectedAccountTitleRowData.id]: newAccounts,
                }));
            } else {
                // If no reassigning needed, just update the state with the updated account list
                setSelectedAccountsData(prevData => ({
                    ...prevData,
                    [selectedAccountTitleRowData.id]: sortedAccounts,
                }));
            }
    
            // Close the right-click modal
            setShowRightClickModal(false);
    
        } catch (error) {
            console.error('Error deleting account row from Firestore:', error);
        }
    };
    


    const handleHoverData = (account, accountTitle) =>{
        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID

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
        if (!ledgerId || !selectedAccountTitle) return;  // Ensure necessary data exists
    
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
    
            // Fetch existing accounts and find the max position
            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
            const existingAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const maxPosition = existingAccounts.length > 0
                ? Math.max(...existingAccounts.map(account => account.position || 0))
                : 0; // Default to 0 if no accounts exist
    
            // Prepare the new account with the next position
            const newAccount = {
                date: null,
                particulars: null,
                debit: null,
                credit: null,
                balance: null,
                position: parseFloat((maxPosition + 10).toFixed(10)), // Ensure position is a float and increment by 10
            };
    
            // Add the new account to the subcollection and get its reference
            const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);
    
            // Fetch the new account's ID
            const newAccountWithId = { ...newAccount, id: newAccountRef.id };
    
            // Directly update state with the new account
            setSelectedAccountsData(prevData => {
                const updatedAccounts = prevData[accountTitleDocRef.id] || [];
                return {
                    ...prevData,
                    [accountTitleDocRef.id]: [...updatedAccounts, newAccountWithId].sort((a, b) => a.position - b.position),
                };
            });
    
            setShowModal(false); // Close the modal after successful addition
    
        } catch (error) {
            console.error('Error adding account to Firestore:', error.message || error);
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
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{ledgerDescription}</h1>
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ ADD ACCOUNT</button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/*TABLE*/}
            <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-screen ">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-[12px] text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky">
                        <tr>
                            
                            <th scope="col" className="px-2 py-3 w-72">ACCOUNT TITLE</th>
                            <th scope="col" className="px-2 py-3 w-48">ACCOUNT CODE</th>
                            <th scope="col" className="px-2 py-3 w-24">DATE</th>
                            <th scope="col" className="px-2 py-3 w-80">PARTICULARS</th>
                            <th scope="col" className="px-2 py-3 w-48">DEBIT</th>
                            <th scope="col" className="px-2 py-3 w-48">CREDIT</th>
                            <th scope="col" className="px-2 py-3 w-48 text-center">BALANCE</th>
                            <th scope="col" className=" w-[20px] "></th>

                        </tr>
                    </thead>
                </table>
                <div className=' w-full overflow-y-scroll h-[calc(100vh-200px)]'>
                <table className='w-full overflow-x-visible'>
                   
                        <tbody>
                            {accountTitles.map((accountTitle) => {
                                let runningBalance = 0; // Initialize running balance for this account title group

                                // Calculate the final running balance for the account title header
                                const finalRunningBalance = accountsData[accountTitle.id]?.reduce((balance, account) => {
                                    return calculateBalance(accountTitle.accountType, account.debit, account.credit, balance);
                                }, 0);

                                return (
                                    <Fragment key={accountTitle.id}>
                                        {/* Account Title Header */}
                                        <tr className="bg-gray-100 font-bold text-[12px]"
                                                key={accountTitle.id}
                                                onContextMenu={(e) => handleMainAccountRightClick(e, accountTitle.id)}
                                                
                            
                                                >
                                            
                                            <td className="table-cell px-2 py-3 w-72">{accountTitle.accountTitle}</td>
                                            <td className="table-cell px-2 py-3 w-48">{accountTitle.accountCode}</td>
                                            <td className="table-cell px-2 py-3 w-24"></td>
                                            <td className="table-cell px-2 py-3 w-80"></td>
                                            <td className="table-cell px-2 py-3 w-48"></td>
                                            <td className="table-cell px-2 py-3 w-48"></td>
                                            <td className=" text-center">
                                            <td className="table-cell px-2 py-3 w-[20px] "></td>

                                                {formatBalance(finalRunningBalance)}
                                            </td>
                                        </tr>

                                        {/* Account Rows */}
                                        {accountsData[accountTitle.id]?.map((account) => {
                                            runningBalance = calculateBalance(
                                                accountTitle.accountType,
                                                account.debit,
                                                account.credit,
                                                runningBalance
                                            );

                                            return (
                                                <tr
                                                    key={account.id}
                                                    onContextMenu={(e) => handleRightClick(e, account, accountTitle)}  // Right-click functionality
                                                    onMouseEnter={() => { 
                                                        setHoveredRowId(account.id); 
                                                        handleHoverData(account, accountTitle); 
                                                    }}
                                                    onMouseLeave={() => setHoveredRowId(null)}     
                                                    className=" text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 "
                                                >
                                                    

                                                    <td className="px-6 py-5 w-72"></td>
                                                    <td className="px-6 py-5 w-48"></td>


                                                    {/* Date Field */}
                                                    <td className="px-2 py-2 w-24 h-6 text-[12px]">
                                                        {editingCell === account.id && editValue.field === 'date' ? (
                                                            <DatePicker
                                                                selected={editValue.value ? new Date(editValue.value) : null}
                                                                onChange={(date) => setEditValue({ field: 'date', value: date ? date.toISOString().split('T')[0] : '' })}
                                                                dateFormat="yyyy-MM-dd"
                                                                className="border border-gray-400 focus:outline-none w-full h-8 px-2"
                                                                placeholderText="Select date"
                                                                onBlur={() => handleCellChange(account.id, 'date', editValue.value)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'date', value: account.date || '' }) }}
                                                                className="block border border-gray-300 hover:bg-gray-100 h-8 w-full px-2 py-1"
                                                            >
                                                                {account.date || '-'}
                                                            </span>
                                                        )}
                                                    </td>


                                                    {/* Particulars Field */}
                                                    <td className="px-2 py-2 w-80 h-6">
                                                        {editingCell === account.id && editValue.field === 'particulars' ? (
                                                            <input
                                                                type="text"
                                                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 py-1"
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
                                                    <td className="px-2 py-2 w-48 h-6">
                                                        {editingCell === account.id && editValue.field === 'debit' ? (
                                                            <input
                                                                type="text"
                                                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 py-1"
                                                                value={editValue.value}
                                                                onChange={(e) => setEditValue({ field: 'debit', value: e.target.value })}
                                                                onBlur={() => handleCellChange(account.id, 'debit', editValue.value)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'debit', value: account.debit || '' }) }}
                                                                className="block border border-gray-300 hover:bg-gray-100 w-full h-8 px-2 py-1"
                                                            >
                                                                {formatNumber(account.debit) || '-'}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Credit Field */}
                                                    <td className="px-2 py-2 w-48 h-6">
                                                        {editingCell === account.id && editValue.field === 'credit' ? (
                                                            <input
                                                                type="text"
                                                                className="border border-gray-400 focus:outline-none w-full h-8 px-2 py-1"
                                                                value={editValue.value}
                                                                onChange={(e) => setEditValue({ field: 'credit', value: e.target.value })}
                                                                onBlur={() => handleCellChange(account.id, 'credit', editValue.value)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'credit', value: account.credit || '' }) }}
                                                                className="block border border-gray-300 hover:bg-gray-100 w-full h-8 px-2 py-1"
                                                            >
                                                                {formatNumber(account.credit) || '-'}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Display Running Balance */}
                                                    <td className="px-2 py-4 text-center w-48">
                                                        {formatBalance(runningBalance) || '-'}
                                                    </td>

                                                    {/* Add Row Button */}
                                                    <td className="px-2 py-5 w-0 relative z-10"> {/* Add relative position for button */}
                                                        {hoveredRowId === account.id && (
                                                            <button
                                                                className="absolute left-[-10px] top-[49px] transform -translate-y-1/2 bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                                                onClick={handleAddRowBelow}
                                                            >
                                                                <IoMdAddCircleOutline />
                                                            </button>
                                                        )}
                                                    </td>


                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                        

                </table>
            </div>
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

            {/*Main Account Right-click context modal */}
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
                            Delete Account
                        </button>
                    </div>
                </div>
                )}





        </Fragment>
    );
}
