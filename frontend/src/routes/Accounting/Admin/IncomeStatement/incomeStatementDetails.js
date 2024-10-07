import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal";

export default function IncomeStatement() {
    const navigate = useNavigate();
    const { incomeStatementID } = useParams();
    const [currentModal, setCurrentModal] = useState(1);
    const [incomeStatement, setIncomeStatement] = useState(null);
    const [accountTitles, setAccountTitles] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [balanceSheetData, setBalanceSheetData] = useState({
        ledgerYear: "", // Placeholder for ledger year
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState("");
    const [incomeStatementLedgerList, setIncomeStatementLedgerList] = useState([]);

    const getIncomeStatementDescription = async () => {
        try {
            const docRef = doc(db, "incomestatement", incomeStatementID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const incomeStatementData = { id: docSnap.id, ...docSnap.data() };

                if (incomeStatementData.ledgerID) {
                    const ledgerRef = doc(db, "ledger", incomeStatementData.ledgerID);
                    const ledgerSnap = await getDoc(ledgerRef);

                    if (ledgerSnap.exists()) {
                        balanceSheetData.ledgerYear = ledgerSnap.data().year;
                    }
                }

                const accountTitlesRef = collection(db, "ledger", incomeStatementData.ledgerID, "accounttitles");
                const accountTitlesSnap = await getDocs(accountTitlesRef);

                const accountTitlesData = [];
                const accountsData = [];

                for (const titleDoc of accountTitlesSnap.docs) {
                    const titleData = { id: titleDoc.id, ...titleDoc.data() };

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

    useEffect(() => {
        getLedgerList();
        getIncomeStatementDescription();
    }, [incomeStatementID]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    const calculateTotal = (children) => {
        return children.reduce((sum, child) => {
            if (child.children) {
                return sum + calculateTotal(child.children);
            }
            return sum + (child.amount || 0); // Ensure default 0 if amount is undefined
        }, 0);
    };

    const incomeStatementData = [
        {
            name: "Revenues",
            amount: calculateTotal([
                {
                    name: "Service and Business Income",
                    children: [
                        {
                            name: "Service Income",
                            children: accountTitles
                                .filter(accountTitle => accountTitle.accountType === "Revenue")
                                .map(accountTitle => ({
                                    name: accountTitle.accountTitle,
                                    amount: accountTitle.difference || 0, // Ensure default 0 if difference is undefined
                                })),
                        },
                    ],
                },
                {
                    name: "Shares, Grants and Donations",
                    children: [
                        {
                            name: "Grants and Donations",
                            amount: accountTitles
                                .filter(accountTitle => accountTitle.accountTitle === "Grants and Donations")
                                .reduce((sum, accountTitle) => sum + (accountTitle.difference || 0), 0), // Ensure default 0
                        },
                    ],
                },
                {
                    name: "Miscellaneous Income",
                    children: [
                        {
                            name: "Miscellaneous",
                            amount: accountTitles
                                .filter(accountTitle => accountTitle.accountTitle === "Miscellaneous Income")
                                .reduce((sum, accountTitle) => sum + (accountTitle.difference || 0), 0), // Ensure default 0
                        },
                    ],
                },
            ]),
            children: [
                {
                    name: "Service and Business Income",
                    children: [
                        {
                            name: "Service Income",
                            children: accountTitles
                                .filter(accountTitle => accountTitle.accountType === "Revenue")
                                .map(accountTitle => ({
                                    name: accountTitle.accountTitle,
                                    amount: accountTitle.difference || 0, // Ensure default 0
                                })),
                        },
                    ],
                },
                {
                    name: "Shares, Grants and Donations",
                    children: [
                        {
                            name: "Grants and Donations",
                            amount: accountTitles
                                .filter(accountTitle => accountTitle.accountTitle === "Grants and Donations")
                                .reduce((sum, accountTitle) => sum + (accountTitle.difference || 0), 0), // Ensure default 0
                        },
                    ],
                },
                {
                    name: "Miscellaneous Income",
                    children: [
                    ],
                },
            ],
        },
        {
            name: "Expenses",
            amount: calculateTotal(
                accountTitles
                    .filter(accountTitle => accountTitle.accountType === "Expenses")
                    .map(accountTitle => ({
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference || 0, // Ensure default 0
                    }))
            ),
            children: [
                {
                    name: "Maintenance and Other Operating Expenses",
                    children: accountTitles
                        .filter(accountTitle => accountTitle.accountType === "Expenses")
                        .map(accountTitle => ({
                            name: accountTitle.accountTitle,
                            amount: accountTitle.difference || 0, // Ensure default 0
                        })),
                },
            ],
        },
        {
            name: "Financial Subsidy from NGAs, LGUs, GOCCs",
            amount: calculateTotal(
                accountTitles
                    .filter(accountTitle => accountTitle.accountType === "Subsidy")
                    .map(accountTitle => ({
                        name: accountTitle.accountTitle,
                        amount: accountTitle.difference || 0, 
                    }))
            ),
            children: [], 
        },
    ];

    const totalRevenues = incomeStatementData.find(item => item.name === "Revenue")?.children.flatMap(child => child.children).reduce((sum, grandChild) => sum + (grandChild.amount || 0), 0) || 0;
    const totalExpenses = incomeStatementData.find(item => item.name === "Expenses")?.children.flatMap(child => child.children).reduce((sum, grandChild) => sum + (grandChild.amount || 0), 0) || 0;
    const totalFinancialSubsidy = incomeStatementData
        .find(item => item.name === "Subsidy")
        ?.amount || 0;

    const totalSurplusDeficit = totalRevenues - totalExpenses;

    const surplusOrDeficit = totalSurplusDeficit > 0 ? "Total Surplus" : totalSurplusDeficit < 0 ? "Total Deficit" : "Break-even";

    const Row = ({ item, depth = 0 }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <tr className="border-t">
                    <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ paddingLeft: `${depth * 20}px`, width: '70%' }}
                    >
                        {item.children ? (
                            <span>
                                {isOpen ? "▼" : "▶"} {item.name}
                            </span>
                        ) : (
                            <span>{item.name}</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold" style={{ width: '30%' }}>
                        {item.amount !== undefined ? item.amount.toLocaleString() : null}
                    </td>
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

            <div className="overflow-x-auto my-8">
                <div className="overflow-y-auto max-h-96"> {/* Wrapper for vertical scrollbar */}
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Account Title</th>
                                <th scope="col" className="px-6 py-3 text-right">
                                    {`Period - ${incomeStatement?.ledgerYear || "N/A"}`}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {incomeStatementData.map((item, index) => (
                                <Row key={index} item={item} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 shadow rounded">
                    <h2 className="text-xl font-semibold">Total Revenues</h2>
                    <p className="text-2xl font-bold">{totalRevenues.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 shadow rounded">
                    <h2 className="text-xl font-semibold">Total Expenses</h2>
                    <p className="text-2xl font-bold">{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 shadow rounded">
                    <h2 className="text-xl font-semibold">Total Subsidy</h2>
                    <p className="text-2xl font-bold">{totalFinancialSubsidy.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white p-4 shadow rounded mt-4">
                <h2 className="text-xl font-semibold">{surplusOrDeficit}</h2>
                <p className="text-2xl font-bold">{totalSurplusDeficit.toLocaleString()}</p>
            </div>
            {showModal && currentModal === 1 && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select a Ledger</h1>
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
                                <option value="">Select Ledger</option>
                                {incomeStatementLedgerList.map((ledger) => (
                                    <option key={ledger.id} value={ledger.id}>
                                        {ledger.description}
                                    </option>
                                ))}
                            </select>
                        </form>

                        <div className="flex justify-end py-3 px-4">
                            <button
                                className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5 ${!selectedLedger && "opacity-50 cursor-not-allowed"}`}
                                onClick={() => selectedLedger && setCurrentModal(2)}
                                disabled={!selectedLedger}
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Fragment>
    );
}

