import React, { useState, Fragment } from "react";
import { FaTimes } from "react-icons/fa";

export default function FireStationCollections() {
  const [reportData, setReportData] = useState([
    {
      id: 1,
      fireStation: "",
      opsNumber: "",
      opsDate: "",
      opsAmount: "",
      orDate: "",
      orNumber: "",
      payorName: "",
      fireCodeClassification: "",
      amountPaid: "",
    },
  ]);

  const [officerName, setOfficerName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split("T")[0]); // Current date in YYYY-MM-DD format

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
      opsNumber: "",
      opsDate: "",
      opsAmount: "",
      orDate: "",
      orNumber: "",
      payorName: "",
      fireCodeClassification: "",
      amountPaid: "",
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
      <div className="bg-white h-full py-6 px-8 w-full rounded-lg shadow-md">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">
            Submit a Report - Collection
          </h1>
          <button
            type="button"
            className="bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        {/* Collecting Officer Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Collecting Officer's Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
            value={officerName}
            onChange={handleOfficerNameChange}
            required
          />
        </div>

        <form onSubmit={handleSubmit}>
          <table className="w-full text-sm text-left text-gray-500 table-auto border-separate border-spacing-0.5">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Fire Station</th>
                <th className="px-4 py-3">OPS Number</th>
                <th className="px-4 py-3">OPS Date</th>
                <th className="px-4 py-3">OPS Amount</th>
                <th className="px-4 py-3">OR Date</th>
                <th className="px-4 py-3">OR Number</th>
                <th className="px-4 py-3">Payor Name</th>
                <th className="px-4 py-3">Fire Code Classification</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.id} className="border-b">
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.fireStation}
                      onChange={(e) =>
                        handleChange(item.id, "fireStation", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.opsNumber}
                      onChange={(e) =>
                        handleChange(item.id, "opsNumber", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.opsDate}
                      onChange={(e) =>
                        handleChange(item.id, "opsDate", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.opsAmount}
                      onChange={(e) =>
                        handleChange(item.id, "opsAmount", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.orDate}
                      onChange={(e) =>
                        handleChange(item.id, "orDate", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.orNumber}
                      onChange={(e) =>
                        handleChange(item.id, "orNumber", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.payorName}
                      onChange={(e) =>
                        handleChange(item.id, "payorName", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.fireCodeClassification}
                      onChange={(e) =>
                        handleChange(
                          item.id,
                          "fireCodeClassification",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                      value={item.amountPaid}
                      onChange={(e) =>
                        handleChange(item.id, "amountPaid", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
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
            className="mt-4 bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
            onClick={handleAddRow}
          >
            Add Row
          </button>
        </form>
      </div>

      {/* Modal */}
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
            <p>Are you sure you want to submit the following report?</p>

            <ul className="my-4">
              <li>
                <strong>Collecting Officer's Name:</strong> {officerName}
              </li>
              <li>
                <strong>Current Date:</strong> {currentDate}
              </li>
            </ul>

            <table className="w-full text-sm text-left text-gray-500 table-auto">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Fire Station</th>
                  <th className="px-4 py-3">OPS Number</th>
                  <th className="px-4 py-3">OPS Date</th>
                  <th className="px-4 py-3">OPS Amount</th>
                  <th className="px-4 py-3">OR Date</th>
                  <th className="px-4 py-3">OR Number</th>
                  <th className="px-4 py-3">Payor Name</th>
                  <th className="px-4 py-3">Fire Code Classification</th>
                  <th className="px-4 py-3">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 border">{item.fireStation}</td>
                    <td className="px-4 py-2 border">{item.opsNumber}</td>
                    <td className="px-4 py-2 border">{item.opsDate}</td>
                    <td className="px-4 py-2 border">{item.opsAmount}</td>
                    <td className="px-4 py-2 border">{item.orDate}</td>
                    <td className="px-4 py-2 border">{item.orNumber}</td>
                    <td className="px-4 py-2 border">{item.payorName}</td>
                    <td className="px-4 py-2 border">
                      {item.fireCodeClassification}
                    </td>
                    <td className="px-4 py-2 border">{item.amountPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-[#2196F3] text-white px-4 py-2 rounded hover:bg-[#1976D2]"
                onClick={handleConfirm}
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
