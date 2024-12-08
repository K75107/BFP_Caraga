import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../../config/firebase-config'; // Firestore configuration
import { doc, collection, onSnapshot, addDoc, updateDoc, arrayRemove, deleteDoc, where, query, getDocs, getDoc, writeBatch, orderBy } from 'firebase/firestore';
import Modal from "../../../../components/Modal";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoMdAddCircleOutline } from "react-icons/io"; // Icon
import { Dropdown, Checkbox } from 'flowbite-react'; // Use Flowbite's React components
import { BiFilterAlt, BiChevronDown, BiExport } from "react-icons/bi"; // Icons for filter button
import { BsChevronDown } from "react-icons/bs"; // Icon for actions button
import { debounce } from 'lodash'; // Import debounce
import { useNavigate } from 'react-router-dom';
import { RiBook2Line, RiBook2Fill } from "react-icons/ri";
import SearchBar from '../../../../components/searchBar';
import AddButton from '../../../../components/addButton';
import { CiFilter } from "react-icons/ci";
import ExportButton from "../../../../components/exportButton";
import ExcelJS from 'exceljs';

export default function LedgerDetails() {

  const { ledgerId } = useParams(); // Get ledgerId from URL
  // console.log(ledgerId);
  const [loading, setLoading] = useState(false);
  const [ledgerDescription, setLedgerDescription] = useState('');

  //Navigation
  const navigate = useNavigate();

  //Hover on Rows
  const [hoveredRowId, setHoveredRowId] = useState(null);

  //List of Account Titles from
  const [listAccountTitles, setListAccountTitles] = useState([]);


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
  const [selectedAccountTitleRowData, setSelectedAccountTitleRowData] = useState(null);

  /// Main Account Right click Modal
  const [showMainAccountRightClick, setShowMainAccountRightClick] = useState(false);
  const [selectedMainAccount, setSelectedMainAccount] = useState(null);

  //Modal
  const [showModal, setShowModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState(''); // Search input state
  const [filteredAccountTitles, setFilteredAccountTitles] = useState([]); // Filtered account titles

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [startExportDate, setStartExportDate] = useState(null);
  const [endExportDate, setEndExportDate] = useState(null);


  useEffect(() => {
    if (!ledgerId) {
      console.error('ledgerId is not provided.');
      return;
    }

    const ledgerDocRef = doc(db, 'ledger', ledgerId);
    setLoading(true); // Start loading before fetching data

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
    unsubscribeLedger = onSnapshot(
      query(accountTitlesCollectionRef, orderBy('position', 'asc')),
      async (snapshot) => {
        const fetchedAccountTitles = [];
        const fetchedAccounts = {};
    
        for (const accountTitleDoc of snapshot.docs) {
          const accountTitleData = { id: accountTitleDoc.id, ...accountTitleDoc.data() };
          fetchedAccountTitles.push(accountTitleData);
    
          const accounts = await fetchAccounts(accountTitleDoc.id);
    
          // Merge optimistically added accounts with fetched accounts
          const localAccounts = accountsData[accountTitleDoc.id] || [];
          fetchedAccounts[accountTitleDoc.id] = [...accounts, ...localAccounts]
            .filter((value, index, self) => 
              index === self.findIndex((v) => v.id === value.id)
            )
            .sort((a, b) => a.position - b.position);
        }
    
        setAccountTitles(fetchedAccountTitles);
        setSelectedAccountsData(fetchedAccounts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching ledger data:', error);
        setLoading(false);
      }
    );
    

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


  // Filter account titles based on searchQuery and date range
  useEffect(() => {
    if (!accountTitles.length || !accountsData) {
      setFilteredAccountTitles([]); // No data to filter
      return;
    }

    const filteredTitles = accountTitles.reduce((result, title) => {
      const transactions = accountsData[title.id] || [];

      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

      // Filter transactions, include rows without dates if no filters are applied
      const filteredTransactions = transactions.filter((transaction) => {
        if (!transaction.date) {
          // Include rows without a date if no start or end date filters are applied
          return !start && !end;
        }

        const transactionDate = new Date(transaction.date);
        return (
          (!start || transactionDate >= start) &&
          (!end || transactionDate <= end)
        );
      });

        // Check if the title matches the search query
        const matchesSearchQuery = title.accountTitle
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        // Add the account title if it matches the search query and has valid transactions
        if (matchesSearchQuery && filteredTransactions.length > 0) {
            result.push({
                ...title,
                transactions: filteredTransactions, // Add only the filtered transactions
            });
        }

        return result;
    }, []);

    setFilteredAccountTitles(filteredTitles);
  }, [accountTitles, accountsData, startDate, endDate, searchQuery]);




  //Right Click Functions

  const handleRightClick = (event, account, accountTitle) => {
    event.preventDefault();

    const accountId = account.id; // Account document ID
    const accountTitleId = accountTitle.id; // Parent accountTitle document ID

    setSelectedRowData(account);
    setSelectedAccountTitleRowData(accountTitle);

    // Set the modal position based on the mouse position
    setModalPosition({ x: event.clientX, y: event.clientY - 50 });
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
      // console.log("Successfully added a child row below the main account.");

    } catch (error) {
      console.error('Error adding entry under main account:', error.message || error);
    }
  };

  //DELETE MAIN ACCOUNT
  const handleDeleteAccount = async () => {

    if (!selectedMainAccount || !ledgerId) return;
    try {

      //Reference directly
      const selectedAccountTitleRef = doc(db, 'ledger', ledgerId, 'accounttitles', selectedMainAccount);

      await deleteDoc(selectedAccountTitleRef);
      setShowMainAccountRightClick(false);
      console.log("successfully deleted account");
    } catch (error) {
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



  const handleHoverData = (account, accountTitle) => {
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
      case 'Subsidy':
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

        // Fetch all account titles to find the minimum position, sorted by position in ascending order
        const allAccountTitlesSnapshot = await getDocs(query(accountTitlesCollectionRef, orderBy('position', 'asc')));
        const existingAccountTitles = allAccountTitlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Find the minimum position or default to 0 if no titles exist
        const minPosition = existingAccountTitles.length > 0
          ? Math.min(...existingAccountTitles.map(title => title.position || 0))
          : 0; // Default to 0 if no account titles exist

        // Set the new position as minPosition - 1 to make it appear on top
        const newPosition = minPosition - 1;

        // Add the new account title with the calculated position
        accountTitleDocRef = await addDoc(accountTitlesCollectionRef, {
          accountTitle: selectedAccountTitle,
          accountCode: accountCode || null,
          accountType: accountType || null,
          position: parseFloat(newPosition.toFixed(10)), // Ensure position is a float
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
      let matchingAccountTitle = null;
      let existingAccount = null;

      // Find the account title containing the specific account ID
      for (let accountTitle of accountTitles) {
        const accounts = accountsData[accountTitle.id]; // Get the accounts for this account title

        // Check if this accountTitle contains the account we're trying to update
        const targetAccount = accounts.find(account => account.id === accountId);

        if (targetAccount) {
          matchingAccountTitle = accountTitle;
          existingAccount = targetAccount;
          break; // Exit loop once the account is found
        }
      }

      if (!matchingAccountTitle || !existingAccount) {
        console.error(`No account document found with ID ${accountId}.`);
        return; // Exit if no matching account is found
      }

      // Only update if there is a change in value
      if (existingAccount[field] === newValue) {
        console.log('No changes detected, skipping update.');
        return; // Exit early if no changes are made
      }

      // Optimistically update local state immediately
      setSelectedAccountsData(prevData => ({
        ...prevData,
        [matchingAccountTitle.id]: prevData[matchingAccountTitle.id].map(account =>
          account.id === accountId ? { ...account, [field]: newValue } : account
        ),
      }));

      // Debounced Firebase update to avoid frequent writes
      debouncedUpdate(accountId, field, newValue, matchingAccountTitle);

      // Clear the editing state after optimistic update
      setEditingCell(null);
      setEditValue({ field: '', value: '' });

    } catch (error) {
      console.error('Error updating account field:', error);
    }
  };

  // Debounced function for Firebase update
  const debouncedUpdate = debounce(async (accountId, field, newValue, matchingAccountTitle) => {
    try {
      // Get the ledger reference
      const ledgerDocRef = doc(db, 'ledger', ledgerId);

      // Get the collection of account titles
      const accountTitlesCollectionRef = collection(ledgerDocRef, 'accounttitles');

      // Get the subcollection for the matching account title
      const accountsSubcollectionRef = collection(doc(accountTitlesCollectionRef, matchingAccountTitle.id), 'accounts');
      const accountDocRef = doc(accountsSubcollectionRef, accountId);

      // Update the specific field of the account in Firestore
      await updateDoc(accountDocRef, {
        [field]: newValue,
      });

    } catch (error) {
      console.error('Error updating account field:', error);
    }
  }, 1000);  // Set the delay to 1 second for debouncing




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


  // Function to export the data to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('General Ledger');

    worksheet.pageSetup.margins = {
      top: 0.5,      
      bottom: 0.5, 
      left: 0.45,   
      right: 0.25,    
      header: 0.3,   
      footer: 0.3,   
    };
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 3,
      },
    ];

    // Define the effective end date if not set
    const effectiveEndDate = endExportDate
      ? new Date(endExportDate).setHours(23, 59, 59, 999)
      : new Date().setHours(23, 59, 59, 999);

    // Filter account titles and transactions based on start and end dates
    const filteredAccountTitles = accountTitles.reduce((result, accountTitle) => {
      const transactions = accountsData[accountTitle.id] || [];

      const filteredTransactions = transactions.filter((transaction) => {
        if (!transaction.date) return !startExportDate && !endExportDate;
        const transactionDate = new Date(transaction.date);
        return (
          (!startExportDate || transactionDate >= new Date(startExportDate)) &&
          (!endExportDate || transactionDate <= effectiveEndDate)
        );
      });

      if (filteredTransactions.length > 0) {
        result.push({
          ...accountTitle,
          transactions: filteredTransactions,
        });
      }

      return result;
    }, []);
    filteredAccountTitles.forEach((accountTitle, index) => {
      const startRow = worksheet.lastRow ? worksheet.lastRow.number + 5 : 1;

      worksheet.mergeCells(`A${startRow}:G${startRow}`);
      worksheet.getCell(`A${startRow}`).value = 'GENERAL LEDGER';
      worksheet.getCell(`A${startRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14, name: 'Times New Roman' };

      worksheet.mergeCells(`A${startRow + 1}:G${startRow + 1}`);
      worksheet.getCell(`A${startRow + 1}`).value = 'Bureau of Fire Protection';
      worksheet.getCell(`A${startRow + 1}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${startRow + 1}`).font = { italic: true, underline: true, name: 'Times New Roman' };

      worksheet.mergeCells(`A${startRow + 2}:G${startRow + 2}`);
      worksheet.getCell(`A${startRow + 2}`).value = 'Agency Name';
      worksheet.getCell(`A${startRow + 2}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${startRow + 2}`).font = { name: 'Times New Roman' };

      worksheet.getCell(`A${startRow + 4}`).value = {
        richText: [
          { text: 'Account Title: ', font: { name: 'Times New Roman' } },
          { text: accountTitle.accountTitle, font: { bold: true, underline: true, name: 'Times New Roman' } },
        ],
      };

      worksheet.getCell(`F${startRow + 4}`).value = {
        richText: [
          { text: 'Account Code: ', font: { name: 'Times New Roman' } },
          { text: accountTitle.accountCode, font: { bold: true, underline: true, name: 'Times New Roman' } },
        ],
      };

      const headersRow = worksheet.getRow(startRow + 6);
      headersRow.values = ['Date', 'Particulars', '', 'Ref.', 'Debit', 'Credit', 'Balance'];
      headersRow.font = { bold: true, name: 'Times New Roman' };

      worksheet.mergeCells(`B${startRow + 6}:C${startRow + 6}`);

      // Center-align the merged cell
      const mergedHeaderCell = worksheet.getCell(`B${startRow + 6}`);
      mergedHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Apply borders and alignments to headers
      headersRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center' };
      });

      let runningBalance = 0;
      let currentRowNumber = startRow + 7;

      accountTitle.transactions.forEach((transaction) => {
        runningBalance = calculateBalance(
          accountTitle.accountType,
          transaction.debit || 0,
          transaction.credit || 0,
          runningBalance
        );

        const row = worksheet.addRow([
          transaction.date || '',
          transaction.particulars || '',
          '',
          transaction.ref || '',
          transaction.debit || 0,
          transaction.credit || 0,
          runningBalance,
        ]);

        const rowIndex = row.number;

        // Merge columns C and D for the current row
        worksheet.mergeCells(`B${rowIndex}:C${rowIndex}`);

        // Apply borders to each transaction row cell
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1 || colNumber === 2) { // Ensure columns 1 and 2 always have borders
            cell.value = cell.value || ''; // Explicitly ensure the cell is not undefined
          }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          // Apply number formatting for Debit, Credit, and Balance columns
          if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
            cell.value = parseFloat(cell.value) || 0; // Ensure numeric value
            cell.numFmt = '#,##0.00'; // Apply two-decimal formatting with thousand separator
          }
        });

        // Adjust alignment for columns
        row.getCell(5).alignment = { horizontal: 'right' }; // Debit
        row.getCell(6).alignment = { horizontal: 'right' }; // Credit
        row.getCell(7).alignment = { horizontal: 'right' }; // Balance

      currentRowNumber += 1;
    });

    // Set column widths for readability
    worksheet.getColumn(1).width = 10; // Date
    worksheet.getColumn(2).width = 25; // Particulars
    worksheet.getColumn(3).width = 10; // Ref.
    worksheet.getColumn(5).width = 15; // Debit
    worksheet.getColumn(6).width = 15; // Credit
    worksheet.getColumn(7).width = 15; // Balance
  });

  // Export file as Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'GeneralLedger.xlsx';
  link.click();
};



return (
  <Fragment>
    {/**Breadcrumbs */}
    <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li class="inline-flex items-center">
          <button onClick={() => navigate("/main/generalLedger/")} class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
            <RiBook2Fill className="mr-2"></RiBook2Fill>
            General Ledger
          </button>
        </li>
        <li aria-current="page">
          <div class="flex items-center">
            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
            </svg>
            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{ledgerDescription}</span>
          </div>
        </li>
      </ol>
    </nav>
    {/**Breadcrumbs */}

    <div className="flex justify-between w-full">
      <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{ledgerDescription}</h1>
      <div class="flex space-x-4">
        <SearchBar
          placeholder="Search Account Title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          listSource={filteredAccountTitles}
        />


        <AddButton
          label={"ADD ACCOUNT"}
          onClick={() => setShowModal(true)}
        />

        {/* Buttons and Dropdowns */}
        <div className="flex flex-col items-stretch justify-end flex-shrink-0 w-full space-y-2 md:w-auto md:flex-row md:space-y-0 md:items-center md:space-x-3">


          {/* Filter Dropdown */}
          <Dropdown
            label={
              <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                <CiFilter className="w-5 h-5 mr-2" aria-hidden="true" />
                <span className="mr-2 font-medium">Filter</span>
                <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
              </div>
            }
            dismissOnClick={false}
            inline={true}
            arrowIcon={false} // Disabled default arrow icon
            className=" w-70 text-gray-900 bg-white border border-gray-200 rounded-lg  focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            <h6 className=" text-sm font-medium text-gray-700 dark:text-white p-1 text-center">
              Filter by Date
            </h6>
            <hr className="border-t bordergray-50 my-1" />

            <div className="px-3 py-1 flex flex-row justify-between">
              <div className='px-3 py-1'>
                <h6 className="mb-2 text-xs text-gray-700 dark:text-white text-left font-medium">
                  Start Date
                </h6>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholderText="Start Date"
                  className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                  dateFormat="yyyy-MM-dd"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>

              <div className='px-3 py-1'>
                <h6 className="mb-2 text-xs  text-gray-700 dark:text-white text-left font-medium ">
                  End Date
                </h6>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholderText="End Date"
                  dateFormat="yyyy-MM-dd"
                  onKeyDown={(e) => e.stopPropagation()}
                  className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                />
              </div>

            </div>
          </Dropdown>

          {/* Export Dropdown */}
          <Dropdown
            label={
              <div className="flex items-center bg-gray-50 py-1 px-2 text-xs h-10 ring-1 ring-blue-700 text-blue-700 rounded-lg hover:bg-white focus:ring-4 focus:ring-blue-300 transition">
                <BiExport className="mr-2 text-[15px] font-bold" />
                <span className="mr-2 font-medium">Export</span>
                <BiChevronDown className="w-5 h-5" /> {/* Chevron Down Icon */}
              </div>
            }
            dismissOnClick={false}
            inline={true}
            arrowIcon={false} // Disabled default arrow icon
            className=" w-70 text-gray-900 bg-white border border-gray-200 rounded-lg  focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            <h6 className=" text-sm font-medium text-gray-700 dark:text-white p-1 text-center">
              Export by Date
            </h6>
            <hr className="border-t bordergray-50 my-1" />

            <div className="px-3 py-1 flex flex-row justify-between">
              <div className='px-3 py-1'>
                <DatePicker
                  selected={startExportDate}
                  onChange={(date) => setStartExportDate(date)}
                  placeholderText="Start Date"
                  dateFormat="yyyy-MM-dd"
                  onKeyDown={(e) => e.stopPropagation()}
                  className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                />
              </div>
              <div className='px-3 py-1'>
                <DatePicker
                  selected={endExportDate}
                  onChange={(date) => setEndExportDate(date)}
                  placeholderText="End Date"
                  dateFormat="yyyy-MM-dd"
                  onKeyDown={(e) => e.stopPropagation()}
                  className="rounded-date-input w-24 text-xs rounded-md h-10 bg-gray-50"
                />
              </div>

              <div className='px-3 py-1'>
                <ExportButton
                  label="EXPORT"
                  onClick={exportToExcel}
                />
              </div>
            </div>
          </Dropdown>

        </div>
      </div>
    </div>

    <hr className="border-t border-[#7694D4] my-2 mb-4" />


    {/*TABLE*/}
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs  uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky ">
          <tr>

            <th scope="col" className="px-6 py-4 w-72 ">ACCOUNT TITLE</th>
            <th scope="col" className="px-6 py-4 w-48">ACCOUNT CODE</th>
            <th scope="col" className="px-6 py-4 w-32">DATE</th>
            <th scope="col" className="px-6 py-4 w-80">PARTICULARS</th>
            <th scope="col" className="px-6 py-4 w-48">DEBIT</th>
            <th scope="col" className="px-6 py-4 w-48">CREDIT</th>
            <th scope="col" className="px-6 py-4 w-48 text-center">BALANCE</th>
            <th scope="col" className=" w-[20px] "></th>
            <td className="table-cell py-4 w-10"></td>

          </tr>
        </thead>
      </table>
      <div className="w-full overflow-y-scroll h-[calc(96vh-200px)]">
        <table className="w-full">
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-6">
                  <div className="flex justify-center items-center h-96">
                    <div role="status">
                      <svg
                        aria-hidden="true"
                        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAccountTitles.map((accountTitle) => {
                let runningBalance = 0;

                const finalRunningBalance = accountTitle.transactions?.reduce((balance, account) => {
                  return calculateBalance(accountTitle.accountType, account.debit, account.credit, balance);
                }, 0);

                return (
                  <Fragment key={accountTitle.id}>
                    <tr className=" text-[12px] bg-white border-b w-full font-bold bg-blue-50"
                      onContextMenu={(e) => handleMainAccountRightClick(e, accountTitle.id)}
                    >
                      <td className="table-cell px-6 py-3 w-72">{accountTitle.accountTitle}</td>
                      <td className="table-cell px-6 py-3 w-48">{accountTitle.accountCode}</td>
                      <td className="table-cell px-6 py-3 w-32"></td>
                      <td className="table-cell px-6 py-3 w-80"></td>
                      <td className="table-cell px-6 py-3 w-48"></td>
                      <td className="table-cell px-6 py-3 w-48"></td>
                      <td className="table-cell px-6 py-3 w-[20px] text-center">
                        {formatBalance(finalRunningBalance)}
                      </td>
                      <td className="table-cell py-3 "></td>
                    </tr>

                    {/* Render filtered transactions */}
                    {accountTitle.transactions?.map((account) => {
                      runningBalance = calculateBalance(
                        accountTitle.accountType,
                        account.debit,
                        account.credit,
                        runningBalance
                      );

                      return (
                        <tr
                          key={account.id}
                          onContextMenu={(e) => handleRightClick(e, account, accountTitle)}
                          onMouseEnter={() => {
                            setHoveredRowId(account.id);
                            handleHoverData(account, accountTitle);
                          }}
                          onMouseLeave={() => setHoveredRowId(null)}
                          className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50"
                        >
                          <td className="px-6 py-2 w-72"></td>
                          <td className="px-6 py-2 w-48"></td>

                          <td className="px-2 py-2 w-32 h-6 text-[12px]">
                            {editingCell === account.id && editValue.field === 'date' ? (
                              <DatePicker
                                selected={editValue.value ? new Date(editValue.value) : null}
                                onChange={(date) => setEditValue({ field: 'date', value: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="yyyy-MM-dd"
                                className="text-[12px] border border-gray-400 focus:outline-none h-8 w-full px-2"
                                placeholderText="Select date"
                                onBlur={() => handleCellChange(account.id, 'date', editValue.value)}
                                autoFocus
                                style={{ fontSize: '12px' }}
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'date', value: account.date || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 h-full w-full px-2 py-2"
                              >
                                {account.date || '-'}
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-2 w-80 h-6">
                            {editingCell === account.id && editValue.field === 'particulars' ? (
                              <input
                                type="text"
                                className="text-[12px] border border-gray-400 focus:outline-none h-8 w-full px-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'particulars', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'particulars', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'particulars', value: account.particulars || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 w-full h-full px-2 py-2"
                              >
                                {account.particulars || '-'}
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-2 w-48 h-6">
                            {editingCell === account.id && editValue.field === 'debit' ? (
                              <input
                                type="number"
                                className="text-[12px] border border-gray-400 focus:outline-none h-8 w-full px-2 py-2"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'debit', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'debit', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'debit', value: account.debit || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 w-full h-full px-2 py-2"
                              >
                                {formatNumber(account.debit) || '-'}
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-2 w-48 h-6">
                            {editingCell === account.id && editValue.field === 'credit' ? (
                              <input
                                type="number"
                                className=" text-[12px] border border-gray-400 focus:outline-none w-full px-2 h-8"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'credit', value: e.target.value })}
                                onBlur={() => handleCellChange(account.id, 'credit', editValue.value)}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingCell(account.id); setEditValue({ field: 'credit', value: account.credit || '' }) }}
                                className="block border border-gray-300 hover:bg-gray-100 w-full h-full px-2 py-2"
                              >
                                {formatNumber(account.credit) || '-'}
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-4 text-center w-48">
                            {formatBalance(runningBalance) || '-'}
                          </td>

                          <td className="px-2 py-6 w-0 relative z-10">
                            {hoveredRowId === account.id && (
                              <button
                                className=" absolute left-[-10px] top-[49px] transform -translate-y-1/2 bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
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
              })
            )}
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
            onClick={() => navigate("/main/accounts")}
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