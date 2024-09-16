//Right Click Functions

const handleRightClick = (event, rowData) => {
    event.preventDefault(); // Prevent the browser's default right-click menu
    setSelectedRowData(rowData); // Set the row's data

    // Set the modal position based on the mouse position
    setModalPosition({ x: event.clientX, y: event.clientY });

    setShowRightClickModal(true); // Open the modal
  };

  const closeModalOnOutsideClick = (e) => {
    if (e.target.id === "user-modal-overlay") {
        setShowRightClickModal(false);
    }
  };

// Fetch account titles with onSnapshot
const accountTitleCollectionRef = collection(db, 'accountTitle');
const unsubscribeAccountTitles = onSnapshot(accountTitleCollectionRef, (snapshot) => {
    const titles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAccountTitles(titles);
}, (error) => {
    console.error('Error fetching account titles:', error);
});



  const handleAddAccount = async () => {
    try {
        const ledgerDocRef = doc(db, 'ledger', ledgerId); // Reference to the specific ledger document
        const accountTitlesLedgerRef = collection(ledgerDocRef, 'accountTitles'); // Reference to the accountTitles subcollection inside the ledger
        
        // Check if the account title already exists, or add it if necessary (optional)
        const accountTitleDocRef = doc(accountTitlesLedgerRef, selectedAccountTitle);
        
        // Reference the 'accounts' subcollection within the specific account title document
        const accountsSubcollectionRef = collection(accountTitleDocRef, 'accounts');
        
        const NewAccount = {
            accountTitle: selectedAccountTitle || null,
            accountCode: accountCode || null,
            accountType: accountType || null,
            date: null,
            particulars: null,
            debit: null,
            credit: null,
            balance: null
        };

        // Add the new account to the 'accounts' subcollection
        await addDoc(accountsSubcollectionRef, NewAccount);

        console.log('New account added to Firestore under the selected account title');
        setShowModal(false);
    } catch (error) {
        console.error('Error adding account to Firestore:', error);
    }
};


  //Delete Row
  const handleDeleteRow = async () => {
    if (!selectedRowData || !ledgerId) return;

    try {
        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountDocRef = doc(ledgerDocRef, 'accounts', selectedRowData.id);

        await deleteDoc(accountDocRef);
        
        // Optionally, you may want to update the UI to reflect the deletion
        setLedgerData(prevData => 
            prevData.map(group => ({
                ...group,
                accounts: group.accounts.filter(account => account.id !== selectedRowData.id)
            }))
        );

        console.log('Account deleted successfully');
        setShowRightClickModal(false); // Close the context menu
    } catch (error) {
        console.error('Error deleting row:', error);
    }
};

//Add row Above



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




