import React from 'react';

const SubmitButton = ({ label, onClick }) => {
    return (
        <button
            className="bg-[#2196F3] h-10 rounded-full text-white font-poppins py-2 px-8 text-[12px] font-medium flex items-center"
            onClick={onClick}
        >
            {label}
        </button>
    );
};

export default SubmitButton;
