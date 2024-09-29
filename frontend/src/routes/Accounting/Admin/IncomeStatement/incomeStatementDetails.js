import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExcelJS from 'exceljs'; //
import { db } from "../../../../config/firebase-config";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc
} from "firebase/firestore";

export default function IncomeStatementDetails() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams(); 
    const [incomeStatement, setIncomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch the income statement description and its associated ledger year
    const getIncomeStatementDescription = async () => {
        try {
            const docRef = doc(db, "incomestatement", incomeStatementID); // Create a reference to the income statement document
            const docSnap = await getDoc(docRef); // Get the document snapshot

            if (docSnap.exists()) {
                const incomeStatementData = { id: docSnap.id, ...docSnap.data() };

                // Check if ledgerID exists in the income statement
                if (incomeStatementData.ledgerID) {
                    // Fetch the associated ledger document
                    const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);

                    if (ledgerSnap.exists()) {
                        // Attach the year from the ledger data to the income statement data
                        incomeStatementData.ledgerYear = ledgerSnap.data().year;

                        // Fetch accounttitles subcollection from the ledger
                        const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                        const accountTitlesSnap = await getDocs(accountTitlesRef);

                        const accountTitlesData = [];
                        for (const titleDoc of accountTitlesSnap.docs) {
                            const titleData = { id: titleDoc.id, ...titleDoc.data() };

                            // Log account title data
                            console.log("Account Title Data:", titleData);

                            // Fetch accounts subcollection from each accounttitle document
                            const accountsRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles", titleDoc.id, "accounts");
                            const accountsSnap = await getDocs(accountsRef);

                            const accountsData = accountsSnap.docs.map(accountDoc => ({
                                id: accountDoc.id,
                                ...accountDoc.data(),
                            }));

                            // Log accounts data
                            console.log(`Accounts for ${titleDoc.id}:`, accountsData);

                            // Add accounts data to the accounttitle
                            titleData.accounts = accountsData;
                            accountTitlesData.push(titleData);
                        }

                        setAccountTitles(accountTitlesData); // Store the accounttitles and accounts
                        console.log("Data Inside:", accountTitles);

                    } else {
                        incomeStatementData.ledgerYear = "N/A"; // Handle missing ledger case
                    }
                }

                setIncomeStatement(incomeStatementData); // Store the income statement data with ledger year
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

    useEffect(() => {
        getIncomeStatementDescription();
    }, [incomeStatementID]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    // Data structure for income statement (replace this with your actual data from Firebase)
    const incomeStatementData = [
        {
            name: "Revenues",
            children: [
                {
                    name: "Service and Business Income",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Service Income") // Filter for "Service Income"
                        .map((accountTitle) => ({
                            name: accountTitle.accountTitle,
                            amount: 0, 
                        })),
                },
                {
                    name: "Other Income",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Other Income") // Filter for "Other Income"
                        .map((accountTitle) => ({
                            name: accountTitle.accountTitle,
                            amount: 200000, // This should be dynamic from Firebase
                        })),
                },
            ],
        },
        {
            name: "Expenses",
            children: [
                {
                    name: "Operating Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Operating Expenses") // Filter for "Operating Expenses"
                        .map((accountTitle) => ({
                            name: accountTitle.accountTitle,
                            amount: 300000, // This should be dynamic from Firebase
                        })),
                },
                {
                    name: "Administrative Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Administrative Expenses") // Filter for "Administrative Expenses"
                        .map((accountTitle) => ({
                            name: accountTitle.accountTitle,
                            amount: 150000, // This should be dynamic from Firebase
                        })),
                },
            ],
        },
    ];

    // Recursive component to render rows
    const Row = ({ item, depth = 0 }) => {
        const [isOpen, setIsOpen] = useState(false); // State to handle collapse/expand

        return (
            <>
                <tr className="border-t">
                    {/* Toggle icon and account name with indentation */}
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
                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-semibold">
                        {item.amount ? item.amount.toLocaleString() : ''}
                    </td>
                </tr>
                {/* If the row has children and is open, recursively render the child rows */}
                {isOpen && item.children && (
                    <tr>
                        <td colSpan="2">
                            <table className="w-full">
                                <tbody>
                                    {item.children.map((childItem, index) => (
                                        <Row key={index} item={childItem} depth={depth + 1} /> // Increment depth for children
                                    ))}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                )}
            </>
        );
    };

    return (
        <Fragment>
            <div className="flex justify-between w-full">
                <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
                    {incomeStatement.description}
                </h1>
                <button
                    className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium"
                >
                    EXPORT TO EXCEL
                </button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/* TABLE */}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3"></th>
                            <th scope="col" className="px-6 py-3 text-2">{`Period -  ${incomeStatement?.ledgerYear || ""}`}</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementData.map((item, index) => (
                            <Row key={index} item={item} depth={1} /> // Start with depth 1 for main categories
                        ))}
                    </tbody>
                </table>
            </div>

        </Fragment>
    );
}
