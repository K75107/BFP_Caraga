import React, { Fragment, useState } from "react";
import GeneralLedgerModal from "../../../components/Modals/GeneralLedgerModal";

export default function GeneralLedger(){
    const [showModal, setShowModal] = useState(false);
    return(
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">General Ledger</h1>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>ADD LEDGER</button>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                {/*TABLE*/}
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" class="px-6 py-3">
                                    DESCRIPTION
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    Year
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    <span class="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    BFP General Ledger
                                </th>
                                <td class="px-6 py-4">
                                    2024
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</a>
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    BFP General Ledger
                                </th>
                                <td class="px-6 py-4">
                                    2023
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>


            {/*MODAL*/}
            <GeneralLedgerModal isVisible={showModal}>

            <div className="flex justify-between">
                    <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                    Select a Ledger
                    </h1>
                    <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                    x
                    </button>
            </div>

            <hr className="border-t border-[#7694D4] my-3" />

            {/*LABEL*/}
            <div className="flex flex-row p-2.5">
                {/*LEDGER DESCRIPTION*/}
                <div class="relative">
                <input type="text" id="default_outlined1" class="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label for="default_outlined1" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">Ledger Description</label>
                </div>

                {/*YEAR*/}
                <div class="relative ml-auto">
                <input type="text" id="default_outlined2" class="block px-2.5 pb-2.5 pt-4 w-20 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label for="default_outlined2" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">Year</label>
                </div>
            </div>

            <div className="flex justify-end py-3 px-4">
            <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4">ADD</button>
            </div>

            </GeneralLedgerModal>
        </Fragment>
    );
}