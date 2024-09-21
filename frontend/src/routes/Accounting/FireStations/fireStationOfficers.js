import React, { Fragment, useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/firebase-config"; // 

export default function FireStationOfficers() {
  const [showModal, setShowModal] = useState(false);
  const [stationsList, setStationsList] = useState([]);
  
  const [stationName, setStationName] = useState('');
  const [location, setLocation] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [image, setImage] = useState(null); // For handling the picture

  // Fetch Fire Station Data from Firebase
  useEffect(() => {
    const getFireStationList = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "fireStations"));
        const stationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStationsList(stationsData);
      } catch (err) {
        console.error(err);
      }
    };
    getFireStationList();
  }, []);

  const handleAddStation = async () => {
    try {
      // Add your logic for adding fire station data to Firebase here
      // You might need to handle image upload if applicable
      console.log("Fire Station added:", { stationName, location, officerName, image });
    } catch (err) {
      console.error("Error adding fire station: ", err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file); // Store the image file
  };

  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between w-full">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E]">Manage Officers</h1>
          <button 
            className="bg-[#2196F3] rounded-lg text-white py-2 px-3 text-[11px] font-medium" 
            onClick={() => setShowModal(true)}>
              ADD AN OFFICER
          </button>
        </div>

        <hr className="border-t border-[#7694D4] my-4" />

        {/* Table to show list  */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">STATION NAME</th>
                <th className="px-6 py-3">LOCATION</th>
                <th className="px-6 py-3">COLLECTION OFFICER</th>
                <th className="px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody>
              {stationsList.map((station, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{station.stationName || 'Unknown'}</td>
                  <td className="px-6 py-4">{station.location || 'N/A'}</td>
                  <td className="px-6 py-4">{station.officerName || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding Fire Station */}
      <Modal isVisible={showModal}>
        <div className="bg-white w-[600px] h-auto rounded py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-[27px] text-[#1E1E1E]">Add an Officer</h1>
            <button className="text-[27px] bg-transparent" onClick={() => setShowModal(false)}>×</button>
          </div>

          <hr className="border-t border-[#7694D4] my-3" />

          <div className="space-y-4">
            {/* Station Name */}
            <div className="relative">
              <input
                type="text"
                id="stationName"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border rounded-lg focus:border-blue-600"
                placeholder=" "
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
              />
              <label htmlFor="stationName" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 bg-white px-2">Station Name</label>
            </div>

            {/* Location */}
            <div className="relative">
              <input
                type="text"
                id="location"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border rounded-lg focus:border-blue-600"
                placeholder=" "
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <label htmlFor="location" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 bg-white px-2">Location</label>
            </div>

            {/* Collection Officer's Name */}
            <div className="relative">
              <input
                type="text"
                id="officerName"
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border rounded-lg focus:border-blue-600"
                placeholder=" "
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
              />
              <label htmlFor="officerName" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 bg-white px-2">Collection Officer's Name</label>
            </div>

            {/* Add Picture */}
            <div className="relative">
              <input
                type="file"
                id="stationPicture"
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label htmlFor="stationPicture" className="text-sm text-gray-500 mt-1">Upload Station Picture</label>
            </div>
          </div>

          <div className="flex justify-end py-3">
            <button
              className="bg-[#2196F3] rounded text-white py-2.5 px-4 mt-4"
              onClick={handleAddStation}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </Fragment>
  );
}
