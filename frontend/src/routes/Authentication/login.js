// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
  
      // Example: const role = user.role; // Retrieve role from user object or database
      const role = "Admin"; // Replace with actual role fetching logic
  
      // Store 'true' as a string explicitly
      sessionStorage.setItem('loginSuccess', 'true');

  
      // Redirect based on the role
      switch (role) {
        case 'Admin':
          navigate('/main/dashboard');
          break;
        case 'Regional Accountant':
          navigate('/main/generalLedger');
          break;
        default:
          navigate('/main/dashboard');
      }
    } catch (error) {
      setError("Invalid email or password. Please try again.");
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
