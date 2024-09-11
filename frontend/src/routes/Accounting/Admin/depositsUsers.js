import React, { useState, Fragment } from "react";
import { FaTimes } from "react-icons/fa";

export default function FireStationReportForm() {
  const [reportData, setReportData] = useState([
    {
      id: 1,
      fireStation: "",
      lcNumber: "",
      date: "",
      orNumber: "",
      amount: "",
    },
  ]);

  const [officerName, setOfficerName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]); 

  const handleChange = (id, field, value) => {
    const updatedData = reportData.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setReportData(updatedData);
  };

  const handleOfficerNameChange = (e) => {
    setOfficerName(e.target.value);
  };

  const handleAddRow = () => {
    const newRow = {
      id: reportData.length + 1,
      fireStation: "",
      lcNumber: "",
      date: "",
      orNumber: "",
      amount: "",
    };
    setReportData([...reportData, newRow]);
  };

  const handleRemoveRow = (id) => {
    setReportData(reportData.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    console.log("Submitted data:", reportData);
    console.log("Collecting Officer:", officerName);
    console.log("Current Date:", currentDate);
    // Add form submission logic here
  };

  return (
    <Fragment>
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
            Fire Station Reports - Deposits
          </h1>
          <button
            type="button"
            className="bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Collecting Officer's Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={officerName}
            onChange={handleOfficerNameChange}
            required
          />
        </div>

        <form onSubmit={handleSubmit}>
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Fire Station</th>
                <th className="px-6 py-3">LC Number</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">OR Number</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.id} className="border-b">
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border"
                      value={item.fireStation}
                      onChange={(e) => handleChange(item.id, "fireStation", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border"
                      value={item.lcNumber}
                      onChange={(e) => handleChange(item.id, "lcNumber", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="w-full px-2 py-1 border"
                      value={item.date}
                      onChange={(e) => handleChange(item.id, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border"
                      value={item.orNumber}
                      onChange={(e) => handleChange(item.id, "orNumber", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border"
                      value={item.amount}
                      onChange={(e) => handleChange(item.id, "amount", e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-red-500"
                      onClick={() => handleRemoveRow(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="mt-4 bg-[#2196F3] text-white px-4 py-2 rounded"
            onClick={handleAddRow}
          >
            Add Row
          </button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-1/3 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Confirm Submission</h2>
            <p>Are you sure you want to submit this report?</p>
            <p className="font-bold mt-2">Current Date: {currentDate}</p>
            <p className="font-bold mt-2">Collecting Officer: {officerName}</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#f25757] text-white py-2 px-4 rounded hover:bg-[#e04c4c]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
