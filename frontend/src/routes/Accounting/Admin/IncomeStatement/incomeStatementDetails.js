import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal"; // Import the Modal component
import { RiFileAddLine, RiFileAddFill } from "react-icons/ri";
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { UseLedgerData } from './incomeStatementContext';
import { IncomeStatementPeriodProvider } from './incomeStatementContext';


export default function IncomeStatement() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams();
    const [incomeStatement, setIncomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [incomeStatementData, setIncomeStatementData] = useState([]
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState("");
    const [selectedincomeStatement, setSelectedIncomeStatement] = useState("");
    const [selectedincomeStatementList, setSelectedIncomeStatementList] = useState([]);
    const [incomeStatementLedgerList, setIncomeStatementLedgerList] = useState([]);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const location = useLocation();
    const [stateStartDate, setStateStartDate] = useState(null);
    const [stateEndDate, setStateEndDate] = useState(null);
    const [currentModal, setCurrentModal] = useState(1); // Modal state
    


    const [isClicked, setIsClicked] = useState(false);
    const {
        accountTitlesPeriod, updateAccountTitlesPeriod,
        accountsPeriod, updateAccountsPeriod,
        selectedLedgerYear, updateSelectedLedgerYear,
        showPeriodColumn, updateShowPeriodColumn
    } = UseLedgerData();


    // Access data specific to this 
    const currentAccountTitlesPeriod = accountTitlesPeriod[incomeStatementID] || [];
    const currentAccountsPeriod = accountsPeriod[incomeStatementID] || [];
    const currentSelectedLedgerYear = selectedLedgerYear[incomeStatementID] || null;
    const currentShowPeriodColumn = showPeriodColumn[incomeStatementID] || false;

    const setAccountTitlesPeriod = (data) => updateAccountTitlesPeriod(incomeStatementID, data);
    const setAccountsPeriod = (data) => updateAccountsPeriod(incomeStatementID, data);
    const setSelectedLedgerYear = (year) => updateSelectedLedgerYear(incomeStatementID, year);
    const setShowPeriodColumn = (value) => updateShowPeriodColumn(incomeStatementID, value);


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
    
    //----------------------------------------------------------------------------------------------------------------------------------------

    const getLedgerList = async () => {
        try {
            const data = await getDocs(collection(db, "ledger"));
            const filteredData = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setIncomeStatementLedgerList(filteredData);
        } catch (err) {
            console.error("Error fetching ledger data:", err);
        }
    };
    //---------------------------------------------------------------------------------------------------------------------------------------

    const getIncomeStatementDescription = async () => {
        try {
            const docRef = doc(db, "incomestatement", incomeStatementID); // Reference to the balance sheet document
            const docSnap = await getDoc(docRef); // Get the document snapshot

            if (docSnap.exists()) {
                const incomeStatementData = { id: docSnap.id, ...docSnap.data() };

                // Convert Firestore timestamps to "yyyy-mm-dd" format, adjusted for local timezone
                const convertToLocalDate = (timestamp) => {
                    const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JavaScript Date
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000); // Adjust to local timezone
                    return localDate.toISOString().split("T")[0]; // Convert to "yyyy-mm-dd" format
                };

                const startDate = convertToLocalDate(incomeStatementData.start_date);
                const endDate = convertToLocalDate(incomeStatementData.end_date);

                // Set dates in the component's state
                setStateStartDate(startDate);
                setStateEndDate(endDate);


                // Check if ledgerID exists in the balance sheet
                if (incomeStatementData.ledgerID) {
                    // Fetch the associated ledger document
                    const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);

                    if (ledgerSnap.exists()) {
                        incomeStatementData.ledgerYear = ledgerSnap.data().year; // Attach year from ledger

                        // Fetch account titles from the ledger
                        const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                        const accountTitlesSnap = await getDocs(accountTitlesRef);

                        const accountTitlesData = [];
                        const accountsData = [];

                        for (const titleDoc of accountTitlesSnap.docs) {
                            const titleData = { id: titleDoc.id, ...titleDoc.data() };

                            // Fetch accounts subcollection for each account title
                            const accountsRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles", titleDoc.id, "accounts");
                            let accountsQuery = query(
                                accountsRef,
                                where("date", ">=", startDate),   // Filter by start_date
                                where("date", "<=", endDate)      // Filter by end_date
                            );
                            const accountsSnap = await getDocs(accountsQuery);

                            // Only proceed if there are accounts within the date range
                            if (!accountsSnap.empty) {
                                // Initialize sums for debit and credit
                                let totalDebit = 0;
                                let totalCredit = 0;

                                const titleAccounts = accountsSnap.docs.map(accountDoc => {
                                    const accountData = {
                                        id: accountDoc.id,
                                        accountTitleID: titleDoc.id, // Link to the account title ID
                                        ...accountDoc.data(),
                                    };

                                    totalDebit += parseFloat(accountData.debit) || 0;  // Parse to number, default to 0 if invalid or missing
                                    totalCredit += parseFloat(accountData.credit) || 0; // Parse to number, default to 0 if invalid or missing

                                    return accountData;
                                });

                                // After processing all account documents, you can attach the difference (debit - credit) to the account title
                                titleData.difference = totalDebit - totalCredit;  // Attach the debit - credit difference to the account title
                                titleData.differenceContra = totalCredit - totalDebit;

                                // Continue to add this account title to the list
                                accountTitlesData.push(titleData);  // Add account title to state

                                // Add accounts to a separate state for accounts
                                accountsData.push(...titleAccounts);
                            }
                        }

                        setAccountTitles(accountTitlesData); // Set account titles
                        setAccounts(accountsData); // Set accounts separately

                    } else {
                        incomeStatementData.ledgerYear = "N/A"; // Handle missing ledger case
                    }
                }

                setIncomeStatement(incomeStatementData); // Set balance sheet data with ledger year
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

     // --------------------------------------- CALCULATION FOR ADDING PERIOD ---------------------------------------
     const getSelectedLedgerData = async () => {
        try {
            if (selectedLedger) {
                // Fetch the associated ledger document using the selectedLedgerID
                const ledgerRef = doc(db, "ledger", selectedLedger);
                const ledgerSnap = await getDoc(ledgerRef);

                if (ledgerSnap.exists()) {
                    const ledgerYear = ledgerSnap.data().year; // Get the ledger year

                    // Fetch account titles from the selected ledger
                    const accountTitlesRef = collection(db, "ledger", selectedLedger, "accounttitles");
                    const accountTitlesSnap = await getDocs(accountTitlesRef);

                    const accountTitlesData = [];
                    const accountsData = [];

                    for (const titleDoc of accountTitlesSnap.docs) {
                        const titleData = { id: titleDoc.id, ...titleDoc.data() };

                        // Fetch accounts subcollection for each account title
                        const accountsRef = collection(db, "ledger", selectedLedger, "accounttitles", titleDoc.id, "accounts");
                        const accountsQuery = query(
                            accountsRef,
                            where("date", ">=", stateStartDate),   // Filter by start_date
                            where("date", "<=", stateEndDate)      // Filter by end_date
                        );
                        const accountsSnap = await getDocs(accountsQuery);

                        // Only proceed if there are accounts within the date range
                        if (!accountsSnap.empty) {
                            // Initialize sums for debit and credit
                            let totalDebit2 = 0;
                            let totalCredit2 = 0;

                            const titleAccounts = accountsSnap.docs.map(accountDoc => {
                                const accountData = {
                                    id: accountDoc.id,
                                    accountTitleID: titleDoc.id, // Link to the account title ID
                                    ...accountDoc.data(),
                                };

                                totalDebit2 += parseFloat(accountData.debit) || 0;  // Parse to number, default to 0 if invalid or missing
                                totalCredit2 += parseFloat(accountData.credit) || 0; // Parse to number, default to 0 if invalid or missing
                                return accountData;
                            });

                            // Attach the difference (debit - credit) to the account title
                            titleData.difference2 = totalDebit2 - totalCredit2;  // Attach the debit - credit difference to the account title

                            // Add account title and accounts data to their respective arrays
                            accountTitlesData.push(titleData);  // Add account title to the list
                            accountsData.push(...titleAccounts);  // Add account data to the list
                        }
                    }

                    // Update the state with the fetched data
                    setAccountTitlesPeriod(accountTitlesData); // Set account titles
                    setAccountsPeriod(accountsData); // Set accounts separately

                    // Optionally, if you want to show the year
                    setSelectedLedgerYear(ledgerYear);
                } else {
                    console.error("Selected ledger not found.");
                }
            }
        } catch (error) {
            console.error("Error fetching selected ledger data:", error);
        }
    };
    // --------------------------------------- CALCULATION FOR ADDING PERIOD ---------------------------------------

    useEffect(() => {   
        getLedgerList();
        getIncomeStatementDescription();
        getSelectedLedgerData();
    }, [incomeStatementID]);

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
    // Calculate total Revenue
    const totalRevenues = accountTitles
        .filter(accountTitle =>
            accountTitle.accountType === "Revenue")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference;
            return total + amount; // Sum the amounts
        }, 0);

    // Calculate total Expenses
    const totalExpenses = accountTitles
        .filter(accountTitle => accountTitle.accountType === "Expenses")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference;
            return total + amount;
        }, 0);

    const totalSubsidy = accountTitles
        .filter(accountTitle => accountTitle.accountType === "Subsidy")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference;
            return total + amount;
        }, 0);

    let totalNetSurplusDeficit = totalRevenues - totalExpenses;

    const updateTotalSurplusDeficitInFirestore = async (incomeStatementID, totalNetSurplusDeficit) => {
        try {
            const incomeStatementRef = doc(db, "incomestatement", incomeStatementID);
            await updateDoc(incomeStatementRef, {
                totalSurplusDeficit: totalNetSurplusDeficit // Push the totalSubsidy value to Firestore
            });
            console.log("Total net Revenues successfully updated in Firestore.");
        } catch (err) {
            console.error("Error updating total Subsidy:", err);
        }
    };
    updateTotalSurplusDeficitInFirestore(incomeStatementID, totalNetSurplusDeficit);



    //--------------------------------------- T O T A L S  F O R  P E R I O D --------------------------------------- 

    const totalRevenues2 = currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Revenue")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);

    // Calculate total amount for Expenses
    const totalExpenses2 = currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Expenses")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);

    // Calculate base equity as Revenues - Expenses
    let totalNetRevenues2 = totalRevenues2 - totalExpenses2;
    let totalNetSurplusDeficit2 = totalRevenues2 - totalExpenses2;

    const totalSubsidy2 = currentAccountTitlesPeriod
        .filter(accountTitle => accountTitle.accountType === "Subsidy")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.difference2;
            return total + amount;
        }, 0);

    //--------------------------------------- T O T A L S  F O R  P E R I O D ---------------------------------------
    const incomeStatementDetailsData = [
        {
            name: "Revenue",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Revenue"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map(accountTitle => {
                    // Match by accountTitle with accountTitlesPeriod
                    const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                        periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                    );

                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null // Display amount2 if it exists and if not the set to null
                    };
                }),
            amount: totalRevenues,
            amount2: totalRevenues2 !== 0 ? totalRevenues2 : null  // Display amount2 if it exists and if not the set to null // Add the calculated total amount for Revenue
        },
        {
            name: "Expenses",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Expenses"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map(accountTitle => {
                    // Match by accountTitle with accountTitlesPeriod
                    const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                        periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                    );

                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null // Display amount2 if it exists and if not the set to null
                    };
                }),
            amount: totalExpenses,
            amount2: totalExpenses2 !== 0 ? totalExpenses2 : null
        },
        {
            name: "Financial Assistance/Subsidy from NGAs, LGUs, GOCCs",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Subsidy"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map(accountTitle => {
                    // Match by accountTitle with accountTitlesPeriod
                    const matchingPeriodAccount = currentAccountTitlesPeriod.find(
                        periodAccount => periodAccount.accountTitle === accountTitle.accountTitle
                    );

                    return {
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference,
                        amount2: matchingPeriodAccount ? matchingPeriodAccount.difference2 : null // Display amount2 if it exists and if not the set to null
                    };
                }),
            amount: totalSubsidy,
            amount2: totalSubsidy2 !== 0 ? totalSubsidy2 : null  // Display amount2 if it exists and if not the set to null
        },
    ];


    // Group data for the cards
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
                    label: totalNetSurplusDeficit > 0 ? "TOTAL Surplus" : "TOTAL Deficit",
                    value: totalNetSurplusDeficit < 0 ? Math.abs(totalNetSurplusDeficit).toLocaleString() : totalNetSurplusDeficit.toLocaleString()
                },

            ]
        },

    ];
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





    const Row = ({ item, depth = 0 }) => {
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

        // Check if the row is a parent row for "Revenues, Expenses or Subsidy"
        const isMainCategory = ["Revenue", "Expenses", "Subsidy"].includes(item.name);

        return (
            <>
                <tr className="border-t bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    {/* Account name with indentation */}
                    <td
                        className={`px-6 py-4 ${isMainCategory ? "cursor-pointer" : ""}`}
                        onClick={() => setIsOpen(!isOpen)}
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
                            <Row key={index} item={childItem} depth={depth + 1} /> // Increment depth for children
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
            <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li class="inline-flex items-center">
                        <button onClick={() => navigate("/main/incomeStatement/incomeStatementList")} class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <RiFileAddFill className="mr-2"></RiFileAddFill>
                            Income Statement
                        </button>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-Width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{incomeStatement.description}</span>
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
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium">
                        EXPORT TO EXCEL
                    </button>
                    <button
                        className={`rounded-lg py-2 px-8 text-[12px] font-poppins font-medium border border-gray-400 ${isClicked
                            ? 'bg-gradient-to-r from-red-700 to-orange-400 text-white font-semibold'
                            : 'bg-white text-black hover:bg-color-lighter-gray'
                            }`}
                        onClick={() => {
                            setIsClicked(true);
                            setCurrentModal(1);
                            setShowModal(true);
                        }}
                    >
                        ADD PERIOD
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
                            <th scope="col" className="px-6 py-3 text-right">{`Period - ${incomeStatement?.ledgerYear || "N/A"}`}</th>
                            {currentShowPeriodColumn && (
                                <th scope="col" className="px-6 py-3 text-right">
                                    {currentSelectedLedgerYear ? `Period - ${currentSelectedLedgerYear}` : "Period - ××××"}
                                </th>
                            )}
                            <th scope="col" className="px-6 py-3 text-right"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementDetailsData.map((item, index) => (
                            <Row key={index} item={item} depth={1} /> 
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


 {/* Modal */}
 {showModal && currentModal === 1 && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[400px] h-60 rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select Ledger Period</h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => { setShowModal(false); setIsClicked(false); }}>×</button>
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
                                    if (selectedLedger) {
                                        // Call the function to get ledger data for the selected period
                                        getSelectedLedgerData(selectedLedger, stateStartDate, stateEndDate);

                                        // Optionally move to the next modal step
                                        setCurrentModal(2);

                                        setShowPeriodColumn(true);  // Show the period column
                                        setIsClicked(false);
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
        </Fragment>
    );

}
