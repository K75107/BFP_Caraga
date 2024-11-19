import React from 'react';

const SubmitButton = ({ label, onClick,type}) => {
    return (
        <button
            className="bg-blue-600 h-10 rounded-full ring-1 ring-blue-600 text-white font-poppins py-2 px-8 text-[12px] font-medium flex items-center"
            onClick={onClick}
            type = {type}
        >
            {label}
        </button>
    );
};

export default SubmitButton;
