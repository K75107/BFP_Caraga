import React from 'react';
import { BiExport } from "react-icons/bi";

const ExportButton = ({ label ="EXPORT", onClick }) => {
    return (
        <button
            className="bg-gray-50 hover:bg-white h-10 rounded-lg ring-1 ring-blue-700 text-blue-700 font-poppins py-2 px-4 text-[11px] font-medium flex items-center"
            onClick={onClick}
        >
            <BiExport className="mr-2 text-[15px] font-bold" />
            {label}
        </button>
    );
};

export default ExportButton;
