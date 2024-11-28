import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
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
import { useLocation } from 'react-router-dom';
import SuccessUnsuccessfulAlert from '../../../components/Alerts/SuccessUnsuccessfulALert';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {


  //For Alerts
  const location = useLocation();
  // Get login success state from session storage
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('loginSuccess');
    if (loginSuccess === 'true') {

      setIsSuccess(true);
      sessionStorage.removeItem('loginSuccess');
    }
    const timer = setTimeout(() => {
      setIsSuccess(false);
    }, 2000)
    return () => clearTimeout(timer);

  }, []);




  const depositData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Deposits ($)',
        data: [5000, 10000, 7000, 14000, 9000, 12000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Example data for Collections Bar Chart
  const collectionData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Collections ($)',
        data: [4000, 9000, 8000, 12000, 8500, 15000],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

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
    },
  };

  // State to store officers fetched from Firebase
  const [recentlyAddedOfficers, setRecentlyAddedOfficers] = useState([]);

  // Fetch officers data from Firebase
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'fireStations'));
        const officersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Assuming officers are sorted by date added, we take the last 3 officers
        const recentOfficers = officersData.slice(0, 3);
        setRecentlyAddedOfficers(recentOfficers);
      } catch (error) {
        console.error('Error fetching officers data: ', error);
      }
    };
    fetchOfficers();
  }, []);

  // Example data for recently submitted officers

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      {/* Alert Section */}
      {isSuccess && (
        <div className="absolute top-4 right-4">
          <SuccessUnsuccessfulAlert isSuccess={isSuccess} message ={'Login Success'} icon={'check'}/>
        </div>
      )}

      <div className="container mx-auto">

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Deposits Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Deposits</h2>
            <p className="text-gray-700 mb-4">Total Deposits: $XX,XXX</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
          </div>

          {/* Collections Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Collections</h2>
            <p className="text-gray-700 mb-4">Total Collections: $XX,XXX</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
          </div>

          {/* Officers Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Officers</h2>
            <p className="text-gray-700 mb-4">Active Officers: 10</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">View Details</button>
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



          {/* Recently Added Officers */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Recently Added Officers</h2>
            <ul>
              {recentlyAddedOfficers.map((officer, index) => (
                <li key={index} className="border-b py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-lg font-semibold">{officer.officerName || 'Unknown'}</p>
                      <p className="text-gray-600">{officer.stationName || 'Unknown Station'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location: {officer.location || 'N/A'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>



    </div>
  );
};