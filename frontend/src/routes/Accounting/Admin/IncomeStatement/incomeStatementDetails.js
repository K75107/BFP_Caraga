import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

export default function IncomeStatement() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams(); // Get the ID from the URL
    const [incomeStatement, setIncomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [balanceSheetData, setBalanceSheetData] = useState({
        ledgerYear: "", // Placeholder for ledger year
    });

    // Fetch the income statement description and its associated data
    const getIncomeStatementDescription = async () => {
        try {
            const docRef = doc(db, "incomestatement", incomeStatementID); // Reference to the income statement document
            const docSnap = await getDoc(docRef); // Get the document snapshot

            if (docSnap.exists()) {
                const incomeStatementData = { id: docSnap.id, ...docSnap.data() };

                // Fetch ledger information if it exists
                if (incomeStatementData.ledgerID) {
                    const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);

                    if (ledgerSnap.exists()) {
                        balanceSheetData.ledgerYear = ledgerSnap.data().year; // Attach year from ledger
                    }
                }

                // Fetch account titles and accounts from Firestore for the income statement
                const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                const accountTitlesSnap = await getDocs(accountTitlesRef);

                const accountTitlesData = [];
                const accountsData = [];

                for (const titleDoc of accountTitlesSnap.docs) {
                    const titleData = { id: titleDoc.id, ...titleDoc.data() };

                    // Fetch accounts subcollection for each account title
                    const accountsRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles", titleDoc.id, "accounts");
                    const accountsSnap = await getDocs(accountsRef);

                    let totalDebit = 0;
                    let totalCredit = 0;

                    const titleAccounts = accountsSnap.docs.map(accountDoc => {
                        const accountData = {
                            id: accountDoc.id,
                            accountTitleID: titleDoc.id,
                            ...accountDoc.data(),
                        };

                        totalDebit += accountData.debit || 0;
                        totalCredit += accountData.credit || 0;

                        return accountData;
                    });

                    titleData.difference = totalDebit - totalCredit;
                    accountTitlesData.push(titleData);
                    accountsData.push(...titleAccounts);
                }

                setAccountTitles(accountTitlesData);
                setAccounts(accountsData);
                setIncomeStatement(incomeStatementData);
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

    // Income statement data structure with integration
    const incomeStatementData = [
        {
            name: "Revenues",
            children: [
                {
                    name: "Service and Business Income",
                    children: [
                        {
                            name: "Service Income",
                            children: accountTitles
                                .filter(accountTitle => accountTitle.accountType === "Revenue") // Filter for revenue
                                .map(accountTitle => ({
                                    name: accountTitle.accountTitle,
                                    amount: accountTitle.difference,
                                })),
                        },
                    ],
                },
            ],
        },
        {
            name: "Expenses",
            children: [
                {
                    name: "Maintenance and Other Operating Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.accountType === "Expenses") 
                        .map(accountTitle => ({
                            name: accountTitle.accountTitle,
                            amount: accountTitle.difference,
                        })),
                },
            ],
        },
    ];

    // Recursive component to render rows with editable amount fields
    const Row = ({ item, depth = 0 }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [editableAmount, setEditableAmount] = useState(item.amount);

        const handleAmountChange = (event) => {
            setEditableAmount(event.target.value);
        };

        return (
            <>
                <tr className="border-t">
                    <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ paddingLeft: `${depth * 20}px` }}
                    >
                        {item.children ? (
                            <span>
                                {isOpen ? "▼" : "▶"} {item.name}
                            </span>
                        ) : (
                            <span>{item.name}</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">
                        {item.amount !== undefined ? (
                            <input
                                type="number"
                                value={editableAmount}
                                onChange={handleAmountChange}
                                className="text-right border rounded px-2"
                            />
                        ) : null}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold"></td>
                </tr>

                {isOpen && item.children && (
                    <>
                        {item.children.map((childItem, index) => (
                            <Row key={index} item={childItem} depth={depth + 1} />
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
                    {incomeStatement.description}
                </h1>
                <div className="flex space-x-4">
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium">
                        EXPORT TO EXCEL
                    </button>
                    <button className="bg-white rounded-lg text-black font-poppins py-2 px-8 text-[12px] font-medium border border-gray-400">
                        ADD PERIOD
                    </button>
                </div>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            {/* TABLE */}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3 text-right">{`Period - ${balanceSheetData.ledgerYear || "N/A"}`}</th>
                            <th scope="col" className="px-6 py-3 text-right">
                                <span className="sr-only">View</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomeStatementData.map((item, index) => (
                            <Row key={index} item={item} depth={1} />
                        ))}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
}
