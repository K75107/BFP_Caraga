import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import {
    collection,
    getDocs,
    getDoc,
    doc,
} from "firebase/firestore";

export default function IncomeStatementDetails() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams();

    const [incomeStatement, setIncomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editableData, setEditableData] = useState({});

    const getIncomeStatementDescription = async () => {
        try {
            const docRef = doc(db, "incomestatement", incomeStatementID);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const incomeStatementData = { id: docSnap.id, ...docSnap.data() };
    
                // Check if there's a linked ledger
                if (incomeStatementData.ledgerID) {
                    const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);
    
                    if (ledgerSnap.exists()) {
                        incomeStatementData.ledgerYear = ledgerSnap.data().year;
    
                        // Fetch account titles from the ledger
                        const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                        const accountTitlesSnap = await getDocs(accountTitlesRef);
    
                        const accountTitlesData = [];
                        for (const titleDoc of accountTitlesSnap.docs) {
                            const titleData = { id: titleDoc.id, ...titleDoc.data() };
    
                            // Fetch accounts associated with each account title
                            const accountsRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles", titleDoc.id, "accounts");
                            const accountsSnap = await getDocs(accountsRef);
    
                            // Structure the accounts and link them to the title
                            const accountsData = accountsSnap.docs.map(accountDoc => ({
                                id: accountDoc.id,
                                ...accountDoc.data(),
                            }));
    
                            // Assign the fetched accounts to the title data
                            titleData.accounts = accountsData;
    
                            // Add the structured title data to the main array
                            accountTitlesData.push(titleData);
                        }
    
                        // Filter for only Revenue account types and update state
                        const revenueAccountTitles = accountTitlesData.filter(accountTitle => accountTitle.category === "Revenue");
                        setAccountTitles(revenueAccountTitles);
                    } else {
                        incomeStatementData.ledgerYear = "N/A";
                    }
                }
    
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

    const handleAmountChange = (name, value) => {
        setEditableData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    const incomeStatementData = [
        {
            name: "Revenues",
            children: [
                {
                    name: "Service and Business Income",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Service Income")
                        .flatMap(accountTitle => accountTitle.accounts.map(account => ({
                            name: account.accountTitle,
                            amount: editableData[account.accountTitle] || 0,
                        }))),
                },
                {
                    name: "Other Income",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Other Income")
                        .flatMap(accountTitle => accountTitle.accounts.map(account => ({
                            name: account.accountTitle,
                            amount: editableData[account.accountTitle] || 200000, 
                        }))),
                },
            ],
        },
        {
            name: "Expenses",
            children: [
                {
                    name: "Operating Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Operating Expenses")
                        .flatMap(accountTitle => accountTitle.accounts.map(account => ({
                            name: account.accountTitle,
                            amount: editableData[account.accountTitle] || 300000, // Adjust this as necessary
                        }))),
                },
                {
                    name: "Administrative Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.category === "Administrative Expenses")
                        .flatMap(accountTitle => accountTitle.accounts.map(account => ({
                            name: account.accountTitle,
                            amount: editableData[account.accountTitle] || 150000, // Adjust this as necessary
                        }))),
                },
            ],
        },
    ];

    const Row = ({ item, depth = 0 }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [isEditing, setIsEditing] = useState(false);
        const [amount, setAmount] = useState(item.amount);

        const handleDoubleClick = () => {
            setIsEditing(true);
        };

        const handleBlur = () => {
            handleAmountChange(item.name, amount);
            setIsEditing(false);
        };

        return (
            <>
                <tr
                    className="border-t"
                    onClick={() => setIsOpen(!isOpen)} // Left-click for collapse
                >
                    <td
                        className="px-6 py-4 cursor-pointer"
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
                    <td className="px-6 py-4 text-right font-semibold" onDoubleClick={handleDoubleClick}>
                        {item.children ? null : isEditing ? (
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onBlur={handleBlur}
                                autoFocus
                                className="border p-1 rounded"
                            />
                        ) : (
                            item.amount.toLocaleString()
                        )}
                    </td>
                </tr>
                {isOpen && item.children && (
                    <tr>
                        <td colSpan="2">
                            <table className="w-full">
                                <tbody>
                                    {item.children.map((childItem, index) => (
                                        <Row key={index} item={childItem} depth={depth + 1} />
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
                <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-8 text-[12px] font-medium">
                    EXPORT TO EXCEL
                </button>
            </div>

            <hr className="border-t border-[#7694D4] my-4" />

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3 text-2">{`Period - ${incomeStatement?.ledgerYear || ""}`}</th>
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
