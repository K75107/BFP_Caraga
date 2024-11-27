import React, { useEffect, useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase-config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import SuccessUnsuccessfulAlert from '../../../components/Alerts/SuccessUnsuccessfulALert';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentYearData, setCurrentYearData] = useState([]);
  const [lastYearData, setLastYearData] = useState([]);
  const [currentYearUndepositedData, setCurrentYearUndepositedData] = useState([]);
  const [lastYearUndepositedData, setLastYearUndepositedData] = useState([]);
  
  const [totalCollectionAmount, setTotalCollectionAmount] = useState(0);
  const [totalDepositedAmount, setTotalDepositedAmount] = useState(0);
  const [totalUndepositedAmount, setTotalUndepositedAmount] = useState(0);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartRef = useRef(null);

 useEffect(() => {
  const fetchAdminData = async () => {
    try {
      // Retrieve all top-level documents in submittedReportsCollections
      const querySnapshot = await getDocs(collection(db, "submittedReportsCollections"));

      const allCollections = [];
      for (const doc of querySnapshot.docs) {
        const userId = doc.id; // Each document ID represents a user
        const userCollectionsRef = collection(db, `submittedReportsCollections/${userId}/collections`);

        // Fetch collections for the user
        const userSnapshot = await getDocs(userCollectionsRef);
        const userCollections = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userId,
        }));

        allCollections.push(...userCollections);
      }

      // Process data (deposited and undeposited)
      const depositedCollections = allCollections.filter(item => item.depositStatus === true);
      const undepositedCollections = allCollections.filter(item => !item.depositStatus);

      // Update state
      const depositedTotal = depositedCollections.reduce((sum, item) => sum + parseFloat(item.collectionAmount || 0), 0);
      const undepositedTotal = undepositedCollections.reduce((sum, item) => sum + parseFloat(item.collectionAmount || 0), 0);

      setTotalCollectionAmount(depositedTotal + undepositedTotal);
      setTotalDepositedAmount(depositedTotal);
      setTotalUndepositedAmount(undepositedTotal);

      processYearlyData(depositedCollections, undepositedCollections);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  fetchAdminData();
}, []);


  const processYearlyData = (deposited, undeposited) => {
    const currentYearTotals = Array(12).fill(0);
    const lastYearTotals = Array(12).fill(0);
    const currentYearUndepositedTotals = Array(12).fill(0);
    const lastYearUndepositedTotals = Array(12).fill(0);

    deposited.forEach(item => {
      const date = item.date_submitted?.toDate();
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed

        const amount = parseFloat(item.collectionAmount) || 0;

        if (year === currentYear) {
          currentYearTotals[month] += amount;
        } else if (year === lastYear) {
          lastYearTotals[month] += amount;
        }
      }
    });

    undeposited.forEach(item => {
      const date = item.date_submitted?.toDate();
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed

        const amount = parseFloat(item.collectionAmount) || 0;

        if (year === currentYear) {
          currentYearUndepositedTotals[month] += amount;
        } else if (year === lastYear) {
          lastYearUndepositedTotals[month] += amount;
        }
      }
    });

    setCurrentYearData(currentYearTotals);
    setLastYearData(lastYearTotals);
    setCurrentYearUndepositedData(currentYearUndepositedTotals);
    setLastYearUndepositedData(lastYearUndepositedTotals);
  };

  const chartData = (year, depositedData, undepositedData) => ({
    labels: months,
    datasets: [
      {
        label: `${year} Deposited`,
        data: depositedData,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: `${year} Undeposited`,
        data: undepositedData,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  });

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Yearly Financial Data',
      },
    },
  };

  const scrollToGraphs = () => {
    chartRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      {/* Alert Section */}
      {isSuccess && (
        <div className="absolute top-4 right-4">
          <SuccessUnsuccessfulAlert isSuccess={isSuccess} message="Login Success" icon="check" />
        </div>
      )}

      <div className="container mx-auto">
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Total Deposits</h2>
            <p className="text-gray-700 mb-2">₱{totalDepositedAmount.toLocaleString()}</p>
            <p className="text-green-600">{((totalDepositedAmount / totalCollectionAmount) * 100).toFixed(2) | 0}% Deposited</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Total Collections</h2>
            <p className="text-gray-700 mb-2">₱{totalCollectionAmount.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Undeposited Collections</h2>
            <p className="text-gray-700 mb-2">₱{totalUndepositedAmount.toLocaleString()}</p>
            <p className="text-red-600">{((totalUndepositedAmount / totalCollectionAmount) * 100).toFixed(2)| 0} % Undeposited</p>
          </div>
        </div>



        {/* Graphs Section */}
        <div ref={chartRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-2">{currentYear} Financial Data</h2>
            <div style={{ height: '300px' }}>
              <Bar data={chartData(currentYear, currentYearData, currentYearUndepositedData)} options={options} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-2">{lastYear} Financial Data</h2>
            <div style={{ height: '300px' }}>
              <Bar data={chartData(lastYear, lastYearData, lastYearUndepositedData)} options={options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
