import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import ViewButton from "../../../components/viewButton";
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../../config/firebase-config'; // Firebase setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  // // Example data for Deposits Bar Chart
  // const depositData = {
  //   labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  //   datasets: [
  //     {
  //       label: 'Deposits ($)',
  //       data: [5000, 10000, 7000, 14000, 9000, 12000],
  //       backgroundColor: 'rgba(54, 162, 235, 0.5)',
  //       borderColor: 'rgba(54, 162, 235, 1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  // // Example data for Collections Bar Chart
  // const collectionData = {
  //   labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  //   datasets: [
  //     {
  //       label: 'Collections ($)',
  //       data: [4000, 9000, 8000, 12000, 8500, 15000],
  //       backgroundColor: 'rgba(75, 192, 192, 0.5)',
  //       borderColor: 'rgba(75, 192, 192, 1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Financial Data Over Time',
      },
      tooltip: {
        callbacks: {
          label: (context) => `₱ ${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Months',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount (₱)',
        },
        ticks: {
          callback: (value) => `₱ ${value.toLocaleString()}`,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  //FOR NAVIGATE

  const navigate = useNavigate();
  

  // --------------------------- U S E R   I D   A N D   D A T A   F E T C H I N G ---------------------------
  const [logUserID, setlogUserID] = useState(null); // Set initial value to null
  const [firestationdeposit, setFirestationdeposit] = useState([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [firestationCollections, setFirestationCollections] = useState([]);
  const [totalCollections, setTotalCollections] = useState(0);
  const [firestationOfficers, setFirestationOfficers] = useState([]);
  const [totalOfficers, setTotalOfficers] = useState(0); // New state for officer count
 
  console.log("data of logUserID: ", logUserID);
  console.log("data of firestationdeposit: ", firestationdeposit);
  console.log("data of firestationCollections: ", firestationCollections);

  useEffect(() => {
    // Setup listener for the submitted data
    const submitteddepositRef = collection(db, 'submittedReportsDeposits');
    const unsubscribeSubmitteddeposits = onSnapshot(submitteddepositRef, (snapshot) => {
      const submittedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // Find the current user in the submitted data by matching their email
          const currentUser = submittedData.find((doc) => doc.email === user.email);

          if (currentUser) {
            // Set the current user ID in the state if found in the submitted deposits
            setlogUserID(currentUser.id);
          } else {
            console.log('User not found in submittedReportsDeposits');
          }
        } else {
          console.log('No user is currently logged in');
        }
      });
    });

    // Return the unsubscribe function to clean up the listener on unmount
    return () => {
      unsubscribeSubmitteddeposits();
    };
  }, []); // Only runs once on mount

  useEffect(() => {
    // Only run the listener if logUserID is set (i.e., user is found)
    if (logUserID) {
      // Reference the deposits subcollection
      const submittedSubdepositsDataRef = collection(db, 'submittedReportsDeposits', logUserID, 'deposits');

      // Listener for the deposits subcollection
      const unsubscribeSubmitteddepositsDataRef = onSnapshot(submittedSubdepositsDataRef, (snapshot) => {
        const submitteddepositsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationdeposit(submitteddepositsList);
      });

      // Reference the collections subcollection
      const submittedSubcollectionsDataRef = collection(db, 'submittedReportsCollections', logUserID, 'collections');

      // Listener for the collections subcollection
      const unsubscribeSubmittedcollectionsDataRef = onSnapshot(submittedSubcollectionsDataRef, (snapshot) => {
        const submittedCollectionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirestationCollections(submittedCollectionsList);
      });

      // Reference the officers subcollection
      const firestationOfficersRef = collection(db, 'firestationReportsOfficers', logUserID, 'officers');
      const unsubscribeOfficers = onSnapshot(firestationOfficersRef, (snapshot) => {
        const officersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFirestationOfficers(officersList); // Set officer data

        const totalOfficersCount = snapshot.size; // Get total number of officers from snapshot size
        setTotalOfficers(totalOfficersCount); // Update the state with the count of officers
      });

      return () => {
        unsubscribeSubmitteddepositsDataRef();
        unsubscribeSubmittedcollectionsDataRef();
        unsubscribeOfficers();
      };
    }
  }, [logUserID]); // Runs only when logUserID changes


  useEffect(() => {
    // Calculate totalDeposits whenever firestationdeposit changes
    const total = firestationdeposit.reduce((sum, deposit) => {
      return sum + (parseFloat(deposit.depositAmount) || 0); // Convert depositAmount to a number
    }, 0);
    setTotalDeposits(total);
  }, [firestationdeposit]); // This effect runs whenever firestationdeposit changes

  useEffect(() => {
    // Calculate totalCollections whenever firestationCollections changes
    const total = firestationCollections.reduce((sum, collection) => {
      return sum + (parseFloat(collection.collectionAmount) || 0); // Convert collectionAmount to a number
    }, 0);
    setTotalCollections(total);
  }, [firestationCollections]); // This effect runs whenever firestationCollections changes

  useEffect(() => {
    // Calculate totalOfficers whenever fireStationOfficers changes
    const officerCount = firestationOfficers.length; // Total count is simply the length of the array
    setTotalOfficers(officerCount);
  }, [firestationOfficers]); // This effect runs whenever fireStationOfficers changes


  console.log("Total Deposits: ", totalDeposits);
  console.log("Total Collections: ", totalCollections);
  console.log("Total Officers: ", totalOfficers);

  // --------------------------- U S E R   I D   A N D   D A T A   F E T C H I N G ---------------------------

  // ----------------------------- F O R   D E P O S I T S   C H A R T   D A T A -----------------------------

  const processDepositData = (firestationdeposit) => {
    // Group deposits by month
    const depositByMonth = {};

    firestationdeposit.forEach((deposit) => {
      const dateDeposited = deposit.dateDeposited;
      if (dateDeposited) {
        const month = format(new Date(dateDeposited), 'MMMM'); // Format as full month name
        const amount = parseFloat(deposit.depositAmount) || 0; // Ensure depositAmount is numeric

        if (!depositByMonth[month]) {
          depositByMonth[month] = 0;
        }
        depositByMonth[month] += amount;
      }
    });

    // Convert grouped data to labels and data arrays
    const labels = Object.keys(depositByMonth);
    const data = Object.values(depositByMonth);

    return { labels, data };
  };

  const { labels: depositLabels, data: depositAmounts } = processDepositData(firestationdeposit);

  const depositData = {
    labels: depositLabels, // Dynamic labels (e.g., ['January', 'February'])
    datasets: [
      {
        label: 'Deposits (₱)',
        data: depositAmounts, // Dynamic data
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // ----------------------------- F O R   D E P O S I T S   C H A R T   D A T A ----------------------------- 

  // -------------------------- F O R   C O L L E C T I O N S   C H A R T   D A T A --------------------------

  const processCollectionData = (firestationCollections) => {
    // Group collections by month
    const collectionsByMonth = {};

    firestationCollections.forEach((collection) => {
      const dateCollected = collection.dateCollected;
      if (dateCollected) {
        const month = format(new Date(dateCollected), 'MMMM'); // Format as full month name
        const amount = parseFloat(collection.collectionAmount) || 0; // Ensure collectionAmount is numeric

        if (!collectionsByMonth[month]) {
          collectionsByMonth[month] = 0;
        }
        collectionsByMonth[month] += amount;
      }
    });

    // Convert grouped data to labels and data arrays
    const labels = Object.keys(collectionsByMonth);
    const data = Object.values(collectionsByMonth);

    return { labels, data };
  };

  const { labels: collectionLabels, data: collectionAmounts } = processCollectionData(firestationCollections);

  const collectionData = {
    labels: collectionLabels, // Dynamic labels (e.g., ['January', 'February'])
    datasets: [
      {
        label: 'Collections (₱)',
        data: collectionAmounts, // Dynamic data
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  console.log("Chart Data for Collections: ", collectionData);

  // -------------------------- F O R   C O L L E C T I O N S   C H A R T   D A T A --------------------------


  return (
    <div className="bg-gray-100 min-h-screen p-2">
      <div className="container mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-semibold mb-8">Dashboard</h1>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Deposits Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Deposits</h2>
            <p className="text-gray-700 mb-4">
              Total Deposits: ₱ {new Intl.NumberFormat('en-PH', { style: 'decimal' }).format(totalDeposits)}
            </p>
            <ViewButton
              onClick={() => navigate("/main/firestation/deposits/submitted")} // Pass appropriate ID
              label="View Details"
            />
          </div>


          {/* Collections Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Collections</h2>
            <p className="text-gray-700 mb-4">
              Total Collections: ₱ {new Intl.NumberFormat('en-PH', { style: 'decimal' }).format(totalCollections)}
            </p>
            <ViewButton
              onClick={() => navigate("/main/firestation/collections/submitted")} // Pass appropriate ID
              label="View Details"
            />
          </div>

          {/* Officers Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Officers</h2>
            <p className="text-gray-700 mb-4">Active Officers: {totalOfficers || 0}</p>
            <ViewButton
             onClick={() => navigate("/main/firestation/officers")}// Pass appropriate ID
              label="View Details"
            />
          </div>
        </div>

        {/* Graphs and Officer Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Deposits Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Deposits Over Time</h2>
            <Bar data={depositData} options={options} />
          </div>

          {/* Collections Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Collections Over Time</h2>
            <Bar data={collectionData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
