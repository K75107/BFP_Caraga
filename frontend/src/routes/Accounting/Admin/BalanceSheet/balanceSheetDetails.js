import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot } from "firebase/firestore";

export default function BalanceSheet() {
    const navigate = useNavigate();
    const { balanceSheetID } = useParams(); // Get the ID from the URL
    const [balanceSheet, setBalanceSheet] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]); // Store account titles
    const [accounts, setAccounts] = useState([]); // Separate state for accounts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    // Fetch the balance sheet description and its associated ledger year
    const getBalanceSheetDescription = async () => {
        try {
            const docRef = doc(db, "balancesheet", balanceSheetID); // Reference to the balance sheet document
            const docSnap = await getDoc(docRef); // Get the document snapshot

            if (docSnap.exists()) {
                const balanceSheetData = { id: docSnap.id, ...docSnap.data() };

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
                            const accountsSnap = await getDocs(accountsRef);

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


                                console.log('total credit', totalCredit);
                                console.log('total debit', totalDebit)

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
                ? -accountTitle.differenceContra // Subtract differenceContra for Contra Assets
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
    let totalEquity = totalAssets - totalLiabilities;

    // Add any Equity accounts to the calculated equity
    totalEquity += accountTitles
        .filter(accountTitle => accountTitle.accountType === "Equity")
        .reduce((total, accountTitle) => {
            const amount = accountTitle.differenceContra; // Use differenceContra for Equity accounts if applicable
            return total + amount; // Sum equity amounts
        }, 0);

    // Data structure for balance sheet (you can replace this with your actual data from Firebase)
    const balanceSheetData = [
        {
            name: "Assets",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Assets" ||
                    accountTitle.accountType === "Contra Assets" // Filter for "Assets/Contra Assets" 
                )
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.accountType === "Contra Assets"
                        ? accountTitle.differenceContra // Use differenceContra for Contra Assets
                        : accountTitle.difference,      // Use difference for regular Assets
                })),
            amount: totalAssets // Add the calculated total amount for Assets
        },
        {
            name: "Liabilities",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Liabilities"
                )
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
                { label: "Total Current Assets", value: "100,000" },
                { label: "Total Non-Current Assets", value: "200,000" },
                { label: "TOTAL ASSETS", value: "300,000" }
            ]
        },
        {
            // GROUP 2
            items: [
                { label: "Total Current Liabilities", value: "50,000" },
                { label: "Total Non-Current Liabilities", value: "80,000" },
                { label: "TOTAL LIABILITIES", value: "130,000" }
            ]
        },
        {
            // GROUP 3
            items: [
                { label: "Total Assets Less Total Liabilities", value: "170,000" },
                { label: "Total Net Assets/Equity", value: "170,000" }
            ]
        }
    ];

    // Card component for group data
    const Card = ({ title, items }) => (
        <div className="card bg-white shadow-md rounded-lg p-6 m-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            {items.map((item, index) => (
                <p key={index} className="text-gray-700 text-sm font-semibold mb-2">
                    <span className="font-medium">{item.label}: </span>
                    {item.value}
                </p>
            ))}
        </div>
    );

    // Recursive component to render rows
    const Row = ({ item, depth = 0 }) => {
        const [isOpen, setIsOpen] = useState(false); // State to handle collapse/expand

        return (
            <>
                <tr className="border-t">
                    {/* Account name with indentation */}
                    <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ paddingLeft: `${depth * 20}px` }} // Adjust indentation based on depth
                    >
                        {item.children ? (
                            <span>
                                {isOpen ? "▼" : "▶"} {item.name}
                            </span>
                        ) : (
                            <span>{item.name}</span>
                        )}
                    </td>

                    {/* Amount in the second column */}
                    <td className="px-6 py-4 text-right font-semibold">
                        {item.amount ? item.amount.toLocaleString() : ''}
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
                <button
                    className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium"
                >
                    EXPORT TO EXCEL
                </button>
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
                        {balanceSheetData.map((item, index) => (
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
        </Fragment>
    );

}
