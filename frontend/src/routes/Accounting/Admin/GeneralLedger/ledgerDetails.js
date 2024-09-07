import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import Modal from "../../../../components/Modal";

export default function LedgerDetails() {
    const [showModal, setShowModal] = useState(false);
    const { ledgerId } = useParams(); // Get ledgerId from URL
    const [ledgerData, setLedgerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accountTitles, setAccountTitles] = useState([]);
    const [selectedAccountTitle, setSelectedAccountTitle] = useState('');
    const [accountCode, setAccountCode] = useState('');
    const [accountType, setAccountType] = useState('');
    const [editingCell, setEditingCell] = useState(null); // To track which cell is being edited
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        const fetchLedgerData = async () => {
            try {
                const ledgerDocRef = doc(db, 'ledger', ledgerId);
                const ledgerDoc = await getDoc(ledgerDocRef);

                if (ledgerDoc.exists()) {
                    const accountsCollectionRef = collection(ledgerDocRef, 'accounts');
                    const accountsSnapshot = await getDocs(accountsCollectionRef);
                    const accountsData = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Group by accountTitle and calculate balances
                    const groupedData = accountsData.reduce((acc, entry) => {
                        if (!acc[entry.accountTitle]) {
                            acc[entry.accountTitle] = {
                                title: entry.accountTitle,
                                code: entry.accountCode,
                                type: entry.accountType,
                                accounts: [],
                                runningBalance: 0 // Initialize running balance for this account
                            };
                        }

                        // Calculate running balance
                        const balance = calculateBalance(
                            acc[entry.accountTitle].type,
                            parseFloat(entry.debit || 0),
                            parseFloat(entry.credit || 0),
                            acc[entry.accountTitle].runningBalance
                        );

                        // Set the balance for this entry
                        entry.balance = balance;

                        // Update running balance in the group
                        acc[entry.accountTitle].runningBalance = balance;

                        // Add the entry to the group's accounts
                        acc[entry.accountTitle].accounts.push(entry);

                        return acc;
                    }, {});

                    setLedgerData(Object.values(groupedData));
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching ledger data:', error);
            }
        };

        const fetchAccountTitles = async () => {
            try {
                const accountTitleCollectionRef = collection(db, 'accountTitle');
                const accountTitleSnapshot = await getDocs(accountTitleCollectionRef);
                const titles = accountTitleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAccountTitles(titles);
            } catch (error) {
                console.error('Error fetching account titles:', error);
            }
        };

        fetchLedgerData();
        fetchAccountTitles();
        setLoading(false);
    }, [ledgerId]);

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
            const accountsCollectionRef = collection(ledgerDocRef, 'accounts');

            await addDoc(accountsCollectionRef, {
                accountTitle: selectedAccountTitle || null,
                accountCode: accountCode || null,
                accountType: accountType || null,
                date: null,
                particulars: null,
                debit: null,
                credit: null,
                balance: null
            });

            console.log('New account added to Firestore');
            setShowModal(false);
        } catch (error) {
            console.error('Error adding account to Firestore:', error);
        }
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

    const formatBalance = (balance) => {
        return balance !== null && balance !== undefined && !isNaN(balance)
            ? balance.toFixed(2)
            : '0.00';
    };

    if (loading) return <p>Loading...</p>;

    return (
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
                                <tr className="bg-gray-100 font-bold">
                                    <td className="table-cell px-6 py-4">{group.title}</td>
                                    <td className="table-cell px-6 py-4">{group.code}</td>
                                    <td className="table-cell px-6 py-4"></td>
                                    <td className="table-cell px-6 py-4"></td>
                                    <td className="table-cell px-6 py-4"></td>
                                    <td className="table-cell px-6 py-4"></td>
                                    <td className="table-cell px-6 py-4"></td>
                                </tr>
                                {group.accounts.map((entry) => (
                                    <tr key={entry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="table-cell px-6 py-4"></td>
                                        <td className="table-cell px-6 py-4"></td>
                                        <td className="table-cell px-6 py-4">
                                            {editingCell?.field === 'date' && editingCell.id === entry.id ? (
                                                <input
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                                    type="date"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleCellChange(entry.id, 'date', editValue)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCellChange(entry.id, 'date', editValue);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span onClick={() => { setEditingCell({ id: entry.id, field: 'date' }); setEditValue(entry.date || ''); }}>
                                                    {entry.date || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="table-cell px-6 py-4">
                                            {editingCell?.field === 'particulars' && editingCell.id === entry.id ? (
                                                <input
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleCellChange(entry.id, 'particulars', editValue)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCellChange(entry.id, 'particulars', editValue);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span onClick={() => { setEditingCell({ id: entry.id, field: 'particulars' }); setEditValue(entry.particulars || ''); }}>
                                                    {entry.particulars || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="table-cell px-6 py-4">
                                            {editingCell?.field === 'debit' && editingCell.id === entry.id ? (
                                                <input
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleCellChange(entry.id, 'debit', editValue)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCellChange(entry.id, 'debit', editValue);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span onClick={() => { setEditingCell({ id: entry.id, field: 'debit' }); setEditValue(entry.debit || ''); }}>
                                                    {entry.debit || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="table-cell px-6 py-4">
                                            {editingCell?.field === 'credit' && editingCell.id === entry.id ? (
                                                <input
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleCellChange(entry.id, 'credit', editValue)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCellChange(entry.id, 'credit', editValue);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span onClick={() => { setEditingCell({ id: entry.id, field: 'credit' }); setEditValue(entry.credit || ''); }}>
                                                    {entry.credit || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="table-cell px-6 py-4">{formatBalance(entry.balance)}</td>
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
        </Fragment>
    );
}
