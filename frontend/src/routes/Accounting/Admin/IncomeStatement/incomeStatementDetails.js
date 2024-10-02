import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import Modal from "../../../../components/Modal"; // Assuming you have a reusable Modal component
import DatePicker from "react-datepicker"; // Assuming you are using react-datepicker

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
    const [showModal, setShowModal] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState("");
    const [incomeStatementLedgerList, setIncomeStatementLedgerList] = useState([]);

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

    // Fetching ledger list from Firestore
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

    // Function to calculate total deficit/surplus
    const calculateTotalDeficitSurplus = () => {
        // Calculate total revenue by traversing through grandchildren
        const totalRevenue = incomeStatementData
            .flatMap(item => item.children) 
            .flatMap(item => item.children) 
            .reduce((sum, child) => sum + (child.children?.reduce((childSum, grandChild) => childSum + (grandChild.amount || 0), 0) || 0), 0); // Sum up grandchildren amounts

        // Calculate total expenses in the same way
        const totalExpenses = incomeStatementData
            .flatMap(item => item.children) // Get the children (e.g., "Service and Business Income", "Expenses")
            .flatMap(item => item.children) // Get the next level of children (e.g., "Maintenance and Other Operating Expenses")
            .reduce((sum, child) => sum + (child.children?.reduce((childSum, grandChild) => childSum + (grandChild.amount || 0), 0) || 0), 0); // Sum up grandchildren amounts

        return totalRevenue - totalExpenses; // Calculate surplus or deficit
    };

    // Use the updated calculateTotalDeficitSurplus function in your component
    const totalDeficitSurplus = calculateTotalDeficitSurplus();

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
                    <button
                        className="bg-white rounded-lg text-black font-poppins py-2 px-8 text-[12px] font-medium border border-gray-400"
                        onClick={() => setShowModal(true)}
                    >
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

            {/* Display total deficit/surplus below the table */}
            <div className="font-semibold text-right mt-4">
                Total Deficit/Surplus: {totalDeficitSurplus.toFixed(2)}
            </div>

            {showModal && (
                <Modal isVisible={showModal}>
                    <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                        <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select a Ledger</h1>
                            <button
                                className="font-poppins text-[27px] text-[#1E1E1E]"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
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
                                className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5 ${
                                    !selectedLedger && "opacity-50 cursor-not-allowed"
                                }`}
                                onClick={() => {
                                    // Handle selection
                                    if (selectedLedger) {
                                        console.log("Selected Ledger ID:", selectedLedger);
                                        setShowModal(false); // Close modal after selection
                                    }
                                }}
                                disabled={!selectedLedger}
                            >
                                ADD PERIOD
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Fragment>
    );
}
