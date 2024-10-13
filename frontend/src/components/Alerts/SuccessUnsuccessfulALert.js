import React from 'react';

const SuccessUnsuccessfulAlert = ({ message, isSuccess, isError, icon }) => {
  return (
    (isSuccess || isError) && (
      <div
        id="toast-simple"
        className={`flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800 transition-opacity duration-300 ease-in-out transform ${
          isSuccess || isError ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-full scale-95'
        }`}
        role="alert"
      >
        {/* Conditional rendering based on the icon and type */}
        {icon === 'check' && isSuccess ? (
          <svg
            className="w-5 h-5 text-green-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
        ) : icon === 'wrong' && isError ? (
          <svg
            className="w-5 h-5 text-red-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
          </svg>
        ) : null}

        <div className="ps-4 text-sm font-normal">{message}</div>
      </div>
    )
  );
};

export default SuccessUnsuccessfulAlert;
