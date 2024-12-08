import React, { Fragment } from "react";

export default function CashflowStatement() {
    return (
        <Fragment>
            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-[25px] text-[#1E1E1E] font-poppins">Cashflow Statement</h1>
                    <div className="flex space-x-3">
                        <button className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium">EXPORT</button>
                        <button className="bg-gray-200 rounded-lg text-gray-800 font-poppins py-2 px-3 text-[11px] font-medium">ADD ANOTHER PERIOD</button>
                    </div>
                </div>

                <hr className="border-t border-[#7694D4] my-4" />

                <div className="text-[#1E1E1E] mb-4">
                    <p>Description: BFP Cashflow Statement</p>
                </div>

                {/* Footer: Cash and Cash Equivalents */}
                <div className="text-[#1E1E1E] mt-6">
                    <p className="text-right font-semibold">Cash and Cash Equivalents: 1,000,000</p>
                </div>
            </div>
        </Fragment>
    );
}
