// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(null);

  
  const handlePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch user data from Firestore
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid); // Ensure "users" is your collection name
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userType = userDoc.data().usertype;
  
        // Store login success in session storage
        sessionStorage.setItem("loginSuccess", "true");
  
        // Navigate based on usertype
        const normalizedUserType = userType.toLowerCase(); // Normalize for case sensitivity
        switch (normalizedUserType) {
          case "admin":
            navigate("/main/dashboard");
            break;
          case "regional accountant":
            navigate("/main/generalLedger");
            break;
          case "bookkeeper":
            navigate("/main/bookkeeper/dashboard");
            break;
            case "fire-stations":
              navigate("/main/firestation/dashboard");
              break;
          default:
            setError("User data not found. Please contact the administrator.");
            break;
        }
      } else {

      }
    } catch (error) {
      console.error("Error logging in:", error.message);
      setError("User data not found. Please contact the administrator.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/bfpbackground.png)' }}>
      <div className="w-96 p-5 h-96 bg-white shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-10">WELCOME</h1>
        <form onSubmit={handleLogin}>
          <div className="relative mb-4">
            <input
              type="email"
              id="email"
              placeholder="Email"
              name="email"
              className="w-full p-2.5 pl-10 border rounded-md border-gray-300"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
          <div className="relative mb-4">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              placeholder="Password"
              name="password"
              className="w-full p-2.5 pl-10 pr-10 border rounded-md border-gray-300"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FontAwesomeIcon icon={faLock} className="absolute left-3 bottom-3.5 text-gray-400" />
            <FontAwesomeIcon
              icon={passwordVisible ? faEyeSlash : faEye}
              onClick={handlePasswordVisibility}
              className="absolute right-3 bottom-3 text-gray-400 cursor-pointer"
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" className="w-full py-2.5 mt-12 bg-blue-500 text-white rounded-full">Log In</button>
        </form>
      </div>
      <div className="ml-0 w-72 h-96 bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url(/bfpbackground.png)' }}>
        <img src="/bfplogo.png" alt="Logo" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}
