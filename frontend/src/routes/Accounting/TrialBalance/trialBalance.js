import React, { Fragment, useState } from "react";
import Modal from "../../../components/Modal";

export default function TrialBalance(){
    const [showModal, setShowModal] = useState(false);
    return(
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Trial Balance</h1>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ GENERATE TRIAL BALANCE</button>
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
                                    Start Date
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    End Date
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    <span class="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                  
                                </th>
                                <td class="px-6 py-4">
                                
                                </td>
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                   
                                </th>
                                <td class="px-6 py-4 text-right">
                                    
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>


            {/*MODAL*/}
            
            <Modal isVisible={showModal}>
            <div className="bg-white w-[600px] h-60 rounded py-2 px-4">

                {/*HEADER*/}
                <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                        Select a Ledger
                        </h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>
                        x
                        </button>
                </div>

                <hr className="border-t border-[#7694D4] my-3" />

                {/*SELECT*/}
                <form class="max-w-sm mt-5">
                <select id="ledgerselect" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option selected>Choose a Ledger</option>
                    <option value="ledger-2024">BFP General Ledger - 2024</option> 
                    <option value="ledger-2023">BFP General Ledger - 2023</option> 
                </select>
                </form>


                {/*BUTTON*/}
                <div className="flex justify-end py-3 px-4">
                <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-10">NEXT</button>
                </div>

            </div>

            </Modal>
            
        </Fragment>
    );
}