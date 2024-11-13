import React, { useMemo } from "react";
import { IoSearch } from "react-icons/io5";

const SearchBar = ({
    placeholder = "Search...",
    onSearch,
    onChange,
    value,
    listSource = [],
    field = "name", // Default field to search by
    onSelect,
}) => {
    // Memoize filtered list to improve performance
    const filteredList = useMemo(
        () => listSource.filter((item) => item[field]?.toLowerCase().includes(value.toLowerCase())),
        [value, listSource, field]
    );

    return (
        <div className="w-72 h-10">
            <form className="flex items-center rounded-full h-10" onSubmit={onSearch}>
                <div className="relative w-full h-10">
                    <input
                        type="text"
                        id="search"
                        className="h-10 border-transparent focus:border-transparent focus:ring-0 w-full bg-gray-100 pl-8 pr-4 py-2 text-gray-900 dark:text-white text-sm rounded-full focus:outline-none focus:ring-0"
                        placeholder={placeholder}
                        autoComplete="off"
                        onChange={onChange}
                        value={value}
                    />
                    {value && filteredList.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredList.map((data) => (
                                <li
                                    key={data.id}
                                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                        onSelect(data[field]); // Trigger selection
                                    }}
                                >
                                    {data[field]}
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <IoSearch className="text-gray-500" />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SearchBar;
