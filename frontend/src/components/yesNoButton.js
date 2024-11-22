import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa"; // Import icons

const YesNoButton = ({ type = "yes", onClick, label, size = "medium" }) => {
  const isYes = type === "yes";

  // Define size classes
  const sizeClasses = {
    xs: "h-6 text-[10px] px-2",
    small: "h-8 text-xs px-3",
    medium: "h-10 text-sm px-4",
    large: "h-12 text-base px-6",
  };

  const iconSize = {
    xs: 10,
    small: 14,
    medium: 16,
    large: 20,
  };

  // Adjust styles for label-less buttons
  const noLabelStyles = label
    ? ""
    : {
        xs: "w-6 h-6",
        small: "w-8 h-8",
        medium: "w-10 h-10",
        large: "w-12 h-12",
      };

  return (
    <button
      className={`rounded-full flex items-center justify-center text-white font-poppins font-medium ${
        isYes ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
      } ${label ? sizeClasses[size] : noLabelStyles[size]}`}
      onClick={onClick}
    >
      {isYes ? (
        <FaCheck size={iconSize[size]} />
      ) : (
        <FaTimes size={iconSize[size]} />
      )}
      {label && <span className="ml-2">{label}</span>}
    </button>
  );
};

export default YesNoButton;
