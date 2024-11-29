import React, { useEffect, useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { useLocation } from 'react-router-dom';
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
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'submittedReportsCollections'));

        const allCollections = [];
        const allDeposits = [];

        for (const doc of querySnapshot.docs) {
          const userId = doc.id;

          // Fetch collections
          const collectionsSnapshot = await getDocs(
            collection(db, `submittedReportsCollections/${userId}/collections`)
          );
          const userCollections = collectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userId,
          }));
          allCollections.push(...userCollections);

          // Fetch deposits
          const depositsSnapshot = await getDocs(
            collection(db, `submittedReportsDeposits/${userId}/deposits`)
          );
          const userDeposits = depositsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userId,
          }));
          allDeposits.push(...userDeposits);
        }

        // Process totals
        processTotals(allCollections, allDeposits);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const processTotals = (collections, deposits) => {
    const depositedCollections = collections.filter(item => item.depositStatus === true);
    const undepositedCollections = collections.filter(
      (item) => item.depositStatus === false || item.depositStatus === null
    );

    const depositedTotal = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.depositAmount  || 0), 0);
    const undepositedTotal = undepositedCollections.reduce(
      (sum, item) => sum + parseFloat(item.collectionAmount || 0),
      0
    );
    const collectionTotal = depositedCollections.reduce(
      (sum, item) => sum + parseFloat(item.collectionAmount || 0),
      0
    );

    setTotalCollectionAmount(collectionTotal + undepositedTotal);
    setTotalDepositedAmount(depositedTotal);
    setTotalUndepositedAmount(undepositedTotal);

    processYearlyData(depositedCollections, undepositedCollections);
  };

  const processYearlyData = (deposited, undeposited) => {
    const currentYearTotals = Array(12).fill(0);
    const lastYearTotals = Array(12).fill(0);
    const currentYearUndepositedTotals = Array(12).fill(0);
    const lastYearUndepositedTotals = Array(12).fill(0);

    deposited.forEach(item => {
      const date = item.date_submitted?.toDate();
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const amount = parseFloat(item.collectionAmount) || 0;

        if (year === currentYear) currentYearTotals[month] += amount;
        else if (year === lastYear) lastYearTotals[month] += amount;
      }
    });

    undeposited.forEach(item => {
      const date = item.date_submitted?.toDate();
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const amount = parseFloat(item.collectionAmount) || 0;

        if (year === currentYear) currentYearUndepositedTotals[month] += amount;
        else if (year === lastYear) lastYearUndepositedTotals[month] += amount;
      }
    });

    setCurrentYearData(currentYearTotals);
    setLastYearData(lastYearTotals);
    setCurrentYearUndepositedData(currentYearUndepositedTotals);
    setLastYearUndepositedData(lastYearUndepositedTotals);
  };

  const chartData = (year, depositedCollections, undepositedData) => ({
    labels: months,
    datasets: [
      {
        label: `${year} Deposited`,
        data: depositedCollections,
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


  return (
    <div className="bg-gray-100 min-h-screen p-8">
      {isSuccess && (
        <div className="absolute top-4 right-4">
          <SuccessUnsuccessfulAlert isSuccess={isSuccess} message="Login Success" icon="check" />
        </div>
      )}
      <div className="container mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-semibold mb-8r">Dashboard</h1>
        </div>
        <div className="container mx-auto mt-4"> 
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card title="Total Deposits" value={totalDepositedAmount} percentage={(totalDepositedAmount / totalCollectionAmount) * 100 | 0} color="green" />
          <Card title="Total Collections" value={totalCollectionAmount} />
          <Card title="Undeposited Collections" value={totalUndepositedAmount} percentage={(totalUndepositedAmount / totalCollectionAmount) * 100 | 0} color="red" />
        </div>

        {/* Graphs */}
        <div ref={chartRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"> 
          <Graph title={`${currentYear} Financial Data`} data={chartData(currentYear, currentYearData, currentYearUndepositedData)} options={options} />
          <Graph title={`${lastYear} Financial Data`} data={chartData(lastYear, lastYearData, lastYearUndepositedData)} options={options} />
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, value, percentage, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    <p className="text-gray-700 mb-2">₱{value.toLocaleString()}</p>
    {percentage && (
      <p className={`text-${color}-600`}>
        {percentage.toFixed(2)}% {color === 'green' ? 'Deposited' : 'Undeposited'}
      </p>
    )}
  </div>
);

const Graph = ({ title, data, options }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-lg font-bold mb-2">{title}</h2>
    <div style={{ height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  </div>
);
