import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal";

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
    // -----------------------------------------------------------------

    // Fetch the balance sheet description and its associated ledger year
    const getBalanceSheetDescription = async () => {
        try {
            const docRef = doc(db, "balancesheet", balanceSheetID); // Reference to the balance sheet document
            const docSnap = await getDoc(docRef); // Get the document snapshot

            if (docSnap.exists()) {
                const balanceSheetData = { id: docSnap.id, ...docSnap.data() };
                // console.log("balance sheet data: ", balanceSheetData)

                // Convert Firestore timestamps to "yyyy-mm-dd" format, adjusted for local timezone
                const convertToLocalDate = (timestamp) => {
                    const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JavaScript Date
                    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000); // Adjust to local timezone
                    return localDate.toISOString().split("T")[0]; // Convert to "yyyy-mm-dd" format
                };

                const startDate = convertToLocalDate(balanceSheetData.start_date);
                const endDate = convertToLocalDate(balanceSheetData.end_date);

                // console.log("balance sheet start date: ", startDate)
                // console.log("balance sheet end date: ", endDate)

                // Check if ledgerID exists in the balance sheet
                if (balanceSheetData.ledgerID) {
                    // Fetch the associated ledger document
                    const ledgerRef = doc(db, "ledger", balanceSheetData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);

                    if (ledgerSnap.exists()) {
                        balanceSheetData.ledgerYear = ledgerSnap.data().year; // Attach year from ledger

                        // Fetch account titles from the ledger
                        const accountTitlesRef = collection(db, "ledger", balanceSheetData.ledgerID, "accounttitles");
                        const accountTitlesSnap = await getDocs(accountTitlesRef);

                        const accountTitlesData = [];
                        const accountsData = [];

                        for (const titleDoc of accountTitlesSnap.docs) {
                            const titleData = { id: titleDoc.id, ...titleDoc.data() };

                            // Fetch accounts subcollection for each account title
                            const accountsRef = collection(db, "ledger", balanceSheetData.ledgerID, "accounttitles", titleDoc.id, "accounts");
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
                        balanceSheetData.ledgerYear = "N/A"; // Handle missing ledger case
                    }
                }

                setBalanceSheet(balanceSheetData); // Set balance sheet data with ledger year
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

    useEffect(() => {
        getBalanceSheetDescription();
        getLedgerList();
    }, [balanceSheetID]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <p>{error}</p>;
    }

    // Calculate total amount for Assets
    const totalAssets = accountTitles
        .filter(accountTitle =>
            accountTitle.accountType === "Assets" ||
            accountTitle.accountType === "Contra Assets"
        )
        .reduce((total, accountTitle) => {
            const amount = accountTitle.accountType === "Contra Assets"
                ? +accountTitle.differenceContra // Subtract differenceContra for Contra Assets
                : accountTitle.difference;        // Use difference for regular Assets
            return total + amount; // Sum the amounts
        }, 0);

    // Calculate total amount for Liabilities
    const totalLiabilities = accountTitles
        .filter(accountTitle => accountTitle.accountType === "Liabilities")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.differenceContra;
            return total + amount;
        }, 0);

    // Calculate base equity as Assets - Liabilities
    let totalNetAssets = totalAssets - totalLiabilities;
    let totalEquity = totalNetAssets;

    // Add any Equity accounts to the calculated equity
    totalEquity += accountTitles
        .filter(accountTitle => accountTitle.accountType === "Equity")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.differenceContra; // Use differenceContra for Equity accounts if applicable
            return total + amount; // Sum equity amounts
        }, 0);

    // Function to update totalEquity in the balanceSheet collection
    const updateTotalEquityInFirestore = async (balanceSheetID, totalEquity) => {
        try {
            const balanceSheetRef = doc(db, "balancesheet", balanceSheetID);
            await updateDoc(balanceSheetRef, {
                totalNetAssets: totalEquity // Push the totalEquity value to Firestore
            });
            // console.log("Total net assets successfully updated in Firestore.");
        } catch (err) {
            console.error("Error updating total equity:", err);
        }
    };

    // Call the function to update Firestore after calculating totalEquity
    updateTotalEquityInFirestore(balanceSheetID, totalEquity);

    // Data structure for balance sheet (you can replace this with your actual data from Firebase)
    const balanceSheetDetailsData = [
        {
            name: "Assets",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Assets" || accountTitle.accountType === "Contra Assets"
                )
                .sort((a, b) => {
                    // Sort assets alphabetically, and move Contra Assets to the bottom
                    if (a.accountType === "Assets" && b.accountType === "Contra Assets") {
                        return -1;  // Keep "Assets" before "Contra Assets"
                    } else if (a.accountType === "Contra Assets" && b.accountType === "Assets") {
                        return 1;   // Move "Contra Assets" after "Assets"
                    } else {
                        return a.accountTitle.localeCompare(b.accountTitle);  // Sort alphabetically within the same type
                    }
                })
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.accountType === "Contra Assets"
                        ? accountTitle.differenceContra // Use differenceContra for Contra Assets
                        : accountTitle.difference,      // Use difference for regular Assets
                })),
            amount: totalAssets 
        },
        {
            name: "Liabilities",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Liabilities"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) 
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.differenceContra,
                })),
            amount: totalLiabilities
        },
        {
            name: "Equity",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Equity"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) 
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.differenceContra,
                })),
            amount: totalEquity // Display the updated equity (Assets - Liabilities + any Equity accounts)
        },
    ];

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

        // Check if the row is a parent row for "Assets", "Liabilities", or "Equity"
        const isMainCategory = ["Assets", "Liabilities", "Equity"].includes(item.name);

        return (
            <>
                <tr className="border-t bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    {/* Account name with indentation */}
                    <td
                        className="px-6 py-4 cursor-pointer"
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
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
                    {balanceSheet.description}
                </h1>
                <div className="flex space-x-4">
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium">
                        EXPORT TO EXCEL
                    </button>
                    <button
                        className="bg-white rounded-lg text-black font-poppins py-2 px-8 text-[12px] font-medium border border-gray-400"
                    onClick={() => {
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
                            <th scope="col" className="px-6 py-3 text-right">{`Period - ${balanceSheet?.ledgerYear || "N/A"}`}</th>
                            <th scope="col" className="px-6 py-3 text-right"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {balanceSheetDetailsData.map((item, index) => (
                            <Row key={index} item={item} depth={1} /> // Start with depth 1 for main categories
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
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>×</button>
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
                                onClick={() => selectedLedger && setCurrentModal(2)}
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
