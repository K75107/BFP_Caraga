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



                                // Sum up debit and credit for each document
                                // totalDebit += accountData.debit || 0;  // Default to 0 if debit is missing
                                // totalCredit += accountData.credit || 0; // Default to 0 if credit is missing

                                totalDebit += parseFloat(accountData.debit) || 0;  // Parse to number, default to 0 if invalid or missing
                                totalCredit += parseFloat(accountData.credit) || 0; // Parse to number, default to 0 if invalid or missing


                                console.log('total credit', totalCredit);
                                console.log('total debit', totalDebit)

                                return accountData;
                            });



                            // After processing all account documents, you can attach the difference (debit - credit) to the account title
                            titleData.difference = totalDebit - totalCredit;  // Attach the debit - credit difference to the account title



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
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }
    // Data structure for balance sheet (you can replace this with your actual data from Firebase)
    const balanceSheetData = [
        {
            name: "Assets",
            children: [
                {
                    name: "Current Assets",
                    children: [
                        {
                            name: "Cash and Cash Equivalents",
                            children: [
                                {
                                    name: "Cash on Hand",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Cash on Hand")  // Filter for "Cash on Hand" assets
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Treasury/Agency Cash Accounts",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Treasury/Agency Cash Accounts")  // Filter for "Treasury/Agency Cash Accounts" assets
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],

                        },
                        {
                            name: "Receivables",
                            children: [
                                {
                                    name: "Inter-Agency Receivables",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Inter-Agency Receivables")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Other Receivables",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Other Receivables")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],
                        },
                        {
                            name: "Inventories",
                            children: [
                                {
                                    name: "Inventory Held For Consumption",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Inventory Held For Consumption")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Semi-Expendable Machinery and Equipment",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Semi-Expendable Machinery and Equipment")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],
                        },
                        {
                            name: "Other Current Assets",
                            children: [
                                {
                                    name: "Advances",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Advances")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Prepayments",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Prepayments")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "Non-Current Assets",
                    children: [
                        {
                            name: "Property, Plant and Equipment",
                            children: [
                                {
                                    name: "Land",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Land")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Building and Other Structures",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Building and Other Structures")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Machinery and Equipment",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Machinery and Equipment")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Transportation Equipment",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Transportation Equipment")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Furniture, Fixture, and Books",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Furniture, Fixture, and Books")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Other Property, Plant and Equipment",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Other Property, Plant and Equipment")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                                {
                                    name: "Construction in Progress",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Construction in Progress")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],

                        },
                        {
                            name: "Other Non-Current Assets",
                            children: [
                                {
                                    name: "Prepayments",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Prepayments")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            name: "Liabilities",
            children: [
                {
                    name: "Current Liabilities",
                    children: [
                        {
                            name: "Financial Liabilities",
                            children: [
                                {
                                    name: "Payables",
                                    children: accountTitles
                                        .filter(accountTitle => accountTitle.assetType === "Payables")
                                        .map((accountTitle) => ({
                                            name: accountTitle.accountTitle,
                                            amount: accountTitle.difference,
                                        })),

                                },
                            ],
                        },
                    ],
                },
                {
                    name: "Non-Current Liabilities",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.assetType === "Non-Current Liabilities")
                        .map((accountTitle) => ({
                            name: accountTitle.accountTitle,
                            amount: accountTitle.difference,
                        })),
                },
            ],
        },
        {
            name: "Net Assets/Equity",
            children: [
                {
                    name: "Equity",
                    children: [
                        {
                            name: "Government Equity",
                            children: accountTitles
                                .filter(accountTitle => accountTitle.assetType === "Government Equity")
                                .map((accountTitle) => ({
                                    name: accountTitle.accountTitle,
                                    amount: accountTitle.difference,
                                })),
                        },
                    ],
                },

            ],
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
