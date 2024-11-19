import React, { Fragment, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot, query, where, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal";
import { useLocation } from "react-router-dom";
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import ExcelJS from 'exceljs';
import ExcelHeader from '../../../../assets/ExcelHeader.png';
import ExportButton from "../../../../components/exportButton";
import { PiBookOpenText, PiBookOpenTextFill } from "react-icons/pi";
import { UseLedgerData } from './incomeStatementContext';
import AddButton from "../../../../components/addButton";
import { IncomeStatementPeriodProvider } from './incomeStatementContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/outline';
import { IoIosSearch } from "react-icons/io";


export default function IncomeStatement() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams(); // Get the ID from the URL
    const [incomeStatement, setincomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]); // Store account titles
    const [accounts, setAccounts] = useState([]); // Separate state for accounts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentModal, setCurrentModal] = useState(1); // Modal state
    const [showModal, setShowModal] = useState(false);

    const [selectedLedger, setSelectedLedger] = useState("");
    const [incomeStatementLedgerList, setincomeStatementLedgerList] = useState([]);

    const location = useLocation();
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [stateStartDate, setStateStartDate] = useState(null);
    const [stateEndDate, setStateEndDate] = useState(null);

    const [totalRevenues, setTotalRevenues] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalSubsidy, setTotalSubsidy] = useState(0);
    const [totalNetSurplusDeficit, setTotalNetSurplusDeficit] = useState(0);

    const [fireAccountTitlesPeriod, setFireAccountTitlesPeriod] = useState([]);
    const [dataShow, setDataShow] = useState(false);
    // const [selectedLedgerYear, setSelectedLedgerYear] = useState([]);
    // const [accountTitlesPeriod, setAccountTitlesPeriod] = useState([]); // Store account titles
    // const [accountsPeriod, setAccountsPeriod] = useState([]); // Separate state for accounts
    // const [showPeriodColumn, setShowPeriodColumn] = useState(false);


    const {
        accountTitlesPeriod, updateAccountTitlesPeriod,
        accountsPeriod, updateAccountsPeriod,
        selectedLedgerYear, updateSelectedLedgerYear,
        showPeriodColumn, updateShowPeriodColumn
    } = UseLedgerData();

    // Access data specific to this income statement ID
    const currentAccountTitlesPeriod = accountTitlesPeriod[incomeStatementID] || [];
    const currentAccountsPeriod = accountsPeriod[incomeStatementID] || [];
    const fireLedgerYear = selectedLedgerYear[incomeStatementID] || null;
    const currentShowPeriodColumn = showPeriodColumn[incomeStatementID] || false;

    // Functions to update data for this income statement ID
    const setAccountTitlesPeriod = (data) => updateAccountTitlesPeriod(incomeStatementID, data);
    const setAccountsPeriod = (data) => updateAccountsPeriod(incomeStatementID, data);
    const setSelectedLedgerYear = (year) => updateSelectedLedgerYear(incomeStatementID, year);
    const setShowPeriodColumn = (value) => updateShowPeriodColumn(incomeStatementID, value);

    // Now use `currentAccountTitles`, `currentAccounts`, `currentLedgerYear`, etc. for rendering data
    // Use `setCurrentAccountTitles`, `setCurrentAccounts`, etc. for updating data
    console.log("Data of currentAccountTitlesPeriod: ", currentAccountTitlesPeriod);
    console.log("Data of currentAccountsPeriod: ", currentAccountsPeriod);
    console.log("Data of fireAccountTitlesPeriod: ", fireAccountTitlesPeriod);
    console.log("Data of fireLedgerYear: ", fireLedgerYear);

    const [isClicked, setIsClicked] = useState(false);
    const [firstSubcategoryModal, setFirstSubcategoryModal] = useState(false);
    const [secondSubcategoryModal, setSecondSubcategoryModal] = useState(false);
    const [thirdSubcategoryModal, setThirdSubcategoryModal] = useState(false);
    const [selectParentCategory, setSelectParentCategory] = useState(["Revenue", "Expenses", "Subsidy"]);
    const [subcategory, setSubcategory] = useState([]);
    const [currentSelection, setCurrentSelection] = useState("");

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const [searchTerm, setSearchTerm] = useState("");
    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const [checkedAccounts, setCheckedAccounts] = useState(new Set());
    const handleCheckboxChange = (accountTitle) => {
        setCheckedAccounts((prev) => {
            const updatedCheckedAccounts = new Set(prev);
            if (!updatedCheckedAccounts.has(accountTitle)) {
                updatedCheckedAccounts.delete(accountTitle);
                updatedCheckedAccounts.add(accountTitle);
            } else {
                updatedCheckedAccounts.add(accountTitle);
                updatedCheckedAccounts.delete(accountTitle);
            }
            return updatedCheckedAccounts;
        });
    };

    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const handleConfirm = () => {
        const selected = Array.from(checkedAccounts); // Convert Set to array
        setSelectedAccounts(prevSelected => [...prevSelected, ...selected]); // Append new selections
        console.log("Selected Accounts for Categorization:", selected);

        setCheckedAccounts(new Set());
    };

    const [subcategoryType, setSubcategoryType] = useState('');
    const determineSubcategoryType = (parentCategoryName) => {
        // Determine the subcategoryType based on the parent category
        const parentCategory = subcategories.find(
            (sub) => sub.subcategoryName === parentCategoryName
        );
        return parentCategory
            ? parentCategory.subcategoryType // inherit from the parent
            : parentCategoryName; // if root, use the root category type
    };

    // Function to dynamically filter accounts based on updated data
    const getFilteredAccounts = (subcategoryType) => {
        return accountTitles
            .filter(account => {
                if (subcategoryType === "Revenue") {
                    return ["Revenue"].includes(account.accountType);
                } else if (subcategoryType === "Expenses") {
                    return account.accountType === "Expenses";
                } else if (subcategoryType === "Subsidy") {
                    return account.accountType === "Subsidy";
                }
                return false; // Exclude any account that doesn't match the subcategoryType
            })
            .filter(account => account.accountTitle.toLowerCase().includes(searchTerm.toLowerCase())) // Search filter
            .filter(account => !selectedAccounts.includes(account.accountTitle)) // Exclude selected accounts
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)); // Sort alphabetically by accountTitle
    };

    const [subcategories, setSubcategories] = useState([]);
    const addSubcategory = (newName, newParentCategory, newSubcategoryType, newSelectedAccounts = []) => {
        const accountTitlesArray = Array.isArray(newSelectedAccounts)
            ? newSelectedAccounts
            : Array.from(newSelectedAccounts || []);

        setSubcategories((prevSubcategories) => [
            ...prevSubcategories,
            {
                subcategoryName: newName,
                parentCategory: newParentCategory,
                subcategoryType: newSubcategoryType,
                accountTitles: accountTitlesArray
            }
        ]);
    };
    console.log("Data of subcategories: ", subcategories)

    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [showRightClickModal, setShowRightClickModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

    const handleRightClick = useCallback((event, item) => {
        event.preventDefault();
        setModalPosition({ x: event.clientX, y: event.clientY });
        setSelectedSubcategory(item.name);
        setShowRightClickModal(true);
    }, []);


    const handleDeleteRow = (subcategoryName) => {
        // Get the names of deleted subcategories and removed accounts
        const { removedSubcategoryNames, removedAccountTitles } = deleteSubcategoryAndDescendants(subcategoryName, subcategories);

        // Update `selectedAccounts` to reflect removed accounts
        const updatedSelectedAccounts = selectedAccounts.filter(
            account => !removedAccountTitles.includes(account)
        );
        setSelectedAccounts(updatedSelectedAccounts);

        // Update `selectParentCategory` to remove all deleted subcategories
        const updatedParentCategories = selectParentCategory.filter(
            category => !removedSubcategoryNames.includes(category)
        );
        setSelectParentCategory(updatedParentCategories);
    };


    const closeModalOnOutsideClick = () => {
        setShowRightClickModal(false);
        setSelectedSubcategory(null);
    };


    // Spinner Component
    const Spinner = () => (
        <div className="flex justify-center items-center h-screen">
            <div role="status">
                <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" // Set to w-8 h-8 to match original
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
    );

    // ----------------------------------------- F E T C H  L E D G E R  L I S T -----------------------------------------
    useEffect(() => {
        const getLedgerList = async () => {
            try {
                const data = await getDocs(collection(db, "ledger"));
                const filteredData = data.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setincomeStatementLedgerList(filteredData);
            } catch (err) {
                console.error("Error fetching ledger data:", err);
            }
        };

        getLedgerList();
    }, []); // No dependencies for getLedgerList, so it only runs once on mount
    // ----------------------------------------- F E T C H  L E D G E R  L I S T -----------------------------------------

    // -------------------------- Function to update totalNetSurplusDeficit in the incomeStatement collection --------------------------
    const updateTotalNetSurplusDeficitInFirestore = async (incomeStatementID, totalNetSurplusDeficit) => {
        try {
            const incomeStatementRef = doc(db, "incomestatement", incomeStatementID);
            await updateDoc(incomeStatementRef, {
                totalSurplusDeficit: totalNetSurplusDeficit // Push the totalNetSurplusDeficit value to Firestore
            });
            console.log("Total net revenues successfully updated in Firestore.");
        } catch (err) {
            console.error("Error updating total subsidy:", err);
        }
    };
    // -------------------------- Function to update totalNetSurplusDeficit in the incomeStatement collection --------------------------

    // --------------------------- FETCH income statement DESCRIPTION AND ASSOCIATED LEDGER YEAR ----------------------------
    useEffect(() => {
        const getIncomeStatementDescription = async () => {
            try {
                const docRef = doc(db, "incomestatement", incomeStatementID); // Reference to the income statement document
                const docSnap = await getDoc(docRef); // Get the document snapshot

                if (docSnap.exists()) {
                    const incomeStatementData = { id: docSnap.id, ...docSnap.data() };

                    const convertToLocalDate = (timestamp) => {
                        const date = new Date(timestamp.seconds * 1000);
                        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                        return localDate.toISOString().split("T")[0];
                    };

                    const startDate = convertToLocalDate(incomeStatementData.start_date);
                    const endDate = convertToLocalDate(incomeStatementData.end_date);

                    setStateStartDate(startDate);
                    setStateEndDate(endDate);

                    if (incomeStatementData.ledgerID) {
                        const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                        const ledgerSnap = await getDoc(ledgerRef);

                        if (ledgerSnap.exists()) {
                            incomeStatementData.ledgerYear = ledgerSnap.data().year;

                            const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                            const accountTitlesSnap = await getDocs(accountTitlesRef);

                            const accountTitlesData = [];
                            const accountsData = [];

                            for (const titleDoc of accountTitlesSnap.docs) {
                                const titleData = { id: titleDoc.id, ...titleDoc.data() };

                                const accountsRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles", titleDoc.id, "accounts");
                                let accountsQuery = query(
                                    accountsRef,
                                    where("date", ">=", startDate),
                                    where("date", "<=", endDate)
                                );
                                const accountsSnap = await getDocs(accountsQuery);

                                if (!accountsSnap.empty) {
                                    let totalDebit = 0;
                                    let totalCredit = 0;

                                    const titleAccounts = accountsSnap.docs.map(accountDoc => {
                                        const accountData = {
                                            id: accountDoc.id,
                                            accountTitleID: titleDoc.id,
                                            ...accountDoc.data(),
                                        };

                                        totalDebit += parseFloat(accountData.debit) || 0;
                                        totalCredit += parseFloat(accountData.credit) || 0;

                                        return accountData;
                                    });

                                    titleData.difference = totalDebit - totalCredit;
                                    titleData.difference = totalCredit - totalDebit;

                                    accountTitlesData.push(titleData);
                                    accountsData.push(...titleAccounts);
                                }
                            }

                            setAccountTitles(accountTitlesData);
                            setAccounts(accountsData);

                            // Calculate totals
                            const Revenue = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Revenue")
                                .reduce((total, accountTitle) => total + accountTitle.difference, 0);

                            const Expenses = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Expenses")
                                .reduce((total, accountTitle) => total + accountTitle.difference, 0);

                            const subsidy = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Subsidy")
                                .reduce((total, accountTitle) => total + accountTitle.difference, 0);

                            const netRevenue = Revenue - Expenses;
                            const finalSurplusDeficit = netRevenue + subsidy;

                            // Update states with calculated values
                            setTotalRevenues(Revenue);
                            setTotalExpenses(Expenses);
                            setTotalSubsidy(subsidy);
                            setTotalNetSurplusDeficit(finalSurplusDeficit);

                            // Update Firestore with totalNetSurplusDeficit
                            updateTotalNetSurplusDeficitInFirestore(incomeStatementID, finalSurplusDeficit);
                        } else {
                            incomeStatementData.ledgerYear = "N/A";
                        }
                    }

                    setincomeStatement(incomeStatementData);
                } else {
                    setError("No income statement found.");
                }
            } catch (err) {
                console.error("Error fetching income statement data:", err);
                setError("Error fetching income statement data.");
            } finally {
                setLoading(false);
            }
        };

        getIncomeStatementDescription();
    }, []);


    // --------------------- FETCH SELECTED LEDGER DATA FOR ADDING PERIOD ALSO INCLUDE CALCULATIONS ----------------------
    const getSelectedLedgerData = async () => {
        try {
            if (selectedLedger) {
                const ledgerRef = doc(db, "ledger", selectedLedger);
                const ledgerSnap = await getDoc(ledgerRef);

                if (ledgerSnap.exists()) {
                    const ledgerYear = ledgerSnap.data().year;

                    const accountTitlesRef = collection(db, "ledger", selectedLedger, "accounttitles");
                    const accountTitlesSnap = await getDocs(accountTitlesRef);

                    const accountTitlesData = [];
                    const accountsData = [];

                    for (const titleDoc of accountTitlesSnap.docs) {
                        const titleData = { id: titleDoc.id, ...titleDoc.data() };

                        const accountsRef = collection(db, "ledger", selectedLedger, "accounttitles", titleDoc.id, "accounts");
                        const accountsQuery = query(
                            accountsRef,
                            where("date", ">=", stateStartDate),
                            where("date", "<=", stateEndDate)
                        );
                        const accountsSnap = await getDocs(accountsQuery);

                        if (!accountsSnap.empty) {
                            let totalDebit2 = 0;
                            let totalCredit2 = 0;

                            const titleAccounts = accountsSnap.docs.map(accountDoc => {
                                const accountData = {
                                    id: accountDoc.id,
                                    accountTitleID: titleDoc.id,
                                    ...accountDoc.data(),
                                };

                                totalDebit2 += parseFloat(accountData.debit) || 0;
                                totalCredit2 += parseFloat(accountData.credit) || 0;

                                return accountData;
                            });

                            titleData.difference2 = totalDebit2 - totalCredit2;
                            titleData.difference2 = totalCredit2 - totalDebit2;

                            accountTitlesData.push(titleData);
                            accountsData.push(...titleAccounts);
                        }
                    }
                    // Delete existing period data
                    await deletePeriodData();
                    // Add data to Firestore and update the state
                    await addPeriodData(accountTitlesData, ledgerYear);

                    setAccountTitlesPeriod(accountTitlesData);
                    setAccountsPeriod(accountsData);
                    setSelectedLedgerYear(ledgerYear);
                } else {
                    console.error("Selected ledger not found.");
                }
            }
        } catch (error) {
            console.error("Error fetching selected ledger data:", error);
        }
    };
    // --------------------- FETCH SELECTED LEDGER DATA FOR ADDING PERIOD ALSO INCLUDE CALCULATIONS ----------------------

    const deletePeriodData = async () => {
        try {
            const periodDataRef = collection(db, "incomestatement", incomeStatementID, "periodData");
            const querySnapshot = await getDocs(periodDataRef);

            // Delete each document in the periodData collection
            const deletePromises = querySnapshot.docs.map(async (doc) => {
                await deleteDoc(doc.ref);
                console.log(`Deleted document with ID: ${doc.id}`);
            });

            // Wait for all deletions to complete
            await Promise.all(deletePromises);
            console.log("All period data successfully deleted.");
        } catch (error) {
            console.error("Error deleting period data:", error);
        }
    };


    const addPeriodData = async (accountTitlesData, ledgerYear) => {
        try {
            const periodDataRef = collection(db, "incomestatement", incomeStatementID, "periodData");

            // Map over accountTitlesData to create an array of promises
            const promises = accountTitlesData.map(async (element) => {
                const data = {
                    ledgerYear: ledgerYear,
                    accountCode: element.accountCode,
                    accountID: element.id,
                    accountTitle: element.accountTitle,
                    accountType: element.accountType,
                    difference2: element.difference2,
                    position: element.position,
                };

                // Add data to Firestore
                const docRef = await addDoc(periodDataRef, data);
                if (docRef.id) {
                    console.log(`Document added with ID: ${docRef.id}`);
                } else {
                    console.warn('Document was not added.');
                }
            });

            // Wait for all promises to resolve
            await Promise.all(promises);
            console.log("All data successfully added to Firestore!");
        } catch (error) {
            console.error("Error adding data to Firestore:", error);
        }
    };

    const fetchPeriodData = async () => {
        try {
            const periodDataRef = collection(db, "incomestatement", incomeStatementID, "periodData");
            const querySnapshot = await getDocs(periodDataRef);

            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setFireAccountTitlesPeriod(data);

            // Extract the ledgerYear from the first document (assuming consistent ledgerYear for all docs)
            if (data.length > 0 && data[0].ledgerYear) {
                setSelectedLedgerYear(data[0].ledgerYear);
                setShowPeriodColumn(true);
            } else {
                console.warn("No ledgerYear found in the fetched data.");
            }

            console.log("Fetched data:", data);
            return data;
        } catch (error) {
            console.error("Error fetching data from Firestore:", error);
        }
    };


    useEffect(() => {
        const initializeData = async () => {
            try {
                if (selectedLedger) {
                    await getSelectedLedgerData();
                }
                await fetchPeriodData();
            } catch (error) {
                console.error("Error initializing data:", error);
            }
        };

        initializeData();
    }, [selectedLedger]);

    useEffect(() => {
        fetchPeriodData();
    }, []);

    // Your existing functions (fetchPeriodData, getSelectedLedgerData, etc.) remain unchanged


    useEffect(() => {
        if (!loading && location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            setIsSuccess(true);

            const timer = setTimeout(() => {
                setIsSuccess(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [loading, location.state]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <p>{error}</p>;
    }

    // ----------------------------------------- A D D  P E R I O D  T O T A L S -----------------------------------------
    const totalRevenues2 = fireAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Revenue")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);
    // Calculate total amount for Expenses
    const totalExpenses2 = fireAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Expenses")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);

    // Calculate base subsidy as Revenue - Expenses
    let totalNetRevenues2 = totalRevenues2 - totalExpenses2;
    let totalNetSurplusDeficit2 = totalRevenues2 - totalExpenses2;

    const totalSubsidy2 = currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Subsidy")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);
    // ----------------------------------------- A D D  P E R I O D  T O T A L S -----------------------------------------

    // ------------------------------------- A S S E T S  A C C O U N T  T I T L E S -------------------------------------
    const revenueAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
        // Gather all account titles from subcategories recursively
        const getAllSubcategoryAccountTitles = (subcategories, parentCategory) => {
            let subcategoryAccountTitles = [];

            subcategories
                .filter(sub => sub.parentCategory === parentCategory)
                .forEach(sub => {
                    if (sub.accountTitles) {
                        subcategoryAccountTitles.push(...sub.accountTitles);
                    }
                    subcategoryAccountTitles.push(...getAllSubcategoryAccountTitles(subcategories, sub.subcategoryName));
                });

            return subcategoryAccountTitles;
        };

        // Get all account titles in the nested subcategories under "Revenue"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Revenue");

        return accountTitles
            .filter(accountTitle =>
                accountTitle.accountType === "Revenue" &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                    amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null
                };
            });
    };
    // ------------------------------------- A S S E T S  A C C O U N T  T I T L E S -------------------------------------

    // -------------------------------- L I A B I L I T I E S  A C C O U N T  T I T L E S --------------------------------
    const ExpensesAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
        // Gather all account titles from subcategories recursively
        const getAllSubcategoryAccountTitles = (subcategories, parentCategory) => {
            let subcategoryAccountTitles = [];

            subcategories
                .filter(sub => sub.parentCategory === parentCategory)
                .forEach(sub => {
                    if (sub.accountTitles) {
                        subcategoryAccountTitles.push(...sub.accountTitles);
                    }
                    subcategoryAccountTitles.push(...getAllSubcategoryAccountTitles(subcategories, sub.subcategoryName));
                });

            return subcategoryAccountTitles;
        };

        // Get all account titles in the nested subcategories under "Expenses"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Expenses");

        return accountTitles
            .filter(accountTitle =>
                accountTitle.accountType === "Expenses" &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                    amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null
                };
            });
    };
    // -------------------------------- L I A B I L I T I E S  A C C O U N T  T I T L E S --------------------------------

    // ------------------------------------- E Q U I T Y  A C C O U N T  T I T L E S -------------------------------------
    const subsidyAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
        // Gather all account titles from subcategories recursively
        const getAllSubcategoryAccountTitles = (subcategories, parentCategory) => {
            let subcategoryAccountTitles = [];

            // Recursively accumulate account titles for each subcategory
            subcategories
                .filter(sub => sub.parentCategory === parentCategory)
                .forEach(sub => {
                    // Add current subcategory's account titles
                    if (sub.accountTitles) {
                        subcategoryAccountTitles.push(...sub.accountTitles);
                    }
                    // Recursively add child subcategories' account titles
                    subcategoryAccountTitles.push(...getAllSubcategoryAccountTitles(subcategories, sub.subcategoryName));
                });

            return subcategoryAccountTitles;
        };

        // Get all account titles in the nested subcategories under "Subsidy"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Subsidy");

        return accountTitles
            .filter(accountTitle =>
                accountTitle.accountType === "Subsidy" &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                    amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null
                };
            });
    };
    // ------------------------------------ E Q U I T Y  A C C O U N T  T I T L E S ------------------------------------

    //-------------------------------- S U B C A T E G O R I E S  A C C O U N T  T I T L E S -------------------------------
    const subcategoriesAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
        const subcategoryAccountNames = subcategories
            .flatMap(sub => sub.accountTitles || [])
            .map(account => account);

        return accountTitles
            .filter(accountTitle =>
                (accountTitle.accountType === "Revenue" ||
                    accountTitle.accountType === "Expenses" ||
                    accountTitle.accountType === "Subsidy") &&
                subcategoryAccountNames.includes(accountTitle.accountTitle)
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                // Return structure based on accountType
                if (accountTitle.accountType === "Expenses" || accountTitle.accountType === "Subsidy") {
                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null
                    };
                } else if (accountTitle.accountType === "Revenue") {
                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null
                    };
                }
            });
    };
    //------------------------------- S U B C A T E G O R I E S  A C C O U N T  T I T L E S ------------------------------

    // Recursive function to get ------------------------ N E S T E D  S U B C A T E G O R I E S -------------------------
    const getNestedSubcategories = (subcategories, parentName, accountTitles, currentAccountTitlesPeriod) => {
        return subcategories
            .filter(sub => sub.parentCategory === parentName)
            .map(sub => ({
                name: sub.subcategoryName,
                children: [
                    // Get account titles specific to this subcategory
                    ...subcategoriesAccountTitles(accountTitles, currentAccountTitlesPeriod, [sub]),

                    // Recursively add nested subcategories
                    ...getNestedSubcategories(subcategories, sub.subcategoryName, accountTitles, currentAccountTitlesPeriod),
                ]
            }));
    };
    // -------------------------------------- N E S T E D  S U B C A T E G O R I E S -------------------------------------

    //------------------------ D E L E T E  S U B C A T E G O R I E S  A N D  D E S C E N D A N T S ----------------------
    const deleteSubcategoryAndDescendants = (subcategoryName, subcategories) => {
        // Prevent deletion of the main categories
        if (["Revenue", "Expenses", "Subsidy"].includes(subcategoryName)) {
            console.warn(`Deletion of Main Category "${subcategoryName}" is not allowed.`);
            return { removedSubcategoryNames: [], removedAccountTitles: [] };
        }

        let removedSubcategoryNames = [subcategoryName]; // Start with the main subcategory
        let removedAccountTitles = [];

        const deleteRecursive = (parentCategory) => {
            const index = subcategories.findIndex(sub => sub.subcategoryName === parentCategory);

            if (index > -1) {
                const subcategory = subcategories[index];
                if (subcategory.accountTitles) {
                    removedAccountTitles.push(...subcategory.accountTitles);
                }

                // Collect the name of the subcategory being deleted
                removedSubcategoryNames.push(subcategory.subcategoryName);

                // Remove the subcategory
                subcategories.splice(index, 1);

                // Recursively delete nested subcategories
                subcategories
                    .filter(sub => sub.parentCategory === parentCategory)
                    .forEach(sub => deleteRecursive(sub.subcategoryName));
            }
        };

        deleteRecursive(subcategoryName);

        // Return both removed subcategory names and account titles
        return { removedSubcategoryNames, removedAccountTitles };
    };
    //------------------------ D E L E T E  S U B C A T E G O R I E S  A N D  D E S C E N D A N T S ----------------------

    // --------------------------------------- DATA STRUCTURE FOR income statement ------------------------------------------ 
    const incomeStatementDetailsData = [
        {
            name: "Revenue",
            children: [
                ...getNestedSubcategories(subcategories, "Revenue", accountTitles, fireAccountTitlesPeriod),
                ...revenueAccountTitles(accountTitles, fireAccountTitlesPeriod, subcategories)

            ],
            amount: totalRevenues,
            amount2: totalRevenues2 !== 0 ? totalRevenues2 : null
        },
        {
            name: "Expenses",
            children: [
                ...getNestedSubcategories(subcategories, "Expenses", accountTitles, fireAccountTitlesPeriod),
                ...ExpensesAccountTitles(accountTitles, fireAccountTitlesPeriod, subcategories)
            ],
            amount: totalExpenses,
            amount2: totalExpenses2 !== 0 ? totalExpenses2 : null
        },
        {
            name: "Subsidy",
            children: [
                ...getNestedSubcategories(subcategories, "Subsidy", accountTitles, fireAccountTitlesPeriod),
                ...subsidyAccountTitles(accountTitles, fireAccountTitlesPeriod, subcategories)
            ],
            amount: totalSubsidy,
            amount2: totalSubsidy2 !== 0 ? totalSubsidy2 : null
        }
    ];
    // --------------------------------------- DATA STRUCTURE FOR income statement ------------------------------------------ 

    const groupData = [
        {
            //GROUP 1
            items: [
                { label: "TOTAL Revenue", value: totalRevenues.toLocaleString() }
            ]
        },
        {
            // GROUP 2
            items: [
                { label: "TOTAL Expenses", value: totalExpenses.toLocaleString() },

            ]
        },

        {
            // GROUP 3
            items: [
                { label: "Net Financial Subsidy", value: totalSubsidy.toLocaleString() },

            ]
        },
        {

            items: [
                {
                    label: totalNetSurplusDeficit > 0 ? "TOTAL Surplus for the Period" : "TOTAL Deficit for the Period",
                    value: totalNetSurplusDeficit < 0 ? Math.abs(totalNetSurplusDeficit).toLocaleString() : totalNetSurplusDeficit.toLocaleString()
                },

            ]
        },

    ];

    // Card component for group data
    const Card = ({ title, items }) => (
        <div className="card bg-white shadow-md rounded-lg p-4 m-4 w-[200px] h-[80px] pt-6"> {/* Adjust width and margin */}
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {items.map((item, index) => (
                <p key={index} className="text-gray-700 text-sm font-semibold mb-1">
                    <span className="font-medium">{item.label}: </span>
                    {item.value}
                </p>
            ))}
        </div>
    );

    // Recursive component to render rows --------------------------- R E C U R S I V E  R O W ---------------------------
    const Row = ({ item, depth = 0, handleRightClick }) => {
        const [isOpen, setIsOpen] = useState(false); // State to handle collapse/expand

        // Helper function to format amounts with parentheses for negative or contra amounts
        const formatAmount = (amount) => {
            if (amount < 0) {
                return `(${Math.abs(amount).toLocaleString()})`; // Format negative amounts in parentheses
            }
            return amount.toLocaleString(); // Format positive amounts normally
        };

        // Determine text color based on positive or negative value
        const getTextColor = (amount) => {
            if (amount > 0) {
                return "text-green-500"; // Green for positive values
            } else if (amount < 0) {
                return "text-red-500"; // Red for negative values
            } else {
                return ""; // Default for zero values
            }
        };

        // Check if the row is a parent row for "Revenue", "Expenses", or "Subsidy"
        const isMainCategory = ["Revenue", "Expenses", "Subsidy"].includes(item.name);

        return (
            <>
                <tr className="border-t bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    onContextMenu={(event) => handleRightClick(event, item)}
                >
                    {/* Account name with indentation */}
                    <td
                        className={`px-6 py-4 ${isMainCategory ? "cursor-pointer" : ""}`}
                        onClick={() => {
                            console.log("isOpen Status Before: ", !isOpen);
                            setIsOpen(!isOpen);
                            console.log("isOpen Status After: ", !isOpen);
                        }}
                        style={{ paddingLeft: `${depth * 20}px` }} // Adjust indentation based on depth
                    >
                        {item.children ? (
                            <span className={`font-medium ${isMainCategory ? "text-black" : "text-gray-900"}`}>
                                {isOpen ? "▼" : "▶"} {item.name}
                            </span>
                        ) : (
                            <span className={`font-normal ${isMainCategory ? "text-black" : "text-gray-900"}`}>
                                {item.name}
                            </span>
                        )}
                    </td>

                    {/* Amount in the second column */}
                    <td
                        className={`px-6 py-4 text-right font-semibold ${isMainCategory ? "text-black" : getTextColor(item.amount)
                            }`}
                    >
                        {item.amount ? formatAmount(item.amount) : ""}
                    </td>

                    {/* Render amount2 if it exists */}
                    {item.amount2 !== undefined && (
                        <td
                            className={`px-6 py-4 text-right font-semibold ${isMainCategory ? "text-black" : getTextColor(item.amount2)}`}
                        >
                            {item.amount2 !== null ? formatAmount(item.amount2) : ""}
                        </td>
                    )}

                    {/* Empty column for the "View" or other action */}
                    <td className="px-6 py-4 text-right font-semibold"></td>
                </tr>

                {/* If the row has children and is open, render child rows directly without nested tables */}
                {isOpen && item.children && (
                    <>
                        {item.children.map((childItem, index) => (
                            <Row key={index} item={childItem} depth={depth + 1} handleRightClick={handleRightClick} /> // Increment depth for children
                        ))}
                    </>
                )}
            </>
        );
    };
    //--------------------------------------------- R E C U R S I V E  R O W ---------------------------------------------

    //--------------------------------------------- E X P O R T I N G F U N C T I O N ---------------------------------------------

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Performance');

        // Recursive function to add rows for each parent and their children
        const addParentAndChildrenRows = (parent, worksheet, depth = 0) => {
            const indent = " ".repeat(depth * 3); // 3 spaces per level for hierarchy
            const parentRow = worksheet.addRow([
                `${indent}${parent.name}`,
                parent.amount === 0 || parent.amount === "" ? "" : parent.amount,
                "",
                parent.amount2 === 0 || parent.amount2 === "" ? "" : parent.amount2,
            ]);

            // Style rows based on depth
            parentRow.eachCell((cell, colNumber) => {
                const isNumericColumn = colNumber === 2 || colNumber === 4;

                // Style for parent rows (top-level)
                if (depth === 0) {
                    cell.font = { name: 'Arial Narrow', size: 11, bold: true };
                    if (isNumericColumn) {
                        cell.border = {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                        };
                    }
                }

                // Style for subcategory rows (depth 1)
                if (depth === 1) {
                    cell.font = { name: 'Arial Narrow', size: 11, bold: true };
                }

                // Style for deeper rows (children of subcategories)
                if (depth > 1) {
                    cell.font = { name: 'Arial Narrow', size: 11, bold: false };
                }

                // Numeric formatting for amount columns
                if (isNumericColumn) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    cell.numFmt = '#,##0.00'; // Format numbers with commas and decimals
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
            });

            // Recursively process children
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(child => addParentAndChildrenRows(child, worksheet, depth + 1));
            }
        };

        // Ensure end date is fetched
        if (!stateEndDate) {
            alert("End date is not available. Please ensure data is loaded before exporting.");
            return;
        }

        // Format the end date for the header
        const end = new Date(stateEndDate);
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ];
        const monthName = months[end.getMonth()];
        const day = end.getDate();
        const year = end.getFullYear();

        // Generate the worksheet data
        const worksheetData = [
            ["DETAILED STATEMENT OF FINANCIAL PERFORMANCE"],
            ["REGULAR AGENCY FUND"],
            [`FOR THE PERIOD ENDED ${monthName} ${day}, ${year}`],
            ["", "", "", ""],
            ["ACCOUNT DESCRIPTION", `${incomeStatement.ledgerYear}`, "", `${fireLedgerYear}`],
            ["", "", "", ""],
            ["", "", "", ""],
        ];

        // Append Header Rows
        worksheetData.forEach(row => worksheet.addRow(row));

        // Append Parent and Children Rows
        incomeStatementDetailsData.forEach(parent => addParentAndChildrenRows(parent, worksheet));

        // Footer Rows
        worksheet.addRow(["", "", "", ""]);
        const financialSubsidyRow = worksheet.addRow(["Net Financial Assistance/Subsidy", totalSubsidy, "", totalSubsidy2]);
        worksheet.addRow(["", "", "", ""]);
        const netSurplusRow = worksheet.addRow(["Net Surplus (Deficit) for the Period", totalNetSurplusDeficit, "", totalNetSurplusDeficit2]);

        // Adjust Column Widths
        worksheet.columns = [
            { width: 50 },
            { width: 20 },
            { width: 3.7 },
            { width: 20 },
            { width: 13 },
        ];

        // Merge Header Cells
        worksheet.mergeCells('A1:D1');
        worksheet.mergeCells('A2:D2');
        worksheet.mergeCells('A3:D3');
        worksheet.mergeCells('A5:A7');
        worksheet.mergeCells('B5:B7');
        worksheet.mergeCells('C5:C7');
        worksheet.mergeCells('D5:D7');

        // Header Styles
        const headerStyle = {
            font: { bold: true, size: 14, name: 'Arial Narrow' },
            alignment: { horizontal: 'center', vertical: 'middle' },
        };

        const subHeaderStyle = {
            font: { bold: true, size: 12, name: 'Arial Narrow' },
            alignment: { horizontal: 'center', vertical: 'middle' },
        };

        // Apply styles to header cells
        ['A1', 'A2', 'A3'].forEach(cell => {
            worksheet.getCell(cell).style = headerStyle;
        });

        worksheet.getRow(5).eachCell(cell => {
            cell.style = subHeaderStyle;
        });

        // Underline for header years
        worksheet.getCell('B5').font = { underline: true, ...subHeaderStyle.font };
        worksheet.getCell('D5').font = { underline: true, ...subHeaderStyle.font };

        // Underline for footer rows
        financialSubsidyRow.getCell(2).border = { bottom: { style: 'thin' } };
        financialSubsidyRow.getCell(4).border = { bottom: { style: 'thin' } };
        netSurplusRow.getCell(2).border = { bottom: { style: 'double' } };
        netSurplusRow.getCell(4).border = { bottom: { style: 'double' } };

        // Export the workbook to a file
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Income Statement for ${monthName}.xlsx`
            link.click();
        } catch (error) {
            console.error("Error exporting Excel file:", error);
            alert("Failed to export Excel file. Please try again.");
        }
    };



    //--------------------------------------------- E X P O R T I N G F U N C T I O N --------------------------------------------- 

    return (
        <Fragment>
            {/* Success Alert */}
            {isSuccess && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert
                        isSuccess={isSuccess}
                        message={successMessage}
                        icon="check"
                    />
                </div>
            )}
            {/**Breadcrumbs */}
            <nav className="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex classNameitems-center">
                        <button onClick={() => navigate("/main/incomeStatement/incomeStatementList")} className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <PiBookOpenTextFill className="mr-2"></PiBookOpenTextFill>
                            income statement
                        </button>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{incomeStatement.description}</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
                    {incomeStatement.description}
                </h1>
                <div className="flex space-x-4">
                    <AddButton
                        onClick={() => setFirstSubcategoryModal(true)}
                        label="ADD SUBCATEGORY"
                    />
                    <AddButton
                        onClick={() => {
                            setIsClicked(true);
                            setCurrentModal(1);
                            setShowModal(true);
                        }}
                        label="ADD PERIOD"
                    />
                    {/* Button to export to Excel */}
                    <ExportButton
                        onClick={exportToExcel}
                        label="EXPORT AS SPREADSHEET"
                    />
                </div>
            </div>
            <hr className="border-t border-[#7694D4] my-4" />

            {/* TABLE */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3 text-right">{`Period - ${incomeStatement?.ledgerYear || "N/A"}`}</th>
                            {!currentShowPeriodColumn ? (
                                <th scope="col" className="px-6 py-3"></th>
                            ) : (
                                <th scope="col" className="px-6 py-3 text-right">
                                    {fireLedgerYear ? `Period - ${fireLedgerYear}` : "Period - ××××"}
                                </th>
                            )}
                            <th scope="col" className="px-6 py-3 text-right"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementDetailsData.map((item, index) => (
                            <Row key={index} item={item} depth={1} handleRightClick={handleRightClick} /> // Start with depth 1 for main categories
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Group Data Cards */}
            <div className="flex flex-wrap justify-evenly mt-8">
                {groupData.map((group, index) => (
                    <Card key={index} title={group.title} items={group.items} />
                ))}
            </div>

             {/* `Modal 1` */}
            {showModal && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[400px] h-60 rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select Ledger Period</h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => { setShowModal(false); setSelectedLedger(""); }}>×</button>
                        </div>

                        <hr className="border-t border-[#7694D4] my-3" />

                        <form className="max-w-sm mt-5">
                            <select
                                id="ledgerselect"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                value={selectedLedger}
                                onChange={(e) => setSelectedLedger(e.target.value)}
                            >
                                <option value="">Select Period</option>
                                {incomeStatementLedgerList.map((ledger) => (
                                    <option key={ledger.id} value={ledger.id}>
                                        {ledger.year}
                                    </option>
                                ))}
                            </select>
                        </form>

                        <div className="flex justify-end py-3 px-4">
                            <button
                                className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5 ${!selectedLedger && "opacity-50 cursor-not-allowed"}`}
                                onClick={() => {
                                    setShowPeriodColumn(true);  // Show the period column
                                    setShowModal(false);
                                    setSelectedLedger("");
                                    // if (selectedLedger) {

                                    // }
                                }}
                                disabled={!selectedLedger} // Disable when no ledger is selected
                            >
                                ADD
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Right-click context modal */}
            {showRightClickModal && (
                <div
                    id="user-modal-overlay"
                    className="fixed inset-0 flex justify-center items-center"
                    onClick={closeModalOnOutsideClick}
                >
                    <div
                        style={{ top: modalPosition.y, left: modalPosition.x }}
                        className="absolute z-10 bg-white shadow-lg rounded-lg p-2"
                    >
                        <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                                handleDeleteRow(selectedSubcategory); // Call delete function with selected subcategory
                                setShowRightClickModal(false); // Close the modal
                            }}
                        >
                            Delete Row
                        </button>
                    </div>
                </div>
            )}

            {/* 1st Modal For Add Subcategory */}
            {firstSubcategoryModal && (
                <Modal isVisible={firstSubcategoryModal}>
                    <div className="bg-white w-[600px] h-auto rounded py-2 px-4 overflow-y-auto ">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Create Subcategory</h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]"
                                onClick={() => {
                                    setSubcategory('');        // Reset subcategory input
                                    setCurrentSelection('');    // Reset select dropdown
                                    setSubcategoryType('');
                                    setFirstSubcategoryModal(false); // Close modal
                                }}>
                                ×
                            </button>
                        </div>

                        <hr className="border-t border-[#7694D4] my-3" />

                        <div className="flex p-2.5">
                            <div className="relative">
                                <input
                                    type="text"
                                    id="name"
                                    className="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300"
                                    placeholder=" "
                                    value={subcategory}
                                    onChange={(e) => setSubcategory(e.target.value)}
                                />
                                <label
                                    htmlFor="name"
                                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2"
                                >
                                    Subcategory Name
                                </label>
                            </div>
                        </div>

                        <div className="flex p-2.5 overflow-y-auto ">
                            <div className="relative w-80">
                                <select
                                    id="categoryselect"
                                    className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={currentSelection}
                                    onChange={(e) => setCurrentSelection(e.target.value)}
                                >
                                    <option value=""></option>
                                    {selectParentCategory.map((parentCategory, index) => (
                                        <option key={index} value={parentCategory}>
                                            {parentCategory}
                                        </option>
                                    ))}
                                </select>
                                <label
                                    htmlFor="categoryselect"
                                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2"
                                >
                                    Select Parent Category
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end py-3 px-4 flex-row">
                            <button
                                className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-4 ml-5 
                                        ${subcategory.length === 0 || currentSelection === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={subcategory.length === 0 || currentSelection === ''}
                                onClick={() => {
                                    const subcategoryType = determineSubcategoryType(currentSelection);
                                    setSubcategoryType(subcategoryType);
                                    console.log("subcategoryType of subcategory: ", subcategoryType);
                                    setFirstSubcategoryModal(false);
                                    setSecondSubcategoryModal(true);
                                }}
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 2nd Modal For Add Subcategory */}
            {secondSubcategoryModal && (
                <Modal isVisible={secondSubcategoryModal}>
                    <div className="bg-white w-[600px] h-[295px] rounded-lg py-2 px-4 shadow-xl">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="font-poppins font-bold text-xl text-gray-700">Add Accounts to {subcategory}</h1>
                            <button
                                type="button"
                                className="text-2xl font-semibold text-gray-500 focus:outline-none"
                                onClick={() => {
                                    setSecondSubcategoryModal(false);
                                    setSubcategory('');
                                    setCurrentSelection('');
                                    setSubcategoryType('');
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <hr className="border-t border-[#7694D4] my-3" />

                        {/* Content */}
                        <div className="p-6 text-center">
                            <QuestionMarkCircleIcon className="mx-auto mb-4 text-gray-400 w-16 h-16" />
                            <h3 className="mb-6 text-lg font-medium text-gray-600">
                                Would you like to add accounts to this subcategory?
                            </h3>

                            {/* Buttons */}
                            <div className="flex justify-center space-x-10">
                                <button
                                    type="button"
                                    className="bg-[#2196F3] hover:bg-[#1976D2] transition-colors rounded-lg text-sm text-white font-poppins font-medium py-2.5 px-6 shadow-md hover:shadow-lg focus:outline-none"
                                    onClick={() => {
                                        setThirdSubcategoryModal(true)
                                        setSecondSubcategoryModal(false)
                                    }}
                                >
                                    YES
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-100 rounded-lg text-sm text-gray-700 font-poppins font-medium py-2.5 px-6 border border-gray-300 hover:border-red-500 hover:text-white hover:bg-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-200 shadow-md"
                                    onClick={() => {
                                        setSecondSubcategoryModal(false)
                                        setSelectParentCategory(prevSelected => [...prevSelected, ...[subcategory]]); // Append new selections
                                        console.log("No button clicked with:", selectParentCategory);
                                        setSubcategory('');
                                        setCurrentSelection('');
                                        setSubcategoryType('');
                                        addSubcategory(subcategory, currentSelection, subcategoryType, []);
                                    }}
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 3rd Modal For Add Subcategory */}
            {thirdSubcategoryModal && (
                <Modal isVisible={thirdSubcategoryModal}>
                    <div className="bg-white w-[600px] h-[295px] rounded-lg py-2 px-4 shadow-xl flex flex-col justify-between">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="font-poppins font-bold text-xl text-gray-700">Select Accounts to Add</h1>
                            <button
                                className="text-2xl font-semibold text-gray-500 focus:outline-none"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setCheckedAccounts(new Set());
                                    setThirdSubcategoryModal(false);
                                    setSubcategory('');
                                    setCurrentSelection('');
                                    setSubcategoryType('');
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <hr className="border-t border-[#7694D4] -my-1" />

                        {/* Content */}
                        <div className="p-8 pt-16 text-center flex justify-center">
                            <div className="relative">
                                <button
                                    id="dropdownSearchButton"
                                    onClick={toggleDropdown}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                    type="button"
                                >
                                    Available Accounts
                                    <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l4 4 4-4" />
                                    </svg>
                                </button>

                                {/* Dropdown menu */}
                                <div
                                    id="dropdownSearch"
                                    className={`z-10 ${isDropdownOpen ? '' : 'hidden'} absolute top-full -left-8 mt-2 bg-white rounded-lg shadow w-60 dark:bg-gray-700`}
                                >
                                    <div className="p-3">
                                        <label htmlFor="input-group-search" className="sr-only">Search</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                                <IoIosSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id="input-group-search"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                placeholder="Search Account"
                                            />
                                        </div>
                                    </div>
                                    <ul
                                        className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
                                        aria-labelledby="dropdownSearchButton"
                                    >
                                        {getFilteredAccounts(subcategoryType).length === 0 ? (
                                            <li className="absolute inset-x-0 bottom-24 text-center text-gray-500 dark:text-gray-400">
                                                No Available Accounts
                                            </li>
                                        ) : (
                                            getFilteredAccounts(subcategoryType).map((account) => (
                                                <li key={account.id}>
                                                    <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                        <input
                                                            id={`checkbox-item-${account.accountTitle}`}
                                                            type="checkbox"
                                                            value={account.accountTitle}
                                                            checked={checkedAccounts.has(account.accountTitle)}
                                                            onChange={() => handleCheckboxChange(account.accountTitle)}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                                        />
                                                        <label
                                                            htmlFor={`checkbox-item-${account.id}`}
                                                            className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                                        >
                                                            {account.accountTitle}
                                                        </label>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer with Confirm and Cancel Button */}
                        <div className="flex justify-end mt-4 p-4">
                            {getFilteredAccounts(subcategoryType).length === 0 ? (
                                <button
                                    type="button"
                                    className="text-white bg-[#2196F3] font-poppins text-xs rounded font-medium py-2 px-4"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setThirdSubcategoryModal(false);
                                        // setSelectParentCategory(prevSelected => [...prevSelected, ...[subcategory]]);
                                        setSubcategory('');
                                        setCurrentSelection('');;
                                        setSubcategoryType('');

                                    }}
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={`text-white bg-[#2196F3] font-poppins text-xs rounded font-medium py-2 px-4 ${checkedAccounts.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={checkedAccounts.size === 0}
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setThirdSubcategoryModal(false);
                                        setSelectParentCategory(prevSelected => [...prevSelected, subcategory]);
                                        addSubcategory(subcategory, currentSelection, subcategoryType, checkedAccounts);
                                        handleConfirm(); // Clear checked accounts after adding
                                        setSubcategory('');
                                        setCurrentSelection('');
                                        setSubcategoryType('');
                                    }}
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </Fragment>
    );

}
