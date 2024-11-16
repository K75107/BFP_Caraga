import React, { Fragment, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal";
import { useLocation } from "react-router-dom";
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { PiBookOpenText, PiBookOpenTextFill } from "react-icons/pi";
import { UseLedgerData } from './balanceSheetContext';
import { BalanceSheetPeriodProvider } from './balanceSheetContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/outline';
import { IoIosSearch } from "react-icons/io";


export default function BalanceSheet() {
    const navigate = useNavigate();
    const { balanceSheetID } = useParams(); // Get the ID from the URL
    const [balanceSheet, setBalanceSheet] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]); // Store account titles
    const [accounts, setAccounts] = useState([]); // Separate state for accounts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentModal, setCurrentModal] = useState(1); // Modal state
    const [showModal, setShowModal] = useState(false);

    const [selectedLedger, setSelectedLedger] = useState("");
    const [balanceSheetLedgerList, setBalanceSheetLedgerList] = useState([]);

    const location = useLocation();
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [stateStartDate, setStateStartDate] = useState(null);
    const [stateEndDate, setStateEndDate] = useState(null);

    const [totalAssets, setTotalAssets] = useState(0);
    const [totalLiabilities, setTotalLiabilities] = useState(0);
    const [totalNetAssets, setTotalNetAssets] = useState(0);
    const [totalEquity, setTotalEquity] = useState(0);

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

    // Access data specific to this balance sheet ID
    const currentAccountTitlesPeriod = accountTitlesPeriod[balanceSheetID] || [];
    const currentAccountsPeriod = accountsPeriod[balanceSheetID] || [];
    const currentSelectedLedgerYear = selectedLedgerYear[balanceSheetID] || null;
    const currentShowPeriodColumn = showPeriodColumn[balanceSheetID] || false;

    // Functions to update data for this balance sheet ID
    const setAccountTitlesPeriod = (data) => updateAccountTitlesPeriod(balanceSheetID, data);
    const setAccountsPeriod = (data) => updateAccountsPeriod(balanceSheetID, data);
    const setSelectedLedgerYear = (year) => updateSelectedLedgerYear(balanceSheetID, year);
    const setShowPeriodColumn = (value) => updateShowPeriodColumn(balanceSheetID, value);

    // Now use `currentAccountTitles`, `currentAccounts`, `currentLedgerYear`, etc. for rendering data
    // Use `setCurrentAccountTitles`, `setCurrentAccounts`, etc. for updating data

    const [isClicked, setIsClicked] = useState(false);
    const [firstSubcategoryModal, setFirstSubcategoryModal] = useState(false);
    const [secondSubcategoryModal, setSecondSubcategoryModal] = useState(false);
    const [thirdSubcategoryModal, setThirdSubcategoryModal] = useState(false);
    const [selectParentCategory, setSelectParentCategory] = useState(["Assets", "Liabilities", "Equity"]);
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
                if (subcategoryType === "Assets") {
                    return ["Assets", "Contra Assets"].includes(account.accountType);
                } else if (subcategoryType === "Liabilities") {
                    return account.accountType === "Liabilities";
                } else if (subcategoryType === "Equity") {
                    return account.accountType === "Equity";
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

    // ---------Fetching ledger list from the Firestore-----------------
    useEffect(() => {
        const getLedgerList = async () => {
            try {
                const data = await getDocs(collection(db, "ledger"));
                const filteredData = data.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setBalanceSheetLedgerList(filteredData);
            } catch (err) {
                console.error("Error fetching ledger data:", err);
            }
        };

        getLedgerList();
    }, []); // No dependencies for getLedgerList, so it only runs once on mount
    // -----------------------------------------------------------------

    // Function to update totalEquity in the balanceSheet collection
    const updateTotalEquityInFirestore = async (balanceSheetID, totalEquity) => {
        try {
            const balanceSheetRef = doc(db, "balancesheet", balanceSheetID);
            await updateDoc(balanceSheetRef, {
                totalNetAssets: totalEquity // Push the totalEquity value to Firestore
            });
            console.log("Total net assets successfully updated in Firestore.");
        } catch (err) {
            console.error("Error updating total equity:", err);
        }
    };

    // Fetch the balance sheet description and its associated ledger year
    useEffect(() => {
        const getBalanceSheetDescription = async () => {
            try {
                const docRef = doc(db, "balancesheet", balanceSheetID); // Reference to the balance sheet document
                const docSnap = await getDoc(docRef); // Get the document snapshot

                if (docSnap.exists()) {
                    const balanceSheetData = { id: docSnap.id, ...docSnap.data() };

                    const convertToLocalDate = (timestamp) => {
                        const date = new Date(timestamp.seconds * 1000);
                        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                        return localDate.toISOString().split("T")[0];
                    };

                    const startDate = convertToLocalDate(balanceSheetData.start_date);
                    const endDate = convertToLocalDate(balanceSheetData.end_date);

                    setStateStartDate(startDate);
                    setStateEndDate(endDate);

                    if (balanceSheetData.ledgerID) {
                        const ledgerRef = doc(db, "ledger", balanceSheetData.ledgerID);
                        const ledgerSnap = await getDoc(ledgerRef);

                        if (ledgerSnap.exists()) {
                            balanceSheetData.ledgerYear = ledgerSnap.data().year;

                            const accountTitlesRef = collection(db, "ledger", balanceSheetData.ledgerID, "accounttitles");
                            const accountTitlesSnap = await getDocs(accountTitlesRef);

                            const accountTitlesData = [];
                            const accountsData = [];

                            for (const titleDoc of accountTitlesSnap.docs) {
                                const titleData = { id: titleDoc.id, ...titleDoc.data() };

                                const accountsRef = collection(db, "ledger", balanceSheetData.ledgerID, "accounttitles", titleDoc.id, "accounts");
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
                                    titleData.differenceContra = totalCredit - totalDebit;

                                    accountTitlesData.push(titleData);
                                    accountsData.push(...titleAccounts);
                                }
                            }

                            setAccountTitles(accountTitlesData);
                            setAccounts(accountsData);

                            // Calculate totals
                            const assets = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Assets" || accountTitle.accountType === "Contra Assets")
                                .reduce((total, accountTitle) => {
                                    const amount = accountTitle.accountType === "Contra Assets"
                                        ? +accountTitle.differenceContra
                                        : accountTitle.difference;
                                    return total + amount;
                                }, 0);

                            const liabilities = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Liabilities")
                                .reduce((total, accountTitle) => total + accountTitle.differenceContra, 0);

                            const equity = accountTitlesData
                                .filter(accountTitle => accountTitle.accountType === "Equity")
                                .reduce((total, accountTitle) => total + accountTitle.differenceContra, 0);

                            const netAssets = assets - liabilities;
                            const finalEquity = netAssets + equity;

                            // Update states with calculated values
                            setTotalAssets(assets);
                            setTotalLiabilities(liabilities);
                            setTotalNetAssets(netAssets);
                            setTotalEquity(finalEquity);

                            // Update Firestore with totalEquity
                            updateTotalEquityInFirestore(balanceSheetID, finalEquity);
                        } else {
                            balanceSheetData.ledgerYear = "N/A";
                        }
                    }

                    setBalanceSheet(balanceSheetData);
                } else {
                    setError("No balance sheet found.");
                }
            } catch (err) {
                console.error("Error fetching balance sheet data:", err);
                setError("Error fetching balance sheet data.");
            } finally {
                setLoading(false);
            }
        };

        getBalanceSheetDescription();
    }, []);

    // --------------------------------------- CALCULATION FOR ADDING PERIOD ---------------------------------------
    useEffect(() => {
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
                                titleData.differenceContra2 = totalCredit2 - totalDebit2;

                                accountTitlesData.push(titleData);
                                accountsData.push(...titleAccounts);
                            }
                        }

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

        getSelectedLedgerData();
    }, [selectedLedger]);
    // --------------------------------------- CALCULATION FOR ADDING PERIOD ---------------------------------------

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

    //--------------------------------------- T O T A L S  F O R  P E R I O D --------------------------------------- 
    // Calculate total amount for Assets
    const totalAssets2 = currentAccountTitlesPeriod
        .filter(accountTitle =>
            accountTitle.accountType === "Assets" ||
            accountTitle.accountType === "Contra Assets"
        )
        .reduce((total, accountTitle) => {
            const amount = accountTitle.accountType === "Contra Assets"
                ? +accountTitle.differenceContra2 // Subtract differenceContra for Contra Assets
                : accountTitle.difference2;        // Use difference for regular Assets
            return total + amount; // Sum the amounts
        }, 0);

    // Calculate total amount for Liabilities
    const totalLiabilities2 = currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Liabilities")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.differenceContra2;
            return total + amount;
        }, 0);

    // Calculate base equity as Assets - Liabilities
    let totalNetAssets2 = totalAssets2 - totalLiabilities2;
    let totalEquity2 = totalNetAssets2;

    // Add any Equity accounts to the calculated equity
    totalEquity2 += currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Equity")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.differenceContra2; // Use differenceContra for Equity accounts if applicable
            return total + amount; // Sum equity amounts
        }, 0);

    //--------------------------------------- T O T A L S  F O R  P E R I O D ---------------------------------------

    // ------------------------------------- A S S E T S  A C C O U N T  T I T L E S -------------------------------------
    const assetsAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
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

        // Get all account titles in the nested subcategories under "Assets"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Assets");

        return accountTitles
            .filter(accountTitle =>
                (accountTitle.accountType === "Assets" || accountTitle.accountType === "Contra Assets") &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => {
                if (a.accountType === "Assets" && b.accountType === "Contra Assets") {
                    return -1;
                } else if (a.accountType === "Contra Assets" && b.accountType === "Assets") {
                    return 1;
                } else {
                    return a.accountTitle.localeCompare(b.accountTitle);
                }
            })
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.accountType === "Contra Assets"
                        ? accountTitle.differenceContra
                        : accountTitle.difference,
                    amount2: matchingPeriodAccount ? (
                        accountTitle.accountType === "Contra Assets"
                            ? matchingPeriodAccount.differenceContra2
                            : matchingPeriodAccount.difference2
                    ) : null
                };
            });
    };
    // ------------------------------------- A S S E T S  A C C O U N T  T I T L E S -------------------------------------

    // -------------------------------- L I A B I L I T I E S  A C C O U N T  T I T L E S --------------------------------
    const liabilitiesAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
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

        // Get all account titles in the nested subcategories under "Liabilities"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Liabilities");

        return accountTitles
            .filter(accountTitle =>
                accountTitle.accountType === "Liabilities" &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.differenceContra,
                    amount2: matchingPeriodAccount ? matchingPeriodAccount.differenceContra2 : null
                };
            });
    };
    // -------------------------------- L I A B I L I T I E S  A C C O U N T  T I T L E S --------------------------------

    // ------------------------------------- E Q U I T Y  A C C O U N T  T I T L E S -------------------------------------
    const equityAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
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

        // Get all account titles in the nested subcategories under "Equity"
        const subcategoryAccountNames = getAllSubcategoryAccountTitles(subcategories, "Equity");

        return accountTitles
            .filter(accountTitle =>
                accountTitle.accountType === "Equity" &&
                !subcategoryAccountNames.includes(accountTitle.accountTitle) // Exclude if in subcategories
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                return {
                    name: accountTitle.accountTitle,
                    amount: accountTitle.differenceContra,
                    amount2: matchingPeriodAccount ? matchingPeriodAccount.differenceContra2 : null
                };
            });
    };
    // ------------------------------------- E Q U I T Y  A C C O U N T  T I T L E S -------------------------------------

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
    // --------------------------------------- N E S T E D  S U B C A T E G O R I E S --------------------------------------

    //-------------------------------- S U B C A T E G O R I E S  A C C O U N T  T I T L E S -------------------------------
    const subcategoriesAccountTitles = (accountTitles, currentAccountTitlesPeriod, subcategories) => {
        const subcategoryAccountNames = subcategories
            .flatMap(sub => sub.accountTitles || [])
            .map(account => account);

        return accountTitles
            .filter(accountTitle =>
                (accountTitle.accountType === "Assets" ||
                    accountTitle.accountType === "Contra Assets" ||
                    accountTitle.accountType === "Liabilities" ||
                    accountTitle.accountType === "Equity") &&
                subcategoryAccountNames.includes(accountTitle.accountTitle)
            )
            .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle))
            .map(accountTitle => {
                const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                    periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                );

                // Return structure based on accountType
                if (accountTitle.accountType === "Liabilities" || accountTitle.accountType === "Equity") {
                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.differenceContra,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.differenceContra2 : null
                    };
                } else if (accountTitle.accountType === "Assets" || accountTitle.accountType === "Contra Assets") {
                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.accountType === "Contra Assets"
                            ? accountTitle.differenceContra
                            : accountTitle.difference,
                        amount2: matchingPeriodAccount ? (
                            accountTitle.accountType === "Contra Assets"
                                ? matchingPeriodAccount.differenceContra2
                                : matchingPeriodAccount.difference2
                        ) : null
                    };
                }
            });
    };
    //-------------------------------- S U B C A T E G O R I E S  A C C O U N T  T I T L E S -------------------------------

    //------------------------ D E L E T E  S U B C A T E G O R I E S  A N D  D E S C E N D A N T S ----------------------
    const deleteSubcategoryAndDescendants = (subcategoryName, subcategories) => {
        // Prevent deletion of the main categories
        if (["Assets", "Liabilities", "Equity"].includes(subcategoryName)) {
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

    // --------------------------------------- DATA STRUCTURE FOR BALANCE SHEET ------------------------------------------ 
    const balanceSheetDetailsData = [
        {
            name: "Assets",
            children: [
                ...getNestedSubcategories(subcategories, "Assets", accountTitles, currentAccountTitlesPeriod),
                ...assetsAccountTitles(accountTitles, currentAccountTitlesPeriod, subcategories)

            ],
            amount: totalAssets,
            amount2: totalAssets2 !== 0 ? totalAssets2 : null
        },
        {
            name: "Liabilities",
            children: [
                ...getNestedSubcategories(subcategories, "Liabilities", accountTitles, currentAccountTitlesPeriod),
                ...liabilitiesAccountTitles(accountTitles, currentAccountTitlesPeriod, subcategories)
            ],
            amount: totalLiabilities,
            amount2: totalLiabilities2 !== 0 ? totalLiabilities2 : null
        },
        {
            name: "Equity",
            children: [
                ...getNestedSubcategories(subcategories, "Equity", accountTitles, currentAccountTitlesPeriod),
                ...equityAccountTitles(accountTitles, currentAccountTitlesPeriod, subcategories)
            ],
            amount: totalEquity,
            amount2: totalEquity2 !== 0 ? totalEquity2 : null
        }
    ];
    // --------------------------------------- DATA STRUCTURE FOR BALANCE SHEET ------------------------------------------ 

    // Group data for the cards
    const groupData = [
        {
            //GROUP 2
            items: [
                { label: "Total Assets", value: totalAssets.toLocaleString() }
            ]
        },
        {
            // GROUP 2
            items: [
                { label: "Total Liabilities", value: totalLiabilities.toLocaleString() }
            ]
        },
        {
            // GROUP 3
            items: [
                { label: "Total Assets Less Total Liabilities", value: totalNetAssets.toLocaleString() }
            ]
        },
        {
            // GROUP 3
            items: [
                { label: "Total Net Assets/Equity", value: totalEquity.toLocaleString() }
            ]
        }
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

    // Recursive component to render rows
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

        // Check if the row is a parent row for "Assets", "Liabilities", or "Equity"
        const isMainCategory = ["Assets", "Liabilities", "Equity"].includes(item.name);

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
                        <button onClick={() => navigate("/main/balanceSheet/balanceSheetList")} className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <PiBookOpenTextFill className="mr-2"></PiBookOpenTextFill>
                            Balance Sheet
                        </button>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{balanceSheet.description}</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/**Breadcrumbs */}

            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
                    {balanceSheet.description}
                </h1>
                <div className="flex space-x-4">
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium"
                        onClick={() => setFirstSubcategoryModal(true)}
                    >
                        ADD SUBCATEGORY
                    </button>
                    <button
                        className={`rounded-lg py-2 px-8 text-[12px] font-poppins font-medium ${isClicked
                            ? 'bg-[#2196F3] text-white' //'border border-gray-400 bg-gradient-to-r from-red-700 to-orange-400 text-white font-semibold'
                            : 'bg-[#2196F3] text-white' //'border border-gray-400 bg-white text-black hover:bg-color-lighter-gray'
                            }`}
                        onClick={() => {
                            setIsClicked(true);
                            setCurrentModal(1);
                            setShowModal(true);
                        }}
                    >
                        ADD PERIOD
                    </button>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium">
                        EXPORT TO EXCEL
                    </button>
                </div>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/* TABLE */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3 text-right">{`Period - ${balanceSheet?.ledgerYear || "N/A"}`}</th>
                            {currentShowPeriodColumn && (
                                <th scope="col" className="px-6 py-3 text-right">
                                    {currentSelectedLedgerYear ? `Period - ${currentSelectedLedgerYear}` : "Period - ××××"}
                                </th>
                            )}
                            <th scope="col" className="px-6 py-3 text-right"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {balanceSheetDetailsData.map((item, index) => (
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

            {/* Modal 1 */}
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
                                {balanceSheetLedgerList.map((ledger) => (
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
                                    if (selectedLedger) {
                                        setShowPeriodColumn(true);  // Show the period column
                                        setShowModal(false);
                                        setSelectedLedger("");
                                    }
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
