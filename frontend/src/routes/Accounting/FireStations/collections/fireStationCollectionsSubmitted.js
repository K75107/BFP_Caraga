export default function FireStationCollectionsSubmitted(){

    return(
        <div>
                        {/* TABLE */}
            <div className="relative overflow-x-visible shadow-md sm:rounded-lg h-full">
            <button
                type="button"
                className="absolute top-[-70px] right-10 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            >
                Submit
            </button>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-x-visible">
                <thead className="text-[12px] text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr className="text-[12px]">
                    <th scope="col" className="px-2 py-3 w-36">Date Submitted</th>
                    <th scope="col" className="px-2 py-3 w-40">Collecting Officer</th>
                    <th scope="col" className="px-2 py-3 w-36">Date Collected</th>
                    <th scope="col" className="px-2 py-3 w-36">OR Number</th>
                    <th scope="col" className="px-2 py-3 w-36">LC Number</th>
                    <th scope="col" className="px-2 py-3 w-36">Name of Payor</th>
                    <th scope="col" className="px-2 py-3 w-36">Nature of Collection</th>
                    <th scope="col" className="px-2 py-3 w-36">Amount</th>
                    <th scope="col" className="w-[20px]"></th>
                </tr>
                </thead>
            </table>

            <div className="w-full overflow-y-scroll h-[calc(96vh-240px)]">
                <table className="w-full overflow-x-visible">
                <tbody>
                {/* Header Row */}
            <tr className="text-[12px] bg-gray-100 border-b w-full dark:bg-gray-700 dark:border-gray-700">
            <td className="table-cell px-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300">Collecting Officer</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">Date Collected</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">OR Number</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">LC Number</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">Name of Payor</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">Nature of Collection</td>
            <td className="table-cell px-2 py-2 w-36 text-[12px] font-semibold text-gray-700 dark:text-gray-300">Amount</td>
            <td className="px-2 py-5 w-0 relative z-10"></td>
            </tr>

            {/* Empty Row */}
            <tr className="text-[12px] bg-white border-b w-full dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
            <td className="table-cell px-2 w-40 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="table-cell px-2 py-2 w-36 text-[12px]"></td>
            <td className="px-2 py-5 w-0 relative z-10"></td>
            </tr>


                </tbody>
                </table>
            </div>
            </div>

        </div>


    );


}