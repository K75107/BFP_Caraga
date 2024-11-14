import React from 'react';
import { CiFilter } from "react-icons/ci";


// FilterButton Component
const FilterButton = ({ label = 'Filter', onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition"
    >
      <CiFilter className="w-5 h-5 mr-2" aria-hidden="true" />
      {label}
    </button>
  );
};

export default FilterButton;
