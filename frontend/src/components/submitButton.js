import React from 'react';

const SubmitButton = ({ label, onClick, type, variant = 'filled', disabled = false }) => {
  const baseClasses =
    "h-10 rounded-lg text-[12px] font-medium flex items-center font-poppins py-2 px-4 transition-colors duration-200";
  const filledClasses =
    "bg-blue-600 text-white ring-1 ring-blue-600 hover:bg-blue-700 hover:ring-blue-700";
  const outlinedClasses =
    "bg-gray-100 text-blue-600 ring-1 ring-blue-600 hover:bg-white";
  const disabledClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";

  const buttonClasses = `${baseClasses} ${
    disabled ? disabledClasses : variant === 'filled' ? filledClasses : outlinedClasses
  }`;

  return (
    <button
      className={buttonClasses}
      onClick={disabled ? null : onClick}
      type={type}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default SubmitButton;
