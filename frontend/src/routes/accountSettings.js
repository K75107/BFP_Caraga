import React, { useState, useEffect } from "react";

import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { getDatabase, ref, set, onDisconnect, serverTimestamp } from "firebase/database";


function AccountSettings() {
  const [logUserData, setLogUserData] = useState({});
  const database = getDatabase();

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const currentUser = usersList.find((doc) => doc.email === auth.currentUser?.email);
      if (currentUser) setLogUserData(currentUser);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userStatusRef = ref(database, `status/${user.uid}`);
        set(userStatusRef, {
          isActive: true,
          lastActive: serverTimestamp(),
        });
        onDisconnect(userStatusRef).set({
          isActive: false,
          lastActive: serverTimestamp(),
        });
      } else {
        console.log("No user is currently logged in");
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeAuth();
    };
  }, [database]);

  const [formData, setFormData] = useState({
    oldPassword: "",
    username: logUserData?.username || "",
    newPassword: "",
  });

  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (!logUserData?.username) return;
  
    const isChanged =
      formData.oldPassword !== "" ||
      formData.username !== logUserData.username ||
      formData.newPassword !== "";
  
    setIsModified(isChanged);
  }, [formData, logUserData]);
  
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      username: logUserData?.username || "",
    }));
  }, [logUserData]);
  
  
  
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveChanges = async () => {
    const user = auth.currentUser;
    const { oldPassword, newPassword } = formData;

    if (!user) {
      alert("User not authenticated.");
      return;
    }

    try {
      // Reauthenticate the user
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Update the password
      if (newPassword) {
        await updatePassword(user, newPassword);
        alert("Password updated successfully!");
      } else {
        alert("New password cannot be empty.");
      }
    } catch (error) {
      console.error("Error updating password:", error.message);
      alert(error.message);
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">


      {/* Profile Section */}
      <div className="w-full px-4">
        <div className="bg-white py-8 px-8 rounded-lg shadow-md flex items-center space-x-6">
          {/* Circular Avatar */}
          <div
            className="w-32 h-32 text-5xl rounded-full border-4 border-white flex items-center justify-center font-bold text-white cursor-pointer shadow-lg"
            style={{
              backgroundColor:
                logUserData?.province === 'Agusan del Norte' ? 'blue' :
                  logUserData?.province === 'Agusan del Sur' ? 'red' :
                    logUserData?.province === 'Dinagat Islands' ? 'brown' :
                      logUserData?.province === 'Surigao del Norte' ? 'orange' :
                        logUserData?.province === 'Surigao del Sur' ? 'violet' :
                          'gray' // Default color
            }}
          >
            {logUserData?.username?.charAt(0).toUpperCase()}
          </div>

          {/* Name and Email */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {logUserData?.username || 'Username'}
            </h2>
            <p className="text-gray-600">{logUserData?.email || 'Email'}</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-lg px-4 mt-6 ">
        <div className="bg-white py-8 px-8 rounded-lg shadow-md">
          {/* Form Title */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Update Account Details
          </h2>

          {/* Form Fields */}
          <div className="space-y-6">

            {/* Old Password Input */}
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Current Password
              </label>
              <input
                id="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="w-full px-4 py-2 border rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>



          {/* New Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mt-2"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full px-4 py-2 mt-2 border rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!isModified} // Disable when no changes are made
              className={`w-full py-2 rounded-lg shadow-md font-semibold focus:outline-none focus:ring-1 ${isModified
                  ? "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-400"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Save Changes
            </button>
          </div>

        </div>


      </div>
    </div>



  );
}

export default AccountSettings;
