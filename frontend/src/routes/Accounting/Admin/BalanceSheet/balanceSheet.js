import React, { Fragment, useState } from "react";
import Modal from "../../../../components/Modal";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function BalanceSheet(){

    const [currentModal, setCurrentMOdal] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    return(
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Balance Sheet</h1>
                    <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium" onClick={() => setShowModal(true)}>+ GENERATE BALANCE SHEET</button>
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
                                    TOTAL NET ASSETS/EQUITY
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
                                <td class="px-6 py-4">
                                   
                                </td>
                                <td class="px-6 py-4 text-right">
                                    
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>


            {/*MODALS*/}

            {/*1st MODAL*/}
            {showModal && currentModal === 1 &&(
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
                <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-10" onClick={() => setCurrentMOdal(2)}>NEXT</button>
                </div>

            </div>
            </Modal>
            )}

            {/*2nd MODAL*/}
            {showModal && currentModal === 2 &&(
                <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-70 rounded py-2 px-4">
                    {/*HEADER*/}
                    <div className="flex justify-between">
                            <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">
                            Generate Balance Sheet
                            </h1>
                            <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setCurrentMOdal(1) & setShowModal(false) & setStartDate(null) & setEndDate(null)}>
                            x
                            </button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />

                    {/*LABEL*/}
                    <div className="flex p-2.5">
                        <div class="relative">
                        <input type="text" id="default_outlined1" class="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                        <label for="default_outlined1" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">Balance Sheet Description</label>
                        </div>
                    </div>

                    {/*DATE*/}
                    <div className="flex items-center space-x-4 p-2.5 bg-white max-w-lg">
                    <div className="relative">
                        <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholderText="Select start date"
                        />
                    </div>

                    <span className="text-gray-500">to</span>

                    <div className="relative">
                        <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholderText="Select end date"
                        />
                    </div>
                    </div>


                {/*GENERATE BUTTON*/}
                <div className="flex justify-end py-3 px-4 flex-row">
                        <button className="bg-white border border-[#D32F2F] rounded text-[11px] text-[#D32F2F] font-poppins font-md py-2.5 px-7 mt-4" onClick={() => setCurrentMOdal(1) & setStartDate(null) & setEndDate(null)}>BACK</button>
                        <button className="bg-[#2196F3] rounded text-[11px] text-white font-poppins font-md py-2.5 px-4 mt-4 ml-5">GENERATE</button>
                </div>

                </div>
                </Modal>
            )
            }



        </Fragment>
    );
}