import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, getDocs, getDoc, onSnapshot, query, where } from "firebase/firestore";
import Modal from "../../../../components/Modal"; // Import the Modal component

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
    const [incomeStatementLedgerList, setIncomeStatementLedgerList] = useState([]);
    const [currentModal, setCurrentModal] = useState(1); // Modal state
    
    


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
                        incomeStatementData.ledgerYear = ledgerSnap.data().year;
                        console.log("Ledger Data:", ledgerSnap.data());
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

                console.log("Income Statement Data:", incomeStatementData);
                
                setAccountTitles(accountTitlesData);
                setAccounts(accountsData);
                setIncomeStatement(incomeStatementData);
            } else {
                incomeStatementData.ledgerYear = "N/A"; 
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
        return <Spinner />;
    }

    if (error) {
        return <p>{error}</p>;
    }
    // Calculate total Revenue
    const totalRevenues = accountTitles
        .filter(accountTitle => accountTitle.accountType === "Revenue")
        .reduce((total, accountTitle) => total + accountTitle.difference, 0);

    // Calculate total Expenses
    const totalExpenses = accountTitles
        .filter(accountTitle => accountTitle.accountType === "Expenses")
        .reduce((total, accountTitle) => total + accountTitle.difference, 0);

    const totalSubsidy = accountTitles
    .filter(accountTitle => accountTitle.accountType === "Subsidy")
    .reduce((total, accountTitle) => total + accountTitle.difference, 0);

    let totalNetSurplusDeficit = totalRevenues - totalExpenses;


  


    const incomeStatementDetailsData = [
        {
            name: "Revenue",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Revenue"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                })),
            amount: totalRevenues  // Add the calculated total amount for Revenue
        },
        {
            name: "Expenses",
            children: accountTitles
                .filter(accountTitle => 
                    accountTitle.accountType === "Expenses"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                })),
            amount: totalExpenses
        },
        {
            name: "Financial Assistance/Subsidy from NGAs, LGUs, GOCCs",
            children: accountTitles
                .filter(accountTitle =>
                    accountTitle.accountType === "Subsidy"
                )
                .sort((a, b) => a.accountTitle.localeCompare(b.accountTitle)) // Sort alphabetically by accountTitle
                .map((accountTitle) => ({
                    name: accountTitle.accountTitle,
                    amount: accountTitle.difference,
                })),
            amount: totalSubsidy    
        },  
    ];


        // Group data for the cards
        const groupData = [
            {
                //GROUP 2
                items: [
                    { label: "TOTAL Revenue", value: totalRevenues.toLocaleString() }
                ]
            },
            {
                // GROUP 2
                items: [
                    { label: "TOTAL Expenses", value: totalExpenses.toLocaleString() },
                    { label: "Total Non-Cash Expense" , value: totalExpenses.toLocaleString() },
                    { label: "Current Operating Expense" , value: totalExpenses.toLocaleString() },
                    
                ]
            },
            {
                // GROUP 3
                items: [
                    {
                        label: totalNetSurplusDeficit > 0 ? "TOTAL Surplus" : "TOTAL Deficit",
                        value: totalNetSurplusDeficit < 0 ? Math.abs(totalNetSurplusDeficit).toLocaleString() : totalNetSurplusDeficit.toLocaleString()
                    },
                    { label: "Net Financial Subsidy", value: totalSubsidy.toLocaleString ()}
                ]
            }
        ];
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
                        <td className={`px-6 py-4 text-right font-semibold ${getTextColor(item.amount)}`}>
                            {item.amount ? formatAmount(item.amount) : ''}
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

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Account Description</th>
                            <th scope="col" className="px-6 py-3 text-right">Period- {incomeStatement?.ledgerYear || "N/A"}</th>
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

