import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
    const navigate = useNavigate();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handlePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleSubmit = (event) => {
        event.preventDefault(); 
        
        navigate('/Main/Dashboard');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/bfpbackground.png)' }}>
            <div className="w-96 p-5 h-96 bg-white shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-10">WELCOME</h1>
                <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                        <label htmlFor="username" className="block mb-2 font-medium"></label>
                        <input type="text" id="username" placeholder="Username" name="username" className="w-full p-2.5 pl-10 border rounded-md border-gray-300" required />
                        <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    <div className="relative mb-4">
                        <label htmlFor="password" className="block mb-2 font-medium"></label>
                        <input type={passwordVisible ? "text" : "password"} id="password" placeholder="Password" name="password" className="w-full p-2.5 pl-10 pr-10 border rounded-md border-gray-300" required />
                        <FontAwesomeIcon icon={faLock} className="absolute left-3 bottom-3.5 text-gray-400" />
                        <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} onClick={handlePasswordVisibility} className="absolute right-3 bottom-3 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <input type="checkbox" id="remember" name="remember" className="mr-1.5" />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        <a href="#" className="text-blue-500">Forgot password?</a>
                    </div>
                    <button type="submit" className="w-full py-2.5 mt-12 bg-blue-500 text-white rounded-full">Log In</button>
                </form>
            </div>
            <div className="ml-0 w-72 h-96 bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: 'url(/bfpbackground.png)' }}>
                <img src="/bfplogo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
        </div>
    );
}