const handleCellChange = async (id, field, value) => {
    try {
        const ledgerDocRef = doc(db, 'ledger', ledgerId);
        const accountsDocRef = doc(ledgerDocRef, 'accounts', id);

        await updateDoc(accountsDocRef, { [field]: value });

        setLedgerData(prevData => {
            // Recalculate balances for the entire dataset after any cell change
            return prevData.map(group => {
                let runningBalance = 0;
                return {
                    ...group,
                    accounts: group.accounts.map(entry => {
                        if (entry.id === id) {
                            const updatedEntry = { ...entry, [field]: value };

                            // Recalculate balance for the updated entry
                            runningBalance = calculateBalance(
                                updatedEntry.accountType,
                                parseFloat(updatedEntry.debit || 0),
                                parseFloat(updatedEntry.credit || 0),
                                runningBalance
                            );
                            updatedEntry.balance = runningBalance;
                            return updatedEntry;
                        }

                        // Calculate balance for the rest of the entries in the group
                        runningBalance = calculateBalance(
                            entry.accountType,
                            parseFloat(entry.debit || 0),
                            parseFloat(entry.credit || 0),
                            runningBalance
                        );
                        entry.balance = runningBalance;
                        return entry;
                    })
                };
            });
        });

        setEditingCell(null);
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
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



<Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Ledger Details</h1>
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ ADD ACCOUNT</button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/*TABLE*/}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-[150px]">ACCOUNT TITLE</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">ACCOUNT CODE</th>
                            <th scope="col" className="px-6 py-3 w-[120px]">DATE</th>
                            <th scope="col" className="px-6 py-3 w-[200px]">PARTICULARS</th>
                            <th scope="col" className="px-6 py-3 w-[100px]">DEBIT</th>
                            <th scope="col" className="px-6 py-3 w-[100px]">CREDIT</th>
                            <th scope="col" className="px-6 py-3 w-[120px]">BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
    {ledgerData.map((group, index) => (
        <Fragment key={index}>
            {/* Main account title row */}
            <tr className="bg-gray-100 font-bold">
                <td className="table-cell px-6 py-4">{group.title}</td>
                <td className="table-cell px-6 py-4">{group.code}</td>
                <td className="table-cell px-6 py-4"></td>
                <td className="table-cell px-6 py-4"></td>
                <td className="table-cell px-6 py-4"></td>
                <td className="table-cell px-6 py-4"></td>
                <td className="table-cell px-6 py-4">{formatBalance(group.runningBalance)}</td>
            </tr>

            {/* Detail rows */}
            {group.accounts.map(account => (
                <tr key={account.id} onContextMenu={(e) => handleRightClick(e, account)} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4">
                        {editingCell === account.id && editValue.field === 'date' ? (
                            <input
                                type="text"
                                className="border-b border-gray-400 focus:outline-none w-full h-full px-2 py-1"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'date', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'date', editValue.value)}
                            />
                        ) : (
                            <span
                                onDoubleClick={() => { setEditingCell(account.id); setEditValue({ field: 'date', value: account.date || '' }) }}
                                className="block w-full h-full px-2 py-1"
                            >
                                {account.date || '-'}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {editingCell === account.id && editValue.field === 'particulars' ? (
                            <input
                                type="text"
                                className="border-b border-gray-400 focus:outline-none w-full h-full px-2 py-1"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'particulars', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'particulars', editValue.value)}
                            />
                        ) : (
                            <span
                                onDoubleClick={() => { setEditingCell(account.id); setEditValue({ field: 'particulars', value: account.particulars || '' }) }}
                                className="block w-full h-full px-2 py-1"
                            >
                                {account.particulars || '-'}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {editingCell === account.id && editValue.field === 'debit' ? (
                            <input
                                type="text"
                                className="border-b border-gray-400 focus:outline-none w-full h-full px-2 py-1"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'debit', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'debit', editValue.value)}
                            />
                        ) : (
                            <span
                                onDoubleClick={() => { setEditingCell(account.id); setEditValue({ field: 'debit', value: account.debit || '' }) }}
                                className="block w-full h-full px-2 py-1"
                            >
                                {formatNumber(account.debit) || '-'}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {editingCell === account.id && editValue.field === 'credit' ? (
                            <input
                                type="text"
                                className="border-b border-gray-400 focus:outline-none w-full h-full px-2 py-1"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'credit', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'credit', editValue.value)}
                            />
                        ) : (
                            <span
                                onDoubleClick={() => { setEditingCell(account.id); setEditValue({ field: 'credit', value: account.credit || '' }) }}
                                className="block w-full h-full px-2 py-1"
                            >
                                {formatNumber(account.credit) || '-'}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {formatBalance(account.balance) || '-'}
                    </td>
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
                                const selectedAccount = accountTitles.find(title => title['Account Title'] === selectedTitle);
                                
                                // Update account code and account type based on the selected account
                                if (selectedAccount) {
                                    setAccountCode(selectedAccount['Account Code']);
                                    setAccountType(selectedAccount['Account Type']);
                                } else {
                                    setAccountCode('');
                                    setAccountType('');
                                }
                            }}
                            className="mt-1 block w-2/4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select Account Title</option>
                            {accountTitles.map((title) => (
                                <option key={title.id} value={title['Account Title']}>
                                    {title['Account Title']}
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
                        
                    >
                        Add Row Above
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        
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