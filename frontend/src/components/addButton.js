import React from 'react';
import { IoMdAdd } from 'react-icons/io';

const AddButton = ({ label, onClick }) => {
    return (
        <button
            className="bg-[#2196F3] h-10 rounded-full text-white font-poppins py-2 px-4 text-[11px] font-medium flex items-center"
            onClick={onClick}
        >
            <IoMdAdd className="mr-2 text-[15px] font-bold" />
            {label}
        </button>
    );
};

export default AddButton;
