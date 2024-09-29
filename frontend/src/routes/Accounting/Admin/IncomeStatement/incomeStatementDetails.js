import React, { Fragment, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; 
import { doc, collection, onSnapshot, addDoc, updateDoc, arrayRemove,deleteDoc,where,query,getDocs,getDoc,writeBatch } from 'firebase/firestore';

export default function IncomeStatementDetails() {
    const [incomeStatementDescription, setIncomeStatementDescription] = useState("");
    const [incomeStatementData, setIncomeStatementData] = useState([]);
    const { incomeStatementID } = useParams();
    const [loading, setLoading] = useState(false);
    const { ledgerId } = useParams(); // Get ledgerId from URL
    const [accountsData, setSelectedAccountsData] = useState('');
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [accountCode, setAccountCode] = useState('');
    const [accountType, setAccountType] = useState('');
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [accountTitles, setAccountTitles] = useState([]);
    
    // Right-click Modal States
    const [showRightClickModal, setShowRightClickModal] = useState(false); 
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [selectedAccountTitleRowData, setSelectedAccountTitleRowData] = useState(null);

    // Main Account Right-click Modal States
    const [showMainAccountRightClick, setShowMainAccountRightClick] = useState(false); 
    const [selectedMainAccount, setSelectedMainAccount] = useState(null);

    const handleHoverData = (account, accountTitle) =>{
        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID

         setSelectedRowData(account);
         setSelectedAccountTitleRowData(accountTitle);
    }

    

    

    const handleRightClick = (event,account, accountTitle) => {
        event.preventDefault(); 

        const accountId = account.id; // Account document ID
        const accountTitleId = accountTitle.id; // Parent accountTitle document ID
        
         setSelectedRowData(account);
         setSelectedAccountTitleRowData(accountTitle);
        
        // Set the modal position based on the mouse position
        setModalPosition({ x: event.clientX, y: event.clientY - 50});
        setShowRightClickModal(true); // Open the modal

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
                account: '',
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

    // Date range checker function
    const isWithinDateRange = (accountDate, startDate, endDate) => {
        let accountTimestamp;
        if (accountDate && accountDate.toDate) {
            accountTimestamp = accountDate.toDate();
        } else if (typeof accountDate === 'string') {
            accountTimestamp = new Date(accountDate);
        } else if (accountDate instanceof Date) {
            accountTimestamp = accountDate;
        } else {
            console.log('Invalid account date:', accountDate);
            return false;
        }
        return accountTimestamp >= startDate && accountTimestamp <= endDate;
    };

    useEffect(() => {
        setLoading(true);
        const fetchIncomeStatementData = async () => {
            if (!incomeStatementID) {
                console.error('incomeStatementID is not provided.');
                return;
            }
            try {
                const incomeStatementDocRef = doc(db, 'incomestatement', incomeStatementID);
                const incomeStatementDoc = await getDoc(incomeStatementDocRef);
                if (!incomeStatementDoc.exists()) {
                    console.error("Income statement document not found");
                    setLoading(false);
                    return;
                }

                const incomeStatementData = incomeStatementDoc.data();
                const ledgerId = incomeStatementData.ledger;
                const startDate = incomeStatementData.start_date.toDate();
                const endDate = incomeStatementData.end_date.toDate();

                if (!ledgerId) {
                    console.error('Ledger ID is missing from the income statement document.');
                    return;
                }

                const ledgerDocRef = doc(db, 'ledger', ledgerId);
                const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
                const accountTitlesSnapshot = await getDocs(accountTitlesCollectionRef);
                let incomeData = [];

                for (const accountTitleDoc of accountTitlesSnapshot.docs) {
                    const accountTitleData = accountTitleDoc.data();
                    const accountsCollectionRef = collection(accountTitleDoc.ref, 'accounts');
                    const accountsSnapshot = await getDocs(accountsCollectionRef);

                    let totalBalance = 0;
                    let hasValidAccounts = false;

                    accountsSnapshot.forEach(accountDoc => {
                        const accountData = accountDoc.data();
                        const accountDate = accountData.date;

                        if (isWithinDateRange(accountDate, startDate, endDate)) {
                            const debit = parseFloat(accountData.debit) || 0;
                            const credit = parseFloat(accountData.credit) || 0;

                            // Calculate the balance as credit - debit
                            totalBalance += credit - debit;
                            hasValidAccounts = true;
                        }
                    });

                    if (hasValidAccounts) {
                        incomeData.push({
                            particulars: accountTitleData.accountTitle,
                            accountCode: accountTitleData.accountCode,
                            balance: totalBalance,
                        });
                    }
                }

                setIncomeStatementData(incomeData);
                setIncomeStatementDescription(incomeStatementData.description || 'Income Statement');
                setLoading(false);
            } catch (error) {
                console.error("Error fetching income statement data:", error);
                setLoading(false);
            }
        };

        fetchIncomeStatementData();
    }, [incomeStatementID]);

    const handleInputChange = (index, field, value) => {
        const updatedData = [...incomeStatementData];
        updatedData[index][field] = value;
        setIncomeStatementData(updatedData);
    };

    // ADD ROW LOGIC
    const handleAddRowBelow = async (selectedRowData, ledgerId, selectedAccountTitleRowData) => {
        if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;

        try {
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
            const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');

            const accountsSnapshot = await getDocs(accountsSubcollectionRef);
            const sortedAccounts = accountsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.position - b.position);

            const selectedRowPosition = selectedRowData.position;
            const nextRow = sortedAccounts.find(account => account.position > selectedRowPosition);
            const newRowPosition = nextRow ? (selectedRowPosition + nextRow.position) / 2 : selectedRowPosition + 1;

            const newAccount = {
                balance: null,
                position: parseFloat(newRowPosition.toFixed(10)),
            };

            const newAccountRef = await addDoc(accountsSubcollectionRef, newAccount);

            const newAccountWithId = { ...newAccount, id: newAccountRef.id };
            setIncomeStatementData(prevData => ([...prevData, newAccountWithId]));
        } catch (error) {
            console.error('Error adding row:', error);
        }
    };

    

    // DELETE ROW LOGIC
    const handleDeleteRow = async (selectedRowData, ledgerId, selectedAccountTitleRowData) => {
        if (!selectedRowData || !ledgerId || !selectedAccountTitleRowData) return;

        try {
            const ledgerDocRef = doc(db, 'ledger', ledgerId);
            const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');
            const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, selectedAccountTitleRowData.id), 'accounts');
            const accountDocRef = doc(accountsSubcollectionRef, selectedRowData.id);

            await deleteDoc(accountDocRef);

            setIncomeStatementData(prevData => prevData.filter(row => row.id !== selectedRowData.id));
        } catch (error) {
            console.error('Error deleting row:', error);
        }
    };

    const exportToExcel = () => {
        // Your Excel export logic here
    };

    return (
        <Fragment>
    <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full mb-4">
            <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Income Statement</h1>
            <button onClick={exportToExcel} className="bg-blue-500 text-white px-4 py-2 rounded">Export</button>
        </div>
        <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">Description: {incomeStatementDescription}</p>
            <div>   
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded">Add Other Period</button>
            </div>
        </div>

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Account Description</th>
                        <th scope="col" className="px-6 py-3">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="3" className="text-center py-6">Loading...</td>
                        </tr>
                    ) : (
                        incomeStatementData.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-100 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">
                                    <input 
                                        type="text" 
                                        value={item.particulars} 
                                        onChange={(e) => handleInputChange(index, 'particulars', e.target.value)} 
                                        className="bg-transparent outline-none"
                                    />
                                </td>
                                <td className="px-6 py-4">{item.balance}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>

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
                    Add Entry Below
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
