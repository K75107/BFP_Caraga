import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase-config";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { PiStack, PiStackFill } from "react-icons/pi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReportsOverview() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [firestationDeposit, setFirestationDeposit] = useState([]);
  const [totalCollectionAmount, setTotalCollectionAmount] = useState(0);
  const [depositedCollections, setDepositedCollections] = useState([]);
  const [undepositedCollections, setUndepositedCollections] = useState([]);
  const [totalDepositedAmount, setTotalDepositedAmount] = useState(0);
  const [totalDepositAmount, setTotalDepositAmount] = useState(0);
  const [totalUndepositedAmount, setTotalUndepositedAmount] = useState(0);
  const [firestationUsername, setFirestationUsername] = useState('');

  const [monthlyData, setMonthlyData] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const currentUserRef = doc(db, 'submittedReportsDeposits', userId);

    const fetchUserData = async () => {
      const docSnap = await getDoc(currentUserRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setFirestationUsername(userData.username || '');
      } else {
        console.log('No such document!');
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const submittedSubcollectionsDataRef = collection(db, 'submittedReportsCollections', userId, 'collections');

      const unsubscribeSubmittedCollectionsDataRef = onSnapshot(submittedSubcollectionsDataRef, (snapshot) => {
        const submittedCollectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Separate into deposited and undeposited based on depositStatus
        const depositedCollections = submittedCollectionsList.filter(collection => collection.depositStatus === true);
        const undepositedCollections = submittedCollectionsList.filter(collection =>
          collection.depositStatus === false || collection.depositStatus == null
        );


        // Calculate total amounts for each category
        const totalDepositedAmount = depositedCollections.reduce((acc, collection) => acc + parseFloat(collection.collectionAmount || 0), 0);
        const totalUndepositedAmount = undepositedCollections.reduce((acc, collection) => acc + parseFloat(collection.collectionAmount || 0), 0);

        // Set the state for totals
        setDepositedCollections(depositedCollections);
        setUndepositedCollections(undepositedCollections);
        setTotalCollectionAmount(totalDepositedAmount + totalUndepositedAmount);
        setTotalDepositedAmount(totalDepositedAmount); // Deposited amount
        setTotalUndepositedAmount(totalUndepositedAmount); // Undeposited amount


        // Process monthly data separately for deposited and undeposited
        processMonthlyData(depositedCollections, 'collectionAmount', 'Deposited');
        processMonthlyData(undepositedCollections, 'collectionAmount', 'Undeposited');
      });

      return () => {
        unsubscribeSubmittedCollectionsDataRef();
      };
    }
  }, [userId]);

  console.log(depositedCollections);

  useEffect(() => {
    if (userId) {
      const submittedSubdepositsDataRef = collection(db, 'submittedReportsDeposits', userId, 'deposits');

      const unsubscribeSubmitteddepositsDataRef = onSnapshot(submittedSubdepositsDataRef, (snapshot) => {
        const submittedDepositsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalAmount = submittedDepositsList.reduce((acc, deposit) => acc + parseFloat(deposit.depositAmount || 0), 0);

        setFirestationDeposit(submittedDepositsList);
        setTotalDepositAmount(totalAmount);
        processMonthlyData(submittedDepositsList, 'depositAmount', 'Deposits');
      });

      return () => {
        unsubscribeSubmitteddepositsDataRef();
      };
    }
  }, [userId]);

  const processMonthlyData = (data, amountField, type) => {
    const monthlyTotals = {};

    // Initialize all months with zero values
    months.forEach(month => {
      monthlyTotals[month] = { Deposits: 0, Deposited: 0, Undeposited: 0 };
    });

    data.forEach(item => {
      const date = item.date_submitted.toDate();
      const monthIndex = date.getMonth(); // Get month index (0 = January, 11 = December)
      const monthName = months[monthIndex];
      const amount = parseFloat(item[amountField]) || 0;

      // Add the amount to the correct type (Deposits, Deposited, or Undeposited)
      if (monthlyTotals[monthName]) {
        monthlyTotals[monthName][type] += amount;
      }
    });

    setMonthlyData(prevData => {
      const newMonthlyData = { ...prevData };
      months.forEach(month => {
        if (!newMonthlyData[month]) {
          newMonthlyData[month] = { Deposits: 0, Deposited: 0, Undeposited: 0 };
        }
        newMonthlyData[month][type] = monthlyTotals[month][type];
      });



      return newMonthlyData;
    });
  };




  // Prepare data for chart (group by month)
  const chartData = {
    labels: months, // Always display all months
    datasets: [
      {
        label: 'Deposits',
        data: months.map(month => monthlyData[month]?.Deposits || 0), // Deposits from monthlyData
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Deposited',
        data: months.map(month => monthlyData[month]?.Deposited || 0), // Deposited from monthlyData
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Undeposited',
        data: months.map(month => monthlyData[month]?.Undeposited || 0), // Undeposited from monthlyData
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };



  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Summary of Deposits, Collections, and Undeposited Amounts',
      },
    },
  };


  return (
    <Fragment>
      {/**Breadcrumbs */}
      <nav class="flex absolute top-[20px]" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li class="inline-flex items-center">
            <button onClick={() => navigate("/main/reports/firestationReports")} class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
              <PiStackFill className="mr-2"></PiStackFill>
              Collections & Deposits
            </button>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
              </svg>
              <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{firestationUsername}</span>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
              </svg>
              <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Overview</span>
            </div>
          </li>
        </ol>
      </nav>
      {/**Breadcrumbs */}

      <div className="flex flex-col space-y-6 w-full mb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {firestationUsername}
          </h1>
        </div>
      </div>

      {/* Navigations */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="default-styled-tab" role="tablist">
          <li className="me-2" role="presentation">
            <button
              onClick={() => navigate(`/main/reports/overview/${userId}`)}
              className="inline-block p-3 border-b-4 text-blue-700 border-blue-700 hover:bg-blue-100"
              type="button"
              role="tab"
              aria-controls="profile"
              aria-selected="false"
            >
              Overview
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              onClick={() => navigate(`/main/reports/collections/${userId}`)}
              className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
              type="button"
              role="tab"
              aria-controls="profile"
              aria-selected="false"
            >
              Collections
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              onClick={() => navigate(`/main/reports/deposits/${userId}`)}
              className="inline-block p-3 border-b-0 text-black border-blue-700 hover:bg-blue-100"
              type="button"
              role="tab"
              aria-controls="dashboard"
              aria-selected="false"
            >
              Deposits
            </button>
          </li>
          {/* Generate Report Button Inline */}
          <li className="ml-auto">
          </li>
        </ul>
      </div>
      <hr className="border-t border-[#7694D4] my-4" />

      <div className="container mx-auto">
        <div className="grid grid-cols-4">
          <div className="grid gap-6 mb-8">
            {/* Deposits Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">Collections</h2>
              <p className="text-gray-700 mb-2">Total Collections: ₱{totalCollectionAmount}</p>
            </div>

            {/* Collections Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">Deposits</h2>
              <p className="text-gray-700 mb-2">Total Deposited Collections: ₱{totalDepositedAmount}</p>
            </div>

            {/* Undeposited Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">Undeposited</h2>
              <p className="text-gray-700 mb-2">Total Undeposited: ₱{totalUndepositedAmount}</p>
            </div>
          </div>

          <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md ml-6 mb-8">
            {/* Graph Summary of Deposits, Collections, and Undeposited */}
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </Fragment>
  );
}
