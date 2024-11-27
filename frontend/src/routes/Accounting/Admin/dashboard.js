import React, { useEffect, useState, useRef } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, auth, realtimeDb } from '../../../config/firebase-config';
import ViewButton from "../../../components/viewButton";
import { ref, set, onValue } from "firebase/database";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Tooltip,
  TimeScale,
  TimeSeriesScale,
  Legend,
  ArcElement,
} from 'chart.js';
import SuccessUnsuccessfulAlert from '../../../components/Alerts/SuccessUnsuccessfulALert';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, TimeScale, TimeSeriesScale, ArcElement, Legend);

export default function Dashboard() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentYearData, setCurrentYearData] = useState([]);
  const [lastYearData, setLastYearData] = useState([]);

  const [currentYearUndepositedData, setCurrentYearUndepositedData] = useState([]);
  const [lastYearUndepositedData, setLastYearUndepositedData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentOfficer, setRecentOfficer] = useState(null); // State for recent officer
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [currentActiveUsers, setCurrentActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);

  const [totalCollectionAmount, setTotalCollectionAmount] = useState(0);
  const [totalDepositedAmount, setTotalDepositedAmount] = useState(0);
  const [totalUndepositedAmount, setTotalUndepositedAmount] = useState(0);

  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartRef = useRef(null);

  const [timeSeriesData, setTimeSeriesData] = useState([]);



  useEffect(() => {
    const fetchUserStatusCounts = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => doc.data());

        const activeUsersCount = usersData.filter((user) => user.isActive === true).length;
        const inactiveUsersCount = usersData.filter(
          (user) => user.isActive === false || user.isActive == null || user.isActive === ''
        ).length;

        setCurrentActiveUsers(activeUsersCount);
        setInactiveUsers(inactiveUsersCount); // Update inactive users count
      } catch (error) {
        console.error("Error fetching user status counts:", error);
      }
    };

    fetchUserStatusCounts();
  }, []);
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const officersSnapshot = await getDocs(collection(db, "firestationReportsOfficers"));
        let officersData = []; // Define officersData here
  
        for (const doc of officersSnapshot.docs) {
          const officersCollectionRef = collection(db, `firestationReportsOfficers/${doc.id}/officers`);
          const officersSubSnapshot = await getDocs(officersCollectionRef);
  
          officersSubSnapshot.forEach((officerDoc) => {
            const officer = officerDoc.data();
            officersData.push(officer); // Push officer data to the array
          });
        }
  
        // Sort officers by createdAt
        const sortedOfficers = officersData.sort((a, b) => {
          const aTimestamp = a.createdAt?.seconds || 0;
          const bTimestamp = b.createdAt?.seconds || 0;
          return bTimestamp - aTimestamp;
        });
  
        const mostRecentOfficer = sortedOfficers[0];
        setRecentOfficer(mostRecentOfficer || null); // Update state
      } catch (error) {
        console.error("Error fetching officers:", error);
      }
    };
  
    fetchOfficers();
  }, []);
  

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("Fetching dashboard data...");

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        console.log("Users fetched:", usersSnapshot.size);
        setTotalUsers(usersSnapshot.size);

        // Fetch the firestationReportsOfficers collection to get document IDs
        const officersSnapshot = await getDocs(collection(db, "firestationReportsOfficers"));
        console.log("Officers collection fetched:", officersSnapshot.size);

        const officersData = [];

        // Loop through the document IDs and fetch the officers subcollection
        for (const doc of officersSnapshot.docs) {
          const officersCollectionRef = collection(db, `firestationReportsOfficers/${doc.id}/officers`);
          const officersSubSnapshot = await getDocs(officersCollectionRef);

          officersSubSnapshot.forEach((officerDoc) => {
            officersData.push(officerDoc.data());
          });
        }

        console.log("Fetched officers data:", officersData);
        setTotalOfficers(officersData.length);

        // Process officers and get the most recent officer
        const sortedOfficers = officersData.sort(
          (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
        );
        
        // Correctly access `lastname` (all lowercase)
        const mostRecentOfficer = sortedOfficers[0];
        setRecentOfficer(mostRecentOfficer || null);

        // Fetch submittedReportsCollections
        const querySnapshot = await getDocs(collection(db, "submittedReportsCollections"));
        console.log("Submitted reports fetched:", querySnapshot.size);

        const allCollections = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const userCollectionsRef = collection(db, `submittedReportsCollections/${doc.id}/collections`);
            const userSnapshot = await getDocs(userCollectionsRef);
            return userSnapshot.docs.map((doc) => doc.data());
          })
        );

        const flattenedCollections = allCollections.flat();
        console.log("Flattened collections:", flattenedCollections);

        const deposited = flattenedCollections.filter((item) => item.depositStatus);
        const undeposited = flattenedCollections.filter((item) => !item.depositStatus);

        processYearlyData(deposited, undeposited);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
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

  const groupByTime = (data) => {
    const groupedData = {};
    data.forEach((entry) => {
      const hour = new Date(entry.time).toISOString().slice(0, 13); // Group by hour
      groupedData[hour] = (groupedData[hour] || 0) + entry.count;
    });
    return Object.entries(groupedData).map(([time, count]) => ({ time, count }));
  };


  const chartDataUsers = (activeUsers, inactiveUsers) => ({
    labels: ["Active Users", "Inactive Users"],
    datasets: [
      {
        data: [activeUsers, inactiveUsers],
        backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  })

  // Financial Chart Data
  const chartDataFinancial = (year, depositedData, undepositedData) => ({
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

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "submittedReportsCollections"));
        const allCollections = [];

        for (const doc of querySnapshot.docs) {
          const userId = doc.id;
          const userCollectionsRef = collection(db, `submittedReportsCollections/${userId}/collections`);
          const userSnapshot = await getDocs(userCollectionsRef);
          const userCollections = userSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userId,
          }));
          allCollections.push(...userCollections);
        }

        const depositedCollections = allCollections.filter(item => item.depositStatus === true);
        const undepositedCollections = allCollections.filter(item => !item.depositStatus);

        processYearlyData(depositedCollections, undepositedCollections);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      }
    };

    fetchFinancialData();
  }, []);




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


  const options2 = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top', // Position legend at the top
        labels: {
          padding: 20, // Add padding to make it visually better
        },
      },
      title: {
        display: true,
        text: 'Current Number of Users Active',
      },
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Scrollable Container */}
      <div className="overflow-y-auto h-screen p-8 -mt-4">
        {/* Alert Section */}
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
          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Total Users</h2>
              <p className="text-gray-700">{totalUsers}</p>
            </div>
  
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Total Officers</h2>
              <p className="text-gray-700">{totalOfficers.toLocaleString()}</p>
            </div>
  
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Recently Added Officer</h2>
              {recentOfficer ? (
                <div>
                  <p className="text-gray-700 font-semibold">
                    {recentOfficer.lastname || "Unknown Name"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {recentOfficer.createdAt
                      ? new Date(recentOfficer.createdAt.seconds * 1000).toLocaleString()
                      : "Unknown Date"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No officers found</p>
              )}
            </div>
          </div>
  
          {/* Graphs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Chart 1: Daily Active Users */}
            <div className="bg-white p-4 rounded-lg shadow-md doughnut-container">
              <h2 className="text-lg font-bold mb-2">Active Users</h2>
              <div className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center">
                <div style={{ height: '300px' }}>
                  <Doughnut data={chartDataUsers(currentActiveUsers, inactiveUsers)} options={options2} />
                </div>
              </div>
            </div>
  
            {/* Chart 2: Financial Data */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-bold mb-2">{currentYear} Financial Data</h2>
              <div style={{ height: '300px' }}>
                <Bar data={chartDataFinancial(currentYear, currentYearData, currentYearUndepositedData)} options={options} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}  