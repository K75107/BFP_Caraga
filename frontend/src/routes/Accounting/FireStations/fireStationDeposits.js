import React, { useState, Fragment, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, getDocs, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from "../../../config/firebase-config";
import { IoMdAddCircleOutline } from "react-icons/io";

export default function FireStationDeposits() {
  const [firestationCollection, setFirestationCollection] = useState([]);
  const [depositsData, setDepositsData] = useState([]);

  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [officerName, setOfficerName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const checkUserInDeposits = async (userEmail, deposits) => {
      const userFound = deposits.find((deposit) => deposit.email === userEmail);
      if (userFound) {
        console.log('User found in unsubmitted deposits');
        const depositsSubCollectionRef = collection(db, 'unsubmittedReports', userFound.id, 'deposits');
        const snapshot = await getDocs(depositsSubCollectionRef);
        if (snapshot.empty) {
          console.log('No documents in deposits subcollection. Creating default document...');
          const defaultDoc = {
            opsNumber: null,
            opsDate: null,
            opsAmount: null,
            orDate: null,
            orNumber: null,
            payorName: null,
            fireCodeClassification: null,
            amountPaid: null,
            position: 0, // Set a default position
          };
          await addDoc(depositsSubCollectionRef, defaultDoc);
          console.log('Default document created in deposits subcollection');
        }
        const subCollectionDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDepositsData(subCollectionDocs);
      } else {
        console.log('User not found in unsubmitted deposits');
      }
    };

    const unsubmitCollectionRef = collection(db, 'unsubmittedReports');
    const unsubscribeUnsubmitCollections = onSnapshot(unsubmitCollectionRef, (snapshot) => {
      const listCollections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestationCollection(listCollections);

      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('Current User Email:', user.email);
          checkUserInDeposits(user.email, listCollections);
        } else {
          console.log('No user is currently logged in');
        }
      });
    });

    return () => {
      unsubscribeUnsubmitCollections();
    };
  }, []);

  const handleCellChange = async (depositId, field, newValue) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error('No logged-in user found.');
        return;
      }

      const unsubmittedReportsSnapshot = await getDocs(collection(db, 'unsubmittedReports'));
      const userDoc = unsubmittedReportsSnapshot.docs.find(doc => doc.data().email === user.email);
      if (!userDoc) {
        console.error('No unsubmitted collection found for the logged-in user.');
        return;
      }

      const depositsSubCollectionRef = collection(db, 'unsubmittedReports', userDoc.id, 'deposits');
      const docSnapshot = await getDoc(doc(depositsSubCollectionRef, depositId));
      if (!docSnapshot.exists()) {
        console.error(`No deposit document found with ID ${depositId}.`);
        return;
      }

      const existingData = docSnapshot.data();
      if (existingData[field] === newValue) {
        console.log('No changes detected, skipping update.');
        return;
      }

      await updateDoc(doc(depositsSubCollectionRef, depositId), {
        [field]: newValue
      });

      setDepositsData(prevDeposits =>
        prevDeposits.map(deposit =>
          deposit.id === depositId ? { ...deposit, [field]: newValue } : deposit
        )
      );

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating deposit field:', error);
    }
  };

  const handleHoverData = (deposits) => {
    const deposit = deposits.id;
    setSelectedRowData(deposit);
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
            onClick={() => setShowModal(true)}
          >
            Submit
          </button>
        </div>

        {/* Officer Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Collecting Officer's Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            required
          />
        </div>

        {/* Deposits Table */}
        <div className="relative overflow-x-visible shadow-md sm:rounded-lg ">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr className="text-[12px]">
                <th scope="col" className="px-2 py-3 w-20">OPS Date</th>
                <th scope="col" className="px-2 py-3 w-20">OPS Number</th>
                <th scope="col" className="px-2 py-3 w-20">OPS Amount</th>
                <th scope="col" className="px-2 py-3 w-20">OR Date</th>
                <th scope="col" className="px-2 py-3 w-20">OR Number</th>
                <th scope="col" className="px-2 py-3 w-20">Payor Name</th>
                <th scope="col" className="px-2 py-3 w-20">Fire Code Classification</th>
                <th scope="col" className="px-2 py-3 w-20">Amount Paid</th>
                <th scope="col" className=" w-[0px]"></th>
              </tr>
            </thead>
            <tbody>
              {depositsData.map((deposit) => (
                <Fragment key={deposit.id}>
                  <tr className="bg-white"
                    onMouseEnter={() => { 
                      setHoveredRowId(deposit.id); 
                      handleHoverData(deposit); 
                    }}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'opsDate' ? (
                        <input
                          type="date"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'opsDate', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'opsDate', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'opsDate', value: deposit.opsDate || '' }) }}
                          className="block border  w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.opsDate || 'mm/dd/yyyy'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'opsNumber' ? (
                        <input
                          type="text"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'opsNumber', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'opsNumber', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'opsNumber', value: deposit.opsNumber || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.opsNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'opsAmount' ? (
                        <input
                          type="number"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'opsAmount', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'opsAmount', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'opsAmount', value: deposit.opsAmount || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.opsAmount || '-'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'orDate' ? (
                        <input
                          type="date"
                          className="border border-gray-400 text-[12px] focus:outline-none w-20 h-8 px-2"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'orDate', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'orDate', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'orDate', value: deposit.orDate || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.orDate || 'mm/dd/yyyy'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'orNumber' ? (
                        <input
                          type="text"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'orNumber', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'orNumber', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'orNumber', value: deposit.orNumber || '' }) }}
                          className="block border  w-20 border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.orNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'payorName' ? (
                        <input
                          type="text"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'payorName', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'payorName', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'payorName', value: deposit.payorName || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.payorName || '-'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'fireCodeClassification' ? (
                        <input
                          type="text"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'fireCodeClassification', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'fireCodeClassification', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'fireCodeClassification', value: deposit.fireCodeClassification || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.fireCodeClassification || '-'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-1 py-3 w-20 text-[12px]">
                      {editingCell === deposit.id && editValue.field === 'amountPaid' ? (
                        <input
                          type="number"
                          className="border border-gray-400 focus:outline-none w-20 h-8 px-2 text-[12px]"
                          value={editValue.value}
                          onChange={(e) => setEditValue({ field: 'amountPaid', value: e.target.value })}
                          onBlur={() => handleCellChange(deposit.id, 'amountPaid', editValue.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingCell(deposit.id); setEditValue({ field: 'amountPaid', value: deposit.amountPaid || '' }) }}
                          className="block border w-20  border-gray-300 text-[12px] hover:bg-gray-100 h-8 w-20 px-2 py-1"
                        >
                          {deposit.amountPaid || '-'}
                        </span>
                      )}
                    </td>

                   {hoveredRowId === deposit.id && (
                                <td className="absolute right-8 mt-9 mr-1">  {/* Position the button absolutely */}
                                <button
                                    className="bg-blue-500 text-white px-1 py-1 text-lg rounded-full shadow-md transition hover:bg-blue-600"
                                    style={{ position: 'absolute', right: '-50px' }}  // Adjust position as needed
                        
                                >
                                    <IoMdAddCircleOutline />
                                </button>
                                </td>
                            )}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for submission confirmation */}
        {showModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white rounded-lg p-6 w-1/3">
                <h2 className="text-lg font-semibold mb-4">Confirm Submission</h2>
                <p>Are you sure you want to submit the deposits?</p>
                <div className="mt-4 flex justify-end">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"

                  >
                    Yes
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                    onClick={() => setShowModal(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
}
